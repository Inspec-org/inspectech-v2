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

    const monthly = Array.from({ length: 12 }, () => ({ pass: 0, fail: 0 }));
    const monthlyKeys: Array<{ y: number; m: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, now.getMonth() - i, 1);
      monthlyKeys.push({ y: d.getFullYear(), m: d.getMonth() });
    }
    const monthIndexMap = new Map<string, number>();
    monthlyKeys.forEach((km, idx) => monthIndexMap.set(`${km.y}-${km.m}`, idx));
    inspections.forEach((i) => {
      const d = new Date(i.createdAt);
      const idx = monthIndexMap.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (idx !== undefined) {
        if (i.inspectionStatus === "pass") monthly[idx].pass++;
        else if (i.inspectionStatus === "fail") monthly[idx].fail++;
      }
    });

    const quarterly = Array.from({ length: 4 }, () => ({ pass: 0, fail: 0 }));
    const currQ = Math.floor(now.getMonth() / 3);
    const quarterKeys: Array<{ y: number; q: number }> = [];
    for (let i = 3; i >= 0; i--) {
      let q = currQ - i;
      let y = year;
      while (q < 0) { q += 4; y -= 1; }
      quarterKeys.push({ y, q });
    }
    const quarterIndexMap = new Map<string, number>();
    quarterKeys.forEach((kq, idx) => quarterIndexMap.set(`${kq.y}-${kq.q}`, idx));
    inspections.forEach((i) => {
      const d = new Date(i.createdAt);
      const q = Math.floor(d.getMonth() / 3);
      const idx = quarterIndexMap.get(`${d.getFullYear()}-${q}`);
      if (idx !== undefined) {
        if (i.inspectionStatus === "pass") quarterly[idx].pass++;
        else if (i.inspectionStatus === "fail") quarterly[idx].fail++;
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
