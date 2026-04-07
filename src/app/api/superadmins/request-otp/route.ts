import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { sendEmail } from "@/lib/sendEmail";
import { getOtpEmailTemplate } from "@/lib/emailTemplates";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }
    const actor = await getUserFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "superadmin" && actor.role !== "owner") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const owners = await User.find({ role: "owner", isDeleted: false });
    if (!owners || owners.length === 0) {
      return NextResponse.json({ success: false, message: "Owner account not found" }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Store the same OTP for all owners so any can share it with the actor
    await User.updateMany(
      { role: "owner", isDeleted: false },
      { $set: { managementOTP: otp, managementOTPExpires: otpExpires } }
    );

    // Send emails
    await Promise.all(
      owners.map((owner: any) =>
        sendEmail(
          owner.email,
          "Action Verification OTP",
          getOtpEmailTemplate(
            otp,
            "Superadmin Management Verification",
            "Use this verification code to approve adding or deleting a SuperAdmin.",
            owner.firstName ? `${owner.firstName} ${owner.lastName || ""}`.trim() : undefined,
            "10 minutes"
          )
        )
      )
    );

    return NextResponse.json({
      success: true,
      message: "OTP sent to owner email",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

