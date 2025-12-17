import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";

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

    // Count total documents for pagination info
    const totalUsers = await User.countDocuments({ vendorId });

    const records = await User.find({ vendorId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("vendorId");

    const users = records.map((user: any) => ({
      ...user.toObject(),
      vendor: user.vendorId?.name || null,
      vendorId: undefined,
    }));

    

    return NextResponse.json({
      success: true,
      users,
      total: totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error: any) {
    console.error("USER LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
