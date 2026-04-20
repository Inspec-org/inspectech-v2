import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Review from "@/lib/models/Reviews";
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
      return NextResponse.json({ error: " Only superadmin or owner can remove from review." }, { status: 403 });
    }

    const { unitIds, vendorId, departmentId } = await req.json();

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json({ success: false, message: "unitIds must be a non-empty array" }, { status: 400 });
    }

    if (!vendorId || !departmentId) {
      return NextResponse.json({ success: false, message: "vendorId and departmentId are required" }, { status: 400 });
    }

    await connectDB();

    // Delete all review documents matching the unitIds, vendorId, and departmentId
    const result = await Review.deleteMany({
      unitId: { $in: unitIds },
      vendorId,
      departmentId,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${result.deletedCount} items from review`,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ success: false, message: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
