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
      return NextResponse.json(
        {
          status: 401,
          success: false,
          message: "No token provided",
          data: null,
        },
        { status: 401 }
      );
    }

    const actor = await getUserFromToken(token);

    if (!actor) {
      return NextResponse.json(
        {
          status: 401,
          success: false,
          message: "Unauthorized",
          data: null,
        },
        { status: 401 }
      );
    }

    if (actor.role !== "superadmin" && actor.role !== "owner") {
      return NextResponse.json(
        {
          status: 403,
          success: false,
          message: "Forbidden",
          data: null,
        },
        { status: 403 }
      );
    }

    await connectDB();

    const owners = await User.find({ role: "owner", isDeleted: false });

    if (!owners || owners.length === 0) {
      return NextResponse.json(
        {
          status: 404,
          success: false,
          message: "Owner account not found",
          data: null,
        },
        { status: 404 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.updateMany(
      { role: "owner", isDeleted: false },
      { $set: { managementOTP: otp, managementOTPExpires: otpExpires } }
    );

    await Promise.all(
      owners.map((owner: any) =>
        sendEmail(
          owner.email,
          "Action Verification OTP",
          getOtpEmailTemplate(
            otp,
            "Superadmin Management Verification",
            "Use this verification code to approve adding or deleting a SuperAdmin.",
            owner.firstName
              ? `${owner.firstName} ${owner.lastName || ""}`.trim()
              : undefined,
            "10 minutes"
          )
        )
      )
    );

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "OTP sent to owner email",
        data: null,
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