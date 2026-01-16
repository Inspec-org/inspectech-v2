import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Invitation from "@/lib/models/Invitation";
import Vendor from "@/lib/models/Vendor";

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

        const invitation = await Invitation.findOne({ token }).populate("vendorId");

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

        let vendorName: string | null = null;
        let vendorIdStr: string | undefined = undefined;
        if (invitation.role === "vendor" && invitation.vendorId) {
            vendorName = invitation.vendorId?.name || null;
            vendorIdStr = String(invitation.vendorId?._id || "");
        } else if (invitation.role === "admin") {
            const ids = Array.isArray((invitation as any).vendorAccess) ? (invitation as any).vendorAccess : [];
            if (ids.length) {
                const vendors = await Vendor.find({ _id: { $in: ids } }).select("name").lean();
                vendorName = vendors.map(v => v.name).join(", ");
            }
        }

        return NextResponse.json({
            success: true,
            invitation: {
                name: invitation.name,
                email: invitation.email,
                role: invitation.role,
                vendorName,
                vendorId: vendorIdStr
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