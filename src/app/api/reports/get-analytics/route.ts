// src/app/api/reports/get-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

type TimeRange =
  | "All Time"
  | "Last Month"
  | "Last 3 Months"
  | "Last 6 Months"
  | "Last Year";

function getRangeStart(timeRange?: TimeRange) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (timeRange) {
    case "Last Month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      d.setDate(1); // Start of last month
      return d;
    }
    case "Last 3 Months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setDate(1); // Start of 3 months ago
      return d;
    }
    case "Last 6 Months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      d.setDate(1); // Start of 6 months ago
      return d;
    }
    case "Last Year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      d.setMonth(0);
      d.setDate(1); // Start of last year
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
    case "Last Month": {
      const d = new Date(now);
      d.setDate(0); // Last day of previous month
      return d;
    }
    case "Last 3 Months": {
      const d = new Date(now);
      d.setDate(0); // Last day of previous month
      return d;
    }
    case "Last 6 Months": {
      const d = new Date(now);
      d.setDate(0); // Last day of previous month
      return d;
    }
    case "Last Year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      d.setMonth(11);
      d.setDate(31); // Last day of last year
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


export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      departmentId,
      vendorId,
      timeRange,
    }: { departmentId?: string; vendorId?: string; timeRange?: TimeRange } =
      body;

    await connectDB();
    const query: any = {};
    if (departmentId) query.departmentId = departmentId;
    if (vendorId) query.vendorId = vendorId;

    const inspections = await Inspection.find(query).select("inspectionStatus dateDay dateMonth dateYear");

    const rangeStart = getRangeStart(timeRange);
    const rangeEnd = getRangeEnd(timeRange);
    const nowDate = new Date();
    nowDate.setHours(0, 0, 0, 0);
    const filtered = inspections.filter((i: any) => {
      const t = buildDate(i).getTime();
      const startOk = rangeStart ? t >= rangeStart.getTime() : true;
      const endOk = rangeEnd ? t <= rangeEnd.getTime() : true;
      return startOk && endOk;
    });

    // *** KEY CHANGE: Use filtered data for all calculations ***
    const dataToUse = filtered;

    const total = filtered.length;
    const pass = filtered.filter((i: any) => i.inspectionStatus === "pass")
      .length;
    const fail = filtered.filter((i: any) => i.inspectionStatus === "fail")
      .length;

    const passPct = total ? Number(((pass / total) * 100).toFixed(2)) : 0;
    const failPct = total ? Number(((fail / total) * 100).toFixed(2)) : 0;

    // -----------------------------------------
    // STATUS SUMMARY (total, pass, fail, pie data)
    // -----------------------------------------
    const status = {
      total,
      pass,
      fail,
      pie: [
        { name: "Passed", value: pass, percentage: passPct, color: "#10b981" },
        { name: "Failed", value: fail, percentage: failPct, color: "#ef4444" },
      ],
    };

    // -----------------------------------------
    // BREAKDOWN (Last 3 months stats)
    // -----------------------------------------
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const breakdown = {
      period: timeRange,
      total: total,
      pass: pass,
      fail: fail,
    };

    // -----------------------------------------
    // MONTHLY TRENDS (pass rate + volume)
    // -----------------------------------------
    const year = now.getFullYear();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyCounts = Array.from({ length: 12 }, () => ({
      pass: 0,
      fail: 0,
      total: 0,
    }));

    dataToUse.forEach((i: any) => {
      const d = buildDate(i);
      // if (d.getFullYear() === year) {
      const m = d.getMonth();
      monthlyCounts[m].total++;
      if (i.inspectionStatus === "pass") monthlyCounts[m].pass++;
      else if (i.inspectionStatus === "fail") monthlyCounts[m].fail++;
      // }
    });


    const monthly = {
      passRate: monthlyCounts.map((m, idx) => ({
        date: `${monthNames[idx]} '${String(year).slice(-2)}`,
        passRate: m.total ? Number(((m.pass / m.total) * 100).toFixed(2)) : 0,
      })),
      volume: monthlyCounts.map((m, idx) => ({
        date: `${monthNames[idx]} '${String(year).slice(-2)}`,
        inspections: m.total,
        pass: m.pass,
        fail: m.fail,
      })),
    };

    // -----------------------------------------
    // QUARTERLY TRENDS (pass rate + volume)
    // -----------------------------------------
    const quarterlyCounts = Array.from({ length: 4 }, () => ({
      pass: 0,
      fail: 0,
      total: 0,
    }));

    dataToUse.forEach((i: any) => {
      const d = buildDate(i);
      // if (d.getFullYear() === year) {
      const q = Math.floor(d.getMonth() / 3);
      quarterlyCounts[q].total++;
      if (i.inspectionStatus === "pass") quarterlyCounts[q].pass++;
      else if (i.inspectionStatus === "fail") quarterlyCounts[q].fail++;
      // }
    });


    const quarterly = {
      passRate: quarterlyCounts.map((q, idx) => ({
        date: `Q${idx + 1} '${String(year).slice(-2)}`,
        passRate: q.total ? Number(((q.pass / q.total) * 100).toFixed(2)) : 0,
      })),
      volume: quarterlyCounts.map((q, idx) => ({
        date: `Q${idx + 1} '${String(year).slice(-2)}`,
        inspections: q.total,
        pass: q.pass,
        fail: q.fail,
      })),
    };


    // -----------------------------------------
    // YEARLY TRENDS (pass rate + volume) – last 4 years
    // -----------------------------------------
    const startYear = year - 3;
    const yearlyCounts = Array.from({ length: 4 }, () => ({
      pass: 0,
      fail: 0,
      total: 0,
    }));

    dataToUse.forEach((i: any) => {
      const d = buildDate(i);
      const yi = d.getFullYear() - startYear;
      if (yi >= 0 && yi < 4) { // Add this bounds check
        yearlyCounts[yi].total++;
        if (i.inspectionStatus === "pass") yearlyCounts[yi].pass++;
        else if (i.inspectionStatus === "fail") yearlyCounts[yi].fail++;
      }
    });


    const yearly = {
      passRate: yearlyCounts.map((y, idx) => ({
        date: String(startYear + idx),
        passRate: y.total ? Number(((y.pass / y.total) * 100).toFixed(2)) : 0,
      })),
      volume: yearlyCounts.map((y, idx) => ({
        date: String(startYear + idx),
        inspections: y.total,
        pass: y.pass,
        fail: y.fail,
      })),
    };


    return NextResponse.json({
      success: true,
      analytics: {
        // Final payload sections with comments added above:
        status,
        breakdown,
        trends: {
          monthly,
          quarterly,
          yearly,
        },
      },
    });
  } catch (error: any) {
    ;
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
