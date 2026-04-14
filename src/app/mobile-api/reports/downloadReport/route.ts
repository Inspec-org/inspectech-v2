// src/app/mobile-api/reports/downloadReport/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";
import PDFDocument from "pdfkit";
import * as admin from "firebase-admin";
import crypto from "crypto";

// ─── Firebase ────────────────────────────────────────────────────────────────

const ensureBucket = () => {
    const storageBucketEnv =
        process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY ||
        !storageBucketEnv
    ) {
        return { bucket: null as any, error: "Firebase env vars missing" };
    }
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
            storageBucket: storageBucketEnv,
        });
    }
    return { bucket: admin.storage().bucket(storageBucketEnv), error: null as any };
};

const rand = (n: number) => crypto.randomBytes(n).toString("hex");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pdfToBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });
}

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function cleanFloat(val: number): number {
    return Math.round(val * 1e9) / 1e9;
}

function tickLabel(val: number): string {
    const v = cleanFloat(val);
    return v % 1 === 0 ? String(v) : v.toFixed(2);
}

const C = {
    green:    "#10b981",
    blue:     "#3b82f6",
    orange:   "#f97316",
    red:      "#ef4444",
    yellow:   "#fbbf24",
    failRed:  "#FF0000",
    gridLine: "#e5e7eb",
    axisLine: "#d1d5db",
    text:     "#111827",
    subtext:  "#6b7280",
    tickText: "#374151",
};

// ─── Single chart-drawing function ───────────────────────────────────────────
function drawChart(
    doc: InstanceType<typeof PDFDocument>,
    groups: { label: string; bars: { value: number; color: string }[] }[],
    opts: {
        yAxisLabel?: string;
        legend?: { label: string; color: string }[];
        chartH?: number;
        stacked?: boolean;
    } = {}
) {
    const MARGIN_L  = doc.page.margins.left;   // 40 pts
    const MARGIN_R  = doc.page.margins.right;  // 40 pts
    const PAGE_W    = doc.page.width;
    const CHART_H   = opts.chartH ?? 110;
    const Y_LBL_W   = 18;
    const Y_TICK_W  = 36;
    const X_LBL_H   = 40;   // height below x-axis for angled labels
    const LEGEND_H  = opts.legend?.length ? 18 : 0;
    const TOP_PAD   = 4;

    const plotX = MARGIN_L + Y_LBL_W + Y_TICK_W;
    const plotW = PAGE_W - MARGIN_R - plotX;
    const plotY = doc.y + TOP_PAD;
    const plotH = CHART_H;

    // ── max value ─────────────────────────────────────────────────────────────
    let maxVal = 0;
    if (opts.stacked) {
        groups.forEach(g => {
            const t = g.bars.reduce((s, b) => s + b.value, 0);
            if (t > maxVal) maxVal = t;
        });
    } else {
        groups.forEach(g => g.bars.forEach(b => { if (b.value > maxVal) maxVal = b.value; }));
    }
    if (maxVal === 0) maxVal = 1;

    const TICK_N    = 5;
    const rawStep   = maxVal / TICK_N;
    const mag       = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const niceStep  = Math.ceil(rawStep / mag) * mag;
    const niceMax   = niceStep * TICK_N;

    // ── gridlines + y-tick labels ─────────────────────────────────────────────
    for (let t = 0; t <= TICK_N; t++) {
        const val  = cleanFloat(niceStep * t);
        const yPos = plotY + plotH - (val / niceMax) * plotH;

        doc.moveTo(plotX, yPos)
           .lineTo(plotX + plotW, yPos)
           .strokeColor(C.gridLine).lineWidth(0.4).stroke();

        doc.font("Helvetica").fontSize(7).fillColor(C.tickText)
           .text(tickLabel(val), MARGIN_L + Y_LBL_W, yPos - 4,
                 { width: Y_TICK_W - 3, align: "right", lineBreak: false });
    }

    // ── rotated y-axis label ──────────────────────────────────────────────────
    if (opts.yAxisLabel) {
        const cx = MARGIN_L + 8;
        const cy = plotY + plotH / 2;
        doc.save();
        doc.rotate(-90, { origin: [cx, cy] });
        doc.font("Helvetica").fontSize(8).fillColor(C.subtext)
           .text(opts.yAxisLabel, cx - 40, cy - 4,
                 { width: 80, align: "center", lineBreak: false });
        doc.restore();
    }

    // ── axes ──────────────────────────────────────────────────────────────────
    doc.moveTo(plotX, plotY + plotH)
       .lineTo(plotX + plotW, plotY + plotH)
       .strokeColor(C.axisLine).lineWidth(0.7).stroke();
    doc.moveTo(plotX, plotY)
       .lineTo(plotX, plotY + plotH)
       .strokeColor(C.axisLine).lineWidth(0.7).stroke();

    // ── bars ──────────────────────────────────────────────────────────────────
    const GROUP_PAD = 0.30;
    const BAR_GAP   = 2;
    const slotW     = plotW / Math.max(groups.length, 1);

    groups.forEach((group, gi) => {
        const innerW = slotW * (1 - GROUP_PAD * 2);
        const innerX = plotX + gi * slotW + slotW * GROUP_PAD;

        if (opts.stacked) {
            let bottom = plotY + plotH;
            group.bars.forEach(bar => {
                if (bar.value <= 0) return;
                const bh = (bar.value / niceMax) * plotH;
                bottom -= bh;
                const [r, g, b] = hexToRgb(bar.color);
                doc.rect(innerX, bottom, innerW, bh).fill([r, g, b]);
            });
        } else {
            const n    = group.bars.length;
            const barW = n > 1 ? (innerW - BAR_GAP * (n - 1)) / n : innerW;
            group.bars.forEach((bar, bi) => {
                if (bar.value <= 0) return;
                const bx = innerX + bi * (barW + BAR_GAP);
                const bh = (bar.value / niceMax) * plotH;
                const by = plotY + plotH - bh;
                const [r, g, b] = hexToRgb(bar.color);
                doc.rect(bx, by, barW, bh).fill([r, g, b]);
            });
        }

        // X-axis label: the rotation pivot is placed at the slot centre,
        // 14 pts below the axis line. The text is drawn starting half its
        // width to the LEFT of the pivot so it rotates centred under the tick.
        // After -45° rotation the text sweeps diagonally down-right, sitting
        // fully below the axis with no overlap on the bars.
        const lbl      = group.label.length > 15 ? group.label.slice(0, 14) + "…" : group.label;
        doc.font("Helvetica").fontSize(8);
        const lblW     = doc.widthOfString(lbl);
        const pivotX   = plotX + gi * slotW + slotW / 2;
        const pivotY   = plotY + plotH + 14; // 14 pts clear of the axis line
        doc.save();
        doc.rotate(-45, { origin: [pivotX, pivotY] });
        doc.fillColor(C.tickText)
           .text(lbl, pivotX - lblW / 2, pivotY, { lineBreak: false });
        doc.restore();
    });

    // ── legend ────────────────────────────────────────────────────────────────
    if (opts.legend && opts.legend.length > 0) {
        const legendY  = plotY + plotH + X_LBL_H;
        const SW       = 10;
        const SW_GAP   = 4;
        const ITEM_GAP = 14;

        doc.font("Helvetica").fontSize(8);
        const totalW = opts.legend.reduce((acc, item, i) => {
            return acc + SW + SW_GAP + doc.widthOfString(item.label) +
                   (i < opts.legend!.length - 1 ? ITEM_GAP : 0);
        }, 0);

        let lx = plotX + (plotW - totalW) / 2;

        opts.legend.forEach(item => {
            const [r, g, b] = hexToRgb(item.color);
            doc.rect(lx, legendY + 1, SW, SW).fill([r, g, b]);
            doc.font("Helvetica").fontSize(8).fillColor(C.text)
               .text(item.label, lx + SW + SW_GAP, legendY + 1, { lineBreak: false });
            lx += SW + SW_GAP + doc.widthOfString(item.label) + ITEM_GAP;
        });

        doc.y = legendY + LEGEND_H;
    } else {
        doc.y = plotY + plotH + X_LBL_H;
    }

    // FIX: reset x back to left margin so the next sectionTitle() call
    // starts at the left edge, not wherever the last text() call left the cursor.
    doc.x = MARGIN_L;

    doc.moveDown(0.2);
}

// ─── Estimate height needed for a section (title + chart + legend + gap) ──────
function estimateSectionHeight(hasLegend: boolean, chartH = 110): number {
    const TITLE_H   = 18;
    const X_LBL_H   = 40;
    const LEGEND_H  = hasLegend ? 18 : 0;
    const GAP       = 18;  // moveDown(0.6) approx
    return TITLE_H + chartH + X_LBL_H + LEGEND_H + GAP;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token      = authHeader?.split(" ")[1];
        const user       = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json(
                { status: 401, success: false, message: "Unauthorized", data: null },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { unitIds, vendorId }: { unitIds?: string[]; vendorId?: string } = body;

        await connectDB();

        let vendorIds: Types.ObjectId[] = (user.vendorAccess || []).map(
            (id: any) => (id instanceof Types.ObjectId ? id : new Types.ObjectId(id))
        );
        if (user.role === "superadmin") {
            if (vendorId && Types.ObjectId.isValid(vendorId)) {
                vendorIds = [new Types.ObjectId(vendorId)];
            } else if (Array.isArray(unitIds) && unitIds.length > 0) {
                vendorIds = [];
            }
        }

        const query: any = {};
        if (vendorIds.length > 0) query.vendorId = { $in: vendorIds };
        if (Array.isArray(unitIds) && unitIds.length > 0) query.unitId = { $in: unitIds };

        // ── Aggregations ──────────────────────────────────────────────────────
        const vendorInspectionCounts = await Inspection.aggregate([
            { $match: query },
            { $group: { _id: "$vendorId", count: { $sum: 1 } } },
            { $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" } },
            { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
            { $project: { vendorId: "$_id", vendorName: "$vendor.name", count: 1, _id: 0 } },
            { $sort: { count: -1 } },
        ]);

        const vendorReviewIssueAnalytics = await Review.aggregate([
            { $match: query },
            { $group: { _id: { vendorId: "$vendorId", missingData: "$missingData" }, count: { $sum: 1 } } },
            {
                $group: {
                    _id: "$_id.vendorId",
                    totalIssues: { $sum: "$count" },
                    issues: { $push: { missingData: "$_id.missingData", count: "$count" } },
                },
            },
            { $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" } },
            { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
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
                                    $round: [{ $multiply: [{ $divide: ["$$issue.count", "$totalIssues"] }, 100] }, 2],
                                },
                            },
                        },
                    },
                    _id: 0,
                },
            },
            { $sort: { totalIssues: -1 } },
        ]);

        const vendorInspectionStatusCounts = await Inspection.aggregate([
            { $match: query },
            { $group: { _id: { vendorId: "$vendorId", status: "$inspectionStatus" }, count: { $sum: 1 } } },
            {
                $group: {
                    _id: "$_id.vendorId",
                    totalInspections: { $sum: "$count" },
                    statuses: { $push: { status: "$_id.status", count: "$count" } },
                },
            },
            { $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" } },
            { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    statusCounts: {
                        $arrayToObject: {
                            $map: { input: "$statuses", as: "s", in: { k: "$$s.status", v: "$$s.count" } },
                        },
                    },
                },
            },
            {
                $project: {
                    vendorId: "$_id",
                    vendorName: "$vendor.name",
                    totalInspections: 1,
                    statusCounts: 1,
                    _id: 0,
                },
            },
            { $sort: { totalInspections: -1 } },
        ]);

        // ── Build PDF ─────────────────────────────────────────────────────────
        const doc           = new PDFDocument({ margin: 40, size: "A4" });
        const bufferPromise = pdfToBuffer(doc);

        const MARGIN_T      = doc.page.margins.top;    // 40 pts
        const PAGE_H        = doc.page.height;         // 841.89 pts (A4)
        const USABLE_H      = PAGE_H - MARGIN_T - doc.page.margins.bottom;

        const norm   = (s: string) => (s || "").trim().toLowerCase();
        const getPct = (breakdown: any[], key: string) =>
            Number((breakdown || []).find((b: any) => norm(b.missingData) === norm(key))?.percentage || 0);

        // FIX: always reset x to left margin before writing a title so it
        // never inherits a drifted cursor from the previous drawChart call.
        const sectionTitle = (t: string) => {
            doc.x = doc.page.margins.left;
            doc.font("Helvetica-Bold").fontSize(11).fillColor(C.text).text(t);
            doc.moveDown(0.3);
        };

        // FIX: ensure there is enough vertical room for the coming section;
        // if not, start a fresh page so the title and chart stay together.
        const ensureSpace = (neededH: number) => {
            const remaining = PAGE_H - doc.page.margins.bottom - doc.y;
            if (remaining < neededH) {
                doc.addPage();
            }
        };

        // ── 1A ───────────────────────────────────────────────────────────────
        // 1A is always the first thing on page 1 — no space check needed.
        sectionTitle("Report 1A: Total Inspections by Vendor");

        if (!vendorInspectionCounts.length) {
            doc.font("Helvetica").fontSize(9).fillColor(C.subtext).text("No inspection data available.");
        } else {
            drawChart(
                doc,
                vendorInspectionCounts.map((v: any) => ({
                    label: (v.vendorName || String(v.vendorId)).toString(),
                    bars:  [{ value: Number(v.count || 0), color: C.green }],
                })),
                { yAxisLabel: "Total Count" }
            );
        }

        doc.moveDown(1.8);

        // ── 1B ───────────────────────────────────────────────────────────────
        ensureSpace(estimateSectionHeight(true));
        sectionTitle("Report 1B: Percentage of Issues by Vendor");

        if (!vendorReviewIssueAnalytics.length) {
            doc.font("Helvetica").fontSize(9).fillColor(C.subtext).text("No issue data available.");
        } else {
            drawChart(
                doc,
                vendorReviewIssueAnalytics.map((v: any) => ({
                    label: (v.vendorName || String(v.vendorId)).toString(),
                    bars: [
                        { value: getPct(v.breakdown, "incomplete image file"), color: C.blue },
                        { value: getPct(v.breakdown, "incomplete dot form"),   color: C.orange },
                        { value: getPct(v.breakdown, "incomplete checklist"),  color: C.red },
                    ],
                })),
                {
                    yAxisLabel: "Percentage (%)",
                    legend: [
                        { label: "Incomplete Checklist",  color: C.red },
                        { label: "Incomplete DOT Form",   color: C.orange },
                        { label: "Incomplete Image File", color: C.blue },
                    ],
                }
            );
        }

        doc.moveDown(1.8);

        // ── 1C ───────────────────────────────────────────────────────────────
        ensureSpace(estimateSectionHeight(true));
        sectionTitle("Report 1C: Current Inspection Status Breakdown by Vendor");

        if (!vendorInspectionStatusCounts.length) {
            doc.font("Helvetica").fontSize(9).fillColor(C.subtext).text("No status data available.");
        } else {
            drawChart(
                doc,
                vendorInspectionStatusCounts.map((v: any) => ({
                    label: (v.vendorName || String(v.vendorId)).toString(),
                    bars: [
                        { value: Number(v.statusCounts?.pass             || 0), color: C.green },
                        { value: Number(v.statusCounts?.fail             || 0), color: C.failRed },
                        { value: Number(v.statusCounts?.incomplete       || 0), color: C.yellow },
                        { value: Number(v.statusCounts?.["needs review"] || 0), color: C.orange },
                        { value: Number(v.statusCounts?.complete         || 0), color: C.blue },
                    ],
                })),
                {
                    yAxisLabel: "Count",
                    stacked: true,
                    legend: [
                        { label: "COMPLETE",     color: C.blue },
                        { label: "FAIL",         color: C.failRed },
                        { label: "INCOMPLETE",   color: C.yellow },
                        { label: "NEEDS REVIEW", color: C.orange },
                        { label: "PASS",         color: C.green },
                    ],
                }
            );
        }

        doc.end();
        const pdfBuffer = await bufferPromise;

        // ── Upload to Firebase ────────────────────────────────────────────────
        const { bucket, error: bucketErr } = ensureBucket();
        if (!bucket) {
            return NextResponse.json(
                { status: 500, success: false, message: bucketErr || "Storage not configured", data: null },
                { status: 500 }
            );
        }

        const dateStr     = new Date().toISOString().slice(0, 10);
        const filename    = `vendor-performance-report-${dateStr}.pdf`;
        const objectPath  = `tmp/exports/reports/${dateStr}/${rand(8)}_${filename}`;
        const expiresAtMs = Date.now() + 60 * 60 * 1000;
        const expiresAt   = new Date(expiresAtMs).toISOString();

        const file = bucket.file(objectPath);
        await file.save(pdfBuffer, {
            contentType: "application/pdf",
            metadata: {
                metadata: { temporary: "true", expiresAt },
                cacheControl: "private, max-age=3600",
                contentDisposition: `attachment; filename="${filename}"`,
            },
        });

        const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires: expiresAtMs,
            version: "v4",
        });

        return NextResponse.json(
            { status: 200, success: true, message: "Report generated", data: { url: signedUrl, expiresAt } },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { status: 500, success: false, message: error?.message || "Internal Server Error", data: null },
            { status: 500 }
        );
    }
}