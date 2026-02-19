import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Configuration from "@/lib/models/Configurations";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import Vendor from "@/lib/models/Vendor";
import { sendEmail } from "@/lib/sendEmail";

/* ---------------------------------- utils --------------------------------- */

const pad2 = (n: number) => String(n).padStart(2, "0");

const to12Hour = (d: Date) => {
    const h = d.getHours();
    return {
        hour: pad2(h % 12 === 0 ? 12 : h % 12),
        minute: pad2(d.getMinutes()),
        period: h >= 12 ? "PM" : "AM",
    };
};

const to12HourPacific = (d: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    }).formatToParts(d);
    const hour24 = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
    return {
        hour: pad2(hour24 % 12 === 0 ? 12 : hour24 % 12),
        minute: pad2(minute),
        period: hour24 >= 12 ? 'PM' : 'AM',
    };
};

const getPacificDowDom = (d: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short',
        day: '2-digit',
    }).formatToParts(d);
    const wd = parts.find(p => p.type === 'weekday')?.value ?? 'Sun';
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dayMap[wd] ?? 0;
    const dom = Number(parts.find(p => p.type === 'day')?.value ?? '0');
    return { dow, dom };
};

const normalizeStatus = (s?: string) => {
    const t = String(s || "").trim().toLowerCase();
    if (["need review", "needs review"].includes(t)) return "needs review";
    if (["complete", "completed"].includes(t)) return "complete";
    if (["delivered", "out of cycle"].some(k => t.includes(k))) return "out_of_cycle";
    return t;
};

const isTimeMatch = (cfgTimes: any[], now: ReturnType<typeof to12Hour>) => {
  console.log("🕒 [AUTO][TIME] Current time:", now);

  if (!cfgTimes?.length) {
    console.log("⚠️ [AUTO][TIME] No configured times found");
    return false;
  }

  return cfgTimes.some((t, index) => {
    const cfgTime = {
      hour: pad2(t.hour),
      minute: pad2(t.minute),
      period: String(t.period).toUpperCase(),
    };

    const match =
      cfgTime.hour === now.hour &&
      cfgTime.minute === now.minute &&
      cfgTime.period === now.period;

    console.log(`⏱️ [AUTO][TIME] Checking time[${index}]`, {
      config: cfgTime,
      now,
      match,
    });

    return match;
  });
};

/* --------------------------------- runner --------------------------------- */

const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const isFrequencyMatch = (cfg: any, now: Date) => {
  const { dow, dom } = getPacificDowDom(now);
  const freq = String(cfg?.frequency || 'Daily');
  if (freq === 'Daily') return true;
  if (freq === 'Weekly') {
    const match = dow === 1;
    console.log('📅 [AUTO][FREQ] Weekly check (Pacific)', { targetDow: 1, nowDow: dow, match });
    return match;
  }
  if (freq === 'Monthly') {
    const match = dom === 1;
    console.log('📅 [AUTO][FREQ] Monthly check (Pacific)', { targetDom: 1, nowDom: dom, match });
    return match;
  }
  return true;
};

const runAuto = async () => {

  await connectDB();

  const now = new Date();
  const time = to12HourPacific(now);

  const configs = await Configuration.find({ isAutoEnabled: true }).lean();
  console.log(`📦 [AUTO] Enabled configs found: ${configs.length}`);

  let triggered = 0;
  let emailsSent = 0;

  for (const cfg of configs) {
    if (!isFrequencyMatch(cfg, now)) {
      continue;
    }
    if (!isTimeMatch(cfg.times ?? [], time)) {
      continue;
    }

    const recipients = (cfg.recipients ?? []).filter(Boolean);
    const vendorIds = (cfg.vendors ?? []).filter(Boolean);
    const statuses = (cfg.statuses ?? []).map(normalizeStatus).filter(Boolean);

    if (!recipients.length || !vendorIds.length) {
      console.log("⚠️ [AUTO] Missing recipients or vendors – skipping config");
      continue;
    }

    triggered++;

    for (const vendorId of vendorIds) {

      const pendingReviews = await Review.find({
        vendorId,
        emailNotification: "no",
        $or: [
          { reviewCompletedAt: null },
          { reviewCompletedAt: { $exists: false } },
        ],
      })
        .select("unitId departmentId inspectionId")
        .lean();

      console.log(`📋 [AUTO] Pending reviews found: ${pendingReviews.length}`);

      if (!pendingReviews.length) {
        console.log("⏭️ [AUTO] No pending reviews – skipping vendor");
        continue;
      }

      const pendingPairs = pendingReviews.map(r => ({
        unitId: String(r.unitId),
        departmentId: String(r.departmentId),
      }));

      const unitIds = pendingPairs.map(p => p.unitId);
      const departmentIds = [...new Set(pendingPairs.map(p => p.departmentId))];

      const inspectionsQuery: any = {
        vendorId,
        unitId: { $in: unitIds },
        departmentId: { $in: departmentIds },
      };

      if (statuses.length) {
        inspectionsQuery.inspectionStatus = { $in: statuses };
      }

      const inspections = await Inspection.find(inspectionsQuery)
        .select("_id unitId vendorId departmentId inspectionStatus")
        .lean();


      const toNotify = inspections.filter(i =>
        pendingPairs.some(
          p =>
            p.unitId === String(i.unitId) &&
            p.departmentId === String(i.departmentId)
        )
      );

      if (!toNotify.length) {
        console.log("⏭️ [AUTO] Nothing to notify – skipping vendor");
        continue;
      }

      /* ----------------------------- vendor info ---------------------------- */

      const vendor = await Vendor.findById(vendorId)
        .select("name")
        .lean<{ name?: string } | null>();

      const vendorName = vendor?.name ?? "N/A";
      console.log(`🏷️ [AUTO] Vendor name: ${vendorName}`);

      /* ------------------------------- summary ------------------------------- */

      const total = toNotify.length;
      const passCount = toNotify.filter(
        i => normalizeStatus(i.inspectionStatus) === "pass"
      ).length;
      const needsReviewCount = toNotify.filter(
        i => normalizeStatus(i.inspectionStatus) === "needs review"
      ).length;

      console.log("📊 [AUTO] Summary:", {
        total,
        passCount,
        needsReviewCount,
      });

      /* --------------------------------- csv -------------------------------- */

      const isoDate = now.toISOString().slice(0, 10);
      const fileName = `${vendorName.replace(/[^A-Za-z0-9._-]+/g, "-")}-${isoDate}.csv`;

      /* -------------------------------- email -------------------------------- */

      const emailHtml = buildEmailHtml({
        vendorName,
        total,
        passCount,
        needsReviewCount,
        fileName,
      });

      await sendEmail(
        recipients,
        "Automated Admin Review Notification",
        emailHtml,
        [{ filename: fileName, content: `unitId\n${toNotify.map(i => i.unitId).join("\n")}`, contentType: "text/csv" }]
      );

      /* ----------------------------- mark notified ---------------------------- */

      await Promise.all(
        toNotify.map(i =>
          Review.findOneAndUpdate(
            { unitId: i.unitId, vendorId, departmentId: i.departmentId },
            {
              $set: {
                emailNotification: "yes",
                reviewCompletedAt: new Date(),
                inspectionId: i._id,
              },
            }
          )
        )
      );

      emailsSent++;
    }
  }

  return {
    success: true,
    triggered,
    emailsSent,
    time: `${time.hour}:${time.minute} ${time.period} PT`,
  };
};


/* ----------------------------- email template ----------------------------- */

type EmailTemplateParams = {
    vendorName: string;
    total: number;
    passCount: number;
    needsReviewCount: number;
    fileName: string;
};

const buildEmailHtml = ({
    vendorName,
    total,
    passCount,
    needsReviewCount,
    fileName,
}: EmailTemplateParams) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f6f7fb;
      margin: 0;
      padding: 0;
      color: #1f2937;
    }
    .container {
      max-width: 640px;
      margin: 24px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }
    .header {
      background: #10b981;
      color: #ffffff;
      padding: 28px 32px;
      text-align: center;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px;
    }
    .subtitle {
      font-size: 13px;
      opacity: 0.95;
      margin: 0;
    }
    .section {
      padding: 24px 32px;
    }
    .box {
      background: #ecfdf5;
      border: 1px solid #34d399;
      border-radius: 10px;
      padding: 12px;
      margin-top: 10px;
    }
    .heading {
      font-weight: 600;
      color: #047857;
      font-size: 18px;
      margin: 0 0 24px 0;
    }
    .detail-row {
      margin-bottom: 16px;
    }
    .label {
      font-size: 14px;
      font-weight: 600;
    }
    .list {
      background: #ffffff;
      border: 1px dashed #a7f3d0;
      border-radius: 8px;
      padding: 14px;
      font-size: 14px;
    }
    .muted {
      font-size: 12px;
      color: #6b7280;
    }
    .footer {
      padding: 32px;
      background: #f9fafb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Automated Admin Review Notification</h1>
      <p class="subtitle">InspecTech Inspection Management System</p>
    </div>

    <div class="section">
      <div class="box">
        <p class="heading">Summary</p>

        <div class="detail-row">
          <span class="label">Total Inspections:</span> ${total}
        </div>

        <div class="detail-row">
          <span class="label">Passed:</span> ${passCount}
        </div>

        <div class="detail-row">
          <span class="label">Needs Review:</span> ${needsReviewCount}
        </div>
      </div>

      <div style="height:12px"></div>

      <div class="box">
        <span class="heading">1 vendor included in this notification:</span>

        <div style="height:8px"></div>

        <div class="list">
          ${vendorName} (${total} units)
        </div>

        <div style="height:8px"></div>

        <div class="list">
          See attached CSV: ${fileName}
        </div>
      </div>

      <div style="height:16px"></div>

      <p class="muted">
        Please see attached CSV file for complete details.
      </p>

      <p style="margin-top:10px;">
        Thank you,<br />
        <strong>The InspecTech Team</strong>
      </p>
    </div>

    <div class="footer">
      This is an automated message from the InspecTech inspection management system.
    </div>
  </div>
</body>
</html>
`;

/* -------------------------------- handlers -------------------------------- */

const authorize = (req: NextRequest) => {
    const secret = process.env.CRON_SECRET;
    const token =
        req.headers.get("x-cron-secret") ??
        req.nextUrl.searchParams.get("token");

    return !secret || token === secret;
};

export async function POST(req: NextRequest) {
    if (!authorize(req)) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await runAuto());
}

export async function GET(req: NextRequest) {
    if (!authorize(req)) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await runAuto());
}
