import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Review from "@/lib/models/Reviews";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      unitId,
      vendorId,
      departmentId,
      missingData,
      emailNotification,
      newVendorId,
      newDepartmentId,
      reviewRequestedAt,
      reviewCompletedAt
    } = body;

    console.log(body);

    if (!unitId || !vendorId || !departmentId) {
      return NextResponse.json(
        { success: false, message: "unitId, vendorId, departmentId required" },
        { status: 400 }
      );
    }

    await connectDB();

    const update: any = {};
    const inspectionUpdate: any = {};

    if (typeof missingData === "string") update.missingData = missingData;

    if (newVendorId) {
      update.vendorId = newVendorId;
      inspectionUpdate.vendorId = newVendorId;
    }

    if (newDepartmentId) {
      update.departmentId = newDepartmentId;
      inspectionUpdate.departmentId = newDepartmentId;
    }

    if (reviewRequestedAt !== undefined) {
      update.reviewRequestedAt = reviewRequestedAt
        ? new Date(reviewRequestedAt)
        : null;
    }

    if (reviewCompletedAt !== undefined) {
      update.reviewCompletedAt = reviewCompletedAt
        ? new Date(reviewCompletedAt)
        : null;
    }

    if (typeof emailNotification === "string") {
      update.emailNotification = emailNotification;
      if (emailNotification === "no") {
        update.reviewCompletedAt = null;
      } else if (emailNotification === "manually sent") {
        update.reviewCompletedAt = new Date();
      }
    }

    if (!Object.keys(update).length) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    /** 1️⃣ Update Review */
    const doc = await Review.findOneAndUpdate(
      { unitId, vendorId, departmentId },
      { $set: update },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    /** 2️⃣ Update Inspection if vendor/department changed */
    if (Object.keys(inspectionUpdate).length) {
      await Inspection.updateMany(
        { unitId, vendorId, departmentId },
        { $set: inspectionUpdate }
      );
    }

    return NextResponse.json({ success: true, review: doc });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
