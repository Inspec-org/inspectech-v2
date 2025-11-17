import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Admin from "@/lib/models/Admin";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const { email, password, rememberMe = false } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }
        console.log(rememberMe)

        await connectDB();   // <-- CONNECT SAFELY (prevents errors)

        const user = await Admin.findOne({ email, isDeleted: false }).select("+password");
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 401 }
            );
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: "Invalid Credentials" },
                { status: 401 }
            );
        }

        const JWT_SECRET = process.env.JWT_SECRET!;
        const access_token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: rememberMe ? "30d" : "1d" }
        );

        // Store refresh token in HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined // 30 days or session cookie
        });

        return NextResponse.json({
            success: true,
            message: "Login successful",
            token: access_token,
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
