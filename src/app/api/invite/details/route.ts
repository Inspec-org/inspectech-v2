import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Invitation from "@/lib/models/Invitation";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Token is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const invitation = await Invitation.findOne({ token }).populate('vendorId');

        if (!invitation) {
            return NextResponse.json(
                { success: false, message: "Invalid invitation" },
                { status: 404 }
            );
        }

        if (new Date() > invitation.expiresAt) {
             return NextResponse.json(
                { success: false, message: "Invitation has expired" },
                { status: 410 }
            );
        }

        return NextResponse.json({
            success: true,
            invitation: {
                name: invitation.name,
                email: invitation.email,
                role: invitation.role,
                vendorName: invitation.vendorId.name,
                vendorId: invitation.vendorId._id
            }
        });

    } catch (error: any) {
        console.error("INVITE DETAILS ERROR:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}