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
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { departmentId, vendorId } = body;

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
    const overall = {
      passCount: pass,
      failCount: fail,
      passRate: total ? ((pass / total) * 100).toFixed(2) : "0",
    };

    return NextResponse.json({
      success: true,
      dashboard: {
        stats,
        overall
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
