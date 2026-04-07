import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({
                status: 400,
                success: false,
                message: "Email and OTP are required",
                data: null
            }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email, isDeleted: false }).select("+twoFactorOTP +twoFactorOTPExpires +pending2FactorState");
        if (!user) {
            return NextResponse.json({
                status: 404,
                success: false,
                message: "User not found",
                data: null
            }, { status: 404 });
        }

        if (user.status !== 'active') {
            return NextResponse.json({
                status: 403,
                success: false,
                message: "Your Account has been deactivated. Please contact Your Administrator.",
                data: null
            }, { status: 403 });
        }

        if (!user.twoFactorOTP || user.twoFactorOTP !== otp) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "Invalid OTP",
                data: null
            }, { status: 401 });
        }

        if (new Date() > user.twoFactorOTPExpires) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "OTP expired",
                data: null
            }, { status: 401 });
        }

        // OTP is valid, perform role/vendor checks before finalizing login
        if (user.role !== 'superadmin' && user.role !== 'owner') {
            if (user.role === 'user') {
                const vendorId = user.vendorId;
                if (!vendorId) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'No vendor assigned to your account',
                        data: null
                    }, { status: 403 });
                }
                const vendor = await Vendor.findById(vendorId);
                if (!vendor) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'Vendor not found',
                        data: null
                    }, { status: 403 });    
                }
                if (String(vendor.status).toLowerCase() !== 'active') {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'Your vendor is inactive. Please contact your administrator.',
                        data: null
                    }, { status: 403 });
                }
                const vDeptIds: string[] = (vendor.departmentAccess || []).map((id: any) => id.toString());
                if (vDeptIds.length === 0) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'No departments are configured for your vendor.',
                        data: null
                    }, { status: 403 });
                }
                const vActiveDeptCount = await Department.countDocuments({ _id: { $in: vDeptIds }, status: 'active' });
                if (vActiveDeptCount === 0) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'No active departments are available for your vendor.',
                        data: null
                    }, { status: 403 });
                }
            } else if (user.role === 'admin') {
                const vendorIds: string[] = (user.vendorAccess || []).map((id: any) => id.toString());
                if (vendorIds.length === 0) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'No vendor access configured for this admin.',
                        data: null
                    }, { status: 403 });
                }
                const activeVendors = await Vendor.find({ _id: { $in: vendorIds }, status: 'active' }).select('_id departmentAccess').lean();
                if (!activeVendors || activeVendors.length === 0) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'All vendors assigned to your account are inactive.',
                        data: null
                    }, { status: 403 });
                }
                const adminDeptIds: string[] = (user.departmentAccess || []).map((id: any) => id.toString());
                if (adminDeptIds.length === 0) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'No departments assigned to your admin account.',
                        data: null
                    }, { status: 403 });    
                }
                const unionVendorDeptIds: string[] = Array.from(new Set(activeVendors.flatMap((v: any) => (v.departmentAccess || []).map((id: any) => id.toString()))));
                const intersection = adminDeptIds.filter((id: string) => unionVendorDeptIds.includes(id));
                if (intersection.length === 0) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'No department access overlap with your active vendors.',
                        data: null
                    }, { status: 403 });
                }
                const activeIntersectionCount = await Department.countDocuments({ _id: { $in: intersection }, status: 'active' });
                if (activeIntersectionCount === 0) {
                    return NextResponse.json({
                        status: 403,
                        success: false,
                        message: 'You do not have any active departments for your active vendors.',
                        data: null
                    }, { status: 403 });
                }
            }
        }

        // If this was a 2FA toggle request, update the state
        if (user.pending2FactorState !== undefined && user.pending2FactorState !== null) {
            user.enable2Factor = user.pending2FactorState;
            user.pending2FactorState = undefined;
        }

        // OTP is valid and user is allowed to log in, clear it
        user.twoFactorOTP = undefined;
        user.twoFactorOTPExpires = undefined;
        await user.save();

        const JWT_SECRET = process.env.JWT_SECRET!;
        const access_token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: "1d" } // Default to 1 day for 2FA login
        );

        return NextResponse.json({
            status: 200,
            success: true,
            message: "Login successful",
            data: {
                token: access_token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role
                }
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { status: 500, success: false, message: error.message || "Server error", data: null },
            { status: 500 }
        );
    }
}
