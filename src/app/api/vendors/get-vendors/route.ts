import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/getUserFromToken";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let vendors = [];

    if (user.role === "admin") {
      vendors = await User.find({ role: "vendor" }).select("_id username");
    } else if (user.role === "vendor") {
      vendors = [{ _id: user._id, username: user.username }];
    }

    return NextResponse.json(
      { status: "success", vendors },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
