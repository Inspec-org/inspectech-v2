import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { getUserFromToken } from '@/lib/getUserFromToken';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];
        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const activeTab = formData.get('activeTab') as string;

        if (!file || !activeTab) {
            return NextResponse.json({ success: false, message: "Missing file or activeTab" }, { status: 400 });
        }

        // 1. Get user mask from segmentation API
        const segmentationEndpoint = 'https://segmentation-api-190213262176.europe-west1.run.app/segment/mask';
        const segmentationFormData = new FormData();
        segmentationFormData.append('file', file, file.name);
        segmentationFormData.append('model', 'birefnet');
        segmentationFormData.append('threshold', '0.5');

        const segmentationResp = await fetch(segmentationEndpoint, {
            method: 'POST',
            body: segmentationFormData
        });

        if (!segmentationResp.ok) {
            const errText = await segmentationResp.text().catch(() => '');
            return NextResponse.json({ success: false, message: "Segmentation failed", error: errText }, { status: 500 });
        }

        const userMaskBuffer = Buffer.from(await segmentationResp.arrayBuffer());

        // 2. Load reference mask
        const referenceMaskMap: Record<string, string> = {
            'Front Left Side': 'front_left_mask.png',
            'Front Right Side': 'front_right_mask.png',
            'Rare Left Side': 'rear_left_mask.png',
            'Rare Right Side': 'rear_right_mask.png',
            'Inside Trailer Image': 'inside_trailer_mask.png',
            'Door Details Image': 'door_details_mask.png',
        };

        const maskFileName = referenceMaskMap[activeTab];
        if (!maskFileName) {
            return NextResponse.json({ success: false, message: "Invalid activeTab" }, { status: 400 });
        }

        const maskPath = path.join(process.cwd(), 'public', 'images', 'reference_images', maskFileName);
        
        if (!fs.existsSync(maskPath)) {
            // If the mask file doesn't exist, we might need to fallback to generating it from the reference image
            // but for now let's assume it exists as it was in the directory listing.
            return NextResponse.json({ success: false, message: "Reference mask not found" }, { status: 500 });
        }

        const refMaskBuffer = fs.readFileSync(maskPath);

        // 3. Compare the two masks
        const size = 256;

        const [m1, m2] = await Promise.all([
            sharp(refMaskBuffer)
                .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
                .toColorspace('b-w')
                .raw()
                .toBuffer(),
            sharp(userMaskBuffer)
                .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
                .toColorspace('b-w')
                .raw()
                .toBuffer()
        ]);

        let intersection = 0;
        let union = 0;

        for (let i = 0; i < m1.length; i++) {
            const p1 = m1[i] > 128;
            const p2 = m2[i] > 128;

            if (p1 || p2) union++;
            if (p1 && p2) intersection++;
        }

        const iou = union > 0 ? intersection / union : 0;
        const alignmentScore = Math.round(iou * 100);

        return NextResponse.json({
            success: true,
            alignmentScore
        });

    } catch (error: any) {
        console.error("Error in compute-alignment API:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error.message
        }, { status: 500 });
    }
}
