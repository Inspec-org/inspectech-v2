import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Admin from "@/lib/models/Admin";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: "Email and OTP is required" },
                { status: 400 }
            );
        }
        console.log(email, otp)

        await connectDB();   // <-- CONNECT SAFELY (prevents errors)

        const user = await Admin.findOne({ email, isDeleted: false }).select("+resetPasswordOTP +resetPasswordExpires");
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 401 }
            );
        }

        console.log(user)

        if (user.resetPasswordExpires < Date.now()) {
            return NextResponse.json(
                { success: false, message: "OTP Expired" },
                { status: 401 }
            );
        }

        if (user.resetPasswordOTP !== String(otp)) {
            return NextResponse.json(
                { success: false, message: "Invalid OTP" },
                { status: 401 }
            );
        }

        user.resetPasswordOTP = null;
        user.resetPasswordExpires = null;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "OTP Verified Successfully",
        });

    } catch (error: any) {
        console.error("Verification ERROR:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}
