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

    // ---------- MONTHLY / QUARTERLY / ANNUAL PASS-FAIL ----------
    const now = new Date();
    const year = now.getFullYear();

    // All arrays use { pass, fail }

    // -------- MONTHLY: 12 months of CURRENT YEAR --------
    const monthly = Array.from({ length: 12 }, () => ({ pass: 0, fail: 0 }));

    inspections.forEach((i) => {
      const date = new Date(i.createdAt);
      if (date.getFullYear() === year) {
        const monthIndex = date.getMonth(); // 0–11
        if (i.inspectionStatus === "pass") {
          monthly[monthIndex].pass++;
        } else if (i.inspectionStatus === "fail") {
          monthly[monthIndex].fail++;
        }
      }
    });

    // -------- QUARTERLY: 4 quarters of CURRENT YEAR --------
    const quarterly = Array.from({ length: 4 }, () => ({ pass: 0, fail: 0 }));

    inspections.forEach((i) => {
      const date = new Date(i.createdAt);
      if (date.getFullYear() === year) {
        const quarterIndex = Math.floor(date.getMonth() / 3); // 0,1,2,3
        if (i.inspectionStatus === "pass") {
          quarterly[quarterIndex].pass++;
        } else if (i.inspectionStatus === "fail") {
          quarterly[quarterIndex].fail++;
        }
      }
    });

    // -------- ANNUALLY: LAST 4 YEARS (including current year) --------
    const annually = Array.from({ length: 4 }, () => ({ pass: 0, fail: 0 }));
    const startYear = year - 3; // e.g., if current is 2025, consider 2022–2025

    inspections.forEach((i) => {
      const date = new Date(i.createdAt);
      const y = date.getFullYear();
      if (y >= startYear && y <= year) {
        const yearIndex = y - startYear; // 0–3
        if (i.inspectionStatus === "pass") {
          annually[yearIndex].pass++;
        } else if (i.inspectionStatus === "fail") {
          annually[yearIndex].fail++;
        }
      }
    });

    const monthlyInspection = { monthly, quarterly, annually };


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
        monthlyInspection,
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
