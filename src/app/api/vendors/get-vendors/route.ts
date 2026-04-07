import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/getUserFromToken";
import Vendor from "@/lib/models/Vendor";

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
    let vendors: any[] = [];
    let total = 0;
    if (user.role === "admin") {
      if (user.vendorAccess && user.vendorAccess.length > 0) {
        const vendorIds = user.vendorAccess.map((v: any) => v.$oid || v);
        total = await Vendor.countDocuments({ _id: { $in: vendorIds }, status: 'active' });
        vendors = await Vendor.find({ _id: { $in: vendorIds }, status: 'active' })
          .select("_id name")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);
      }
    }
    else if (user.role === "vendor" || user.role === "user") {
      vendors = await Vendor.find({ _id: user.vendorId, status: 'active' }).select("_id name");
    }
    else if (user.role === "superadmin" || user.role === "owner") {
      total = await Vendor.countDocuments();
      vendors = await Vendor.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const payload: any = { status: "success", vendors };
    if (user.role === "superadmin" || user.role === "owner" || user.role === "admin") {
      payload.total = total;
      payload.page = page;
      payload.limit = limit;
      payload.totalPages = Math.ceil(total / limit);
    }
    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 🔐 Auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 📦 Body
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      );
    }

    // 🚫 Check duplicate
    const exists = await Vendor.findOne({ name: name.trim() });
    if (exists) {
      return NextResponse.json(
        { error: "Vendor already exists" },
        { status: 409 }
      );
    }

    // ✅ Create
    const vendor = await Vendor.create({
      name: name.trim(),
    });

    return NextResponse.json(
      {
        status: "success",
        vendor: {
          _id: vendor._id,
          name: vendor.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
