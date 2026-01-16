import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const actor = await getUserFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "superadmin" && actor.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const targetEmail: string = String(body?.targetEmail || "").trim();
    const vendorIds: string[] = Array.isArray(body?.vendorIds) ? body.vendorIds : [];
    const departmentIds: string[] = Array.isArray(body?.departmentIds) ? body.departmentIds : [];

    if (!targetEmail) {
      return NextResponse.json({ success: false, message: "targetEmail is required" }, { status: 400 });
    }

    await connectDB();

    const target = await User.findOne({ email: targetEmail, role: "admin" });
    if (!target) {
      return NextResponse.json({ success: false, message: "Admin user not found" }, { status: 404 });
    }

    // Optional existence checks (soft validation)
    const validVendorIds = vendorIds.filter(Boolean);
    const validDeptIds = departmentIds.filter(Boolean);

    target.vendorAccess = validVendorIds as any;
    target.departmentAccess = validDeptIds as any;

    await target.save();

    return NextResponse.json({
      success: true,
      user: {
        email: target.email,
        vendorAccess: target.vendorAccess,
        departmentAccess: target.departmentAccess,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}