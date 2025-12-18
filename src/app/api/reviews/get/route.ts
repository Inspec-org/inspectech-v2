import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Review from "@/lib/models/Reviews";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const page = parseInt(body.page ?? 1, 10);
        const limit = parseInt(body.limit ?? 10, 10);
        const department = body.department ?? undefined;
        const vendorId = body.vendorId ?? undefined;

        await connectDB();
        const query: any = {};
        if (department) query.departmentId = department;
        if (vendorId) query.vendorId = vendorId;
        const total = await Review.countDocuments(query);
        const result = await Review.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('inspectionId', 'inspectionStatus dateDay dateMonth dateYear')
            .lean();
        
        const vendorIds = [...new Set(result.map(r => String(r.vendorId)))];
        const deptIds = [...new Set(result.map(r => String(r.departmentId)))];
        const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select('name').lean();
        const depts = await Department.find({ _id: { $in: deptIds } }).select('name').lean();
        const vendorNameMap = Object.fromEntries(vendors.map(v => [String(v._id), v.name]));
        const deptNameMap = Object.fromEntries(depts.map(d => [String(d._id), d.name]));

        const reviews = result.map(r => ({
            ...r,
            vendorName: vendorNameMap[String(r.vendorId)] || '',
            departmentName: deptNameMap[String(r.departmentId)] || '',
        }));
        return NextResponse.json({ success: true, reviews, total, page, limit });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error?.message || "Internal Server Error" }, { status: 500 });
    }
}