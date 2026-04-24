import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

const isEmpty = (v: any) => {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  if (!s || s === "dd/mm/yyyy" || s === "mm/dd/yyyy" || s === "yyyy-mm-dd" || s === "DATE" || s === "date") return true;
  return false;
};

const labelMap: Record<string, string> = {
  poNumber: "PO Number",
  owner: "Owner",
  equipmentId: "Equipment ID/Trailer Number",
  equipmentNumber: "Equipment ID/Trailer Number",
  vin: "VIN",
  licensePlateId: "License Plate ID",
  licensePlateCountry: "License Plate Country",
  licensePlateExpiration: "License Plate Expiration",
  licensePlateStateOrProvince: "License Plate State/Province",
  licensePlateState: "License Plate State/Province",
  possessionOriginLocation: "Possession Origin Location",
  possessionOrigin: "Possession Origin",
  assetId: "Asset ID or Error Message",
  estimatedDateOfAvailability: "Estimated Date of Availability",
  purchaseDate: "Purchase Date",
  manufacturer: "Manufacturer",
  modelYear: "Model Year",
  length: "Length",
  height: "Height",
  grossAxleWeightRating: "Gross Axle Weight Rating",
  axleType: "Axle Type",
  brakeType: "Brake Type",
  suspensionType: "Suspension Type",
  tireModel: "Tire Model",
  tireBrand: "Tire Brand",
  tireSize: "Tire Size",
  treadDepthLeftFrontOuter: "Tread Depth Left Front Outer",
  treadDepthLeftFrontInner: "Tread Depth Left Front Inner",
  treadDepthLeftRearOuter: "Tread Depth Left Rear Outer",
  treadDepthLeftRearInner: "Tread Depth Left Rear Inner",
  treadDepthRightFrontOuter: "Tread Depth Right Front Outer",
  treadDepthRightFrontInner: "Tread Depth Right Front Inner",
  treadDepthRightRearOuter: "Tread Depth Right Rear Outer",
  treadDepthRightRearInner: "Tread Depth Right Rear Inner",
  leftFrontOuter: "Left Front Outer",
  leftFrontInner: "Left Front Inner",
  leftRearOuter: "Left Rear Outer",
  leftRearInner: "Left Rear Inner",
  rightFrontOuter: "Right Front Outer",
  rightFrontInner: "Right Front Inner",
  rightRearOuter: "Right Rear Outer",
  rightRearInner: "Right Rear Inner",
  aerokits: "Aerokits",
  doorBranding: "Door Branding",
  doorColor: "Door Color",
  doorSensor: "Door Sensor",
  doorType: "Door Type",
  lashSystem: "Lash System",
  mudFlapType: "Mud Flap Type",
  panelBranding: "Panel Branding",
  noseBranding: "Nose Branding",
  skirted: "Skirted",
  skirtColor: "Skirt Color",
  captiveBeam: "Captive Beam",
  cargoCamera: "Cargo Camera",
  cartbars: "Cartbars",
  tpms: "TPMS",
  trailerHeightDecal: "Trailer Height Decal",
  conspicuityTape: "Conspicuity Tape",
  conspicuityTapeInstallDate: "Conspicuity Tape Install Date",
  cargoLockInstalledDate: "Cargo Lock Installed Date",
  cargoLockFitted: "Cargo Lock Fitted",
  cargoLockType: "Cargo Lock Type",
  pulsatingLampInstallationDate: "Pulsating Lamp Installation Date",
  pulsatingLampModel: "Pulsating Lamp Model",
  pulsatingLampManufacturer: "Pulsating Lamp Manufacturer",
  pulsatingLampWiring: "Pulsating Lamp Wiring",
  purchaseType: "Purchase Type",
  purchaseCondition: "Purchase Condition",
  absSensor: "ABS Sensor",
  airTankMonitor: "Air Tank Monitor",
  atisRegulator: "ATIS Regulator",
  atisregulator: "ATIS Regulator",
  lightOutSensor: "Light Out Sensor",
  sensorError: "Sensor Error",
  ultrasonicCargoSensor: "Ultrasonic Cargo Sensor",
};

const label = (k: string) => labelMap[k] || k;

// Resolve fields that have old+new name variants
const resolveField = (inspection: any, ...keys: string[]) =>
  keys.some((k) => !isEmpty(inspection[k]));

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unitId") || "";
    if (!unitId) {
      return NextResponse.json(
        { status: 400, success: false, message: "unitId is required", data: null },
        { status: 400 }
      );
    }

    await connectDB();

    const inspection: any = await Inspection.findOne({ unitId }).lean();
    if (!inspection) {
      return NextResponse.json(
        { status: 404, success: false, message: "Inspection not found", data: null },
        { status: 404 }
      );
    }

    let departmentName = "";
    try {
      if (inspection.departmentId) {
        const dept: any = await Department.findById(inspection.departmentId).lean();
        departmentName = String(dept?.name || "");
      }
    } catch {}
    const isCanadaTrailers = departmentName.trim().toLowerCase() === "canada trailers";

    // --- Identification & Registration ---
    const identificationMissingKeys: string[] = [];
    const identificationMissing: string[] = [];

    if (!resolveField(inspection, "equipmentId", "equipmentNumber")) {
      identificationMissingKeys.push("equipmentId");
      identificationMissing.push("Equipment ID/Trailer Number");
    }
    if (!resolveField(inspection, "licensePlateStateOrProvince", "licensePlateState")) {
      identificationMissingKeys.push("licensePlateStateOrProvince");
      identificationMissing.push("License Plate State/Province");
    }
    for (const k of ["poNumber", "vin", "licensePlateId", "licensePlateCountry", "licensePlateExpiration"]) {
      if (isEmpty(inspection[k])) { identificationMissingKeys.push(k); identificationMissing.push(label(k)); }
    }
    if (isCanadaTrailers) {
      for (const k of ["owner", "possessionOriginLocation"]) {
        if (isEmpty(inspection[k])) { identificationMissingKeys.push(k); identificationMissing.push(label(k)); }
      }
    } else {
      for (const k of ["assetId", "estimatedDateOfAvailability", "purchaseDate", "purchaseType", "purchaseCondition"]) {
        if (isEmpty(inspection[k])) { identificationMissingKeys.push(k); identificationMissing.push(label(k)); }
      }
    }

    // --- Physical Dimensions ---
    const physicalDimensionMissingKeys: string[] = [];
    const physicalDimensionMissing: string[] = [];
    for (const k of ["manufacturer", "modelYear", "length", "height", "grossAxleWeightRating", "axleType", "brakeType", "suspensionType", "tireModel", "tireBrand"]) {
      if (isEmpty(inspection[k])) { physicalDimensionMissingKeys.push(k); physicalDimensionMissing.push(label(k)); }
    }
    if (!isCanadaTrailers) {
      if (isEmpty(inspection["tireSize"])) { physicalDimensionMissingKeys.push("tireSize"); physicalDimensionMissing.push(label("tireSize")); }
    }

    // --- Tire Location (tread depths) ---
    const tireLocationMissingKeys: string[] = [];
    const tireLocationMissing: string[] = [];
    const tireDepthKeys = [
      "treadDepthLeftFrontOuter", "treadDepthLeftFrontInner",
      "treadDepthLeftRearOuter", "treadDepthLeftRearInner",
      "treadDepthRightFrontOuter", "treadDepthRightFrontInner",
      "treadDepthRightRearOuter", "treadDepthRightRearInner",
    ];
    for (const k of tireDepthKeys) {
      // Fall back to legacy keys (leftFrontOuter etc.) if new keys absent
      const legacyKey = k.replace("treadDepth", "").replace(/^(.)/, (c) => c.toLowerCase());
      if (!resolveField(inspection, k, legacyKey)) {
        tireLocationMissingKeys.push(k);
        tireLocationMissing.push(label(k));
      }
    }

    // --- Features & Appearance ---
    const featuresMissingKeys: string[] = [];
    const featuresMissing: string[] = [];
    const baseFeatureKeys = [
      "aerokits", "doorBranding", "doorColor", "doorSensor", "doorType",
      "lashSystem", "mudFlapType", "panelBranding", "skirted", "skirtColor",
      "cargoCamera", "cartbars", "tpms", "trailerHeightDecal",
    ];
    if (isCanadaTrailers) {
      baseFeatureKeys.push("noseBranding", "captiveBeam", "conspicuityTape");
    } else {
      baseFeatureKeys.push("conspicuityTape", "conspicuityTapeInstallDate", "cargoLockInstalledDate", "cargoLockFitted", "cargoLockType");
    }
    for (const k of baseFeatureKeys) {
      if (isEmpty(inspection[k])) { featuresMissingKeys.push(k); featuresMissing.push(label(k)); }
    }

    // --- Sensors & Electrical ---
    const sensorsMissingKeys: string[] = [];
    const sensorsMissing: string[] = [];
    const baseSensorKeys = ["absSensor", "airTankMonitor", "lightOutSensor", "sensorError", "ultrasonicCargoSensor"];
    if (!resolveField(inspection, "atisRegulator", "atisregulator")) {
      sensorsMissingKeys.push("atisRegulator");
      sensorsMissing.push("ATIS Regulator");
    }
    if (!isCanadaTrailers) {
      baseSensorKeys.push("pulsatingLampInstallationDate", "pulsatingLampModel", "pulsatingLampManufacturer", "pulsatingLampWiring");
    }
    for (const k of baseSensorKeys) {
      if (isEmpty(inspection[k])) { sensorsMissingKeys.push(k); sensorsMissing.push(label(k)); }
    }

    // --- Aggregate ---
    const allMissingKeys = [
      ...identificationMissingKeys,
      ...physicalDimensionMissingKeys,
      ...tireLocationMissingKeys,
      ...featuresMissingKeys,
      ...sensorsMissingKeys,
    ];
    const allMissing = [
      ...identificationMissing,
      ...physicalDimensionMissing,
      ...tireLocationMissing,
      ...featuresMissing,
      ...sensorsMissing,
    ];
    const processStatus: "pass" | "fail" = allMissingKeys.length === 0 ? "pass" : "fail";

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Inspection processed successfully",
        data: {
          // Summary for web clients
          status: processStatus,
          missing: allMissing,
          missingKeys: allMissingKeys,
          // Grouped breakdown (used by mobile and detailed report)
          sections: {
            identification: { missingKeys: identificationMissingKeys, missing: identificationMissing },
            physicalDimension: { missingKeys: physicalDimensionMissingKeys, missing: physicalDimensionMissing },
            tireLocation: { missingKeys: tireLocationMissingKeys, missing: tireLocationMissing },
            features: { missingKeys: featuresMissingKeys, missing: featuresMissing },
            sensors: { missingKeys: sensorsMissingKeys, missing: sensorsMissing },
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 500,
        success: false,
        message: error?.message || "Internal Server Error",
        data: null,
      },
      { status: 500 }
    );
  }
}