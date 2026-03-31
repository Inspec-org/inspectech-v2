import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User";
import Vendor from "@/lib/models/Vendor";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db/db";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: Request) {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Token is required",
        data: null
      }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    let vendorName = null;
    if (user.vendorId) {
      const vendor = await Vendor.findById(user.vendorId).select("name");
      vendorName = vendor?.name || null;
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: "User fetched successfully",
      data: {
        ...user,
        vendorName
      }
    }, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({
      status: 500,
      success: false,
      message,
      data: null
    }, { status: 500 });
  }
}