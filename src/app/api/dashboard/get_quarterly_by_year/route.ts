import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

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
    const { departmentId, vendorId, year } = body;

    const y = Number(year);
    if (!y || isNaN(y)) {
      return NextResponse.json(
        { success: false, message: "Invalid year" },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await Inspection.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              // ObjectId → compare as string
              { $eq: [{ $toString: "$departmentId" }, departmentId] },
              { $eq: [{ $toString: "$vendorId" }, vendorId] },

              // dateYear stored as string → cast to int
              { $eq: [{ $toInt: "$dateYear" }, y] },
            ],
          },
        },
      },
      {
        // compute quarter (0–3) with safe casting
        $addFields: {
          quarter: {
            $floor: {
              $divide: [
                { $subtract: [{ $toInt: "$dateMonth" }, 1] },
                3,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$quarter",
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
    ]);

    // normalize output to always 4 quarters
    const quarterly = Array.from({ length: 4 }, () => ({
      pass: 0,
      fail: 0,
    }));

    for (const r of result) {
      if (r._id >= 0 && r._id < 4) {
        quarterly[r._id] = {
          pass: r.pass,
          fail: r.fail,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        year: y,
        quarterly,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}