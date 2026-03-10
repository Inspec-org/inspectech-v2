import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const unitIds: string[] = Array.isArray(body?.unitIds) ? body.unitIds : [];
    if (!unitIds.length) {
      return NextResponse.json({ success: false, message: "unitIds required" }, { status: 400 });
    }
    const departmentId = body?.departmentId || '';
    if (!departmentId) {
      return NextResponse.json({ success: false, message: "departmentId required" }, { status: 400 });
    }
    const vendorId = body?.vendorId || '';
    if (!vendorId) {
      return NextResponse.json({ success: false, message: "vendorId required" }, { status: 400 });
    }

    await connectDB();

    const docs = await Inspection.find({ unitId: { $in: unitIds }, vendorId, departmentId })
      .select("unitId")
      .lean();

    const existing = docs.map((d: any) => String(d.unitId));
    return NextResponse.json({ success: true, existing }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}