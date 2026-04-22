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

function getRange(timeRange?: TimeRange) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let start: Date | null = null;
  let end: Date | null = null;

  switch (timeRange) {
    case "Last Month":
      start = new Date(now); start.setMonth(start.getMonth() - 1); start.setDate(1);
      end = new Date(now); end.setDate(0);
      break;

    case "Last 3 Months":
      start = new Date(now); start.setMonth(start.getMonth() - 3); start.setDate(1);
      end = new Date(now); end.setDate(0);
      break;

    case "Last 6 Months":
      start = new Date(now); start.setMonth(start.getMonth() - 6); start.setDate(1);
      end = new Date(now); end.setDate(0);
      break;

    case "Last Year":
      start = new Date(now); start.setFullYear(start.getFullYear() - 1); start.setMonth(0); start.setDate(1);
      end = new Date(now); end.setFullYear(end.getFullYear() - 1); end.setMonth(11); end.setDate(31);
      break;
  }

  return { start, end };
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
    const { departmentId, vendorId, timeRange, year } = body;

    await connectDB();

    const { start, end } = getRange(timeRange);
    const selectedYear =
      typeof year === "number" && !isNaN(year)
        ? year
        : new Date().getFullYear();

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
        // normalize schema (strings → numbers)
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

    // filtering
    if (typeof year === "number" && !isNaN(year)) {
      pipeline.push({ $match: { year } });
    } else if (start || end) {
      const dateFilter: any = {};
      if (start) dateFilter.$gte = start;
      if (end) dateFilter.$lte = end;
      pipeline.push({ $match: { fullDate: dateFilter } });
    }

    pipeline.push({
      $facet: {
        // STATUS
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

        // MONTHLY
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

        // QUARTERLY
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

        // YEARLY (last 4 years)
        yearly: [
          {
            $match: {
              year: { $gte: selectedYear - 3, $lte: selectedYear },
            },
          },
          {
            $group: {
              _id: "$year",
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
    const passPct = s.total ? +((s.pass / s.total) * 100).toFixed(2) : 0;
    const failPct = s.total ? +((s.fail / s.total) * 100).toFixed(2) : 0;

    const status = {
      total: s.total,
      pass: s.pass,
      fail: s.fail,
      pie: [
        { name: "Passed", value: s.pass, percentage: passPct, color: "#10b981" },
        { name: "Failed", value: s.fail, percentage: failPct, color: "#ef4444" },
      ],
    };

    // ---------- MONTHLY ----------
    const months = Array.from({ length: 12 }, () => ({ total: 0, pass: 0, fail: 0 }));
    result.monthly.forEach((m: any) => {
      const idx = m._id - 1;
      if (idx >= 0 && idx < 12) months[idx] = m;
    });

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const monthly = {
      passRate: months.map((m, i) => ({
        date: `${monthNames[i]} '${String(selectedYear).slice(-2)}`,
        passRate: m.total ? +((m.pass / m.total) * 100).toFixed(2) : 0,
      })),
      volume: months.map((m, i) => ({
        date: `${monthNames[i]} '${String(selectedYear).slice(-2)}`,
        inspections: m.total,
        pass: m.pass,
        fail: m.fail,
      })),
    };

    // ---------- QUARTERLY ----------
    const quarters = Array.from({ length: 4 }, () => ({ total: 0, pass: 0, fail: 0 }));
    result.quarterly.forEach((q: any) => {
      if (q._id >= 0 && q._id < 4) quarters[q._id] = q;
    });

    const quarterly = {
      passRate: quarters.map((q, i) => ({
        date: `Q${i + 1} '${String(selectedYear).slice(-2)}`,
        passRate: q.total ? +((q.pass / q.total) * 100).toFixed(2) : 0,
      })),
      volume: quarters.map((q, i) => ({
        date: `Q${i + 1} '${String(selectedYear).slice(-2)}`,
        inspections: q.total,
        pass: q.pass,
        fail: q.fail,
      })),
    };

    // ---------- YEARLY ----------
    const yearlyMap: Record<number, any> = {};
    result.yearly.forEach((y: any) => {
      yearlyMap[y._id] = y;
    });

    const yearly = {
      passRate: Array.from({ length: 4 }, (_, i) => {
        const yr = selectedYear - 3 + i;
        const d = yearlyMap[yr] || { total: 0, pass: 0 };
        return {
          date: String(yr),
          passRate: d.total ? +((d.pass / d.total) * 100).toFixed(2) : 0,
        };
      }),
      volume: Array.from({ length: 4 }, (_, i) => {
        const yr = selectedYear - 3 + i;
        const d = yearlyMap[yr] || { total: 0, pass: 0, fail: 0 };
        return {
          date: String(yr),
          inspections: d.total,
          pass: d.pass,
          fail: d.fail,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      analytics: {
        status,
        breakdown: {
          period: year ? `Year ${year}` : timeRange,
          total: s.total,
          pass: s.pass,
          fail: s.fail,
        },
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