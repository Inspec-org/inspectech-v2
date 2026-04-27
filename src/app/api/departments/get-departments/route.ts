import { NextRequest, NextResponse } from "next/server";
import Department from "@/lib/models/Departments";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const page = pageParam && /^\d+$/.test(pageParam) ? Math.max(parseInt(pageParam, 10), 1) : 1;
    const limit = limitParam && /^\d+$/.test(limitParam) ? Math.max(parseInt(limitParam, 10), 1) : 10;
    let departments = [];
    let total = 0;

    if (user.role === "superadmin" || user.role === "owner") {
      const vendorId = url.searchParams.get("vendorId");
      if (vendorId) {
        const vendor = await Vendor.findById(vendorId).select("departmentAccess").lean();
        if (!vendor) {
          return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }
        const allowedDeptIds = (((vendor as any).departmentAccess) || []).map((id: any) => String(id));
        total = await Department.countDocuments({ _id: { $in: allowedDeptIds } });
        departments = await Department.find({ _id: { $in: allowedDeptIds } })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);
      } else {
        // If no vendorId provided, return departments grouped by vendor
        const vendors = await Vendor.find().select("name departmentAccess").lean();
        
        // Build a map of vendor departments
        const departmentsByVendor: any[] = [];
        for (const vendor of vendors) {
          const vDeptIds = (((vendor as any).departmentAccess) || []).map((id: any) => String(id));
          
          if (vDeptIds.length > 0) {
            const vendorDepts = await Department.find({ _id: { $in: vDeptIds } })
              .sort({ createdAt: -1 });
            
            if (vendorDepts.length > 0) {
              departmentsByVendor.push({
                vendorId: vendor._id,
                vendorName: vendor.name,
                departments: vendorDepts
              });
            }
          }
        }

        return NextResponse.json({ 
          message: "success", 
          departmentsByVendor,
          grouped: true,
          pagination: { page, limit, total: departmentsByVendor.length, totalPages: 1 }
        });
      }
    } else if (user.role === "admin") {
      const vendorId = url.searchParams.get("vendorId");

      // If vendorId is provided, return departments for that specific vendor (flat list)
      if (vendorId) {
        const vendor = await Vendor.findById(vendorId).select("departmentAccess").lean();
        if (!vendor) {
          return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }
        const vDeptIds = (((vendor as any).departmentAccess) || []).map((id: any) => id.toString());
        
        departments = await Department.find({ _id: { $in: vDeptIds } })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);
      } else {
        // If no vendorId provided, return departments grouped by vendor
        const adminVendorIds = (user.vendorAccess || []).map((id: any) => id.toString());
        if (adminVendorIds.length === 0) {
          return NextResponse.json({ error: "No vendor access configured" }, { status: 401 });
        }

        // Get all vendors the admin has access to
        const vendors = await Vendor.find({ _id: { $in: adminVendorIds } }).select("name departmentAccess").lean();
        
        // Build a map of vendor departments
        const departmentsByVendor: any[] = [];
        for (const vendor of vendors) {
          const vDeptIds = (((vendor as any).departmentAccess) || []).map((id: any) => id.toString());
          
          if (vDeptIds.length > 0) {
            const vendorDepts = await Department.find({ _id: { $in: vDeptIds } })
              .sort({ createdAt: -1 });
            
            if (vendorDepts.length > 0) {
              departmentsByVendor.push({
                vendorId: vendor._id,
                vendorName: vendor.name,
                departments: vendorDepts
              });
            }
          }
        }

        return NextResponse.json({ 
          message: "success", 
          departmentsByVendor,
          grouped: true 
        });
      }
    } else if (user.role === "user") {
      const vendorIds = [
        ...(user.vendorAccess || []),
        ...(user.vendorId ? [user.vendorId] : []),
      ];
      if (vendorIds.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select("departmentAccess");
      const allowedDeptIds = Array.from(
        new Set(
          vendors.flatMap((v: any) => (v.departmentAccess || []).map((id: any) => id.toString()))
        )
      );

      departments = await Department.find({ _id: { $in: allowedDeptIds } });

      // departments.sort((a, b) => {
      //   const aIsUS = a.name.toLowerCase().includes("us");
      //   const bIsUS = b.name.toLowerCase().includes("us");

      //   if (aIsUS && !bIsUS) return -1;
      //   if (!aIsUS && bIsUS) return 1;
      //   return a.name.localeCompare(b.name);
      // });
    }

    const plainDepartments = departments.map((dept: any) => (
      (dept && typeof (dept as any).toObject === 'function') ? (dept as any).toObject() : dept
    ));
    const payload: any = { message: "success", departments: plainDepartments };
    if (user.role === "superadmin" || user.role === "owner") {
      payload.pagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
    }

    return NextResponse.json(payload);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
