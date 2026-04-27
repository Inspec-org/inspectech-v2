import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

const IMAGE_FIELDS = [
    { key: "frontLeftSideUrl",      label: "Front Left Side",  cvLabel: "front_left",  cvGroup: "front" },
    { key: "frontRightSideUrl",     label: "Front Right Side", cvLabel: "front_right", cvGroup: "front" },
    { key: "rearLeftSideUrl",       label: "Rear Left Side",   cvLabel: "rear_left",   cvGroup: "rear"  },
    { key: "rearRightSideUrl",      label: "Rear Right Side",  cvLabel: "rear_right",  cvGroup: "rear"  },
    { key: "insideTrailerImageUrl", label: "Inside Trailer",   cvLabel: "inside",      cvGroup: "inside"},
    { key: "doorDetailsImageUrl",   label: "Door Details",     cvLabel: "door",        cvGroup: "door"  },
];

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];
        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json(
                { status: 401, success: false, message: "Unauthorized", data: null },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const unitId = searchParams.get("unitId") || "";
        if (!unitId) {
            return NextResponse.json(
                { status: 400, success: false, message: "unitId is required", data: null },
                { status: 400 }
            );
        }

        await connectDB();

        const inspection: any = await Inspection.findOne({ unitId }).lean();
        if (!inspection) {
            return NextResponse.json(
                { status: 404, success: false, message: "Inspection not found", data: null },
                { status: 404 }
            );
        }

        // Build image list for CV API
        const imageStatuses = IMAGE_FIELDS.map((f) => {
            const url = inspection[f.key];
            const hasUrl = url && String(url).trim().length > 0;
            return {
                label: f.label,
                cvLabel: f.cvLabel,
                url: hasUrl ? String(url).trim() : null,
                missing: !hasUrl,
            };
        });

        const missingImages = imageStatuses.filter((i) => i.missing).map((i) => i.label);
        const presentImages = imageStatuses
            .filter((i) => !i.missing)
            .map((i) => ({ label: i.cvLabel, image_url: i.url as string }));

        // Call CV API and return its raw result
        let cvReport: any = null;
        console.log("presentImages", presentImages);
        if (presentImages.length > 0) {
            try {
                const cvRes = await fetch("https://inspectechnectarsix-inspectech-ai.hf.space/inspect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: presentImages }),
                });
                if (cvRes.ok) {
                    const cvJson = await cvRes.json();
                    if (cvJson.status === "success") {
                        cvReport = cvJson;
                    }
                }
            } catch {
                // CV API failure is non-fatal
            }
        }

        const mediaStatus: "pass" | "fail" =
            !cvReport || missingImages.length > 0 ? "fail" : "pass";

        console.log(JSON.stringify(cvReport, null, 2));

        return NextResponse.json(
            {
                status: 200,
                success: true,
                message: "Media inspection processed",
                data: {
                    mediaStatus,
                    missingImages,
                    cvReport: cvReport ?? null,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                status: 500,
                success: false,
                message: error?.message || "Internal Server Error",
                data: null,
            },
            { status: 500 }
        );
    }
}