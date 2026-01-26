import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const payloads = Array.isArray(body?.payloads) ? body.payloads : [];
    if (!payloads.length) {
      return NextResponse.json({ success: false, message: "payloads required" }, { status: 400 });
    }

    await connectDB();
    await Inspection.syncIndexes();

    const cleanedDocs: any[] = [];
    const errors: Array<{ index: number; unitId?: string; message: string }> = [];

    const normalizeEmpty = (v: any) => v === "" || v === undefined || v === null;

    payloads.forEach((p: any, index: number) => {
      const unitId = String(p?.unitId || "").trim();
      const vendorId = p?.vendorId;
      const departmentId = p?.departmentId;
      if (!unitId || !vendorId || !departmentId) {
        errors.push({ index, unitId, message: "unitId, vendorId, departmentId required" });
        return;
      }
      const doc: any = { ...p, unitId, vendorId, departmentId };
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
    });

    if (!cleanedDocs.length) {
      return NextResponse.json({ success: false, message: "No valid payloads", failed: errors.length, errors }, { status: 400 });
    }

    const unitIds = cleanedDocs.map(d => String(d.unitId)).filter(Boolean);
    const equipmentNumbers = cleanedDocs.map(d => String(d.equipmentNumber || '').trim()).filter(v => v);
    const vins = cleanedDocs.map(d => String(d.vin || '').trim()).filter(v => v && v.toLowerCase() !== 'n/a');

    const existingDocs = await Inspection.find({
      $or: [
        { unitId: { $in: unitIds } },
        ...(equipmentNumbers.length ? [{ equipmentNumber: { $in: equipmentNumbers } }] : []),
        ...(vins.length ? [{ vin: { $in: vins } }] : []),
      ]
    }).select('unitId equipmentNumber vin').lean();

    const existingUnitIds = new Set(existingDocs.map((d: any) => String(d.unitId)).filter(Boolean));
    const existingEquipNums = new Set(existingDocs.map((d: any) => String(d.equipmentNumber || '')).filter(Boolean));
    const existingVins = new Set(existingDocs.map((d: any) => String(d.vin || '')).filter(Boolean));

    const seenUnitIds = new Set<string>();
    const seenEquipNums = new Set<string>();
    const seenVins = new Set<string>();

    const toInsert: any[] = [];
    const duplicates: Array<{ unitId: string; vendorId: string; departmentId: string; field?: string; value?: string }> = [];

    for (const doc of cleanedDocs) {
      const uid = String(doc.unitId);
      const eq = String(doc.equipmentNumber || '').trim();
      const v = String(doc.vin || '').trim();

      if (existingUnitIds.has(uid) || seenUnitIds.has(uid)) {
        duplicates.push({ unitId: uid, vendorId: String(doc.vendorId), departmentId: String(doc.departmentId), field: 'unitId', value: uid });
        continue;
      }
      if (eq && (existingEquipNums.has(eq) || seenEquipNums.has(eq))) {
        duplicates.push({ unitId: uid, vendorId: String(doc.vendorId), departmentId: String(doc.departmentId), field: 'equipmentNumber', value: eq });
        continue;
      }
      if (v && v.toLowerCase() !== 'n/a' && (existingVins.has(v) || seenVins.has(v))) {
        duplicates.push({ unitId: uid, vendorId: String(doc.vendorId), departmentId: String(doc.departmentId), field: 'vin', value: v });
        continue;
      }

      seenUnitIds.add(uid);
      if (eq) seenEquipNums.add(eq);
      if (v && v.toLowerCase() !== 'n/a') seenVins.add(v);

      toInsert.push(doc);
    }

    let insertedCount = 0;
    try {
      const inserted = await Inspection.insertMany(toInsert, { ordered: false });
      insertedCount = Array.isArray(inserted) ? inserted.length : 0;
    } catch (err: any) {
      const ins = Array.isArray(err?.insertedDocs) ? err.insertedDocs.length : 0;
      const res = err?.result?.nInserted ?? err?.result?.insertedCount ?? 0;
      insertedCount = Math.max(ins, res, 0);
    }

    const skippedCount = duplicates.length;
    const failedCount = errors.length;

    return NextResponse.json({
      success: true,
      created: insertedCount,
      skipped: skippedCount,
      failed: failedCount,
      errors,
      duplicates
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}