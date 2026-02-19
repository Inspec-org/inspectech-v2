import { NextRequest, NextResponse } from "next/server";
import Department from "@/lib/models/Departments";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "No token provided",
        data: null
      }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    const url = new URL(req.url);
    let departments: any[] = [];

    // 🔹 SUPERADMIN
    if (user.role === "superadmin") {
      const vendorId = url.searchParams.get("vendorId");

      if (vendorId) {
        const vendor = await Vendor.findById(vendorId)
          .select("departmentAccess")
          .lean();

        if (!vendor) {
          return NextResponse.json({
            status: 404,
            success: false,
            message: "Vendor not found",
            data: null
          }, { status: 404 });
        }

        const allowedDeptIds = ((vendor as any).departmentAccess || [])
          .map((id: any) => String(id));

        departments = await Department.find({
          _id: { $in: allowedDeptIds }
        }).sort({ createdAt: -1 });

      } else {
        departments = await Department.find()
          .sort({ createdAt: -1 });
      }
    }

    // 🔹 ADMIN
    else if (user.role === "admin") {
      const vendorId = url.searchParams.get("vendorId");
      const adminDeptIds = (user.departmentAccess || [])
        .map((id: any) => id.toString());

      if (adminDeptIds.length === 0) {
        return NextResponse.json({
          status: 401,
          success: false,
          message: "Unauthorized",
          data: null
        }, { status: 401 });
      }

      let allowedDeptIds = adminDeptIds;

      if (vendorId) {
        const vendor = await Vendor.findById(vendorId)
          .select("departmentAccess")
          .lean();

        if (!vendor) {
          return NextResponse.json({
            status: 404,
            success: false,
            message: "Vendor not found",
            data: null
          }, { status: 404 });
        }

        const vDeptIds = ((vendor as any).departmentAccess || [])
          .map((id: any) => id.toString());

        allowedDeptIds = allowedDeptIds.filter((id: string) =>
          vDeptIds.includes(id)
        );
      }

      departments = await Department.find({
        _id: { $in: allowedDeptIds }
      }).sort({ createdAt: -1 });
    }

    // 🔹 USER
    else if (user.role === "user") {
      const vendorIds = [
        ...(user.vendorAccess || []),
        ...(user.vendorId ? [user.vendorId] : []),
      ];

      if (vendorIds.length === 0) {
        return NextResponse.json({
          status: 401,
          success: false,
          message: "Unauthorized",
          data: null
        }, { status: 401 });
      }

      const vendors = await Vendor.find({
        _id: { $in: vendorIds }
      }).select("departmentAccess");

      const allowedDeptIds = Array.from(
        new Set(
          vendors.flatMap((v: any) =>
            (v.departmentAccess || [])
              .map((id: any) => id.toString())
          )
        )
      );

      departments = await Department.find({
        _id: { $in: allowedDeptIds }
      }).sort({ createdAt: -1 });
    }

    const plainDepartments = departments.map((dept: any) =>
      typeof dept.toObject === "function" ? dept.toObject() : dept
    );

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Departments fetched successfully",
      data: plainDepartments
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: error.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}
