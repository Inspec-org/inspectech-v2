import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Review from "@/lib/models/Reviews";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];
        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const body = await req.json();
        const page = parseInt(body.page ?? 1, 10);
        const limit = parseInt(body.limit ?? 10, 10);
        const department = body.department ?? undefined;
        const vendorId = body.vendorId ?? undefined;
        const filters = body.filters ?? {};
        const query: any = {};

        // --------------------------------------------------
        // BASE FILTERS
        // --------------------------------------------------
        if (department) query.departmentId = department;
        if (vendorId) query.vendorId = vendorId;

        // --------------------------------------------------
        // UNIT ID (Review)
        // --------------------------------------------------
        if (filters.unitId?.length > 0) {
            query.unitId = { $in: filters.unitId };
        }

        // --------------------------------------------------
        // VENDOR FILTER (BY NAME → ID)
        // --------------------------------------------------
        // if (filters.vendor?.length > 0) {

        //     const vendorDocs = await Vendor.find({
        //         name: { $in: filters.vendor }
        //     }).select("_id").lean();

        //     query.vendorId = { $in: vendorDocs.map(v => v._id) };
        // }

        // --------------------------------------------------
        // DEPARTMENT FILTER (BY NAME → ID)
        // --------------------------------------------------
        if (filters.department?.length > 0) {

            const deptDocs = await Department.find({
                name: { $in: filters.department }
            }).select("_id").lean();

            query.departmentId = { $in: deptDocs.map(d => d._id) };
        }

        // --------------------------------------------------
        // MISSING DATA (Review)
        // --------------------------------------------------
        if (filters.missingData?.length > 0) {
            query.missingData = {
                $in: filters.missingData.map((v: string) => v.toLowerCase())
            };
        }

        // --------------------------------------------------
        // EMAIL NOTIFICATION (Review)
        // --------------------------------------------------
        if (filters.email_notifcation?.length > 0) {
            query.emailNotification = {
                $in: filters.email_notifcation.map((v: string) => v.toLowerCase())
            };
        }

        // --------------------------------------------------
        // INSPECTION-LEVEL FILTERS
        // --------------------------------------------------
        const inspectionMatch: any = {};

        // STATUS
        if (filters.inspectionStatus?.length > 0) {
            inspectionMatch.inspectionStatus = {
                $in: filters.inspectionStatus.map((s: string) => s.toLowerCase())
            };
        }

        // DATE CREATED
        if (filters.dateCreated?.length > 0) {
            const dates = filters.dateCreated.map((d: string) => new Date(d));

            inspectionMatch.$or = dates.map((dt: Date) => ({
                dateDay: dt.getUTCDate(),
                dateMonth: dt.getUTCMonth() + 1,
                dateYear: dt.getUTCFullYear()
            }));
        }

        // --------------------------------------------------
        // FETCH INSPECTIONS IF NEEDED
        // --------------------------------------------------
        if (Object.keys(inspectionMatch).length > 0) {

            const { default: Inspection } = await import("@/lib/models/Inspections");

            const inspections = await Inspection.find(inspectionMatch)
                .select("_id")
                .lean();

            const inspectionIds = inspections.map(i => i._id);

            if (inspectionIds.length === 0) {
                return NextResponse.json({
                    success: true,
                    reviews: [],
                    total: 0,
                    page,
                    limit
                });
            }

            query.inspectionId = { $in: inspectionIds };
        }

        // --------------------------------------------------
        // REVIEW REQUESTED DATE (Review)
        // --------------------------------------------------
        if (filters.reviewRequested?.length > 0) {
            // If multiple dates, use $or with a range for each
            query.$or = filters.reviewRequested.map((d: string) => {
                const start = new Date(d);
                start.setHours(0, 0, 0, 0); // start of day
                const end = new Date(d);
                end.setHours(23, 59, 59, 999); // end of day
                return {
                    reviewRequestedAt: { $gte: start, $lte: end }
                };
            });
        }


        // --------------------------------------------------
        // REVIEW COMPLETED DATE (Review)
        // --------------------------------------------------
        if (filters.review_completed?.length > 0) {
            query.reviewCompletedAt = {
                $in: filters.review_completed.map((d: string) => new Date(d))
            };
        }

        // --------------------------------------------------
        // QUERY REVIEWS
        // --------------------------------------------------
        const total = await Review.countDocuments(query);

        const result = await Review.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("inspectionId", "inspectionStatus dateDay dateMonth dateYear")
            .lean();

        // --------------------------------------------------
        // MAP VENDOR / DEPARTMENT NAMES
        // --------------------------------------------------
        const vendorIds = [...new Set(result.map(r => String(r.vendorId)))];
        const deptIds = [...new Set(result.map(r => String(r.departmentId)))];

        const vendors = await Vendor.find({ _id: { $in: vendorIds } })
            .select("name")
            .lean();

        const depts = await Department.find({ _id: { $in: deptIds } })
            .select("name")
            .lean();

        const vendorMap = Object.fromEntries(vendors.map(v => [String(v._id), v.name]));
        const deptMap = Object.fromEntries(depts.map(d => [String(d._id), d.name]));

        const reviews = result.map(r => ({
            ...r,
            vendorName: vendorMap[String(r.vendorId)] || "",
            departmentName: deptMap[String(r.departmentId)] || ""
        }));

        return NextResponse.json({
            success: true,
            reviews,
            total,
            page,
            limit
        });
    } catch (error: any) {
        console.error("❌ ERROR FETCHING REVIEWS:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
