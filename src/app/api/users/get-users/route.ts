import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import "@/lib/models/Vendor";



export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get("vendorId");
    const role = url.searchParams.get("role");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    if (!vendorId) {
      return NextResponse.json(
        { success: false, message: "vendorId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const filter: any = role === 'admin'
      ? { role: 'admin', $or: [{ vendorId }, { vendorAccess: vendorId }] }
      : { vendorId, ...(role ? { role } : {}) };

    const totalUsers = await User.countDocuments(filter);

    const records = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("vendorId")
      .populate("vendorAccess");

    const users = records.map((u: any) => {
      const obj = u.toObject();

      let vendorName = null;

      // Case 1: Direct vendorId match
      if (obj.vendorId && String(obj.vendorId._id) === vendorId) {
        vendorName = obj.vendorId.name;
      }

      // Case 2: Admin with vendorAccess array
      if (!vendorName && Array.isArray(obj.vendorAccess)) {
        const matchedVendor = obj.vendorAccess.find(
          (v: any) => String(v._id) === vendorId
        );
        vendorName = matchedVendor?.name || null;
      }

      return {
        ...obj,
        vendor: vendorName,
        vendorId: undefined,
        vendorAccess: undefined, // optional cleanup
      };
    });



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
