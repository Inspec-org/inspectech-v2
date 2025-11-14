import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Admin from "@/lib/models/Admin";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db/db";

// Middleware to get user from JWT
async function getUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error("JWT_SECRET is missing");

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    if (!decoded.id) return null;

    // Ensure DB connection
    await connectDB(); 

    const user = await Admin.findById(decoded.id).select("username email avatar _id");
    return user;
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
