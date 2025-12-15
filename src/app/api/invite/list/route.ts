import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Invitation from "@/lib/models/Invitation";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get("vendorId"); // ✅

    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: "vendorId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const records = await Invitation.find({ vendorId }).sort({ createdAt: -1 }).populate("vendorId");

    const invitations = records.map((inv: any) => ({
      _id: inv._id.toString(),
      name: inv.name,
      email: inv.email,
      role: inv.role,
      vendorName: inv.vendorId.name || null,
      invited: inv.createdAt,
      status: inv.status || "expired",
    }));

    return NextResponse.json({ success: true, invitations });
  } catch (error: any) {
    console.error("INVITE LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
