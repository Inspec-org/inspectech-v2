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
  switch (timeRange) {
    case "Last Month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "Last 3 Months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case "Last 6 Months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case "Last Year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
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

    const inspections = await Inspection.find(query);

    const rangeStart = getRangeStart(timeRange);
    const filtered = rangeStart
      ? inspections.filter((i: any) => buildDate(i) >= rangeStart)
      : inspections;



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

    inspections.forEach((i: any) => {
      const d = buildDate(i);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        monthlyCounts[m].total++;
        if (i.inspectionStatus === "pass") monthlyCounts[m].pass++;
        else if (i.inspectionStatus === "fail") monthlyCounts[m].fail++;
      }
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

    inspections.forEach((i: any) => {
      const d = buildDate(i);
      if (d.getFullYear() === year) {
        const q = Math.floor(d.getMonth() / 3);
        quarterlyCounts[q].total++;
        if (i.inspectionStatus === "pass") quarterlyCounts[q].pass++;
        else if (i.inspectionStatus === "fail") quarterlyCounts[q].fail++;
      }
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

    inspections.forEach((i: any) => {
      const d = buildDate(i);
      if (d.getFullYear() >= startYear && d.getFullYear() <= year) {
        const yi = d.getFullYear() - startYear;
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
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
