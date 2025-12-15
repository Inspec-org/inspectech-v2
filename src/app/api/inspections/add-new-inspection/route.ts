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
    if (!body?.unitId) {
      return NextResponse.json({ success: false, message: "unitId is required" }, { status: 400 });
    }
    if (!body?.departmentId) {
      return NextResponse.json({ success: false, message: "departmentId is required" }, { status: 400 });
    }
    if (!body?.vendorId) {
      return NextResponse.json({ success: false, message: "vendorId is required" }, { status: 400 });
    }

    await connectDB();

    await Inspection.syncIndexes();

    const cleaned: any = { ...body };
    ["inspectionStatus", "reviewReason", "delivered"].forEach((key) => {
      if (cleaned[key] === "" || cleaned[key] === undefined || cleaned[key] === null) {
        delete cleaned[key];
      }
    });
    if (cleaned["delivered_status"] && !cleaned["delivered"]) {
      cleaned["delivered"] = cleaned["delivered_status"];
      delete cleaned["delivered_status"];
    }
    console.log("cleaned", cleaned);

    const inspection = await Inspection.create(cleaned);
    return NextResponse.json({ success: true, inspection }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "unitId already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}