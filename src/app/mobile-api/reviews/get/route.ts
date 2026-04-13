import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Review from "@/lib/models/Reviews";
import Vendor from "@/lib/models/Vendor";
import Department from "@/lib/models/Departments";
import "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";
import mongoose from "mongoose";

const normalize = (arr: string[] = []) =>
    arr.map(v => String(v).toLowerCase());

const buildDateRange = (dates: string[]) => {
    if (!dates?.length) return null;

    if (dates.length >= 2) {
        const start = new Date(dates[0]);
        const end = new Date(dates[1]);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { $gte: start, $lte: end };
    }

    return {
        $or: dates.map(d => {
            const start = new Date(d);
            const end = new Date(d);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            return { $gte: start, $lte: end };
        })
    };
};

export async function POST(req: NextRequest) {
    try {
        // ================= AUTH =================
        const token = req.headers.get("Authorization")?.split(" ")[1];
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "Unauthorized",
                data: null
            }, { status: 401 });
        }

        await connectDB();

        const body = await req.json();

        const {
            page = 1,
            limit = 10,
            department,
            vendorId,
            filters = {},
            optionsOnly = false,
            fetchAllIds = false
        } = body;



        const query: any = {};

        // ================= BASE FILTERS =================
        if (department) {
            query.departmentId = new mongoose.Types.ObjectId(department);
        }

        if (vendorId) {
            query.vendorId = new mongoose.Types.ObjectId(vendorId);
        }

        // ================= APPLY ALL FILTERS FIRST =================

        if (filters.unitId?.length) {
            query.unitId = { $in: filters.unitId };
        }

        if (filters.department?.length) {
            const deptDocs = await Department.find({
                name: { $in: filters.department }
            }).select("_id");

            query.departmentId = {
                $in: deptDocs.map(d => new mongoose.Types.ObjectId(d._id))
            };
        }

        if (filters.missingData?.length) {
            query.missingData = { $in: normalize(filters.missingData) };
        }

        if (filters.email_notification?.length) {
            query.emailNotification = { $in: normalize(filters.email_notification) };
        }

        if (filters.reviewRequested?.length) {
            query.reviewRequestedAt = buildDateRange(filters.reviewRequested);
        }

        if (filters.reviewCompleted?.length) {
            query.reviewCompletedAt = buildDateRange(filters.reviewCompleted);
        }
        if (fetchAllIds) {
            const allReviews = await Review.find(query)
                .select("unitId vendorId departmentId")
                .lean();
            return NextResponse.json({
                status: 200,
                success: true,
                message: "",
                data: {
                    total: allReviews.length,
                    allReviews: allReviews.map(r => ({
                        id: r.unitId,
                        vendorId: String(r.vendorId),
                        departmentId: String(r.departmentId)
                    }))
                }
            });
        }
        // ================= INSPECTION FILTER =================
        let inspectionIds: any[] = [];

        if (filters.inspectionStatus?.length || filters.dateCreated?.length) {
            const { default: Inspection } = await import("@/lib/models/Inspections");

            const inspectionMatch: any = {};

            if (filters.inspectionStatus?.length) {
                inspectionMatch.inspectionStatus = {
                    $in: normalize(filters.inspectionStatus)
                };
            }

            if (filters.dateCreated?.length) {
                const [start, end] = filters.dateCreated;

                if (end) {
                    inspectionMatch.$expr = {
                        $and: [
                            {
                                $gte: [
                                    {
                                        $dateFromParts: {
                                            year: { $toInt: "$dateYear" },
                                            month: { $toInt: "$dateMonth" },
                                            day: { $toInt: "$dateDay" }
                                        }
                                    },
                                    new Date(start)
                                ]
                            },
                            {
                                $lte: [
                                    {
                                        $dateFromParts: {
                                            year: { $toInt: "$dateYear" },
                                            month: { $toInt: "$dateMonth" },
                                            day: { $toInt: "$dateDay" }
                                        }
                                    },
                                    new Date(end)
                                ]
                            }
                        ]
                    };
                }
            }

            const inspections = await Inspection.find(inspectionMatch)
                .select("_id")
                .lean();

            inspectionIds = inspections.map(i => i._id);

            if (!inspectionIds.length && !optionsOnly) {
                return NextResponse.json({
                    status: 200,
                    success: true,
                    message: "No reviews found",
                    data: {
                        reviews: [],
                        total: 0,
                        page,
                        limit
                    }
                }, { status: 200 });
            }

            query.inspectionId = { $in: inspectionIds };
        }

        // ================= OPTIONS ONLY =================
        if (optionsOnly) {
            const { default: Inspection } = await import("@/lib/models/Inspections");

            const inspectionIds = await Review.distinct("inspectionId", query);

            const inspectionMatch = inspectionIds.length
                ? { _id: { $in: inspectionIds } }
                : { _id: null };

            const [reviewData, inspectionData] = await Promise.all([
                Review.aggregate([
                    { $match: query },
                    {
                        $group: {
                            _id: null,
                            unitId: { $addToSet: "$unitId" },
                            missingData: { $addToSet: "$missingData" },
                            emailNotification: { $addToSet: "$emailNotification" },
                            reviewRequested: { $addToSet: "$reviewRequestedAt" },
                            reviewCompleted: { $addToSet: "$reviewCompletedAt" }
                        }
                    }
                ]),
                Inspection.aggregate([
                    { $match: inspectionMatch },
                    {
                        $group: {
                            _id: null,
                            inspectionStatus: { $addToSet: "$inspectionStatus" },
                            dateCreated: {
                                $addToSet: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $gt: [{ $toInt: "$dateYear" }, 2000] },
                                                { $lte: [{ $toInt: "$dateMonth" }, 12] },
                                                { $lte: [{ $toInt: "$dateDay" }, 31] }
                                            ]
                                        },
                                        {
                                            $dateToString: {
                                                format: "%Y-%m-%d",
                                                date: {
                                                    $dateFromParts: {
                                                        year: { $toInt: "$dateYear" },
                                                        month: { $toInt: "$dateMonth" },
                                                        day: { $toInt: "$dateDay" }
                                                    }
                                                }
                                            }
                                        },
                                        null
                                    ]
                                }
                            }
                        }
                    }
                ])
            ]);

            const options = {
                unitId: reviewData?.[0]?.unitId || [],
                missingData: reviewData?.[0]?.missingData || [],
                emailNotification: reviewData?.[0]?.emailNotification || [],
                reviewRequested: (reviewData?.[0]?.reviewRequested || [])
                    .filter(Boolean)
                    .map((d: any) => new Date(d).toISOString().slice(0, 10)),
                reviewCompleted: (reviewData?.[0]?.reviewCompleted || [])
                    .filter(Boolean)
                    .map((d: any) => new Date(d).toISOString().slice(0, 10)),
                inspectionStatus: inspectionData?.[0]?.inspectionStatus || [],
                dateCreated: (inspectionData?.[0]?.dateCreated || []).filter(Boolean)
            };

            return NextResponse.json({
                status: 200,
                success: true,
                message: "Options fetched successfully",
                data: options
            }, { status: 200 });
        }

        // ================= MAIN QUERY =================
        const [total, reviewsRaw] = await Promise.all([
            Review.countDocuments(query),
            Review.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("inspectionId", "inspectionStatus dateDay dateMonth dateYear")
                .lean()
        ]);

        if (!reviewsRaw.length) {
            return NextResponse.json({
                status: 200,
                success: true,
                message: "No reviews found",
                data: {
                    reviews: [],
                    total,
                    page,
                    limit
                }
            }, { status: 200 });
        }

        // ================= MAP NAMES =================
        const vendorIds = [...new Set(reviewsRaw.map(r => String(r.vendorId)))];
        const deptIds = [...new Set(reviewsRaw.map(r => String(r.departmentId)))];

        const [vendors, depts] = await Promise.all([
            Vendor.find({ _id: { $in: vendorIds } }).select("name").lean(),
            Department.find({ _id: { $in: deptIds } }).select("name").lean()
        ]);

        const vendorMap = Object.fromEntries(
            vendors.map(v => [String(v._id), v.name])
        );
        const deptMap = Object.fromEntries(
            depts.map(d => [String(d._id), d.name])
        );

        const reviews = reviewsRaw.map(r => ({
            ...r,
            vendorName: vendorMap[String(r.vendorId)] || "",
            departmentName: deptMap[String(r.departmentId)] || ""
        }));

        return NextResponse.json({
            status: 200,
            success: true,
            message: "Reviews fetched successfully",
            data: {
                reviews,
                total,
                page,
                limit
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            status: 500,
            success: false,
            message: error?.message || "Internal Server Error",
            data: null
        }, { status: 500 });
    }
}