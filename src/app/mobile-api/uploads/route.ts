// /Users/mlb/Desktop/InspecTech/src/app/api/uploads/cloudinary/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";
import * as admin from "firebase-admin";
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string) || "inspections";
    const unitId = (form.get("unitId") as string) || "";
    const field = (form.get("field") as string) || "";
    const originalFileName = form.get("originalFileName") as string || file?.name || "";

    if (!file) return NextResponse.json({ message: "file is required" }, { status: 400 });

    const storageBucketEnv = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !storageBucketEnv) {
      return NextResponse.json({ message: "Firebase env vars missing" }, { status: 500 });
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
    const bucket = admin.storage().bucket(storageBucketEnv);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cryptToken = crypto.randomUUID();
    const filename = `${folder}/${unitId ? `${unitId}/` : ""}${field ? `${field}-` : ""}${Date.now()}-${originalFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await bucket.file(filename).save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: { firebaseStorageDownloadTokens: token },
      },
      public: false,
    });
    const secure_url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${token}`;

    await connectDB();

    if (!unitId || !field) {
      return NextResponse.json({
        secure_url,
        public_id: filename,
        originalFileName
      }, { status: 200 });
    }

    // Store both URL and filename if it's a PDF
    const updateFields: any = { [field]: secure_url };
    if (field === 'dotFormPdfUrl' && originalFileName) {
      updateFields['dotFormPdfFileName'] = originalFileName;
    }

    const updated = await (Inspection as any).findOneAndUpdate(
      { unitId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({
        message: "Inspection not found",
        secure_url,
        public_id: filename,
        originalFileName
      }, { status: 404 });
    }

    return NextResponse.json({
      secure_url,
      public_id: filename,
      inspection: updated,
      originalFileName
    }, { status: 200 });
  } catch (e: any) {
    ;
    return NextResponse.json({ message: e.message || "Internal Server Error" }, { status: 500 });
  }
}