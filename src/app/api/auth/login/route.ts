import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Admin from "@/lib/models/Admin";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        await connectDB();   // <-- CONNECT SAFELY (prevents errors)

        const user = await Admin.findOne({ email, isDeleted: false }).select("+password");
        if (!user) {
            return NextResponse.json(
                { success: false, message: "user not found" },
                { status: 401 }
            );
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            );
        }

        const JWT_SECRET = process.env.JWT_SECRET!;
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return NextResponse.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (error: any) {
        console.error("LOGIN ERROR:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}
