import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Invitation from "@/lib/models/Invitation";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
             return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        await connectDB();

        const invitation = await Invitation.findOne({ token });

        if (!invitation) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired invitation" },
                { status: 400 }
            );
        }

        if (new Date() > invitation.expiresAt) {
             return NextResponse.json(
                { success: false, message: "Invitation has expired" },
                { status: 400 }
            );
        }

        // Check if user already exists (double check)
        const existingUser = await User.findOne({ email: invitation.email });
        if (existingUser) {
             return NextResponse.json(
                { success: false, message: "User already exists" },
                { status: 400 }
            );
        }

        const [firstName = '', lastName = ''] = (invitation.name || '').split(' ');
        const payload: any = {
            email: invitation.email,
            password,
            role: invitation.role === "vendor" ? "user" : "admin",
            vendorId: invitation.vendorId,
            firstName,
            lastName,
        };
        if (invitation.role === "admin") {
            payload.vendorAccess = Array.isArray((invitation as any).vendorAccess) ? (invitation as any).vendorAccess : [];
            payload.departmentAccess = Array.isArray((invitation as any).departmentAccess) ? (invitation as any).departmentAccess : [];
        }
        const newUser = await User.create(payload);

        // Delete invitation
        await Invitation.updateOne({ _id: invitation._id }, { status: "accepted" });

        return NextResponse.json({
            success: true,
            message: "Registration successful"
        });

    } catch (error: any) {
        ;
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}