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
    const statusInput = body?.status;
    const status: string | undefined =
      typeof statusInput === "boolean"
        ? statusInput ? "active" : "inactive"
        : typeof statusInput === "string"
        ? statusInput.trim().toLowerCase()
        : undefined;

    if (!targetEmail) {
      return NextResponse.json({ success: false, message: "targetEmail is required" }, { status: 400 });
    }
    if (status && status !== "active" && status !== "inactive") {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    await connectDB();

    const isStatusUpdate = typeof status !== "undefined";
    const isAccessUpdate = (Array.isArray(vendorIds) && vendorIds.length > 0) || (Array.isArray(departmentIds) && departmentIds.length > 0);

    if (!isStatusUpdate && !isAccessUpdate) {
      return NextResponse.json({ success: false, message: "No update fields provided" }, { status: 400 });
    }
    if (isStatusUpdate && isAccessUpdate) {
      return NextResponse.json({ success: false, message: "Provide either status or access fields, not both" }, { status: 400 });
    }

    if (isStatusUpdate) {
      const target = await User.findOne({ email: targetEmail, role: "user" });
      if (!target) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      }
      target.status = status as any;
      await target.save();
      return NextResponse.json({
        success: true,
        user: {
          email: target.email,
          status: target.status,
        },
      });
    }

    const target = await User.findOne({ email: targetEmail, role: "admin" });
    if (!target) {
      return NextResponse.json({ success: false, message: "Admin user not found" }, { status: 404 });
    }

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