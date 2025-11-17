import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PUT(req: NextRequest) {
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

    await connectDB();

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

    const updated = await Inspection.findOneAndUpdate(
      { unitId: cleaned.unitId },
      { $set: cleaned },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Inspection not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, inspection: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}