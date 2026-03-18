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
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    // 📥 Query params instead of body
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const vendorId = searchParams.get("vendorId");

    if (!departmentId || !vendorId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "departmentId and vendorId are required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    const inspections = await Inspection.find({ departmentId, vendorId });

    // ---------- STATS ----------
    const total = inspections.length;
    const pass = inspections.filter((i) => i.inspectionStatus === "pass").length;
    const fail = inspections.filter((i) => i.inspectionStatus === "fail").length;
    const needReview = inspections.filter((i) => i.inspectionStatus === "needs review").length;

    const stats = {
      total,
      passPercentage: total ? ((pass / total) * 100).toFixed(2) : "0",
      failPercentage: total ? ((fail / total) * 100).toFixed(2) : "0",
      needsReviewPercentage: total ? ((needReview / total) * 100).toFixed(2) : "0",
    };

    // ---------- OVERALL ----------
    // const overall = {
    //   passCount: pass,
    //   failCount: fail,
    //   passRate: total ? ((pass / total) * 100).toFixed(2) : "0",
    // };

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Dashboard fetched successfully",
      data: {
        stats,
        // overall
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}