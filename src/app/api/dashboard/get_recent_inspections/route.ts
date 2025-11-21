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
    const { departmentId, vendorId } = body;

    await connectDB();

    // ---------- RECENT INSPECTIONS (BASED ON USER + DEPT) ----------
    const recentDocs = await Inspection.find({
      userId: vendorId,
      departmentId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "unitId inspectionStatus vendor location inspector type durationMin durationSec dateDay dateMonth dateYear createdAt"
      )
      .lean(); 

    const recent = recentDocs.map((i) => ({
      ...i,
      duration: `${i.durationMin} min ${i.durationSec} sec`,
      date: `${String(i.dateDay).padStart(2, "0")} ${i.dateMonth} ${i.dateYear}`,
    }));

    return NextResponse.json({
      success: true,
      dashboard: {
        recent
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
