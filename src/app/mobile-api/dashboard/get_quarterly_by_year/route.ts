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
    const year = searchParams.get("year");

    if (!departmentId || !vendorId || !year) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "departmentId, vendorId and year are required",
        data: null
      }, { status: 400 });
    }

    const y = Number(year);
    if (!y || isNaN(y)) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Invalid year",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    // Fetch inspections
    const inspections = await Inspection.find({
      departmentId,
      vendorId,
      dateYear: y,
    });

    // ---------- QUARTERLY ----------
    const quarterly = Array.from({ length: 4 }, () => ({
      pass: 0,
      fail: 0,
    }));

    for (const i of inspections) {
      const q = Math.floor((i.dateMonth - 1) / 3);

      if (i.inspectionStatus === "pass") {
        quarterly[q].pass++;
      } else if (i.inspectionStatus === "fail") {
        quarterly[q].fail++;
      }
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Quarterly data fetched successfully",
      data: {
        year: y,
        quarterly,
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