import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";

    const actor = await getUserFromToken(token);

    // 1️⃣ Check authorization
    if (!actor || (actor.role !== "superadmin" && actor.role !== "admin")) {
      return NextResponse.json({
        status: 403,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 403 });
    }

    const body = await req.json();
    const departmentId = String(body?.departmentId || "").trim();
    const status = String(body?.status || "").toLowerCase();

    // 2️⃣ Validate inputs
    if (!departmentId || !Types.ObjectId.isValid(departmentId)) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Valid departmentId is required",
        data: null
      }, { status: 400 });
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Status must be 'active' or 'inactive'",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    // 3️⃣ Update department
    const updated = await Department.findByIdAndUpdate(
      departmentId,
      { $set: { status } },
      { new: true } // return the updated document
    );

    if (!updated) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "Department not found",
        data: null
      }, { status: 404 });
    }

    // 4️⃣ Return success response
    return NextResponse.json({
      status: 200,
      success: true,
      message: "Department status updated successfully",
      data: {
        _id: String(updated._id),
        name: updated.name,
        status: updated.status
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
