import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    // 🔐 Auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        {
          status: 401,
          success: false,
          message: "Unauthorized",
          data: null,
        },
        { status: 401 }
      );
    }

    // 📥 Query params
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const vendorId = searchParams.get("vendorId");

    if (!departmentId || !vendorId) {
      return NextResponse.json(
        {
          status: 400,
          success: false,
          message: "departmentId and vendorId are required",
          data: null,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await Inspection.aggregate([
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
          needReview: {
            $sum: {
              $cond: [
                { $eq: ["$inspectionStatus", "needs review"] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          passPercentage: {
            $cond: [
              { $eq: ["$total", 0] },
              "0",
              {
                $toString: {
                  $round: [
                    { $multiply: [{ $divide: ["$pass", "$total"] }, 100] },
                    2,
                  ],
                },
              },
            ],
          },
          failPercentage: {
            $cond: [
              { $eq: ["$total", 0] },
              "0",
              {
                $toString: {
                  $round: [
                    { $multiply: [{ $divide: ["$fail", "$total"] }, 100] },
                    2,
                  ],
                },
              },
            ],
          },
          needsReviewPercentage: {
            $cond: [
              { $eq: ["$total", 0] },
              "0",
              {
                $toString: {
                  $round: [
                    { $multiply: [{ $divide: ["$needReview", "$total"] }, 100] },
                    2,
                  ],
                },
              },
            ],
          },
        },
      },
    ]);

    const data = result[0] || {
      total: 0,
      passPercentage: "0",
      failPercentage: "0",
      needsReviewPercentage: "0",
    };

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Dashboard fetched successfully",
        data: {
          stats: data,
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