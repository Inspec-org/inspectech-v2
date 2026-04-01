import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/sendEmail";

import { getOtpEmailTemplate } from "@/lib/emailTemplates";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        await connectDB();   // <-- CONNECT SAFELY (prevents errors)

        const user = await User.findOne({ email, isDeleted: false });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 401 }
            );
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        await sendEmail(
            user.email,
            "Reset Your Password - Verification Code Inside",
            getOtpEmailTemplate(
                otp, 
                "Password Reset Request", 
                "We received a request to reset your password. Use the verification code below to proceed:",
                user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
                "1 hour"
            )
        );

        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Email Sent Successfully"
        });

    } catch (error: any) {
        ;
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}



