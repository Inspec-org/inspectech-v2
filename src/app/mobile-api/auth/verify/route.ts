import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        // 1️⃣ Validate inputs
        if (!email || !otp) {
            return NextResponse.json({
                status: 400,
                success: false,
                message: "Email and OTP are required",
                data: null
            }, { status: 400 });
        }

        await connectDB();

        // 2️⃣ Find user
        const user = await User.findOne({
            email,
            isDeleted: false
        }).select("+resetPasswordOTP +resetPasswordExpires");

        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "User not found",
                data: null
            }, { status: 401 });
        }

        // 3️⃣ Check expiry
        if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "OTP Expired",
                data: null
            }, { status: 401 });
        }

        // 4️⃣ Verify OTP
        if (user.resetPasswordOTP !== String(otp)) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "Invalid OTP",
                data: null
            }, { status: 401 });
        }

        // 5️⃣ Clear OTP after success
        user.resetPasswordOTP = null;
        user.resetPasswordExpires = null;
        await user.save();

        return NextResponse.json({
            status: 200,
            success: true,
            message: "OTP Verified Successfully",
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
