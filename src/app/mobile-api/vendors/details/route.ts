import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || "";
    const token = req.headers.get("Authorization")?.split(" ")[1] || "";

    // 1️⃣ Auth
    if (!token) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "No token provided",
        data: null
      }, { status: 401 });
    }

    const actor = await getUserFromToken(token);
    if (!actor) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    // 2️⃣ Validate vendorId
    if (!vendorId || vendorId.length !== 24) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Invalid vendorId",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    // 3️⃣ Fetch vendor
    const vendor = await Vendor.findById(vendorId)
      .select("_id name departmentAccess")
      .lean();

    if (!vendor) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "Vendor not found",
        data: null
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Vendor retrieved successfully",
      data: vendor
    }, { status: 200 });

  } catch (e: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: e?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}
