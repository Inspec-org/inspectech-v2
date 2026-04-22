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

function getRange(timeRange?: TimeRange) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let start: Date | null = null;
  let end: Date | null = null;

  switch (timeRange) {
    case "Last Month": {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);

      end = new Date(now);
      end.setDate(0);
      break;
    }
    case "Last 3 Months": {
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      start.setDate(1);

      end = new Date(now);
      end.setDate(0);
      break;
    }
    case "Last 6 Months": {
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      start.setDate(1);

      end = new Date(now);
      end.setDate(0);
      break;
    }
    case "Last Year": {
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      start.setMonth(0);
      start.setDate(1);

      end = new Date(now);
      end.setFullYear(end.getFullYear() - 1);
      end.setMonth(11);
      end.setDate(31);
      break;
    }
  }

  return { start, end };
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
    const departmentId = url.searchParams.get("departmentId");
    const vendorId = url.searchParams.get("vendorId");
    const timeRange = url.searchParams.get("timeRange") as TimeRange;
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? Number(yearParam) : null;

    await connectDB();

    const { start, end } = getRange(timeRange);

    const pipeline: any[] = [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $toString: "$departmentId" }, departmentId] },
              { $eq: [{ $toString: "$vendorId" }, vendorId] },
            ],
          },
        },
      },
      {
        $addFields: {
          year: { $toInt: "$dateYear" },
          month: { $toInt: "$dateMonth" },
          day: { $toInt: "$dateDay" },
        },
      },
      {
        $addFields: {
          fullDate: {
            $dateFromParts: {
              year: "$year",
              month: "$month",
              day: "$day",
            },
          },
        },
      },
    ];

    // apply filters
    if (year) {
      pipeline.push({
        $match: { year },
      });
    } else if (start || end) {
      const dateMatch: any = {};
      if (start) dateMatch.$gte = start;
      if (end) dateMatch.$lte = end;

      pipeline.push({
        $match: {
          fullDate: dateMatch,
        },
      });
    }

    // facet everything in one pass
    pipeline.push({
      $facet: {
        status: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              pass: {
                $sum: {
                  $cond: [{ $eq: ["$inspectionStatus", "pass"] }, 1, 0],
                },
              },
              fail: {
                $sum: {
                  $cond: [{ $eq: ["$inspectionStatus", "fail"] }, 1, 0],
                },
              },
            },
          },
        ],

        quarterly: [
          {
            $addFields: {
              quarter: {
                $floor: {
                  $divide: [{ $subtract: ["$month", 1] }, 3],
                },
              },
            },
          },
          {
            $group: {
              _id: "$quarter",
              total: { $sum: 1 },
              pass: {
                $sum: {
                  $cond: [{ $eq: ["$inspectionStatus", "pass"] }, 1, 0],
                },
              },
              fail: {
                $sum: {
                  $cond: [{ $eq: ["$inspectionStatus", "fail"] }, 1, 0],
                },
              },
            },
          },
        ],

        monthly: [
          {
            $group: {
              _id: "$month",
              total: { $sum: 1 },
              pass: {
                $sum: {
                  $cond: [{ $eq: ["$inspectionStatus", "pass"] }, 1, 0],
                },
              },
              fail: {
                $sum: {
                  $cond: [{ $eq: ["$inspectionStatus", "fail"] }, 1, 0],
                },
              },
            },
          },
        ],
      },
    });

    const [result] = await Inspection.aggregate(pipeline);

    // ---------- STATUS ----------
    const s = result.status[0] || { total: 0, pass: 0, fail: 0 };
    const passPct = s.total ? Number(((s.pass / s.total) * 100).toFixed(2)) : 0;
    const failPct = s.total ? Number(((s.fail / s.total) * 100).toFixed(2)) : 0;

    const status = {
      total: s.total,
      pass: s.pass,
      fail: s.fail,
      pie: [
        { name: "Passed", value: s.pass, percentage: passPct },
        { name: "Failed", value: s.fail, percentage: failPct },
      ],
    };

    const selectedYear = year || new Date().getFullYear();

    // ---------- BREAKDOWN ----------
    const quarterly = Array.from({ length: 4 }, () => ({
      total: 0,
      pass: 0,
      fail: 0,
    }));

    for (const q of result.quarterly) {
      if (q._id >= 0 && q._id < 4) {
        quarterly[q._id] = q;
      }
    }

    const breakdown = quarterly.map((q, i) => ({
      period: `Q${i + 1} '${String(selectedYear).slice(-2)}`,
      total: q.total,
      pass: q.pass,
      fail: q.fail,
    }));

    // ---------- TRENDS ----------
    const months = Array.from({ length: 12 }, () => ({
      total: 0,
      pass: 0,
      fail: 0,
    }));

    for (const m of result.monthly) {
      const idx = m._id - 1;
      if (idx >= 0 && idx < 12) {
        months[idx] = m;
      }
    }

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const trends = {
      passRate: months.map((m, i) => ({
        date: `${monthNames[i]} '${String(selectedYear).slice(-2)}`,
        passRate: m.total ? Number(((m.pass / m.total) * 100).toFixed(2)) : 0,
      })),
      volume: months.map((m, i) => ({
        date: `${monthNames[i]} '${String(selectedYear).slice(-2)}`,
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