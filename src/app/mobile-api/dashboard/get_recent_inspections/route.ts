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

    // 📥 Query params
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

    // ---------- RECENT INSPECTIONS ----------
    const recentDocs = await Inspection.find({
      vendorId,
      departmentId,
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "unitId inspectionStatus vendor location inspector type durationMin durationSec dateDay dateMonth dateYear createdAt"
      )
      .lean();

    const recent = recentDocs.map((i) => ({
      ...i,
      duration: `${i.durationMin} min ${i.durationSec} sec`,
      date: `${String(i.dateDay).padStart(2, "0")}-${i.dateMonth}-${i.dateYear}`,
    }));

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Recent inspections fetched successfully",
      data: {
        recent
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