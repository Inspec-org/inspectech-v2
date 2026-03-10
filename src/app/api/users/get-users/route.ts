import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import Vendor from "@/lib/models/Vendor";
import "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const vendorId = url.searchParams.get("vendorId");
    const role = url.searchParams.get("role");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const q = (url.searchParams.get("q") || "").trim();

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }

    const actor = await getUserFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let filter: any = {};
    const isAdminQuery = (role || "admin") === "admin";

    /* =========================
       SUPERADMIN
    ========================= */
    if (actor.role === "superadmin") {
      filter = role ? { role } : {};

      if (role === "user" && vendorId) {
        filter.vendorId = vendorId;
      }

      if (q) {
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(safe, "i");

        const vendorMatches = await Vendor.find({ name: regex }).select("_id");
        const vendorIds = vendorMatches.map(v => v._id);

        filter.$or = [
          { firstName: regex },
          { lastName: regex },
          { name: regex },
          { email: regex },
          { vendorId: { $in: vendorIds } },
          { vendorAccess: { $in: vendorIds } },
        ];
      }
    }

    /* =========================
       ADMIN / USER
    ========================= */
    else {
      const accessibleVendorIds = [
        actor.vendorId ? String(actor.vendorId) : null,
        ...(Array.isArray(actor.vendorAccess)
          ? actor.vendorAccess.map((id: any) => String(id))
          : []),
      ].filter(Boolean);

      if (isAdminQuery) {
        filter = {
          role: "admin",
          $or: [
            { vendorId: { $in: accessibleVendorIds } },
            { vendorAccess: { $in: accessibleVendorIds } },
          ],
        };
      } else {
        filter = {
          vendorId: { $in: accessibleVendorIds },
          ...(role ? { role } : {}),
        };
      }

      if (q) {
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(safe, "i");

        if (isAdminQuery) {
          const vendorMatches = await Vendor.find({ name: regex }).select("_id");
          const vendorIds = vendorMatches.map(v => v._id);

          filter = {
            role: "admin",
            $and: [
              { $or: filter.$or },
              {
                $or: [
                  { firstName: regex },
                  { lastName: regex },
                  { name: regex },
                  { email: regex },
                  { vendorId: { $in: vendorIds } },
                  { vendorAccess: { $in: vendorIds } },
                ],
              },
            ],
          };
        } else {
          filter.$or = [
            { firstName: regex },
            { lastName: regex },
            { name: regex },
            { email: regex },
          ];
        }
      }
    }

    /* =========================
       QUERY
    ========================= */
    const totalUsers = await User.countDocuments(filter);

    const records = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("vendorId")
      .populate("vendorAccess")
      .populate("departmentAccess");

    const users = records.map((u: any) => {
      const obj = u.toObject();

      const vendorNames = Array.from(
        new Set([
          obj.vendorId?.name,
          ...(Array.isArray(obj.vendorAccess)
            ? obj.vendorAccess.map((v: any) => v?.name)
            : []),
        ].filter(Boolean))
      );

      const deptNames = Array.isArray(obj.departmentAccess)
        ? obj.departmentAccess.map((d: any) => d?.name).filter(Boolean)
        : [];

      return {
        ...obj,
        vendor: vendorNames.length ? vendorNames.join(", ") : null,
        vendorNames,
        departmentName: deptNames.join(", "),
        departmentNames: deptNames,
        vendorId: undefined,
        vendorAccess: undefined,
        departmentAccess: undefined,
      };
    });

    return NextResponse.json({
      success: true,
      users,
      total: totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
