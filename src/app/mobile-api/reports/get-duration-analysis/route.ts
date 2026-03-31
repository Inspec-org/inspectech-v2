// src/app/api/reports/get-duration-analysis/route.ts
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

function toMinutes(i: any) {
  const min = parseInt(i.durationMin || "0", 10) || 0;
  const sec = parseInt(i.durationSec || "0", 10) || 0;
  return min + sec / 60;
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
    const binSizeParam = url.searchParams.get("binSize");
    const binSize = binSizeParam ? parseInt(binSizeParam) : 3;

    await connectDB();

    const query: any = {};
    if (departmentId) query.departmentId = departmentId;
    if (vendorId) query.vendorId = vendorId;

    const inspections = await Inspection.find(query);

    let filtered = inspections;

    if (typeof year === "number" && !Number.isNaN(year)) {
      filtered = inspections.filter(
        (i: any) => parseInt(i.dateYear || "0") === year
      );
    } else {
      const rangeStart = getRangeStart(timeRange);
      filtered = rangeStart
        ? inspections.filter((i: any) => {
            const day = parseInt(i.dateDay || "1");
            const month = parseInt(i.dateMonth || "1") - 1;
            const yr = parseInt(i.dateYear || "1970");
            return new Date(yr, month, day) >= rangeStart;
          })
        : inspections;
    }

    // -----------------------------------------
    // DURATION HISTOGRAM
    // -----------------------------------------
    const durationMinutes = filtered.map(toMinutes).filter((n) => n >= 0);
    const maxMin = Math.max(0, ...durationMinutes);
    const binCount = Math.max(1, Math.ceil(maxMin / binSize));

    const durations = Array.from({ length: binCount }, (_, idx) => {
      const start = idx * binSize;
      const end = start + binSize;
      return {
        range: `${start}-${end} min`,
        count: durationMinutes.filter((m) => m >= start && m < end).length,
      };
    });

    // -----------------------------------------
    // METADATA
    // -----------------------------------------
    const buildDate = (i: any) => {
      const day = parseInt(i.dateDay || "1");
      const month = parseInt(i.dateMonth || "1") - 1;
      const yr = parseInt(i.dateYear || "1970");
      return new Date(yr, month, day).getTime();
    };

    const timestamps = filtered.map(buildDate);
    const formatDate = (ts: number) =>
      new Date(ts).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });

    const metadata = {
      totalInspections: filtered.length,
      dateFrom: filtered.length > 0 ? formatDate(Math.min(...timestamps)) : "",
      dateTo: filtered.length > 0 ? formatDate(Math.max(...timestamps)) : "",
    };

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Duration analysis fetched successfully",
        data: {
          analytics: {
            durations,
            metadata,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 500,
        success: false,
        message: error?.message || "Internal Server Error",
        data: null,
      },
      { status: 500 }
    );
  }
}