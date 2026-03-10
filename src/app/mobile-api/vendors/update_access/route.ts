import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PUT(req: NextRequest) {
  try {
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
    if (!actor || (actor.role !== "admin" && actor.role !== "superadmin")) {
      return NextResponse.json({
        status: 403,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 403 });
    }

    // 2️⃣ Body validation
    const body = await req.json();
    const vendorId = String(body?.vendorId || "");
    const departmentIds = Array.isArray(body?.departmentIds)
      ? body.departmentIds.map((x: any) => String(x)).filter((x: any) => x.length === 24)
      : [];

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
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "Vendor not found",
        data: null
      }, { status: 404 });
    }

    // 4️⃣ Validate departmentIds and update
    const validDepartments = await Department.find({ _id: { $in: departmentIds } }).select("_id").lean();
    vendor.departmentAccess = validDepartments.map((d: any) => d._id);
    await vendor.save();

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Vendor department access updated successfully",
      data: {
        _id: vendor._id,
        name: vendor.name,
        departmentAccess: vendor.departmentAccess
      }
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
