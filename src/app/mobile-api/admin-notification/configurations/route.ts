import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Configuration from "@/lib/models/Configurations";
import { getUserFromToken } from "@/lib/getUserFromToken";

/* ================= GET ================= */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
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

    const configurations = await Configuration.find({
      userId: user._id
    }).lean();

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Configurations fetched successfully",
      data: configurations
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

/* ================= POST ================= */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
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

    const {
      configId,
      name,
      isAutoEnabled,
      frequency,
      timesPerDay,
      times,
      recipients,
      vendors,
      statuses
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "name required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    let configuration;

    // ================= UPDATE =================
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
            statuses: Array.isArray(statuses) ? statuses : []
          }
        },
        { new: true }
      );

      if (!configuration) {
        return NextResponse.json({
          status: 404,
          success: false,
          message: "Configuration not found",
          data: null
        }, { status: 404 });
      }
    }

    // ================= CREATE =================
    else {
      configuration = await Configuration.create({
        userId: user._id,
        name,
        isAutoEnabled: !!isAutoEnabled,
        frequency,
        timesPerDay,
        times: Array.isArray(times) ? times : [],
        recipients: Array.isArray(recipients) ? recipients : [],
        vendors: Array.isArray(vendors) ? vendors : [],
        statuses: Array.isArray(statuses) ? statuses : []
      });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: configId
        ? "Configuration updated successfully"
        : "Configuration created successfully",
      data: configuration
    }, { status: 200 });

  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({
        status: 409,
        success: false,
        message: "Configuration with this name already exists",
        data: null
      }, { status: 409 });
    }

    return NextResponse.json({
      status: 500,
      success: false,
      message: error?.message || "Internal Server Error",
      data: null
    }, { status: 500 });
  }
}