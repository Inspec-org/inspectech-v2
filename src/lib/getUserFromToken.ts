import jwt from "jsonwebtoken";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db/db";

export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error("JWT_SECRET is missing");

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id?: string;
      userId?: string;
      email?: string;
    };

    const id = decoded.id || decoded.userId;
    if (!id) return null;

    await connectDB();

    const user = await User.findById(id).select(
      "firstName lastName email avatar _id role vendorAccess"
    );

    if (!user) return null;

    // 👇 concat firstname + lastname
    const username = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    return {
      ...user.toObject(),
      username,
    };
  } catch {
    return null;
  }
}
