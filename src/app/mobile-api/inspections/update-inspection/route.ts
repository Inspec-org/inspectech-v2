import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { status: 401, success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body?.unitId) {
      return NextResponse.json(
        { status: 400, success: false, message: "unitId is required", data: null },
        { status: 400 }
      );
    }

    await connectDB();

    const { unitId, equipmentNumber } = body;
    console.log(unitId, equipmentNumber);

    const isEmptyOrNA = (v: any) =>
      v === undefined || v === null || v === "" || v === "N/A";

    if (!isEmptyOrNA(equipmentNumber) && equipmentNumber !== unitId) {
      return NextResponse.json(
        { status: 400, success: false, message: "unitId and Equipment Number must match", data: null },
        { status: 400 }
      );
    }

    const cleaned: any = { ...body };
    ["inspectionStatus", "reviewReason", "delivered"].forEach((key) => {
      if (cleaned[key] === "" || cleaned[key] === undefined || cleaned[key] === null) {
        delete cleaned[key];
      }
    });
    const unsetDoc: any = {};
    ["equipmentNumber", "vin"].forEach((key) => {
      const v = cleaned[key];
      if (v === "" || v === null || v === undefined || String(v).trim().toUpperCase() === "N/A") {
        delete cleaned[key];
        unsetDoc[key] = "";
      }
    });

    if (cleaned["delivered_status"] && !cleaned["delivered"]) {
      cleaned["delivered"] = cleaned["delivered_status"];
      delete cleaned["delivered_status"];
    }

    const existing = await Inspection.findOne({ unitId: cleaned.unitId }).select("inspectionStatus notes");

    const protectedStatuses = new Set([
      "pass",
      "out of cycle (delivered)",
      "no inspection (delivered)",
    ]);
    const targetStatus = String(
      (typeof cleaned.inspectionStatus === "string" ? cleaned.inspectionStatus : existing?.inspectionStatus) || ""
    ).trim().toLowerCase();

    let updateOps: any;
    if (protectedStatuses.has(targetStatus) && user.role !== "superadmin") {
      const allowedKeys = new Set(["unitId", "notes"]);
      const filtered: any = {};
      for (const k of Object.keys(cleaned)) {
        if (allowedKeys.has(k)) filtered[k] = cleaned[k];
      }
      const incomingNotes = filtered.notes;
      const existingNotes = existing?.notes;
      if (typeof incomingNotes === "undefined" || String(incomingNotes) === String(existingNotes)) {
        return NextResponse.json(
          { status: 200, success: false, message: "Only 'notes' can be updated; no changes applied", data: null },
          { status: 200 }
        );
      }
      updateOps = { $set: filtered };
    } else {
      updateOps = { $set: cleaned };
      if (Object.keys(unsetDoc).length) updateOps.$unset = unsetDoc;
    }

    const updated = await Inspection.findOneAndUpdate(
      { unitId: cleaned.unitId },
      updateOps,
      { new: true }
    );


    if (!updated) {
      return NextResponse.json(
        { status: 404, success: false, message: "Inspection not found", data: null },
        { status: 404 }
      );
    }

    const status = String(updated.inspectionStatus || "").trim().toLowerCase();
    const needsReview = status === "needs review" || status === "need review";
    const reason = String(updated.reviewReason || "").trim();
    if (needsReview && reason) {
      const map: Record<string, string> = {
        incomplete_image: "incomplete image file",
        incomplete_checklist: "incomplete checklist",
        incomplete_dot: "incomplete dot form",
      };
      const md = map[reason];
      if (md) {
        await Review.findOneAndUpdate(
          { unitId: updated.unitId, vendorId: updated.vendorId, departmentId: updated.departmentId },
          { $set: { missingData: md } }
        );
      }
    }

    const prevStatus = String(existing?.inspectionStatus || "").trim().toLowerCase();
    const changedToPass = prevStatus !== "pass" && status === "pass";
    const changedFromPass = prevStatus === "pass" && status !== "pass";

    if (changedToPass) {
      await Review.findOneAndUpdate(
        { unitId: updated.unitId, vendorId: updated.vendorId, departmentId: updated.departmentId },
        { $set: { reviewCompletedAt: new Date() } }
      );
    } else if (changedFromPass) {
      await Review.findOneAndUpdate(
        { unitId: updated.unitId, vendorId: updated.vendorId, departmentId: updated.departmentId },
        { $set: { reviewCompletedAt: null } }
      );
    }

    return NextResponse.json(
      { status: 200, success: true, message: "Inspection updated successfully", data: { inspection: updated } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating inspection:", error);
    return NextResponse.json(
      { status: 500, success: false, message: error?.message || "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}
