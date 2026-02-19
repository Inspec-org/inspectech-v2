import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Department from "@/lib/models/Departments";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import User from "@/lib/models/User";
import Vendor from "@/lib/models/Vendor";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { Types } from "mongoose";
import * as admin from "firebase-admin";

function extractStoragePathFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/o\/([^?]+)/);
    if (!match || !match[1]) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

async function getBucket() {
  const storageBucketEnv = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !storageBucketEnv) {
    return { bucket: null, warning: "Firebase env vars missing; skipping file deletion" };
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
  return { bucket: admin.storage().bucket(storageBucketEnv), warning: null };
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";

    const actor = await getUserFromToken(token);

    // 1️⃣ Check authorization
    if (!actor || actor.role !== "superadmin") {
      return NextResponse.json({
        status: 403,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 403 });
    }

    const body = await req.json();
    const departmentId = String(body?.departmentId || "").trim();

    // 2️⃣ Validate departmentId
    if (!departmentId || !Types.ObjectId.isValid(departmentId)) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "Valid departmentId is required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    const exists = await Department.findById(departmentId);
    if (!exists) {
      return NextResponse.json({
        status: 404,
        success: false,
        message: "Department not found",
        data: null
      }, { status: 404 });
    }

    // 3️⃣ Get storage bucket
    const { bucket, warning } = await getBucket();

    // 4️⃣ Get inspections
    const inspections = await Inspection.find({ departmentId })
      .select(
        "unitId frontLeftSideUrl frontRightSideUrl rearLeftSideUrl rearRightSideUrl insideTrailerImageUrl doorDetailsImageUrl dotFormImageUrl dotFormPdfUrl additionalAttachment1 additionalAttachment2 additionalAttachment3"
      )
      .lean();

    let fileDeletes = 0;
    let fileDeleteErrors = 0;

    // 5️⃣ Delete files from bucket
    if (bucket) {
      const unitIds = [...new Set(inspections.map((ins: any) => String(ins.unitId)).filter(Boolean))];
      for (const uid of unitIds) {
        try {
          const [files] = await bucket.getFiles({ prefix: `inspections/${uid}/` });
          if (files && files.length) {
            const results = await Promise.allSettled(files.map(f => f.delete()));
            for (const r of results) {
              if (r.status === "fulfilled") fileDeletes++;
              else fileDeleteErrors++;
            }
          }
        } catch {
          fileDeleteErrors++;
        }
      }
    }

    // 6️⃣ Delete inspections, reviews, and remove department references
    const inspectionsDeleted = await Inspection.deleteMany({ departmentId });
    const reviewsDeleted = await Review.deleteMany({ departmentId });

    const usersUpdated = await User.updateMany(
      { departmentAccess: departmentId },
      { $pull: { departmentAccess: departmentId } }
    );

    const vendorsUpdated = await Vendor.updateMany(
      { departmentAccess: departmentId },
      { $pull: { departmentAccess: departmentId } }
    );

    const departmentDeleted = await Department.deleteOne({ _id: departmentId });

    return NextResponse.json({
      status: 200,
      success: true,
      message: "Department deleted successfully",
      data: {
        counts: {
          inspectionsDeleted: inspectionsDeleted.deletedCount || 0,
          reviewsDeleted: reviewsDeleted.deletedCount || 0,
          filesDeleted: fileDeletes,
          fileDeleteErrors,
          usersUpdated: usersUpdated.modifiedCount || 0,
          vendorsUpdated: vendorsUpdated.modifiedCount || 0,
          departmentsDeleted: departmentDeleted.deletedCount || 0,
        },
        warning: warning || null
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