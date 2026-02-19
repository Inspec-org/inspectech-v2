import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(req: NextRequest) {
    try {
        const token = req.headers.get("Authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });
        const actor = await getUserFromToken(token);
        if (!actor || (actor.role !== "admin" && actor.role !== "superadmin")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const body = await req.json();
        const vendorId = String(body?.vendorId || "");
        const departmentIds = Array.isArray(body?.departmentIds) ? body.departmentIds.map((x: any) => String(x)).filter((x: any) => x.length === 24) : [];
        if (!vendorId || vendorId.length !== 24) return NextResponse.json({ error: "Invalid vendorId" }, { status: 400 });

        await connectDB();
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

        const valid = await Department.find({ _id: { $in: departmentIds } }).select("_id").lean();
        vendor.departmentAccess = valid.map((d: any) => d._id);
        await vendor.save();

        return NextResponse.json({ status: "success", vendor: { _id: vendor._id, name: vendor.name, departmentAccess: vendor.departmentAccess } }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 });
    }
}