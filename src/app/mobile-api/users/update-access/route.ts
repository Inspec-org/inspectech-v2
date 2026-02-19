import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const actor = await getUserFromToken(token);

    if (!actor) {
      return NextResponse.json(
        { status: 401, success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    if (actor.role !== "superadmin" && actor.role !== "admin") {
      return NextResponse.json(
        { status: 403, success: false, message: "Forbidden", data: null },
        { status: 403 }
      );
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
      return NextResponse.json(
        { status: 400, success: false, message: "targetEmail is required", data: null },
        { status: 400 }
      );
    }

    if (status && status !== "active" && status !== "inactive") {
      return NextResponse.json(
        { status: 400, success: false, message: "Invalid status", data: null },
        { status: 400 }
      );
    }

    await connectDB();

    const isStatusUpdate = typeof status !== "undefined";
    const isAccessUpdate = (vendorIds.length > 0) || (departmentIds.length > 0);

    if (!isStatusUpdate && !isAccessUpdate) {
      return NextResponse.json(
        { status: 400, success: false, message: "No update fields provided", data: null },
        { status: 400 }
      );
    }

    if (isStatusUpdate && isAccessUpdate) {
      return NextResponse.json(
        { status: 400, success: false, message: "Provide either status or access fields, not both", data: null },
        { status: 400 }
      );
    }

    // ===================== STATUS UPDATE =====================
    if (isStatusUpdate) {
      const target = await User.findOne({ email: targetEmail, role: "user" });
      if (!target) {
        return NextResponse.json(
          { status: 404, success: false, message: "User not found", data: null },
          { status: 404 }
        );
      }

      target.status = status as any;
      await target.save();

      return NextResponse.json(
        {
          status: 200,
          success: true,
          message: "User status updated successfully",
          data: { email: target.email, status: target.status },
        },
        { status: 200 }
      );
    }

    // ===================== ACCESS UPDATE =====================
    const target = await User.findOne({ email: targetEmail, role: "admin" });
    if (!target) {
      return NextResponse.json(
        { status: 404, success: false, message: "Admin user not found", data: null },
        { status: 404 }
      );
    }

    const validVendorIds = vendorIds.filter(Boolean);
    const validDeptIds = departmentIds.filter(Boolean);

    target.vendorAccess = validVendorIds as any;
    target.departmentAccess = validDeptIds as any;
    await target.save();

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Admin access updated successfully",
        data: {
          email: target.email,
          vendorAccess: target.vendorAccess,
          departmentAccess: target.departmentAccess,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 500,
        success: false,
        message: error?.message || "Internal Server Error",
        data: null,
      },
      { status: 500 }
    );
  }
}
