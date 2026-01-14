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

    let vendors: any[] = [];
    if (user.role === "admin") {
      if (user.vendorAccess && user.vendorAccess.length > 0) {
        // Only fetch vendors the admin has access to
        const vendorIds = user.vendorAccess.map((v: any) => v.$oid || v); // handle ObjectId or plain strings
        vendors = await Vendor.find({ _id: { $in: vendorIds } }).select("_id name");
      }
    }
    else if (user.role === "vendor" || user.role === "user") {
      vendors = await Vendor.find({ _id: user.vendorId }).select("_id name");
    }
    else if (user.role === "superadmin") {
      vendors = await Vendor.find().select("_id name");
    }

    return NextResponse.json(
      { status: "success", vendors },
      { status: 200 }
    );
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