import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";

    // 1️⃣ Auth
    if (!token) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "No token provided",
        data: null
      }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({
        status: 403,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 403 });
    }

    // 2️⃣ Body validation
    const body = await req.json();
    const vendorId = String(body?.vendorId || "").trim();
    const status = String(body?.status || "").trim().toLowerCase();

    if (!vendorId || vendorId.length !== 24) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Invalid vendorId",
        data: null
      }, { status: 400 });
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "status must be 'active' or 'inactive'",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    // 3️⃣ Update vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "Vendor not found",
        data: null
      }, { status: 404 });
    }

    vendor.status = status;
    await vendor.save();

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Vendor status updated successfully",
      data: {
        _id: vendor._id,
        name: vendor.name,
        status: vendor.status
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
