import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

type ValidationError = { row: number; field: string; value: string; message: string };

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const norm = (v: any) => String(v ?? "").trim();
const normId = (v: any) => String(v ?? "").trim().toLowerCase();

const FIELD_CATEGORIES = {
  identification: [
    "poNumber",
    "owner",
    "equipmentId",
    "vin",
    "licensePlateId",
    "licensePlateCountry",
    "licensePlateExpiration",
    "licensePlateState/Province",
    "possessionOrigin",
    "manufacturer",
    "modelYear",
  ],
  sensor: [
    "absSensor",
    "airTankMonitor",
    "atisregulator",
    "lightOutSensor",
    "sensorError",
    "ultrasonicCargoSensor",
  ],
  dimensional: [
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
  ],
  feature: [
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
    "cargoCamera",
    "cartbars",
    "tpms",
    "trailerHeightDecal",
  ],
};

const getDropdownAllowed = (key?: string, isCanadaTrailers?: boolean): string[] => {
  if (!key) return [];
  const base: Record<string, string[]> = {
    manufacturer: ["N/A", "Atro", "Cartwright", "DiMond", "Don-Bur", "Great Dane", "Hyundai", "Lufkin", "Manac", "Operbus", "Stoughton", "Strick", "Tiger", "TrailerMobile", "Unity", "Vanguard", "Wabash"],
    length: isCanadaTrailers ? ["N/A", "28 ft", "53 ft"] : ["N/A", "28 ft", "48 ft", "53 ft"],
    height: ["N/A", "13 ft 6 in"],
    grossaxleweightrating: ["N/A", "20000 lbs", "34000 lbs"],
    axletype: ["N/A", "Dual Axle", "Single Axle"],
    braketype: ["N/A", "Disc", "Drum"],
    suspensiontype: ["N/A", "Air", "Spring"],
    tirebrand: ["N/A", "Bridgestone", "Continental", "Firestone", "Goodyear", "Michelin"],
    doorcolor: ["N/A", "Pantone 432 C", "White"],
    leftfrontouter: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    leftfrontinner: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    leftrearouter: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    leftrearinner: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    rightfrontouter: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    rightfrontinner: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    rightrearouter: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    rightrearinner: ["N/A", "15/32", "14/32", "13/32", "12/32", "11/32", "10/32"],
    doortype: ["N/A", "Swing", "Roll"],
    mudflaptype: ["N/A", "Fast-Flap"],
    panelbranding: ["N/A", "Bowman", "Prime", "Tape on White", "Smile on Blue 2016", "Smile on Blue 2017", "Smile on Blue 2018", "Smile on White 2019", "Unbranded", "XTRA Lease"],
    nosebranding: ["N/A", "Captive Mean"],
    skirtcolor: ["N/A", "Ekostinger", "Pantone 432 C", "Transtex", "White"],
    conspicuitytape: ["N/A", "Bottom Rear", "Full Rear Perimeter"],
  };
  return base[key] || [];
};

const countFieldCategories = (headers: string[], isCanada: boolean) => {
  const counts = { identification: 0, dimensional: 0, feature: 0, sensor: 0 };
  const CATS = {
    identification: isCanada ? FIELD_CATEGORIES.identification : FIELD_CATEGORIES.identification.filter(f => f !== "owner"),
    sensor: FIELD_CATEGORIES.sensor,
    dimensional: FIELD_CATEGORIES.dimensional,
    feature: isCanada ? FIELD_CATEGORIES.feature : FIELD_CATEGORIES.feature.filter(f => f !== "conspicuityTape"),
  };
  headers.forEach(header => {
    const n = normalizeHeader(header);
    const match = (field: string) => {
      const nf = normalizeHeader(field);
      if (n === nf) return true;
      if (n.length > nf.length + 3) return n.includes(nf);
      return false;
    };
    if (CATS.identification.some(match)) { counts.identification++; return; }
    if (CATS.sensor.some(match)) { counts.sensor++; return; }
    if (CATS.feature.some(match)) { counts.feature++; return; }
    if (CATS.dimensional.some(match)) { counts.dimensional++; return; }
  });
  return counts;
};

export async function POST(req: NextRequest) {
  try {
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

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const vendorId = String(form.get("vendorId") || "");
    const departmentId = String(form.get("departmentId") || "");
    if (!file)
      return NextResponse.json({
        status: 400,
        success: false,
        message: "file is required",
        data: null
      }, { status: 400 });
    if (!vendorId)
      return NextResponse.json({
        status: 400,
        success: false,
        message: "vendorId is required",
        data: null
      }, { status: 400 });
    if (!departmentId)
      return NextResponse.json({
        status: 400,
        success: false,
        message: "departmentId is required",
        data: null
      }, { status: 400 });

    await connectDB();

    const deptDoc = await Department.findById(departmentId).select("name").lean<{ name?: string } | null>();
    const isCanadaTrailers = (deptDoc?.name || "").toLowerCase() === "canada trailers";

    let rows: (string | number | null | undefined)[][] = [];
    const name = (file as any).name || "";
    const type = (file as any).type || "";
    if (name.toLowerCase().endsWith(".xlsx") || type.includes("spreadsheet")) {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: "mm/dd/yyyy" }) as any[];
    } else {
      const text = await file.text();
      const wb = XLSX.read(text, { type: "string", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, dateNF: "mm/dd/yyyy" }) as any[];
    }
    rows = rows.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== ""));
    if (rows.length < 2) {
      return NextResponse.json({
        status: 200,
        success: false,
        message: "Validation errors in file",
        data: {
          errors: [
            {
              row: 0,
              field: "file",
              value: name,
              message: "File must contain headers and at least one data row."
            }
          ]
        }
      }, { status: 200 });
    }

    const headers = (rows[0] as any[]).map(h => (h === null || h === undefined ? "" : String(h))).filter(h => h !== "");
    if (!headers.length) {
      return NextResponse.json({
        status: 200,
        success: false,
        message: "Invalid spreadsheet: No headers found",
        data: {
          errors: [
            { row: 0, field: "headers", value: "", message: "No headers found" }
          ]
        }
      }, { status: 200 });
    }

    const candidateAllowed = rows[1] as any[] | undefined;
    const isAllowedValuesCell = (s: string) => {
      const t = String(s || "").trim();
      if (!t) return false;
      const hasSep = t.includes(",") || t.includes("/") || t.includes("|");
      if (!hasSep) return false;
      const parts = t.split(t.includes(",") ? "," : t.includes("/") ? "/" : "|").map(x => x.trim());
      return parts.length >= 2 && parts.every(p => p.length > 0);
    };
    let dataStartIndex = 1;
    const allowedByHeader: Record<string, string[]> = {};
    if (candidateAllowed && candidateAllowed.length) {
      const allowedSignalsCount = candidateAllowed.filter(c => isAllowedValuesCell(String(c ?? ""))).length;
      const ratio = allowedSignalsCount / Math.max(candidateAllowed.length, 1);
      if (ratio >= 0.5) {
        dataStartIndex = 2;
        headers.forEach((h, idx) => {
          const cell = candidateAllowed[idx];
          const s = String(cell ?? "").trim();
          if (isAllowedValuesCell(s)) {
            const sep = s.includes(",") ? "," : s.includes("/") ? "/" : ",";
            allowedByHeader[h] = s.split(sep).map(t => t.trim()).filter(t => t);
          }
        });
      }
    }

    const errors: ValidationError[] = [];
    const parsedRows: Record<string, string>[] = [];

    // ✅ FIX: Use normalizeHeader for all candidate matching so camelCase,
    // snake_case, spaced variants all match correctly (e.g. "equipmentNumber" === "equipment number")
    const unitIdHeaderCandidates = ["unit id", "unitid", "unitid#", "unit"];
    const equipIdHeaderCandidates = [
      "equipment id/trailer number",
      "equipment id",
      "trailer number",
      "equipment id #",
      "equipment",
      "equipment number",
      "equipmentnumber",
      "equipmentid",
      "equipmentidtrailernumber",
    ];

    const unitIdIndex = headers.findIndex(h =>
      unitIdHeaderCandidates.some(c => normalizeHeader(h) === normalizeHeader(c))
    );
    const equipIdIndex = headers.findIndex(h =>
      equipIdHeaderCandidates.some(c => normalizeHeader(h) === normalizeHeader(c))
    );

    const seenUnitIds = new Map<string, number>();

    // ✅ FIX: Use normalizeHeader for VIN header matching
    const vinHeaderCandidates = ["vin", "vehicle identification number"];
    const vinIndex = headers.findIndex(h =>
      vinHeaderCandidates.some(c => normalizeHeader(h) === normalizeHeader(c))
    );

    // ✅ FIX: Use normalizeHeader for date header matching
    const dateHeaderCandidates = ["date", "inspection date", "inspectiondate"];
    const dateIndex = headers.findIndex(h =>
      dateHeaderCandidates.some(c => normalizeHeader(h) === normalizeHeader(c))
    );

    const seenVINs = new Map<string, number>();

    const headerKinds = headers.map(h => {
      const n = normalizeHeader(h);
      const MAP: Record<string, { type: "dropdown" | "radio" | "text" | "year"; key?: string }> = {
        manufacturer: { type: "dropdown", key: "manufacturer" },
        modelyear: { type: "year", key: "modelyear" },
        length: { type: "dropdown", key: "length" },
        height: { type: "dropdown", key: "height" },
        grossaxleweightrating: { type: "dropdown", key: "grossaxleweightrating" },
        axletype: { type: "dropdown", key: "axletype" },
        braketype: { type: "dropdown", key: "braketype" },
        suspensiontype: { type: "dropdown", key: "suspensiontype" },
        tirebrand: { type: "dropdown", key: "tirebrand" },
        leftfrontouter: { type: "dropdown", key: "leftfrontouter" },
        leftfrontinner: { type: "dropdown", key: "leftfrontinner" },
        leftrearouter: { type: "dropdown", key: "leftrearouter" },
        leftrearinner: { type: "dropdown", key: "leftrearinner" },
        rightfrontouter: { type: "dropdown", key: "rightfrontouter" },
        rightfrontinner: { type: "dropdown", key: "rightfrontinner" },
        rightrearouter: { type: "dropdown", key: "rightrearouter" },
        rightrearinner: { type: "dropdown", key: "rightrearinner" },
        doorcolor: { type: "dropdown", key: "doorcolor" },
        doortype: { type: "dropdown", key: "doortype" },
        mudflaptype: { type: "dropdown", key: "mudflaptype" },
        panelbranding: { type: "dropdown", key: "panelbranding" },
        nosebranding: { type: "dropdown", key: "nosebranding" },
        skirtcolor: { type: "dropdown", key: "skirtcolor" },
        conspicuitytape: { type: "dropdown", key: "conspicuitytape" },
        aerokits: { type: "radio" },
        doorsensor: { type: "radio" },
        lashsystem: { type: "radio" },
        captivebeam: { type: "radio" },
        cargocamera: { type: "radio" },
        cargocameras: { type: "radio" },
        cartbars: { type: "radio" },
        tpms: { type: "radio" },
        trailerheightdecal: { type: "radio" },
        abssensor: { type: "radio" },
        airtankmonitor: { type: "radio" },
        atisregulator: { type: "radio" },
        lightoutsensor: { type: "radio" },
        sensorerror: { type: "radio" },
        ultrasoniccargosensor: { type: "radio" },
        skirted: { type: "radio" },
        ponumber: { type: "text" },
        equipmentid: { type: "text" },
        equipmentidtrailernumber: { type: "text" },
        equipmentnumber: { type: "text" },
        vin: { type: "text" },
        licenseplateid: { type: "text" },
        licenseplatecountry: { type: "text" },
        licenseplateexpiration: { type: "text" },
        licenseplatestateprovince: { type: "text" },
        possessionorigin: { type: "text" },
        doorbranding: { type: "text" },
        tiremodel: { type: "text" },
        owner: { type: "text" },
        type: { type: "text" },
        inspectionstatus: { type: "text" },
        inspector: { type: "text" },
        location: { type: "text" },
        date: { type: "text" },
      };
      return MAP[n] || { type: "text" };
    });

    if (isCanadaTrailers) {
      const hasOwner = headers.some(h => normalizeHeader(h) === normalizeHeader("owner"));
      const hasConsp = headers.some(h => normalizeHeader(h) === normalizeHeader("conspicuityTape"));
      if (!hasOwner) errors.push({ row: 0, field: "owner", value: "", message: "Missing required column for Canada: owner" });
      if (!hasConsp) errors.push({ row: 0, field: "conspicuityTape", value: "", message: "Missing required column for Canada: conspicuityTape" });
    }

    for (let i = dataStartIndex; i < rows.length; i++) {
      const currentRow = rows[i];
      if (!currentRow || currentRow.every(c => c === null || c === undefined || String(c).trim() === "")) continue;

      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        const val = currentRow[index] ?? "";
        rowData[header] = String(val).trim();
      });

      headers.forEach((header, idx) => {
        const v = norm(String(currentRow[idx] ?? ""));
        if (!v) return;
        const kind = headerKinds[idx];
        if (kind.type === "dropdown") {
          const allowedA = getDropdownAllowed(kind.key, isCanadaTrailers);
          const allowedB = allowedByHeader[header] || [];
          const allowed = Array.from(new Set([...allowedA, ...allowedB]));
          const ok = allowed.length ? allowed.some(a => a.toLowerCase() === v.toLowerCase()) : true;
          if (!ok) errors.push({ row: i + 1, field: header, value: v, message: `Value must be one of: ${allowed.join(", ")}` });
        } else if (kind.type === "radio") {
          const ok = ["n/a", "yes", "no"].includes(v.toLowerCase());
          if (!ok) errors.push({ row: i + 1, field: header, value: v, message: "Value must be one of: N/A, Yes, No" });
        } else if (kind.type === "year") {
          if (v.toLowerCase() !== "n/a") {
            const num = Number(v);
            const maxY = new Date().getFullYear() + 1;
            if (!Number.isFinite(num) || num < 1980 || num > maxY) {
              errors.push({ row: i + 1, field: header, value: v, message: `Year must be between 1980 and ${maxY}, or N/A` });
            }
          }
        }
      });

      const unitVal = unitIdIndex >= 0 ? norm(String(currentRow[unitIdIndex] ?? "")) : "";
      const equipVal = equipIdIndex >= 0 ? norm(String(currentRow[equipIdIndex] ?? "")) : "";

      // Case 1: Both present → MUST match
      if (unitVal && equipVal && normId(unitVal) !== normId(equipVal)) {
        errors.push({
          row: i + 1,
          field: "Unit ID",
          value: `${unitVal} / ${equipVal}`,
          message: "Unit ID and Equipment Number must match",
        });
      }

      // Case 2: One missing → throw error (strict mode)
      if ((unitVal && !equipVal) || (!unitVal && equipVal)) {
        errors.push({
          row: i + 1,
          field: "Unit ID / Equipment Number",
          value: `${unitVal || "-"} / ${equipVal || "-"}`,
          message: "Both Unit ID and Equipment Number are required",
        });
      }

      // Case 3: Both missing
      if (!unitVal && !equipVal) {
        errors.push({
          row: i + 1,
          field: "Unit ID",
          value: "",
          message: "Unit ID and Equipment Number are required",
        });
      }

      const effectiveId = unitVal || equipVal;
      if (effectiveId) {
        const key = normId(effectiveId);
        if (seenUnitIds.has(key)) {
          const firstRow = seenUnitIds.get(key) || 0;
          errors.push({ row: i + 1, field: "Unit ID", value: effectiveId, message: `Duplicate Unit ID, first seen at row ${firstRow}` });
        } else {
          seenUnitIds.set(key, i + 1);
        }
      } else {
        errors.push({ row: i + 1, field: "Unit ID", value: "", message: "Missing Unit ID or Equipment ID/Trailer Number" });
      }

      if (vinIndex >= 0) {
        const vinVal = norm(String(currentRow[vinIndex] ?? ""));
        if (vinVal && vinVal.toLowerCase() !== "n/a") {
          const keyVin = normId(vinVal);
          if (seenVINs.has(keyVin)) {
            const firstRow = seenVINs.get(keyVin) || 0;
            errors.push({ row: i + 1, field: "VIN", value: vinVal, message: `Duplicate VIN, first seen at row ${firstRow}` });
          } else {
            seenVINs.set(keyVin, i + 1);
          }
        }
      }

      if (dateIndex >= 0) {
        const t = String(currentRow[dateIndex] ?? "").trim();
        if (t) {
          let d: Date | null = null;
          const m = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/.exec(t);
          if (m) {
            const year = m[3].length === 2 ? Number(`20${m[3]}`) : Number(m[3]);
            const month = Number(m[1]) - 1;
            const day = Number(m[2]);
            d = new Date(year, month, day);
          } else {
            const nd = new Date(t);
            d = isNaN(nd.getTime()) ? null : nd;
          }
        }
      }

      rowData["Unit ID"] = effectiveId;
      parsedRows.push(rowData);
    }

    if (parsedRows.length === 0) {
      return NextResponse.json({
        status: 200,
        success: false,
        message: "Spreadsheet contains no valid data rows",
        data: {
          errors: [
            { row: 0, field: "general", value: "", message: "No valid data rows" }
          ]
        }
      }, { status: 200 });
    }

    const unitIdsToCheck = parsedRows.map(r => String(r["Unit ID"] || "").trim()).filter(Boolean);
    const vinValues = vinIndex >= 0
      ? parsedRows.map(r => String(r[headers[vinIndex]] || "").trim().toLowerCase()).filter(v => v && v !== "n/a")
      : [];

    const existingDocs = await Inspection.find({
      $or: [
        { unitId: { $in: unitIdsToCheck } },
        ...(vinValues.length ? [{ vendorId, vin: { $in: vinValues } }] : []),
      ],
    }).select("unitId vin vendorId").lean();

    const existingUnitSet = new Set(existingDocs.map(d => String(d.unitId).trim().toLowerCase()));
    const existingVINSet = new Set(existingDocs.map(d => String(d.vin || "").trim().toLowerCase()).filter(v => v));

    parsedRows.forEach((row, i) => {
      const uid = String(row["Unit ID"] || "").trim().toLowerCase();
      if (uid && existingUnitSet.has(uid)) {
        errors.push({ row: i + 1, field: "Unit ID", value: String(row["Unit ID"] || ""), message: "Unit ID already exists" });
      }
      if (vinIndex >= 0) {
        const vinVal = String(row[headers[vinIndex]] || "").trim().toLowerCase();
        if (vinVal && vinVal !== "n/a" && existingVINSet.has(vinVal)) {
          errors.push({ row: i + 1, field: "VIN", value: String(row[headers[vinIndex]] || ""), message: "VIN already exists" });
        }
      }
    });

    const enhancedHeaders = ["Sr No", "Unit ID", ...headers.filter(h =>
      !["Sr No", "Unit ID"].includes(h) &&
      !unitIdHeaderCandidates.some(c => normalizeHeader(h) === normalizeHeader(c))
    )];
    const dataHeaders = enhancedHeaders.filter(h => !["Sr No", "Unit ID"].includes(h));
    const categoryCounts = countFieldCategories(dataHeaders, isCanadaTrailers);

    const rowsWithSrNo = parsedRows.map((row, index) => {
      const r = { ...row };
      r["Sr No"] = String(index + 1);
      return r;
    });

    return NextResponse.json({
      status: 200,
      success: errors.length === 0,
      message: errors.length
        ? "Validation completed with errors"
        : "File processed successfully",
      data: {
        errors,
        preview: {
          headers: enhancedHeaders,
          rows: rowsWithSrNo,
          stats: {
            inspections: rowsWithSrNo.length,
            columns: dataHeaders.length,
            ...categoryCounts,
          },
        }
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