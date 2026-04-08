import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

const isEmpty = (v: any) => {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  if (!s) return true;
  return false;
};

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

    const identificationKeys = [
      "poNumber",
      "equipmentNumber",
      "vin",
      "licensePlateId",
      "licensePlateCountry",
      "licensePlateExpiration",
      "licensePlateState",
      "possessionOrigin",
    ];
    if (isCanadaTrailers) identificationKeys.push("owner");

    const physicalDimensionKeys = [
      "manufacturer",
      "modelYear",
      "length",
      "height",
      "grossAxleWeightRating",
      "axleType",
      "brakeType",
      "suspensionType",
      "tireModel",
      "tireBrand",
    ];

    const tireLocationKeys = [
      "leftFrontOuter",
      "leftFrontInner",
      "leftRearOuter",
      "leftRearInner",
      "rightFrontOuter",
      "rightFrontInner",
      "rightRearOuter",
      "rightRearInner",
    ];

    const featuresKeys = [
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
      "captiveBeam",
      "cargoCameras",
      "cartbars",
      "tpms",
      "trailerHeightDecal",
    ];
    if (isCanadaTrailers) featuresKeys.push("conspicuityTape");

    const sensorsKeys = [
      "absSensor",
      "airTankMonitor",
      "atisregulator",
      "lightOutSensor",
      "sensorError",
      "ultrasonicCargoSensor",
    ];

    const identification: string[] = [];
    const physicalDimension: string[] = [];
    const tireLocation: string[] = [];
    const features: string[] = [];
    const sensors: string[] = [];

    for (const k of identificationKeys) if (isEmpty(inspection[k])) identification.push(k);
    for (const k of physicalDimensionKeys) if (isEmpty(inspection[k])) physicalDimension.push(k);
    for (const k of tireLocationKeys) if (isEmpty(inspection[k])) tireLocation.push(k);
    for (const k of featuresKeys) if (isEmpty(inspection[k])) features.push(k);
    for (const k of sensorsKeys) if (isEmpty(inspection[k])) sensors.push(k);

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Inspection processed successfully",
        data: { identification, physicalDimension, sensors, tireLocation, features },
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
