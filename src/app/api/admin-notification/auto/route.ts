import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Configuration from "@/lib/models/Configurations";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import Vendor from "@/lib/models/Vendor";
import { sendEmail } from "@/lib/sendEmail";

const pad2 = (n: number) => String(n).padStart(2, "0");
const to12Hour = (d: Date) => {
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: pad2(h12), minute: pad2(m), period };
};
const normalizeStatus = (s: string) => {
  const t = String(s || "").trim().toLowerCase();
  if (t === "need review" || t === "needs review") return "needs review";
  if (t === "incomplete") return "incomplete";
  if (t === "complete" || t === "completed") return "complete";
  if (t === "pass") return "pass";
  if (t === "fail") return "fail";
  if (t.includes("delivered") || t.includes("out of cycle")) return "out_of_cycle";
  return t;
};

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get("x-cron-secret") || "";
    const secret = process.env.CRON_SECRET || "";
    if (secret && secretHeader !== secret) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const now = new Date();
    const t = to12Hour(now);

    const configs = await Configuration.find({ isAutoEnabled: true }).lean();
    let triggered = 0;
    let emailsSent = 0;

    for (const cfg of configs) {
      const times = Array.isArray(cfg.times) ? cfg.times : [];
      const shouldRun = times.some(
        (x: any) =>
          String(x.hour).padStart(2, "0") === t.hour &&
          String(x.minute).padStart(2, "0") === t.minute &&
          String(x.period).toUpperCase() === t.period
      );
      if (!shouldRun) continue;

      const recipients: string[] = Array.isArray(cfg.recipients) ? cfg.recipients.filter((r: any) => !!r) : [];
      const vendorIds: string[] = Array.isArray(cfg.vendors) ? cfg.vendors.filter((v: any) => !!v) : [];
      const statusesRaw: string[] = Array.isArray(cfg.statuses) ? cfg.statuses : [];
      const statuses = statusesRaw.map(normalizeStatus).filter(Boolean);
      if (!recipients.length || !vendorIds.length) continue;

      for (const vendorId of vendorIds) {
        const query: any = { vendorId };
        if (statuses.length) query.inspectionStatus = { $in: statuses };
        const deliveredSelected = statusesRaw.some((s) => String(s).toLowerCase().includes("delivered"));
        if (deliveredSelected) query.delivered = "yes";

        const inspections = await Inspection.find(query).select("unitId vendorId departmentId").lean();
        if (!inspections.length) continue;

        const unitIds = inspections.map((i: any) => String(i.unitId));
        const vendorDoc = await Vendor.findById(vendorId).select("name").lean();
        const vendorName = vendorDoc || "N/A";
        const count = unitIds.length;
        const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

        const emailHtml = `
      <!DOCTYPE html><html><head><meta charSet="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background:#f6f7fb; margin:0; padding:0; color:#1f2937; }
        .container { max-width: 640px; margin: 24px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08); border:1px solid #e5e7eb;}
        .header { background:#10b981; color:#fff; padding:28px 32px; text-align:center; }
        .title { font-size:22px; font-weight:700; margin:0 0 6px; }
        .subtitle { font-size:13px; opacity:0.95; margin:0; }
        .section { padding:24px 32px; }
        .box { background:#ecfdf5; border:1px solid #34d399; border-radius:10px; padding:12px; margin-top:10px; }
        .muted { font-size:12px; color:#6b7280; }
        .footer { padding:32px 32px; background:#f9fafb; font-size:12px; color:#6b7280; text-align:center; }
        .list { background:#ffffff; border:1px dashed #a7f3d0; border-radius:8px; padding:14px; font-size:14px;}
        .heading { font-weight: 600; color: #047857; font-size: 18px; margin: 0 0 24px 0;}
        .label { font-size: 14px; font-weight: 600;}
        .detail-row { margin-bottom: 16px;}
      </style>
      </head><body><div class="container">
        <div class="header"><h1 class="title">Admin Notification</h1><p class="subtitle">InspecTech Inspection Management System</p></div>
        <div class="section">
         <div class="box"><p class="heading">Notification Details</p><div class="detail-row"><span class="label">Vendor:</span> ${vendorName}</div> <div class="detail-row"><span class="label">Date:</span> ${dateStr}</div></div>
          <div style="height:12px"></div>
          <div class="box">
            <div><span class="heading">Unit IDs (${count} item${count > 1 ? "s" : ""})</span></div>
            <div style="height:8px"></div>
            <div class="list">Please see attached CSV file:<ul class="bullet"><li>Unit ID list</li></ul></div>
          </div>
          <div style="height:16px"></div>
          <p class="muted">This is an automatic admin notification generated from configured schedule.</p>
          <p style="margin-top:10px;">Thank you,<br/><strong>The InspecTech Team</strong></p>
        </div>
        <div class="footer">This is an automated message from the InspecTech inspection management system.</div>
      </div></body></html>
    `;
        const csv = "unitId\n" + unitIds.join("\n");
        const attachments = [{ filename: "unit_ids.csv", content: csv, contentType: "text/csv" }];

        for (const i of inspections) {
          await Review.findOneAndUpdate(
            { unitId: i.unitId, vendorId: i.vendorId, departmentId: i.departmentId },
            { $set: { emailNotification: "yes" } },
            { upsert: true }
          );
        }

        await sendEmail(recipients, "Admin Notification", emailHtml, attachments);
        emailsSent++;
      }

      triggered++;
    }

    return NextResponse.json({
      success: true,
      triggered,
      emailsSent,
      time: `${t.hour}:${t.minute} ${t.period}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}