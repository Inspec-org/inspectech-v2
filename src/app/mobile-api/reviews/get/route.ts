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
        const optionsOnly = Boolean(body.optionsOnly);
        const query: any = {};

        // --------------------------------------------------
        // BASE FILTERS
        // --------------------------------------------------
        if (department) query.departmentId = department;
        if (vendorId) query.vendorId = vendorId;

        if (optionsOnly) {
            const base = { ...query };

            const unitIds = await Review.distinct("unitId", base);
            const missingDataRaw = await Review.distinct("missingData", base);
            const emailRaw = await Review.distinct("emailNotification", base);

            const reqDocs = await Review.find(base).select("reviewRequestedAt").lean();
            const compDocs = await Review.find(base).select("reviewCompletedAt").lean();
            const reviewRequested = Array.from(new Set(reqDocs.filter(d => d.reviewRequestedAt).map(d => new Date(d.reviewRequestedAt as any).toISOString().slice(0, 10))));
            const reviewCompleted = Array.from(new Set(compDocs.filter(d => d.reviewCompletedAt).map(d => new Date(d.reviewCompletedAt as any).toISOString().slice(0, 10))));

            const { default: Inspection } = await import("@/lib/models/Inspections");
            const insps = await Inspection.find(base)
                .select("inspectionStatus dateDay dateMonth dateYear")
                .lean();
            const inspectionStatus = Array.from(new Set(
                insps.map((i: any) => String(i.inspectionStatus || "")).filter(Boolean)
            ));
            const dateCreated = Array.from(new Set(
                insps.map((i: any) => {
                    if (!i.dateYear || !i.dateMonth || !i.dateDay) return null;
                    const y = String(i.dateYear);
                    const m = String(i.dateMonth).padStart(2, "0");
                    const d = String(i.dateDay).padStart(2, "0");
                    return `${y}-${m}-${d}`;
                }).filter(Boolean)
            ));

            const toLabel = (s: string) => (s === "none" ? "None" : s === "incomplete image file" ? "Incomplete Image File" : s === "incomplete checklist" ? "Incomplete Checklist" : s === "incomplete dot form" ? "Incomplete DOT Form" : s);

            const options = {
                unitId: unitIds.map((v: any) => String(v)),
                inspectionStatus,
                vendor: [],
                department: [],
                dateCreated,
                reviewRequested,
                missingData: missingDataRaw.filter(Boolean).map((v: any) => toLabel(String(v))),
                reviewCompleted,
                emailNotification: emailRaw.filter(Boolean).map((v: any) => (String(v) === "yes" ? "Yes" : String(v) === "no" ? "No" : String(v) === "manually sent" ? "Manually Sent" : String(v)))
            };

            return NextResponse.json({ success: true, options });
        }

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
            if (filters.dateCreated.length >= 2) {
                const [startStr, endStr] = filters.dateCreated;
                const start = new Date(startStr);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endStr);
                end.setHours(23, 59, 59, 999);
                const dateExpr: any = {
                    $dateFromParts: {
                        year: { $toInt: "$dateYear" },
                        month: { $toInt: "$dateMonth" },
                        day: { $toInt: "$dateDay" }
                    }
                };
                inspectionMatch.$expr = { $and: [ { $gte: [dateExpr, start] }, { $lte: [dateExpr, end] } ] };
            } else {
                const dates = filters.dateCreated.map((d: string) => new Date(d));
                inspectionMatch.$or = dates.map((dt: Date) => {
                    const day = dt.getUTCDate();
                    const month = dt.getUTCMonth() + 1;
                    const year = dt.getUTCFullYear();
                    const dayMatch = day < 10 ? { $in: [day, `0${day}`] } : day;
                    const monthMatch = month < 10 ? { $in: [month, `0${month}`] } : month;
                    return { dateDay: dayMatch, dateMonth: monthMatch, dateYear: year };
                });
            }
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
            if (filters.reviewRequested.length >= 2) {
                const [startStr, endStr] = filters.reviewRequested;
                const start = new Date(startStr);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endStr);
                end.setHours(23, 59, 59, 999);
                if (query.$or) {
                    const prevOr = query.$or;
                    delete query.$or;
                    query.$and = [{ $or: prevOr }, { reviewRequestedAt: { $gte: start, $lte: end } }];
                } else if (query.$and) {
                    query.$and.push({ reviewRequestedAt: { $gte: start, $lte: end } });
                } else {
                    query.reviewRequestedAt = { $gte: start, $lte: end };
                }
            } else {
                const orConds = filters.reviewRequested.map((d: string) => {
                    const start = new Date(d);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(d);
                    end.setHours(23, 59, 59, 999);
                    return { reviewRequestedAt: { $gte: start, $lte: end } };
                });
                if (query.$and) {
                    query.$and.push({ $or: orConds });
                } else if (query.$or) {
                    const prevOr = query.$or;
                    delete query.$or;
                    query.$and = [{ $or: prevOr }, { $or: orConds }];
                } else {
                    query.$or = orConds;
                }
            }
        }


        // --------------------------------------------------
        // REVIEW COMPLETED DATE (Review)
        // --------------------------------------------------
        if (filters.reviewCompleted?.length > 0) {
            if (filters.reviewCompleted.length >= 2) {
                const [startStr, endStr] = filters.reviewCompleted;
                const start = new Date(startStr);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endStr);
                end.setHours(23, 59, 59, 999);
                if (query.$or) {
                    const prevOr = query.$or;
                    delete query.$or;
                    query.$and = [{ $or: prevOr }, { reviewCompletedAt: { $gte: start, $lte: end } }];
                } else if (query.$and) {
                    query.$and.push({ reviewCompletedAt: { $gte: start, $lte: end } });
                } else {
                    query.reviewCompletedAt = { $gte: start, $lte: end };
                }
            } else {
                const orConds = filters.reviewCompleted.map((d: string) => {
                    const start = new Date(d);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(d);
                    end.setHours(23, 59, 59, 999);
                    return { reviewCompletedAt: { $gte: start, $lte: end } };
                });
                if (query.$and) {
                    query.$and.push({ $or: orConds });
                } else if (query.$or) {
                    const prevOr = query.$or;
                    delete query.$or;
                    query.$and = [{ $or: prevOr }, { $or: orConds }];
                } else {
                    query.$or = orConds;
                }
            }
        }

        // --------------------------------------------------
        // QUERY REVIEWS
        // --------------------------------------------------
        const total = await Review.countDocuments(query);
        ;

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
        ;
        return NextResponse.json(
            { success: false, message: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
