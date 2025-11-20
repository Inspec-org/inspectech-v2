import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    // const authHeader = req.headers.get("Authorization");
    // const token = authHeader?.split(" ")[1];
    // const user = await getUserFromToken(token);
    // if (!user) {
    //   return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json();
    const { departmentId, vendorId } = body;

    await connectDB();

    const inspections = await Inspection.find({ departmentId, userId: vendorId });

    // ---------- STATS ----------
    const total = inspections.length;
    const pass = inspections.filter((i) => i.inspectionStatus === "pass").length;
    const fail = inspections.filter((i) => i.inspectionStatus === "fail").length;
    const needReview = inspections.filter((i) => i.inspectionStatus === "needs review").length;
    console.log(pass)
    const stats = {
      total,
      passPercentage: total ? ((pass / total) * 100).toFixed(2) : "0",
      failPercentage: total ? ((fail / total) * 100).toFixed(2) : "0",
      needsReviewPercentage: total ? ((needReview / total) * 100).toFixed(2) : "0",
    };

    // ---------- MONTHLY / QUARTERLY / ANNUAL PASS-FAIL ----------
    // ---------- MONTHLY / QUARTERLY / ANNUAL PASS-FAIL ----------
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    //* -------- MONTHLY: 4 weeks in current month --------
    const monthly = Array.from({ length: 4 }, () => ({ pass: 0, fail: 0 }));

    inspections.forEach((i) => {
      const date = new Date(i.createdAt);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const weekIndex = Math.floor((date.getDate() - 1) / 7); // 0-3
        if (weekIndex >= 0 && weekIndex < 4) {
          i.inspectionStatus === "pass"
            ? monthly[weekIndex].pass++
            : monthly[weekIndex].fail++;
        }
      }
    });

    //* -------- QUARTERLY: 4 quarters in current year --------
    const quarterly = Array.from({ length: 4 }, () => ({ pass: 0, fail: 0 }));

    inspections.forEach((i) => {
      const date = new Date(i.createdAt);
      if (date.getFullYear() === year) {
        const quarterIndex = Math.floor(date.getMonth() / 3); // 0=Jan–Mar, 1=Apr–Jun ...
        i.inspectionStatus === "pass"
          ? quarterly[quarterIndex].pass++
          : quarterly[quarterIndex].fail++;
      }
    });

    //* -------- ANNUALLY: 12 months of current year --------
    const annually = Array.from({ length: 12 }, () => ({ pass: 0, fail: 0 }));

    inspections.forEach((i) => {
      const date = new Date(i.createdAt);
      if (date.getFullYear() === year) {
        const monthIndex = date.getMonth(); // 0–11
        i.inspectionStatus === "pass"
          ? annually[monthIndex].pass++
          : annually[monthIndex].fail++;
      }
    });

    const monthlyInspection = { monthly, quarterly, annually };
    console.log(pass)

    // ---------- OVERALL ----------
    const overall = {
      passCount: pass,
      failCount: fail,
      passRate: total ? ((pass / total) * 100).toFixed(2) : "0",
    };

    // ---------- RECENT INSPECTIONS (BASED ON USER + DEPT) ----------
    const recentDocs = await Inspection.find({
      userId: vendorId,
      departmentId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "unitId inspectionStatus vendor location inspector type durationMin durationSec dateDay dateMonth dateYear createdAt"
      )
      .lean(); 

    const recent = recentDocs.map((i) => ({
      ...i,
      duration: `${i.durationMin} min ${i.durationSec} sec`,
      date: `${String(i.dateDay).padStart(2, "0")} ${i.dateMonth} ${i.dateYear}`,
    }));

    return NextResponse.json({
      success: true,
      dashboard: {
        stats,
        monthlyInspection,
        overall,
        recent,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
