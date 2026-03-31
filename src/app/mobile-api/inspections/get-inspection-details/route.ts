import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
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

    const unitId = req.nextUrl.searchParams.get("unitId");
    if (!unitId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "unitId is required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    let id = unitId.includes("%20") ? unitId.replaceAll("%20", " ") : unitId;

    const inspectionDoc = await Inspection.findOne({ unitId: id }).populate({ path: 'vendorId', select: 'name' }).lean();
    if (!inspectionDoc) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "Inspection not found",
        data: null
      }, { status: 404 });
    }

    // cast to any so TS won’t complain
    const inspection = inspectionDoc as any;

    const result = {
      ...inspection,
      vendorId: inspection.vendorId._id, // just the ObjectId
      vendor: inspection.vendorId?.name || null // keep vendor name
    };

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Inspection fetched successfully",
      data: result
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