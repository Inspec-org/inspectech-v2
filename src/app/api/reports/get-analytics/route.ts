// src/app/api/reports/get-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

type TimeRange = "All Time" | "Last Month" | "Last 3 Months" | "Last 6 Months" | "Last Year";

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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { departmentId, vendorId, timeRange }: { departmentId?: string; vendorId?: string; timeRange?: TimeRange } = body;

    await connectDB();

    const query: any = {};
    if (departmentId) query.departmentId = departmentId;
    if (vendorId) query.userId = vendorId;

    const inspections = await Inspection.find(query);

    const rangeStart = getRangeStart(timeRange);
    const filtered = rangeStart ? inspections.filter((i: any) => new Date(i.createdAt) >= rangeStart) : inspections;

    const total = filtered.length;
    const pass = filtered.filter((i: any) => i.inspectionStatus === "pass").length;
    const fail = filtered.filter((i: any) => i.inspectionStatus === "fail").length;

    const passPct = total ? Number(((pass / total) * 100).toFixed(2)) : 0;
    const failPct = total ? Number(((fail / total) * 100).toFixed(2)) : 0;

    const status = {
      total,
      pass,
      fail,
      pie: [
        { name: "Passed", value: pass, percentage: passPct, color: "#10b981" },
        { name: "Failed", value: fail, percentage: failPct, color: "#ef4444" },
      ],
    };

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const last3 = inspections.filter((i: any) => new Date(i.createdAt) >= threeMonthsAgo);
    const breakdown = {
      period: "Last 3 months",
      total: last3.length,
      pass: last3.filter((i: any) => i.inspectionStatus === "pass").length,
      fail: last3.filter((i: any) => i.inspectionStatus === "fail").length,
    };

    const year = now.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyCounts = Array.from({ length: 12 }, () => ({ pass: 0, total: 0 }));
    inspections.forEach((i: any) => {
      const d = new Date(i.createdAt);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        monthlyCounts[m].total++;
        if (i.inspectionStatus === "pass") monthlyCounts[m].pass++;
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
      })),
    };

    const quarterlyCounts = Array.from({ length: 4 }, () => ({ pass: 0, total: 0 }));
    inspections.forEach((i: any) => {
      const d = new Date(i.createdAt);
      if (d.getFullYear() === year) {
        const q = Math.floor(d.getMonth() / 3);
        quarterlyCounts[q].total++;
        if (i.inspectionStatus === "pass") quarterlyCounts[q].pass++;
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
      })),
    };

    const startYear = year - 3;
    const yearlyCounts = Array.from({ length: 4 }, () => ({ pass: 0, total: 0 }));
    inspections.forEach((i: any) => {
      const d = new Date(i.createdAt);
      if (d.getFullYear() >= startYear && d.getFullYear() <= year) {
        const yi = d.getFullYear() - startYear;
        yearlyCounts[yi].total++;
        if (i.inspectionStatus === "pass") yearlyCounts[yi].pass++;
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
      })),
    };

    function toMinutes(i: any) {
      const min = parseInt(i.durationMin || "0", 10) || 0;
      const sec = parseInt(i.durationSec || "0", 10) || 0;
      return min + sec / 60;
    }
    const durationMinutes = filtered.map(toMinutes).filter((n) => n >= 0);
    const maxMin = Math.max(0, ...durationMinutes, 0);
    const binSize = 5;
    const binCount = Math.max(1, Math.ceil(maxMin / binSize));
    const durations = Array.from({ length: binCount }, (_, idx) => {
      const start = idx * binSize;
      const end = start + binSize;
      const count = durationMinutes.filter((m) => m >= start && m < end).length;
      return { range: `${start}-${end} min`, count };
    });

    return NextResponse.json({
      success: true,
      analytics: {
        status,
        breakdown,
        trends: { monthly, quarterly, yearly },
        durations,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}