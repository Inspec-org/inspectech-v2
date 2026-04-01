import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/sendEmail";
import { getOtpEmailTemplate } from "@/lib/emailTemplates";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // 1️⃣ Validate email
        if (!email) {
            return NextResponse.json({
                status: 400,
                success: false,
                message: "Email is required",
                data: null
            }, { status: 400 });
        }

        await connectDB();

        // 2️⃣ Find user
        const user = await User.findOne({ email, isDeleted: false });

        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "User not found",
                data: null
            }, { status: 401 });
        }

        // 3️⃣ Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // 4️⃣ Send Email
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

        // 5️⃣ Save OTP
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        return NextResponse.json({
            status: 200,
            success: true,
            message: "Email Sent Successfully",
            data: null
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            status: 500,
            success: false,
            message: error.message || "Server error",
            data: null
        }, { status: 500 });
    }
}