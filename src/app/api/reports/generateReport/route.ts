// src/app/api/reports/get-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
    try {
        /* -------------------- AUTH -------------------- */
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "Unauthorized",
                data: null
            }, { status: 401 });
        }

        /* -------------------- BODY -------------------- */
        const body = await req.json();
        const { departmentId, unitIds, vendorId }: { departmentId?: string; unitIds?: string[]; vendorId?: string } = body;

        /* -------------------- DB -------------------- */
        await connectDB();

        /* -------------------- VENDOR ACCESS -------------------- */
        let vendorIds: Types.ObjectId[] = (user.vendorAccess || []).map(
            (id: any) => (id instanceof Types.ObjectId ? id : new Types.ObjectId(id))
        );

        if (user.role === 'superadmin') {
            if (vendorId && Types.ObjectId.isValid(vendorId)) {
                vendorIds = [new Types.ObjectId(vendorId)];
            } else if (Array.isArray(unitIds) && unitIds.length > 0) {
                vendorIds = [];
            }
        }

        if (vendorIds.length === 0 && !(user.role === 'superadmin' && Array.isArray(unitIds) && unitIds.length > 0)) {
            return NextResponse.json({
                status: 200,
                success: true,
                message: "No vendor access found for user",
                data: {
                    vendorInspectionCounts: [],
                    vendorReviewIssueAnalytics: [],
                    vendorInspectionStatusCounts: [],
                    totalVendors: 0
                }
            }, { status: 200 });
        }

        /* -------------------- BASE QUERY -------------------- */
        const query: any = {};
        if (vendorIds.length > 0) {
            query.vendorId = { $in: vendorIds };
        }

        if (departmentId) {
            if (!Types.ObjectId.isValid(departmentId)) {
                return NextResponse.json({
                    status: 400,
                    success: false,
                    message: "Invalid departmentId",
                    data: null
                }, { status: 400 });
            }
            query.departmentId = new Types.ObjectId(departmentId);
        }
        if (Array.isArray(unitIds) && unitIds.length > 0) {
            query.unitId = { $in: unitIds };
        }

        /* ======================================================
           1️⃣ EXISTING: INSPECTION COUNTS (UNCHANGED)
        ====================================================== */
        const vendorInspectionCounts = await Inspection.aggregate([
            { $match: query },

            {
                $group: {
                    _id: "$vendorId",
                    count: { $sum: 1 }
                }
            },

            {
                $lookup: {
                    from: "vendors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vendor"
                }
            },

            {
                $unwind: {
                    path: "$vendor",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    vendorId: "$_id",
                    vendorName: "$vendor.name",
                    count: 1,
                    _id: 0
                }
            },

            { $sort: { count: -1 } }
        ]);

        /* ======================================================
           2️⃣ NEW: REVIEW ISSUE ANALYTICS
        ====================================================== */
        const vendorReviewIssueAnalytics = await Review.aggregate([
            { $match: query },

            // count issues per vendor + missingData
            {
                $group: {
                    _id: {
                        vendorId: "$vendorId",
                        missingData: "$missingData"
                    },
                    count: { $sum: 1 }
                }
            },

            // total issues per vendor
            {
                $group: {
                    _id: "$_id.vendorId",
                    totalIssues: { $sum: "$count" },
                    issues: {
                        $push: {
                            missingData: "$_id.missingData",
                            count: "$count"
                        }
                    }
                }
            },

            // populate vendor
            {
                $lookup: {
                    from: "vendors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind: {
                    path: "$vendor",
                    preserveNullAndEmptyArrays: true
                }
            },

            // calculate percentages
            {
                $project: {
                    vendorId: "$_id",
                    vendorName: "$vendor.name",
                    totalIssues: 1,
                    breakdown: {
                        $map: {
                            input: "$issues",
                            as: "issue",
                            in: {
                                missingData: "$$issue.missingData",
                                count: "$$issue.count",
                                percentage: {
                                    $round: [
                                        {
                                            $multiply: [
                                                { $divide: ["$$issue.count", "$totalIssues"] },
                                                100
                                            ]
                                        },
                                        2
                                    ]
                                }
                            }
                        }
                    },
                    _id: 0
                }
            },

            { $sort: { totalIssues: -1 } }
        ]);

        /* ======================================================
       3️⃣ NEW: INSPECTION STATUS COUNTS PER VENDOR
    ====================================================== */
        const vendorInspectionStatusCounts = await Inspection.aggregate([
            { $match: query },

            // count per vendor + status
            {
                $group: {
                    _id: {
                        vendorId: "$vendorId",
                        status: "$inspectionStatus"
                    },
                    count: { $sum: 1 }
                }
            },

            // reshape per vendor
            {
                $group: {
                    _id: "$_id.vendorId",
                    totalInspections: { $sum: "$count" },
                    statuses: {
                        $push: {
                            status: "$_id.status",
                            count: "$count"
                        }
                    }
                }
            },

            // populate vendor
            {
                $lookup: {
                    from: "vendors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vendor"
                }
            },
            {
                $unwind: {
                    path: "$vendor",
                    preserveNullAndEmptyArrays: true
                }
            },

            // normalize statuses (ensure all exist)
            {
                $project: {
                    vendorId: "$_id",
                    vendorName: "$vendor.name",
                    totalInspections: 1,
                    statusCounts: {
                        complete: {
                            $let: {
                                vars: {
                                    item: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$statuses",
                                                    as: "s",
                                                    cond: { $eq: ["$$s.status", "complete"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: { $ifNull: ["$$item.count", 0] }
                            }
                        },
                        incomplete: {
                            $let: {
                                vars: {
                                    item: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$statuses",
                                                    as: "s",
                                                    cond: { $eq: ["$$s.status", "incomplete"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: { $ifNull: ["$$item.count", 0] }
                            }
                        },
                        "needs review": {
                            $let: {
                                vars: {
                                    item: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$statuses",
                                                    as: "s",
                                                    cond: { $eq: ["$$s.status", "needs review"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: { $ifNull: ["$$item.count", 0] }
                            }
                        },
                        pass: {
                            $let: {
                                vars: {
                                    item: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$statuses",
                                                    as: "s",
                                                    cond: { $eq: ["$$s.status", "pass"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: { $ifNull: ["$$item.count", 0] }
                            }
                        },
                        fail: {
                            $let: {
                                vars: {
                                    item: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$statuses",
                                                    as: "s",
                                                    cond: { $eq: ["$$s.status", "fail"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: { $ifNull: ["$$item.count", 0] }
                            }
                        }
                    },
                    _id: 0
                }
            },
            { $sort: { totalInspections: -1 } }
        ]);


        /* -------------------- RESPONSE -------------------- */
        return NextResponse.json({
            status: 200,
            success: true,
            message: "Report generated successfully",
            data: {
                vendorInspectionCounts,
                vendorReviewIssueAnalytics,
                vendorInspectionStatusCounts,
                totalVendors: vendorIds.length
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
