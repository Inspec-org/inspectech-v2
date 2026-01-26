import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const color = String(body?.color || "").trim();
    const icon = String(body?.icon || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }

    await connectDB();

    const exists = await Department.findOne({ name });
    if (exists) {
      return NextResponse.json({ error: "Department already exists" }, { status: 409 });
    }

    const department = await Department.create({ name, color, icon });

    return NextResponse.json(
      { status: "success", department: { _id: department._id, name: department.name, color: department.color, icon: department.icon } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}