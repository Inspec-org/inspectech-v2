import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";

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

    const records = await User.find({ vendorId })
      .sort({ createdAt: -1 })
      .populate("vendorId"); // populate vendorId reference

    const users = records.map((user: any) => ({
      ...user.toObject(),         // convert mongoose doc to plain object
      vendor: user.vendorId?.name || null, // get vendor name
      vendorId: undefined,        // remove original vendorId field
    }));

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("USER LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
