import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Invitation from "@/lib/models/Invitation";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const header = req.headers.get("x-cron-secret");

    if (!secret || !header || header !== secret) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const threshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const filter = {
      status: "pending",
      $or: [
        { createdAt: { $lte: threshold } },
        { expiresAt: { $lte: now } }
      ]
    };

    const result = await Invitation.deleteMany(filter);

    return NextResponse.json({
      success: true,
      deletedCount: result?.deletedCount || 0
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}