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
  now.setHours(0, 0, 0, 0); // Reset to start of day
  
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
      year,
      binSize
    }: { departmentId?: string; vendorId?: string; timeRange?: TimeRange; year?: number; binSize: number } =
      body;

    await connectDB();

    const query: any = {};
    if (departmentId) query.departmentId = departmentId;
    if (vendorId) query.vendorId = vendorId;

    const inspections = await Inspection.find(query);
    let filtered = inspections;
    if (typeof year === 'number' && !Number.isNaN(year)) {
      filtered = inspections.filter((i: any) => parseInt(i.dateYear || "0") === year);
    } else {
      const rangeStart = getRangeStart(timeRange);
      filtered = rangeStart
        ? inspections.filter((i: any) => {
          const day = parseInt(i.dateDay || "1");
          const month = parseInt(i.dateMonth || "1") - 1;
          const yr = parseInt(i.dateYear || "1970");
          const inspectionDate = new Date(yr, month, day);
          return inspectionDate >= rangeStart;
        })
        : inspections;
    }


    // -----------------------------------------
    // DURATION HISTOGRAM (5-minute bins)
    // -----------------------------------------
    function toMinutes(i: any) {
      const min = parseInt(i.durationMin || "0", 10) || 0;
      const sec = parseInt(i.durationSec || "0", 10) || 0;
      return min + sec / 60;
    }

    const durationMinutes = filtered.map(toMinutes).filter((n) => n >= 0);
    const maxMin = Math.max(0, ...durationMinutes, 0);
    const binCount = Math.max(1, Math.ceil(maxMin / binSize));

    const durations = Array.from({ length: binCount }, (_, idx) => {
      const start = idx * binSize;
      const end = start + binSize;
      const count = durationMinutes.filter(
        (m) => m >= start && m < end
      ).length;
      return { range: `${start}-${end} min`, count };
    });

    const metadata = {
      totalInspections: filtered.length,
      dateFrom: filtered.length > 0
        ? new Date(Math.min(...filtered.map((i: any) => {
          const day = parseInt(i.dateDay || "1");
          const month = parseInt(i.dateMonth || "1") - 1;
          const year = parseInt(i.dateYear || "1970");
          return new Date(year, month, day).getTime();
        }))).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
        : '',
      dateTo: filtered.length > 0
        ? new Date(Math.max(...filtered.map((i: any) => {
          const day = parseInt(i.dateDay || "1");
          const month = parseInt(i.dateMonth || "1") - 1;
          const year = parseInt(i.dateYear || "1970");
          return new Date(year, month, day).getTime();
        }))).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
        : ''
    };

    return NextResponse.json({
      success: true,
      analytics: {
        durations,
        metadata  // 🔹 Add metadata to response
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
