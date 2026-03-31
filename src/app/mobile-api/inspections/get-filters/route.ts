import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
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

    await connectDB();

    // ===== QUERY PARAMS =====
    const { searchParams } = new URL(req.url);

    const department = searchParams.get("departmentId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;

    const query: any = {};
    if (department) query.departmentId = new Types.ObjectId(department);
    if (vendorId) query.vendorId = new Types.ObjectId(vendorId);

    // ===== FETCH FILTER DATA =====
    const [
      unitIds,
      statuses,
      types,
      inspectors,
      locations,
      delivered,
      durations,
      dates
    ] = await Promise.all([
      Inspection.distinct("unitId", query),
      Inspection.distinct("inspectionStatus", query),
      Inspection.distinct("type", query),
      Inspection.distinct("inspector", query),
      Inspection.distinct("location", query),
      Inspection.distinct("delivered", query),
      Inspection.aggregate([
        {
          $match: {
            ...query,
            durationMin: { $ne: null },
            durationSec: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              min: { $toString: "$durationMin" },
              sec: { $toString: "$durationSec" }
            }
          }
        },
        {
          $project: {
            _id: 0,
            min: "$_id.min",
            sec: "$_id.sec"
          }
        }
      ]),
      Inspection.aggregate([
        { $match: query },
        {
          $project: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            }
          }
        },
        { $group: { _id: "$day" } },
        { $project: { _id: 0, day: "$_id" } }
      ])
    ]);

    // ===== RESPONSE =====
    return NextResponse.json({
      status: 200,
      success: true,
      message: "Filters fetched successfully",
      data: {
        unitIds,
        statuses,
        types,
        inspectors,
        locations,
        delivered,
        durations: durations.map((d: any) => ({
          durationMin: d.min || "",
          durationSec: d.sec || ""
        })),
        dates: dates.map((d: any) => new Date(d.day))
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