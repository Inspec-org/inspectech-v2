import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/sendEmail";

import { getOtpEmailTemplate } from "@/lib/emailTemplates";

export async function POST(req: NextRequest) {
    try {
        const { email, password, enable } = await req.json();

        if (!email || !password || typeof enable !== "boolean") {
            return NextResponse.json({
                success: false,
                message: "Email, password, and enable (boolean) are required",
            }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email, isDeleted: false }).select("+password");
        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found",
            }, { status: 401 });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json({
                success: false,
                message: "Invalid credentials",
            }, { status: 401 });
        }

        // Generate OTP for verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.twoFactorOTP = otp;
        user.twoFactorOTPExpires = otpExpires;
        user.pending2FactorState = enable;
        await user.save();

        // Send email
        await sendEmail(
            user.email, 
            `Confirm 2FA ${enable ? "Enable" : "Disable"}`, 
            getOtpEmailTemplate(
                otp,
                `Confirm 2FA ${enable ? "Enable" : "Disable"}`,
                `Use the verification code below to confirm ${enable ? "enabling" : "disabling"} two-factor authentication for your account:`,
                user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
                "10 minutes"
            )
        );

        return NextResponse.json({
            success: true,
            message: `OTP sent to your email to confirm 2FA ${enable ? "enable" : "disable"}`,
            data: {
                twoFactorRequired: true,
                email: user.email
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}
