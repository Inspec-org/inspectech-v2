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
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body?.unitId) {
      return NextResponse.json({ success: false, message: "unitId is required" }, { status: 400 });
    }

    await connectDB();

    // Validate unitId vs equipmentNumber/equipmentId
    const { unitId, equipmentNumber, equipmentId } = body;
    console.log(unitId, equipmentNumber, equipmentId)

    const isEmptyOrNA = (v: any) =>
      v === undefined || v === null || v === "" || v === "N/A";

    // If equipmentNumber exists AND is not empty/NA AND different → error
    if (!isEmptyOrNA(equipmentNumber) && equipmentNumber !== unitId) {
      return NextResponse.json(
        { success: false, message: "unitId and Equipment Number must match" },
        { status: 400 }
      );
    }
    // If equipmentId exists AND is not empty/NA AND different → error
    if (!isEmptyOrNA(equipmentId) && equipmentId !== unitId) {
      return NextResponse.json(
        { success: false, message: "unitId and Equipment ID must match" },
        { status: 400 }
      );
    }

    // Clean body
    const cleaned: any = { ...body };
    ["inspectionStatus", "reviewReason", "delivered"].forEach((key) => {
      if (cleaned[key] === "" || cleaned[key] === undefined || cleaned[key] === null) {
        delete cleaned[key];
      }
    });
    const unsetDoc: any = {};
    // Don't unset equipmentId, equipmentNumber, and vin - empty values mean leave unchanged
    // These fields should only be updated if explicitly provided with a non-empty value

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
          { success: false, message: "Inspection marked as PASS / DELIVERED. Only notes can be edited." },
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
      return NextResponse.json({ success: false, message: "Inspection not found" }, { status: 404 });
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

    const prevStatus = String((existing?.inspectionStatus) || "").trim().toLowerCase();
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

    return NextResponse.json({ success: true, inspection: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating inspection:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
