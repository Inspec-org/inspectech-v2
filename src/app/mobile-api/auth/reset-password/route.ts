import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
    try {
        const { email, newPassword } = await req.json();

        if (!email || !newPassword) {
            return NextResponse.json(
                { success: false, message: "Email and NewPassword is required" },
                { status: 400 }
            );
        }

        await connectDB();   // <-- CONNECT SAFELY (prevents errors)

        const user = await User.findOne({ email, isDeleted: false }).select("+password");
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 401 }
            );
        }

        user.password = newPassword;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Password Saved Successfully"
        });

    } catch (error: any) {
        ;
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}
