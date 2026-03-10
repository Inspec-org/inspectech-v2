import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const vendorId = String(body?.vendorId || "").trim();
    let status = String(body?.status || "").trim().toLowerCase();

    if (!vendorId || vendorId.length !== 24) {
      return NextResponse.json({ error: "Invalid vendorId" }, { status: 400 });
    }
    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "status must be 'active' or 'inactive'" }, { status: 400 });
    }

    await connectDB();

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    vendor.status = status;
    await vendor.save();

    return NextResponse.json(
      { status: "success", vendor: { _id: vendor._id, name: vendor.name, status: vendor.status } },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}