import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || "";
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const actor = await getUserFromToken(token);
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!vendorId || vendorId.length !== 24) return NextResponse.json({ error: "Invalid vendorId" }, { status: 400 });

    await connectDB();
    const vendor = await Vendor.findById(vendorId).select("_id name departmentAccess").lean();
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    return NextResponse.json({ status: "success", vendor }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 });
  }
}