import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  console.log("🚀 POST /api/inspection called");

  try {
    /* ================= AUTH ================= */
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    console.log("🔐 Auth Header:", authHeader);
    console.log("🔑 Token:", token);

    const user = await getUserFromToken(token);
    console.log("👤 User from token:", user?._id || user);

    if (!user) {
      console.warn("⛔ Unauthorized request");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ================= BODY ================= */
    const body = await req.json();
    console.log("📦 Raw body:", body);

    const payloads = Array.isArray(body?.payloads) ? body.payloads : [];
    console.log("📦 Payload count:", payloads.length);

    if (!payloads.length) {
      console.warn("⚠️ No payloads provided");
      return NextResponse.json(
        { success: false, message: "payloads required" },
        { status: 400 }
      );
    }

    /* ================= DB ================= */
    console.log("🔌 Connecting to DB...");
    await connectDB();
    console.log("✅ DB connected");

    /* ================= CLEANING ================= */
    const cleanedDocs: any[] = [];
    const errors: Array<{ index: number; unitId?: string; message: string }> =
      [];

    const normalizeEmpty = (v: any) =>
      v === "" || v === undefined || v === null;

    payloads.forEach((p: any, index: number) => {
      console.log(`🧹 Processing payload [${index}]`, p);

      const unitId = String(p?.unitId || "").trim();
      const vendorId = p?.vendorId;
      const departmentId = p?.departmentId;

      if (!unitId || !vendorId || !departmentId) {
        console.warn(`❌ Invalid payload [${index}]`, {
          unitId,
          vendorId,
          departmentId,
        });
        errors.push({
          index,
          unitId,
          message: "unitId, vendorId, departmentId required",
        });
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

      console.log(`✅ Cleaned doc [${index}]`, doc);
      cleanedDocs.push(doc);
    });

    console.log("🧼 Cleaned docs count:", cleanedDocs.length);
    console.log("❌ Validation errors:", errors);

    if (!cleanedDocs.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid payloads",
          failed: errors.length,
          errors,
        },
        { status: 400 }
      );
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

    console.log("📄 Existing docs found:", existingDocs.length);

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
        console.warn("🚫 Duplicate equipmentNumber:", eqKey);
        duplicates.push({ unitId: uid, field: "equipmentNumber", value: eq });
        continue;
      }

      if (v && v.toLowerCase() !== "n/a" &&
          (existingVins.has(vinKey) || seenVins.has(vinKey))) {
        console.warn("🚫 Duplicate VIN:", vinKey);
        duplicates.push({ unitId: uid, field: "vin", value: v });
        continue;
      }

      seenUnitIds.add(uid);
      if (eq) seenEquipNums.add(eqKey);
      if (v) seenVins.add(vinKey);

      toInsert.push(doc);
    }

    console.log("📥 Documents to insert:", toInsert.length);
    console.log("⏭️ Duplicates skipped:", duplicates.length);

    /* ================= INSERT ================= */
    let insertedCount = 0;

    try {
      console.log("🚀 Inserting documents...");
      const inserted = await Inspection.insertMany(toInsert, { ordered: false });
      insertedCount = Array.isArray(inserted) ? inserted.length : 0;
      console.log("✅ Insert successful:", insertedCount);
    } catch (err: any) {
      console.error("🔥 InsertMany error:", err);
      insertedCount =
        err?.result?.nInserted ??
        err?.result?.insertedCount ??
        err?.insertedDocs?.length ??
        0;
      console.log("📊 Partial insert count:", insertedCount);
    }

    /* ================= RESPONSE ================= */
    console.log("📊 Final result:", {
      created: insertedCount,
      skipped: duplicates.length,
      failed: errors.length,
    });

    return NextResponse.json(
      {
        success: true,
        created: insertedCount,
        skipped: duplicates.length,
        failed: errors.length,
        errors,
        duplicates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("💥 API Crash:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
