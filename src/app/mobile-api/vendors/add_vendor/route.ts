import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";

    const user = await getUserFromToken(token);

    // 1️⃣ Check authorization
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({
        status: 403,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 403 });
    }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const departmentAccess: string[] = Array.isArray(body?.departmentAccess) ? body.departmentAccess : [];

    // 2️⃣ Validate inputs
    if (!name) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Vendor name is required",
        data: null
      }, { status: 400 });
    }

    if (!departmentAccess.length) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "departmentAccess must include at least one department id",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    // 3️⃣ Check if vendor already exists
    const exists = await Vendor.findOne({ name });
    if (exists) {
      return NextResponse.json({
        status: 409,
        success: false,
        message: "Vendor already exists",
        data: null
      }, { status: 409 });
    }

    // 4️⃣ Create vendor
    const vendor = await Vendor.create({ name, departmentAccess });

    return NextResponse.json({
      status: 201,
      success: true,
      message: "Vendor created successfully",
      data: {
        _id: vendor._id,
        name: vendor.name,
        departmentAccess: vendor.departmentAccess
      }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}
