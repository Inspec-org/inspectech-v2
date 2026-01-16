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

    let departments = [];

    if (user.role === "superadmin") {
      departments = await Department.find().sort({ createdAt: -1 });
    } else if (user.role === "admin") {
      const allowedDeptIds = (user.departmentAccess || []).map((id: any) => id.toString());
      if (allowedDeptIds.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      departments = await Department.find({ _id: { $in: allowedDeptIds } });
      departments.sort((a, b) => {
        const aIsUS = a.name.toLowerCase().includes("us");
        const bIsUS = b.name.toLowerCase().includes("us");

        if (aIsUS && !bIsUS) return -1;
        if (!aIsUS && bIsUS) return 1;
        return a.name.localeCompare(b.name);
      });
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

      departments.sort((a, b) => {
        const aIsUS = a.name.toLowerCase().includes("us");
        const bIsUS = b.name.toLowerCase().includes("us");

        if (aIsUS && !bIsUS) return -1;
        if (!aIsUS && bIsUS) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    // Add color field based on department name
    const departmentsWithColor = departments.map(dept => {
      let color = "";
      const nameLower = dept.name.toLowerCase();

      if (nameLower.includes("us")) color = "purple";
      else if (nameLower.includes("canada")) color = "blue";
      else if (nameLower.includes("maintenance")) color = "red";
      else if (nameLower.includes("campaign")) color = "green";

      return { ...dept.toObject(), color };
    });
    return NextResponse.json({ message: "success", departments: departmentsWithColor });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
