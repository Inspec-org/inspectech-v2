import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
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
    const departmentAccess: string[] = Array.isArray(body?.departmentAccess) ? body.departmentAccess : [];

    if (!name) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }
    if (!departmentAccess.length) {
      return NextResponse.json({ error: "departmentAccess must include at least one department id" }, { status: 400 });
    }

    await connectDB();

    const exists = await Vendor.findOne({ name });
    if (exists) {
      return NextResponse.json({ error: "Vendor already exists" }, { status: 409 });
    }

    const vendor = await Vendor.create({ name, departmentAccess });

    return NextResponse.json(
      { status: "success", vendor: { _id: vendor._id, name: vendor.name, departmentAccess: vendor.departmentAccess } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}