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

    const groups = new Map<string, { vendorId: string; departmentId: string; unitIds: string[] }>();
    for (const doc of cleanedDocs) {
      const key = `${String(doc.vendorId)}|${String(doc.departmentId)}`;
      const g = groups.get(key) || { vendorId: String(doc.vendorId), departmentId: String(doc.departmentId), unitIds: [] };
      g.unitIds.push(String(doc.unitId));
      groups.set(key, g);
    }

    const existingSet = new Set<string>();
    for (const g of groups.values()) {
      const existing = await Inspection.find({ vendorId: g.vendorId, departmentId: g.departmentId, unitId: { $in: g.unitIds } }).select("unitId").lean();
      for (const e of existing) {
        existingSet.add(`${g.vendorId}|${g.departmentId}|${String((e as any).unitId)}`);
      }
    }

    const uniqueMap = new Map<string, any>();
    const duplicates: Array<{ unitId: string; vendorId: string; departmentId: string }> = [];
    for (const doc of cleanedDocs) {
      const key = `${String(doc.vendorId)}|${String(doc.departmentId)}|${String(doc.unitId)}`;
      if (existingSet.has(key)) {
        duplicates.push({ unitId: String(doc.unitId), vendorId: String(doc.vendorId), departmentId: String(doc.departmentId) });
        continue;
      }
      if (uniqueMap.has(key)) {
        duplicates.push({ unitId: String(doc.unitId), vendorId: String(doc.vendorId), departmentId: String(doc.departmentId) });
        continue;
      }
      uniqueMap.set(key, doc);
    }

    const toInsert = Array.from(uniqueMap.values());
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