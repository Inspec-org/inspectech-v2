import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";
import Invitation from "@/lib/models/Invitation";

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const actor = await getUserFromToken(token);

    if (!actor) {
      return NextResponse.json(
        { status: 401, success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    if (actor.role !== "superadmin" && actor.role !== "owner") {
      return NextResponse.json(
        { status: 403, success: false, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    const body = await req.json();
    const targetEmail: string = String(body?.targetEmail || "").trim();
    const targetUserId: string = String(body?.targetUserId || body?.targetId || "").trim();
    const otp: string = String(body?.otp || "").trim();

    if (!targetEmail && !targetUserId) {
      return NextResponse.json(
        { status: 400, success: false, message: "targetEmail or targetUserId is required", data: null },
        { status: 400 }
      );
    }

    await connectDB();

    const query = targetUserId ? { _id: targetUserId } : { email: targetEmail };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json(
        { status: 404, success: false, message: "User not found", data: null },
        { status: 404 }
      );
    }
    if (user.role === "owner") {
      return NextResponse.json(
        { status: 403, success: false, message: "Owner account cannot be deleted", data: null },
        { status: 403 }
      );
    }
    if (user.role === "superadmin") {
      if (!otp || otp.length !== 6) {
        return NextResponse.json(
          { status: 400, success: false, message: "OTP is required to delete a SuperAdmin", data: null },
          { status: 400 }
        );
      }
      const owner = await User.findOne({
        role: "owner",
        managementOTP: otp,
        managementOTPExpires: { $gt: new Date() },
        isDeleted: false
      }).select("_id");
      if (!owner) {
        return NextResponse.json(
          { status: 401, success: false, message: "Invalid or expired OTP", data: null },
          { status: 401 }
        );
      }
      await User.updateMany({ role: "owner", managementOTP: otp }, { $unset: { managementOTP: "", managementOTPExpires: "" } });
    }

    await User.deleteOne({ _id: user._id });
    await Invitation.deleteOne({ email: user.email });

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "User deleted successfully",
        data: { id: String(user._id), email: user.email },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 500,
        success: false,
        message: error?.message || "Internal Server Error",
        data: null,
      },
      { status: 500 }
    );
  }
}
