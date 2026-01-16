import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const actor = await getUserFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "superadmin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const targetEmail: string = String(body?.targetEmail || "").trim();
    const targetUserId: string = String(body?.targetUserId || body?.targetId || "").trim();
    if (!targetEmail && !targetUserId) {
      return NextResponse.json({ success: false, message: "targetEmail or targetUserId is required" }, { status: 400 });
    }

    await connectDB();
    const query = targetUserId ? { _id: targetUserId } : { email: targetEmail };
    const user = await User.findOne(query);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Only admin users can be deleted" }, { status: 400 });
    }

    await User.deleteOne({ _id: user._id });
    return NextResponse.json(
      { success: true, deletedUser: { id: String(user._id), email: user.email } },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}