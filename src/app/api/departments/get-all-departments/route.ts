import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/db";
import Departments from "@/lib/models/Departments";



export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const pagination = searchParams.get("pagination") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    let data;
    let total = 0;

    if (pagination) {
      const skip = (page - 1) * limit;

      // Get paginated data
      data = await Departments.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Total count for pagination
      total = await Departments.countDocuments();

      return NextResponse.json({
        success: true,
        pagination: true,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data
      });
    } else {
      // Get all departments
      data = await Departments.find().sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        pagination: false,
        total: data.length,
        data
      });
    }

  } catch (error: any) {
    console.error("GET Departments Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch departments",
        error: error.message
      },
      { status: 500 }
    );
  }
}