import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";
import * as XLSX from "xlsx";
import * as admin from "firebase-admin";
import crypto from "crypto";

const escapeCSV = (v: unknown) => {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
};

const ensureBucket = () => {
  const storageBucketEnv = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !storageBucketEnv) {
    return { bucket: null as any, error: "Firebase env vars missing" };
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: storageBucketEnv,
    });
  }
  return { bucket: admin.storage().bucket(storageBucketEnv), error: null as any };
};

const rand = (n: number) => crypto.randomBytes(n).toString("hex");

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ status: 401, success: false, message: "Unauthorized", data: null }, { status: 401 });
    }

    const body = await req.json();
    const format = String(body.format || "csv").toLowerCase();
    const unitIds: string[] | undefined = Array.isArray(body.unitIds) ? body.unitIds : undefined;
    if (!unitIds || unitIds.length === 0) {
      return NextResponse.json(
        { status: 400, success: false, message: "unitIds is required", data: null },
        { status: 400 }
      );
    }

    await connectDB();

    const query: any = { unitId: { $in: unitIds } };

    const docs = await Inspection.find(query)
      .sort({ createdAt: -1 })
      .populate({ path: "vendorId", select: "name" })
      .populate({ path: "departmentId", select: "name" })
      .lean();

    const includeCanadaFields = docs.some(
      (d: any) => String(d?.departmentId?.name || "").trim().toLowerCase() === "canada trailers"
    );

    const normalize = (val: unknown): string => {
      if (val instanceof Date) return new Date(val).toISOString();
      if (val === null || val === undefined) return "";
      if (Array.isArray(val)) return JSON.stringify(val);
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    };

    const transform = (doc: any): any => {
      const result: any = {};
      const imageKeys = [
        "frontLeftSideUrl",
        "frontRightSideUrl",
        "rearLeftSideUrl",
        "rearRightSideUrl",
        "doorDetailsImageUrl",
        "insideTrailerImageUrl",
        "dotFormImageUrl",
        "dotFormPdfUrl",
        "additionalAttachment1",
        "additionalAttachment2",
        "additionalAttachment3",
      ];
      const images: Record<string, any> = {};
      let vendorSetFromVendorId = false;
      for (const [key, value] of Object.entries(doc)) {
        if (key === "_id" || key === "__v" || key === "updatedAt" || key === "createdAt") continue;
        if (key === "dotFormPdfFileName") continue;
        if (imageKeys.includes(key)) {
          images[key] = value as any;
          continue;
        }
        if (key === "departmentId") {
          const name = doc.departmentId?.name || "";
          result["department"] = name;
          continue;
        }
        if (key === "vendorId") {
          const name = doc.vendorId?.name || "";
          if (name) {
            result["vendor"] = name;
            vendorSetFromVendorId = true;
          }
          continue;
        }
        if (key === "vendor") {
          if (!vendorSetFromVendorId) {
            result["vendor"] = value as any;
          }
          continue;
        }
        if (key === "durationMin") {
          const sec = (doc as any)?.durationSec ?? "";
          result["duration"] = `${value ?? ""} m ${sec} s`;
          continue;
        }
        if (key === "durationSec") continue;
        if (key === "dateDay") {
          const month = (doc as any)?.dateMonth ?? "";
          const year = (doc as any)?.dateYear ?? "";
          result["date"] = `${value ?? ""}-${month}-${year}`;
          continue;
        }
        if (key === "dateMonth" || key === "dateYear") continue;
        if (key === "atisregulator") {
          result["atisRegulator"] = value as any;
          continue;
        }
        if (key === "possessionOrigin") {
          result["possessionOriginLocation"] = value as any;
          continue;
        }
        result[key] = value as any;
      }
      imageKeys.forEach((k) => {
        if (images[k] !== undefined && images[k] !== null) {
          result[k] = images[k];
        }
      });
      return result;
    };

    const flatten = (obj: any, prefix = ""): Record<string, string> => {
      const out: Record<string, string> = {};
      Object.entries(obj).forEach(([key, value]) => {
        const k = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
          Object.assign(out, flatten(value, k));
        } else {
          out[k] = normalize(value);
        }
      });
      return out;
    };

    const transformed = docs.map(transform);
    const flatRows = transformed.map((doc) => flatten(doc));
    const allHeaders: string[] = Array.from(new Set(flatRows.flatMap((r) => Object.keys(r))));

    const imageHeaders = [
      "frontLeftSideUrl",
      "frontRightSideUrl",
      "rearLeftSideUrl",
      "rearRightSideUrl",
      "doorDetailsImageUrl",
      "insideTrailerImageUrl",
      "dotFormImageUrl",
      "dotFormPdfUrl",
      "additionalAttachment1",
      "additionalAttachment2",
      "additionalAttachment3",
    ];

    const generalHeaders = [
      "unitId",
      "department",
      "inspectionStatus",
      "reviewReason",
      "type",
      "inspector",
      "vendor",
      "location",
      "delivered",
      "duration",
      "date",
      "notes",
    ];

    let checklistHeaders = [
      "poNumber",
      "owner",
      "equipmentNumber",
      "vin",
      "licensePlateId",
      "licensePlateCountry",
      "licensePlateExpiration",
      "licensePlateState",
      "possessionOriginLocation",
      "manufacturer",
      "modelYear",
      "absSensor",
      "airTankMonitor",
      "atisRegulator",
      "lightOutSensor",
      "sensorError",
      "ultrasonicCargoSensor",
      "length",
      "height",
      "grossAxleWeightRating",
      "axleType",
      "brakeType",
      "suspensionType",
      "tireModel",
      "tireBrand",
      "leftFrontOuter",
      "leftFrontInner",
      "leftRearOuter",
      "leftRearInner",
      "rightFrontOuter",
      "rightFrontInner",
      "rightRearOuter",
      "rightRearInner",
      "aerokits",
      "doorBranding",
      "doorColor",
      "doorSensor",
      "doorType",
      "lashSystem",
      "mudFlapType",
      "panelBranding",
      "noseBranding",
      "skirted",
      "skirtColor",
      "conspicuityTape",
      "captiveBeam",
      "cargoCameras",
      "cartbars",
      "tpms",
      "trailerHeightDecal",
    ];
    if (!includeCanadaFields) {
      checklistHeaders = checklistHeaders.filter((h) => h !== "owner" && h !== "conspicuityTape");
    }

    const baseHeaders: string[] = [...generalHeaders, ...checklistHeaders, ...imageHeaders];
    const seen = new Set(baseHeaders);
    const additionalHeaders = allHeaders.filter((h) => !seen.has(h));
    const headers: string[] = [...baseHeaders, ...additionalHeaders];

    const dateStr = new Date().toISOString().slice(0, 10);
    const ext = format === "excel" ? "xlsx" : format === "json" ? "json" : "csv";
    const mime = format === "excel"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : format === "json"
        ? "application/json"
        : "text/csv; charset=utf-8";
    const filename = `inspections_${dateStr}.${ext}`;
    const { bucket, error: bucketErr } = ensureBucket();
    if (!bucket) {
      return NextResponse.json({ status: 500, success: false, message: bucketErr || "Storage not configured", data: null }, { status: 500 });
    }
    const prefix = "tmp/exports/inspections";
    const expiresAtMs = Date.now() + 60 * 60 * 1000;
    const expiresAt = new Date(expiresAtMs).toISOString();
    const objectPath = `${prefix}/${dateStr}/${rand(8)}_${filename}`;
    const saveAndLink = async (bytes: Uint8Array | ArrayBuffer) => {
      const buf = bytes instanceof ArrayBuffer ? Buffer.from(new Uint8Array(bytes)) : Buffer.from(bytes);
      const file = bucket.file(objectPath);
      await file.save(buf, {
        contentType: mime,
        metadata: {
          metadata: {
            temporary: "true",
            expiresAt,
          },
          cacheControl: "private, max-age=3600",
          contentDisposition: `attachment; filename="${filename}"`,
        },
      });
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: expiresAtMs,
        version: "v4",
      });
      return signedUrl;
    };

    if (format === "json") {
      const ordered = flatRows.map((row) => {
        const o: any = {};
        headers.forEach((h) => {
          o[h] = row[h] ?? "";
        });
        return o;
      });
      const bytes = new TextEncoder().encode(JSON.stringify(ordered, null, 2));
      const url = await saveAndLink(bytes);
      return NextResponse.json({ status: 200, success: true, message: "Export generated", data: { url, expiresAt } }, { status: 200 });
    } else if (format === "excel") {
      const aoa: string[][] = [headers, ...flatRows.map((row) => headers.map((h) => row[h] ?? ""))];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inspections");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      const url = await saveAndLink(wbout);
      return NextResponse.json({ status: 200, success: true, message: "Export generated", data: { url, expiresAt } }, { status: 200 });
    } else {
      const csvRows = flatRows.map((row) => headers.map((h) => escapeCSV(row[h])).join(","));
      const csv = [headers.join(","), ...csvRows].join("\n");
      const bytes = new TextEncoder().encode(csv);
      const url = await saveAndLink(bytes);
      return NextResponse.json({ status: 200, success: true, message: "Export generated", data: { url, expiresAt } }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { status: 500, success: false, message: error?.message || "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}
