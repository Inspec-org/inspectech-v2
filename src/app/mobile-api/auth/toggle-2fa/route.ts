import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
    try {
        const { email, password, enable } = await req.json();

        if (!email || !password || typeof enable !== "boolean") {
            return NextResponse.json({
                status: 400,
                success: false,
                message: "Email, password, and enable (boolean) are required",
                data: null
            }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email, isDeleted: false }).select("+password");
        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "User not found",
                data: null
            }, { status: 401 });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "Invalid credentials",
                data: null
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
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Confirm 2FA ${enable ? "Enable" : "Disable"}</h2>
                <p>Your OTP for verification is: <strong style="font-size: 24px; color: #10b981;">${otp}</strong></p>
                <p>This OTP will expire in 10 minutes.</p>
            </div>
        `;
        await sendEmail(user.email, `Confirm 2FA ${enable ? "Enable" : "Disable"}`, emailHtml);

        return NextResponse.json({
            status: 200,
            success: true,
            message: `OTP sent to your email to confirm 2FA ${enable ? "enable" : "disable"}`,
            data: {
                twoFactorRequired: true,
                email: user.email
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { status: 500, success: false, message: error.message || "Server error", data: null },
            { status: 500 }
        );
    }
}
