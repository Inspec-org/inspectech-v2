import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Invitation from "@/lib/models/Invitation";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get("vendorId"); // ✅
    const page = parseInt(url.searchParams.get("page") || "1", 10); // default page 1
    const limit = parseInt(url.searchParams.get("limit") || "10", 10); // default 10 items per page
    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: "vendorId is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const totalInvitations = await Invitation.countDocuments({ vendorId, status: { $ne: "expired" } });

    const records = await Invitation.find({ vendorId, status: { $ne: "expired" } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("vendorId");


    const invitations = records.map((inv: any) => ({
      _id: inv._id.toString(),
      name: inv.name,
      email: inv.email,
      role: inv.role,
      vendorName: inv.vendorId.name || null,
      invited: inv.createdAt,
      status: inv.status || "expired",
    }));

    return NextResponse.json({ 
      success: true, 
      invitations,
      total: totalInvitations,
      page,
      limit,
      totalPages: Math.ceil(totalInvitations / limit),
    });
  } catch (error: any) {
    ;
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
