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
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { departmentId, vendorId, year } = body;

    const y = Number(year);
    if (!y || isNaN(y)) {
      return NextResponse.json(
        { success: false, message: "Invalid year" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch inspections by stored year
    const inspections = await Inspection.find({
      departmentId,
      vendorId,
      dateYear: y,
    });

    // Q1–Q4
    const quarterly = Array.from({ length: 4 }, () => ({
      pass: 0,
      fail: 0,
    }));

    for (const i of inspections) {
      /**
       * dateMonth expected: 1–12
       * Quarter formula:
       * 1–3   → Q0
       * 4–6   → Q1
       * 7–9   → Q2
       * 10–12 → Q3
       */
      const q = Math.floor((i.dateMonth - 1) / 3);

      if (i.inspectionStatus === "pass") {
        quarterly[q].pass++;
      } else if (i.inspectionStatus === "fail") {
        quarterly[q].fail++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        year: y,
        quarterly,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
