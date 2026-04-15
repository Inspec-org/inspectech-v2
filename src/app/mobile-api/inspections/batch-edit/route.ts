import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PUT(req: NextRequest) {
  try {
    // ===== AUTH =====
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const unitIds: string[] = Array.isArray(body?.unitIds) ? body.unitIds.filter(Boolean) : [];
    const updateData = body?.update || {};

    if (!unitIds.length) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "unitIds array is required",
        data: null
      }, { status: 400 });
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "update object is required",
        data: null
      }, { status: 400 });
    }

    // ===== CLEAN UPDATE =====
    const isEmptyOrNA = (v: any) =>
      v === undefined || v === null || v === "" || String(v).trim().toUpperCase() === "N/A";

    const cleaned: any = { ...updateData };
    const unsetDoc: any = {};

    ["inspectionStatus", "reviewReason", "delivered"].forEach((key) => {
      if (isEmptyOrNA(cleaned[key])) delete cleaned[key];
    });

    // Don't unset equipmentId, equipmentNumber, and vin - empty values mean leave unchanged
    // These fields should only be updated if explicitly provided with a non-empty value

    if (cleaned["delivered_status"] && !cleaned["delivered"]) {
      cleaned["delivered"] = cleaned["delivered_status"];
      delete cleaned["delivered_status"];
    }

    const updateOps: any = {};
    if (Object.keys(cleaned).length) updateOps.$set = cleaned;
    if (Object.keys(unsetDoc).length) updateOps.$unset = unsetDoc;

    // ===== GET OLD DATA (for review logic) =====
    const existingDocs = await Inspection.find({ unitId: { $in: unitIds } })
      .select("unitId inspectionStatus vendorId departmentId")
      .lean();

    // ===== UPDATE INSPECTIONS =====
    const result = await Inspection.updateMany(
      { unitId: { $in: unitIds } },
      updateOps
    );

    // ===== REVIEW LOGIC =====
    const reviewOps: any[] = [];

    const newStatus = String(cleaned.inspectionStatus || "").toLowerCase();
    const reason = String(cleaned.reviewReason || "").trim();

    for (const doc of existingDocs) {
      const prevStatus = String(doc.inspectionStatus || "").toLowerCase();

      const needsReview = newStatus === "needs review" || newStatus === "need review";

      if (needsReview && reason) {
        const map: Record<string, string> = {
          incomplete_image: "incomplete image file",
          incomplete_checklist: "incomplete checklist",
          incomplete_dot: "incomplete dot form",
        };

        const md = map[reason];
        if (md) {
          reviewOps.push({
            updateOne: {
              filter: {
                unitId: doc.unitId,
                vendorId: doc.vendorId,
                departmentId: doc.departmentId
              },
              update: { $set: { missingData: md } }
            }
          });
        }
      }

      const changedToPass = prevStatus !== "pass" && newStatus === "pass";
      const changedFromPass = prevStatus === "pass" && newStatus !== "pass";

      if (changedToPass) {
        reviewOps.push({
          updateOne: {
            filter: {
              unitId: doc.unitId,
              vendorId: doc.vendorId,
              departmentId: doc.departmentId
            },
            update: { $set: { reviewCompletedAt: new Date() } }
          }
        });
      } else if (changedFromPass) {
        reviewOps.push({
          updateOne: {
            filter: {
              unitId: doc.unitId,
              vendorId: doc.vendorId,
              departmentId: doc.departmentId
            },
            update: { $set: { reviewCompletedAt: null } }
          }
        });
      }
    }

    if (reviewOps.length) {
      await Review.bulkWrite(reviewOps);
    }

    // ===== RESPONSE =====
    return NextResponse.json({
      status: 200,
      success: true,
      message: "Bulk update successful",
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Bulk update error:", error);

    return NextResponse.json({
      status: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}