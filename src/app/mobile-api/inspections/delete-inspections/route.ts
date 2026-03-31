import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const actor = await getUserFromToken(token);

    if (!actor) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({
        status: 403,
        success: false,
        message: "Forbidden",
        data: null
      }, { status: 403 });
    }

    const body = await req.json();

    const inspectionIds: string[] = Array.isArray(body?.inspectionIds)
      ? body.inspectionIds.filter(Boolean)
      : [];

    const unitIds: string[] = Array.isArray(body?.unitIds)
      ? body.unitIds.filter(Boolean)
      : [];

    const vendorId: string = String(body?.vendorId || "").trim();
    const departmentId: string = String(body?.departmentId || "").trim();

    if (!inspectionIds.length && !unitIds.length) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Provide inspectionIds or unitIds",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    let inspectionsToDelete: Array<{ unitId: string; vendorId: any; departmentId: any }> = [];
    let inspectionsDeleted = 0;
    let reviewsDeleted = 0;

    // ===== CASE 1: DELETE BY inspectionIds =====
    if (inspectionIds.length) {
      const validIds = inspectionIds.filter(id => Types.ObjectId.isValid(id));

      if (!validIds.length) {
        return NextResponse.json({
          status: 400,
          success: false,
          message: "Invalid inspectionIds",
          data: null
        }, { status: 400 });
      }

      const docs = await Inspection.find({ _id: { $in: validIds } })
        .select("unitId vendorId departmentId")
        .lean();

      inspectionsToDelete = docs.map(d => ({
        unitId: String(d.unitId),
        vendorId: d.vendorId,
        departmentId: d.departmentId,
      }));

      const revRes = inspectionsToDelete.length
        ? await Review.deleteMany({ $or: inspectionsToDelete })
        : { deletedCount: 0 };

      const inspRes = await Inspection.deleteMany({ _id: { $in: validIds } });

      inspectionsDeleted = inspRes.deletedCount || 0;
      reviewsDeleted = revRes.deletedCount || 0;
    }

    // ===== CASE 2: DELETE BY unitIds =====
    else {
      const filter: any = { unitId: { $in: unitIds } };

      if (vendorId) {
        if (!Types.ObjectId.isValid(vendorId)) {
          return NextResponse.json({
            status: 400,
            success: false,
            message: "Invalid vendorId",
            data: null
          }, { status: 400 });
        }
        filter.vendorId = new Types.ObjectId(vendorId);
      }

      if (departmentId) {
        if (!Types.ObjectId.isValid(departmentId)) {
          return NextResponse.json({
            status: 400,
            success: false,
            message: "Invalid departmentId",
            data: null
          }, { status: 400 });
        }
        filter.departmentId = new Types.ObjectId(departmentId);
      }

      const docs = await Inspection.find(filter)
        .select("unitId vendorId departmentId")
        .lean();

      if (!docs.length) {
        return NextResponse.json({
          status: 200,
          success: true,
          message: "No inspections found",
          data: { inspections: 0, reviews: 0 }
        }, { status: 200 });
      }

      inspectionsToDelete = docs.map(d => ({
        unitId: String(d.unitId),
        vendorId: d.vendorId,
        departmentId: d.departmentId,
      }));

      const revRes = await Review.deleteMany({ $or: inspectionsToDelete });
      const inspRes = await Inspection.deleteMany(filter);

      inspectionsDeleted = inspRes.deletedCount || 0;
      reviewsDeleted = revRes.deletedCount || 0;
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Deletion completed successfully",
      data: {
        inspections: inspectionsDeleted,
        reviews: reviewsDeleted
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