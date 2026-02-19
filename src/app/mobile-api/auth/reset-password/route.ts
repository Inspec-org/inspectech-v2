import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
    try {
        const { email, newPassword } = await req.json();

        // 1️⃣ Validate inputs
        if (!email || !newPassword) {
            return NextResponse.json({
                status: 400,
                success: false,
                message: "Email and New Password are required",
                data: null
            }, { status: 400 });
        }

        await connectDB();

        // 2️⃣ Find user
        const user = await User.findOne({ email, isDeleted: false }).select("+password");

        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "User not found",
                data: null
            }, { status: 401 });
        }

        // 3️⃣ Update password
        user.password = newPassword;
        await user.save();

        return NextResponse.json({
            status: 200,
            success: true,
            message: "Password Saved Successfully",
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
