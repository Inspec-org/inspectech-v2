import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {

  try {
    /* ================= AUTH ================= */
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

    /* ================= BODY ================= */
    const body = await req.json();

    const payloads = Array.isArray(body?.payloads) ? body.payloads : [];

    if (!payloads.length) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "payloads required",
        data: null
      }, { status: 400 });
    }

    const topVendorId = body?.vendorId;
    const topDepartmentId = body?.departmentId;

    if (!topVendorId || !topDepartmentId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "vendorId and departmentId required",
        data: null
      }, { status: 400 });
    }

    /* ================= DB ================= */
    await connectDB();

    /* ================= CLEANING ================= */
    const cleanedDocs: any[] = [];
    const errors: Array<{ index: number; unitId?: string; message: string }> =
      [];

    const normalizeEmpty = (v: any) =>
      v === "" || v === undefined || v === null;

    payloads.forEach((p: any, index: number) => {

      const unitId = String(p?.unitId || "").trim();

      if (!unitId) {
        errors.push({
          index,
          unitId,
          message: "unitId required",
        });
        return;
      }

      const doc: any = { ...p, unitId, vendorId: topVendorId, departmentId: topDepartmentId };

      ["inspectionStatus", "reviewReason", "delivered"].forEach((key) => {
        if (normalizeEmpty(doc[key])) {
          delete doc[key];
        }
      });

      if (doc["delivered_status"] && !doc["delivered"]) {
        doc["delivered"] = doc["delivered_status"];
        delete doc["delivered_status"];
      }
      cleanedDocs.push(doc);
    });;

    if (!cleanedDocs.length) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "No valid payloads",
        data: {
          failed: errors.length,
          errors
        }
      }, { status: 400 });
    }

    /* ================= DUPLICATE CHECK ================= */
    const unitIds = cleanedDocs.map((d) => String(d.unitId)).filter(Boolean);
    const vendorIds = cleanedDocs.map((d) => String(d.vendorId)).filter(Boolean);
    const equipmentNumbers = cleanedDocs
      .map((d) => String(d.equipmentNumber || "").trim())
      .filter((v) => v && v.toLowerCase() !== "n/a");
    const vins = cleanedDocs
      .map((d) => String(d.vin || "").trim())
      .filter((v) => v && v.toLowerCase() !== "n/a");

    console.log("🔍 Duplicate check inputs:", {
      unitIds,
      vendorIds,
      equipmentNumbers,
      vins,
    });

    const existingDocs = await Inspection.find({
      $or: [
        { unitId: { $in: unitIds } },
        ...(equipmentNumbers.length
          ? [
            {
              vendorId: { $in: vendorIds },
              equipmentNumber: { $in: equipmentNumbers },
            },
          ]
          : []),
        ...(vins.length
          ? [
            {
              vendorId: { $in: vendorIds },
              vin: { $in: vins },
            },
          ]
          : []),
      ],
    })
      .select("unitId equipmentNumber vin vendorId")
      .lean();


    const existingUnitIds = new Set(
      existingDocs.map((d: any) => String(d.unitId))
    );
    const existingEquipNums = new Set(
      existingDocs.map(
        (d: any) => `${String(d.vendorId)}:${String(d.equipmentNumber || "")}`
      )
    );
    const existingVins = new Set(
      existingDocs.map(
        (d: any) => `${String(d.vendorId)}:${String(d.vin || "")}`
      )
    );

    const seenUnitIds = new Set<string>();
    const seenEquipNums = new Set<string>();
    const seenVins = new Set<string>();

    const toInsert: any[] = [];
    const duplicates: any[] = [];

    for (const doc of cleanedDocs) {
      const uid = String(doc.unitId);
      const vendorKey = String(doc.vendorId);
      const eq = String(doc.equipmentNumber || "").trim();
      const v = String(doc.vin || "").trim();

      if (existingUnitIds.has(uid) || seenUnitIds.has(uid)) {
        console.warn("🚫 Duplicate unitId:", uid);
        duplicates.push({ unitId: uid, field: "unitId" });
        continue;
      }

      const eqKey = `${vendorKey}:${eq}`;
      const vinKey = `${vendorKey}:${v}`;

      if (eq && eq.toLowerCase() !== "n/a" &&
        (existingEquipNums.has(eqKey) || seenEquipNums.has(eqKey))) {
        duplicates.push({ unitId: uid, field: "equipmentNumber", value: eq });
        continue;
      }

      if (v && v.toLowerCase() !== "n/a" &&
        (existingVins.has(vinKey) || seenVins.has(vinKey))) {
        duplicates.push({ unitId: uid, field: "vin", value: v });
        continue;
      }

      seenUnitIds.add(uid);
      if (eq) seenEquipNums.add(eqKey);
      if (v) seenVins.add(vinKey);

      toInsert.push(doc);
    }
    /* ================= INSERT ================= */
    let insertedCount = 0;

    try {
      const inserted = await Inspection.insertMany(toInsert, { ordered: false });
      insertedCount = Array.isArray(inserted) ? inserted.length : 0;
    } catch (err: any) {
      insertedCount =
        err?.result?.nInserted ??
        err?.result?.insertedCount ??
        err?.insertedDocs?.length ??
        0;
    }

    /* ================= RESPONSE ================= */

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Bulk insert completed",
      data: {
        created: insertedCount,
        skipped: duplicates.length,
        failed: errors.length,
        errors,
        duplicates
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
