import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });


    await connectDB();

    const body = await req.json();
    const department = body?.department || undefined;
    const vendorId = body?.vendorId || undefined;

    const query: any = {};
    if (department) query.departmentId = department;
    if (vendorId) query.vendorId = vendorId;

    const [unitIds, statuses, types, inspectors, locations, delivered, durations, dates] = await Promise.all([
      Inspection.distinct('unitId', query),
      Inspection.distinct('inspectionStatus', query),
      Inspection.distinct('type', query),
      Inspection.distinct('inspector', query),
      Inspection.distinct('location', query),
      Inspection.distinct('delivered', query),
      Inspection.aggregate([
        { $match: query },
        { $group: { _id: { min: '$durationMin', sec: '$durationSec' } } },
        { $project: { _id: 0, min: '$_id.min', sec: '$_id.sec' } }
      ]),
      Inspection.aggregate([
        { $match: query },
        { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
        { $group: { _id: '$day' } },
        { $project: { _id: 0, day: '$_id' } }
      ])
    ]);

    const inspections = [
      ...unitIds.map((v: string) => ({ unitId: v })),
      ...statuses.map((v: string) => ({ inspectionStatus: v })),
      ...types.map((v: string) => ({ type: v })),
      ...inspectors.map((v: string) => ({ inspector: v })),
      ...locations.map((v: string) => ({ location: v })),
      ...delivered.map((v: string) => ({ delivered: v })),
      ...durations.map((d: any) => ({ durationMin: d.min || '', durationSec: d.sec || '' })),
      ...dates.map((d: any) => ({ createdAt: new Date(d.day) })),
    ];

    return NextResponse.json({ success: true, inspections });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}