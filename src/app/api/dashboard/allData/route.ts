import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";
import mongoose from "mongoose";

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
    const { departmentId, vendorId } = body;
    const deptId = new mongoose.Types.ObjectId(departmentId);
    const vendId = new mongoose.Types.ObjectId(vendorId);
    await connectDB();

    const result = await Inspection.aggregate([
      {
        $match: {
          departmentId: deptId,
          vendorId: vendId,
        }
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
              $cond: [{ $eq: ["$inspectionStatus", "needs review"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          pass: 1,
          fail: 1,
          needReview: 1,
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
          passRate: {
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
        },
      },
    ]);
    const data = result[0] || {
      total: 0,
      pass: 0,
      fail: 0,
      needReview: 0,
      passPercentage: "0",
      failPercentage: "0",
      needsReviewPercentage: "0",
      passRate: "0",
    };

    return NextResponse.json({
      success: true,
      dashboard: {
        stats: {
          total: data.total,
          passPercentage: data.passPercentage,
          failPercentage: data.failPercentage,
          needsReviewPercentage: data.needsReviewPercentage,
        },
        overall: {
          passCount: data.pass,
          failCount: data.fail,
          passRate: data.passRate,
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