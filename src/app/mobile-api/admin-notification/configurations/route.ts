import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Configuration from "@/lib/models/Configurations";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const configurations = await Configuration.find({ userId: user._id }).lean();
    return NextResponse.json({ success: true, configurations });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { configId, name, isAutoEnabled, frequency, timesPerDay, times, recipients, vendors, statuses } = body;
    if (!name || typeof name !== "string") return NextResponse.json({ success: false, message: "name required" }, { status: 400 });

    await connectDB();

    let configuration;
    if (configId) {
      configuration = await Configuration.findOneAndUpdate(
        { _id: configId, userId: user._id },
        {
          $set: {
            name,
            isAutoEnabled: !!isAutoEnabled,
            frequency,
            timesPerDay,
            times: Array.isArray(times) ? times : [],
            recipients: Array.isArray(recipients) ? recipients : [],
            vendors: Array.isArray(vendors) ? vendors : [],
            statuses: Array.isArray(statuses) ? statuses : [],
          }
        },
        { new: true }
      );
      if (!configuration) return NextResponse.json({ success: false, message: "Configuration not found" }, { status: 404 });
    } else {
      configuration = await Configuration.create({
        userId: user._id,
        name,
        frequency,
        timesPerDay,
        times: Array.isArray(times) ? times : [],
        recipients: Array.isArray(recipients) ? recipients : [],
        vendors: Array.isArray(vendors) ? vendors : [],
        statuses: Array.isArray(statuses) ? statuses : [],
      });
    }

    return NextResponse.json({ success: true, configuration });
  } catch (error: any) {
    // Duplicate key error (unique index violation)
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration with this name already exists",
          field: "name",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }

}

