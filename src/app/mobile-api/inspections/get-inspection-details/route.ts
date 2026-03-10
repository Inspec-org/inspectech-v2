// /Users/mlb/Desktop/InspecTech/src/app/api/inspections/get-inspection-details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const unitId = req.nextUrl.searchParams.get("unitId");
    if (!unitId) {
      return NextResponse.json({ success: false, message: "unitId is required" }, { status: 400 });
    }

    await connectDB();
    let id=unitId;
    if (unitId.includes("%20")) {
      id = unitId.replaceAll("%20", " ");
    }

    const inspection = await Inspection.findOne({ unitId:id });
    if (!inspection) {
      return NextResponse.json({ success: false, message: "Inspection not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, inspection }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}