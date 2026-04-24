import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";
    const actor = await getUserFromToken(token);
    if (!actor || (actor.role !== "superadmin" && actor.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const departmentId = String(body?.departmentId || "");
    const status = String(body?.status || "").toLowerCase();
    console.log("departmentId", departmentId);
    console.log("status", status);
    if (!departmentId || !Types.ObjectId.isValid(departmentId)) {
      return NextResponse.json({ error: "Valid departmentId is required" }, { status: 400 });
    }
    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "status must be 'active' or 'inactive'" }, { status: 400 });
    }

    await connectDB();
    const updated = await Department.findByIdAndUpdate(
      departmentId,
      { $set: { status } },
    );
    if (!updated) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json(
      { status: "success", department: { _id: String(updated._id), name: updated.name, status: updated.status } },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}