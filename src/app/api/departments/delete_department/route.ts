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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1] || "";
    const actor = await getUserFromToken(token);
    if (!actor || actor.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const departmentId = String(body?.departmentId || "");
    if (!departmentId || !Types.ObjectId.isValid(departmentId)) {
      return NextResponse.json({ error: "Valid departmentId is required" }, { status: 400 });
    }

    await connectDB();

    const exists = await Department.findById(departmentId);
    if (!exists) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const { bucket, warning } = await getBucket();

    const inspections = await Inspection.find({ departmentId })
      .select("unitId frontLeftSideUrl frontRightSideUrl rearLeftSideUrl rearRightSideUrl insideTrailerImageUrl doorDetailsImageUrl dotFormImageUrl dotFormPdfUrl additionalAttachment1 additionalAttachment2 additionalAttachment3")
      .lean();

    let fileDeletes = 0;
    let deleteErrors = 0;

    if (bucket) {
      const unitIds = [...new Set(inspections.map((ins: any) => String(ins.unitId)).filter(Boolean))];
      for (const uid of unitIds) {
        try {
          const [files] = await bucket.getFiles({ prefix: `inspections/${uid}/` });
          if (files && files.length) {
            const results = await Promise.allSettled(files.map(f => f.delete()));
            for (const r of results) {
              if (r.status === "fulfilled") fileDeletes++;
              else deleteErrors++;
            }
          }
        } catch {
          deleteErrors++;
        }
      }
    }

    const inspectionsDeleted = await Inspection.deleteMany({ departmentId });
    const reviewsDeleted = await Review.deleteMany({ departmentId });

    const userPull = await User.updateMany(
      { departmentAccess: departmentId },
      { $pull: { departmentAccess: departmentId } }
    );

    const vendorPull = await Vendor.updateMany(
      { departmentAccess: departmentId },
      { $pull: { departmentAccess: departmentId } }
    );

    const deptDeleted = await Department.deleteOne({ _id: departmentId });

    return NextResponse.json({
      status: "success",
      counts: {
        inspectionsDeleted: inspectionsDeleted.deletedCount || 0,
        reviewsDeleted: reviewsDeleted.deletedCount || 0,
        filesDeleted: fileDeletes,
        fileDeleteErrors: deleteErrors,
        usersUpdated: userPull.modifiedCount || 0,
        vendorsUpdated: vendorPull.modifiedCount || 0,
        departmentsDeleted: deptDeleted.deletedCount || 0,
      },
      warning,
    }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE DEPARTMENT ERROR:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}