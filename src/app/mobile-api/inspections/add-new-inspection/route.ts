import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    // ===== AUTH =====
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

    const body = await req.json();

    // ===== VALIDATION =====
    if (!body?.unitId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "unitId is required",
        data: null
      }, { status: 400 });
    }

    if (!body?.departmentId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "departmentId is required",
        data: null
      }, { status: 400 });
    }

    if (!body?.vendorId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "vendorId is required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    // ===== CLEAN DATA =====
    const cleaned: any = { ...body };

    ["inspectionStatus", "reviewReason", "delivered"].forEach((key) => {
      if (cleaned[key] === "" || cleaned[key] === undefined || cleaned[key] === null) {
        delete cleaned[key];
      }
    });

    // Handle both old (equipmentNumber) and new (equipmentId) field names for backward compatibility
    ["equipmentNumber", "equipmentId", "vin"].forEach((key) => {
      const v = cleaned[key];
      if (
        v === "" ||
        v === null ||
        v === undefined ||
        String(v).trim().toUpperCase() === "N/A"
      ) {
        delete cleaned[key];
      }
    });

    if (cleaned["delivered_status"] && !cleaned["delivered"]) {
      cleaned["delivered"] = cleaned["delivered_status"];
      delete cleaned["delivered_status"];
    }

    // ===== CREATE =====
    const inspection = await Inspection.create(cleaned);

    return NextResponse.json({
      status: 201,
      success: true,
      message: "Inspection created successfully",
      data: inspection
    }, { status: 201 });

  } catch (error: any) {
    // ===== DUPLICATE KEY =====
    if (error?.code === 11000) {
      const field =
        (error?.keyPattern && Object.keys(error.keyPattern)[0]) ||
        (error?.keyValue && Object.keys(error.keyValue)[0]) ||
        (/dup key.*\{ (.+?):/.exec(String(error?.message || ""))?.[1]) ||
        "unique field";

      return NextResponse.json({
        status: 409,
        success: false,
        message: `${field} already exists`,
        data: null
      }, { status: 409 });
    }

    // ===== GENERIC ERROR =====
    return NextResponse.json({
      status: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}