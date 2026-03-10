import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    // 1️⃣ Check token
    if (!token) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "No token provided",
        data: null
      }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    // 2️⃣ Check user role
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
    const color = String(body?.color || "").trim();
    const icon = String(body?.icon || "").trim();

    // 3️⃣ Validate name
    if (!name) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Department name is required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    // 4️⃣ Check if department already exists
    const exists = await Department.findOne({ name });
    if (exists) {
      return NextResponse.json({
        status: 409,
        success: false,
        message: "Department already exists",
        data: null
      }, { status: 409 });
    }

    // 5️⃣ Create department
    const department = await Department.create({ name, color, icon });

    return NextResponse.json({
      status: 201,
      success: true,
      message: "Department created successfully",
      data: {
        _id: department._id,
        name: department.name,
        color: department.color,
        icon: department.icon
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
