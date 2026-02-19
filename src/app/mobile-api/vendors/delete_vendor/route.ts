import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";

    if (!token) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "No token provided",
        data: null
      }, { status: 401 });
    }

    const actor = await getUserFromToken(token);
    if (!actor || (actor.role !== "admin" && actor.role !== "superadmin")) {
      return NextResponse.json({
        status: 403,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 403 });
    }

    const body = await req.json();
    const vendorId = String(body?.vendorId || "").trim();

    if (!vendorId || vendorId.length !== 24) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Invalid vendorId",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "Vendor not found",
        data: null
      }, { status: 404 });
    }

    // Delete related data
    const inspectionsRes = await Inspection.deleteMany({ vendorId });
    const reviewsRes = await Review.deleteMany({ vendorId });
    const userAccessPullRes = await User.updateMany(
      { vendorAccess: vendorId },
      { $pull: { vendorAccess: vendorId } }
    );
    const userVendorUnsetRes = await User.updateMany(
      { vendorId },
      { $unset: { vendorId: "" } }
    );
    const vendorDeleteRes = await Vendor.deleteOne({ _id: vendorId });

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Vendor deleted successfully",
      data: {
        deleted: {
          vendor: vendorDeleteRes.deletedCount || 0,
          inspections: inspectionsRes.deletedCount || 0,
          reviews: reviewsRes.deletedCount || 0
        },
        usersUpdated: {
          pulledFromVendorAccess: userAccessPullRes.modifiedCount || 0,
          clearedVendorId: userVendorUnsetRes.modifiedCount || 0
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}
