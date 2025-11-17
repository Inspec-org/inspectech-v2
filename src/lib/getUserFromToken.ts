import jwt from "jsonwebtoken";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db/db";
import { NextResponse } from "next/server";

export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error("JWT_SECRET is missing");

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    if (!decoded.id) return null;

    await connectDB();
    const user = await User.findById(decoded.id).select("username email avatar _id role");
    return user;
  } catch {
    return null;
  }
}
