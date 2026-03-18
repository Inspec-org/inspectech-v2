import { NextRequest, NextResponse } from "next/server";
import Department from "@/lib/models/Departments";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "No token provided",
                data: null
            }, { status: 401 });
        }

        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "Unauthorized",
                data: null
            }, { status: 401 });
        }

        const url = new URL(req.url);
        let departments: any[] = [];

        departments = await Department.find()
            .sort({ createdAt: -1 });

        return NextResponse.json({
            status: 200,
            success: true,
            message: "Departments fetched successfully",
            data: departments
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            status: 500,
            success: false,
            message: error.message || "Internal Server Error",
            data: null
        }, { status: 500 });
    }
}
