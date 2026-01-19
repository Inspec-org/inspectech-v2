import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import Vendor from "@/lib/models/Vendor";
import "@/lib/models/Departments"
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
    if (actor.role === 'superadmin') {
      const baseFilter: any = { role: role };
      let filter: any = baseFilter;
      if (role === "admin") {
        if (q) {
          const regex = new RegExp(q, 'i');
          const vendorMatches = await Vendor.find({ name: { $regex: regex } }).select('_id');
          const vendorIds = vendorMatches.map((v: any) => v._id);
          filter = {
            ...baseFilter,
            $or: [
              { firstName: { $regex: regex } },
              { lastName: { $regex: regex } },
              { name: { $regex: regex } },
              { email: { $regex: regex } },
              { vendorId: { $in: vendorIds } },
              { vendorAccess: { $in: vendorIds } },
            ],
          };
        }
      }
      else if (role === "user") {
          filter = { role: 'user', vendorId: vendorId };
      }

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
        const vnames: string[] = [];
        if (obj.vendorId?.name) vnames.push(obj.vendorId.name);
        if (Array.isArray(obj.vendorAccess)) {
          for (const v of obj.vendorAccess) if (v?.name) vnames.push(v.name);
        }
        const vendorList = Array.from(new Set(vnames));
        const deptNames = Array.isArray(obj.departmentAccess) ? obj.departmentAccess.map((d: any) => d?.name).filter(Boolean) : [];
        return {
          ...obj,
          vendor: vendorList.length ? vendorList.join(", ") : null,
          vendorNames: vendorList,
          departmentName: deptNames.join(", "),
          departmentNames: deptNames,
          vendorId: undefined,
          vendorAccess: undefined,
          departmentAccess: undefined,
          status: obj?.status,
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
    }


    // Build filter based on actor role/access; vendorId query is optional

    const isAdminRole = (role || 'admin') === 'admin';
    let filter: any = {};
    if (actor.role === 'admin') {
      const accessible = [
        actor.vendorId ? String(actor.vendorId) : null,
        ...(Array.isArray(actor.vendorAccess) ? actor.vendorAccess.map((id: any) => String(id)) : [])
      ].filter(Boolean);
      filter = isAdminRole
        ? { role: 'admin', $or: [{ vendorId: { $in: accessible } }, { vendorAccess: { $in: accessible } }] }
        : { vendorId: { $in: accessible }, ...(role ? { role } : {}) };
    } else {
      const vId = actor.vendorId ? String(actor.vendorId) : null;
      filter = isAdminRole
        ? { role: 'admin', $or: [{ vendorId: vId }, { vendorAccess: vId }] }
        : { vendorId: vId, ...(role ? { role } : {}) };
    }

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
      const vnames: string[] = [];
      if (obj.vendorId?.name) vnames.push(obj.vendorId.name);
      if (Array.isArray(obj.vendorAccess)) {
        for (const v of obj.vendorAccess) if (v?.name) vnames.push(v.name);
      }
      const vendorList = Array.from(new Set(vnames));
      const deptNames = Array.isArray(obj.departmentAccess) ? obj.departmentAccess.map((d: any) => d?.name).filter(Boolean) : [];
      return {
        ...obj,
        vendor: vendorList.length ? vendorList.join(", ") : null,
        vendorNames: vendorList,
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
    ;
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
