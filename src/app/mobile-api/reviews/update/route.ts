import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Review from "@/lib/models/Reviews";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(req: NextRequest) {
  try {
    // ================= AUTH =================
    const token = req.headers.get("Authorization")?.split(" ")[1];
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    const body = await req.json();

    const {
      unitIds, // 🔥 CHANGED FROM unitId -> unitIds[]
      vendorId,
      departmentId,
      missingData,
      emailNotification,
      newVendorId,
      newDepartmentId,
      reviewRequestedAt,
      reviewCompletedAt
    } = body;

    // ================= VALIDATION =================
    if (!Array.isArray(unitIds) || unitIds.length === 0 || !vendorId || !departmentId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "unitIds (array), vendorId, departmentId required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    const update: any = {};
    const inspectionUpdate: any = {};

    // ================= BUILD UPDATE =================
    if (typeof missingData === "string") {
      update.missingData = missingData;
    }

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
      return NextResponse.json({
        status: 400,
        success: false,
        message: "No fields to update",
        data: null
      }, { status: 400 });
    }

    // ================= MATCH QUERY (BATCH) =================
    const matchQuery = {
      unitId: { $in: unitIds },
      vendorId,
      departmentId
    };

    // ================= UPDATE MANY REVIEWS =================
    const updateResult = await Review.updateMany(
      matchQuery,
      { $set: update }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "No reviews found for given unitIds",
        data: null
      }, { status: 404 });
    }

    // ================= UPDATE INSPECTIONS (BULK) =================
    if (Object.keys(inspectionUpdate).length) {
      await Inspection.updateMany(
        {
          unitId: { $in: unitIds },
          vendorId,
          departmentId
        },
        { $set: inspectionUpdate }
      );
    }

    // ================= FETCH UPDATED DATA =================
    const updatedDocs = await Review.find(matchQuery).lean();

    // ================= SUCCESS =================
    return NextResponse.json({
      status: 200,
      success: true,
      message: "Reviews updated successfully",
      data: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        reviews: updatedDocs
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