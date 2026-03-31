import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

type TimeRange = "All Time" | "Last Month" | "Last 3 Months" | "Last 6 Months" | "Last Year";

function getRangeStart(timeRange?: TimeRange) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (timeRange) {
    case "Last Month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
      return d;
    }
    case "Last 3 Months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setDate(1);
      return d;
    }
    case "Last 6 Months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      d.setDate(1);
      return d;
    }
    case "Last Year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      d.setMonth(0);
      d.setDate(1);
      return d;
    }
    default:
      return null;
  }
}

function getRangeEnd(timeRange?: TimeRange) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (timeRange) {
    case "Last Month":
    case "Last 3 Months":
    case "Last 6 Months": {
      const d = new Date(now);
      d.setDate(0);
      return d;
    }
    case "Last Year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      d.setMonth(11);
      d.setDate(31);
      return d;
    }
    default:
      return null;
  }
}

function buildDate(i: any) {
  const day = parseInt(i.dateDay || "1");
  const month = parseInt(i.dateMonth || "1") - 1;
  const year = parseInt(i.dateYear || "1970");
  return new Date(year, month, day);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { status: 401, success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const departmentId = url.searchParams.get("departmentId") || undefined;
    const vendorId = url.searchParams.get("vendorId") || undefined;
    const timeRange = url.searchParams.get("timeRange") as TimeRange | undefined;
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam) : undefined;

    await connectDB();

    const query: any = {};
    if (departmentId) query.departmentId = departmentId;
    if (vendorId) query.vendorId = vendorId;

    const inspections = await Inspection.find(query).select(
      "inspectionStatus dateDay dateMonth dateYear"
    );

    let dataToUse = inspections;

    if (typeof year === "number" && !Number.isNaN(year)) {
      dataToUse = inspections.filter(
        (i: any) => parseInt(i.dateYear || "0") === year
      );
    } else {
      const rangeStart = getRangeStart(timeRange);
      const rangeEnd = getRangeEnd(timeRange);
      dataToUse = inspections.filter((i: any) => {
        const t = buildDate(i).getTime();
        const startOk = rangeStart ? t >= rangeStart.getTime() : true;
        const endOk = rangeEnd ? t <= rangeEnd.getTime() : true;
        return startOk && endOk;
      });
    }

    const total = dataToUse.length;
    const pass = dataToUse.filter((i: any) => i.inspectionStatus === "pass").length;
    const fail = dataToUse.filter((i: any) => i.inspectionStatus === "fail").length;
    const passPct = total ? Number(((pass / total) * 100).toFixed(2)) : 0;
    const failPct = total ? Number(((fail / total) * 100).toFixed(2)) : 0;

    // STATUS (unchanged)
    const status = {
      total,
      pass,
      fail,
      pie: [
        { name: "Passed", value: pass, percentage: passPct },
        { name: "Failed", value: fail, percentage: failPct },
      ],
    };

    const now = new Date();
    const selectedYear = year || now.getFullYear();

    // -----------------------------------------
    // BREAKDOWN — quarterly volume
    // -----------------------------------------
    const quarterlyCounts = Array.from({ length: 4 }, () => ({
      pass: 0,
      fail: 0,
      total: 0,
    }));

    dataToUse.forEach((i: any) => {
      const d = buildDate(i);
      const q = Math.floor(d.getMonth() / 3);
      quarterlyCounts[q].total++;
      if (i.inspectionStatus === "pass") quarterlyCounts[q].pass++;
      else if (i.inspectionStatus === "fail") quarterlyCounts[q].fail++;
    });

    const breakdown = quarterlyCounts.map((q, idx) => ({
      period: `Q${idx + 1} '${String(selectedYear).slice(-2)}`,
      total: q.total,
      pass: q.pass,
      fail: q.fail,
    }));

    // -----------------------------------------
    // TRENDS — monthly only (pass rate + volume)
    // -----------------------------------------
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlyCounts = Array.from({ length: 12 }, () => ({ pass: 0, fail: 0, total: 0 }));
    dataToUse.forEach((i: any) => {
      const d = buildDate(i);
      const m = d.getMonth();
      monthlyCounts[m].total++;
      if (i.inspectionStatus === "pass") monthlyCounts[m].pass++;
      else if (i.inspectionStatus === "fail") monthlyCounts[m].fail++;
    });

    const trends = {
      passRate: monthlyCounts.map((m, idx) => ({
        date: `${monthNames[idx]} '${String(selectedYear).slice(-2)}`,
        passRate: m.total ? Number(((m.pass / m.total) * 100).toFixed(2)) : 0,
      })),
      volume: monthlyCounts.map((m, idx) => ({
        date: `${monthNames[idx]} '${String(selectedYear).slice(-2)}`,
        inspections: m.total,
        pass: m.pass,
        fail: m.fail,
      })),
    };

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Analytics fetched successfully",
        data: {
          analytics: {
            status,
            breakdown,
            trends,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 500, success: false, message: error?.message || "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}