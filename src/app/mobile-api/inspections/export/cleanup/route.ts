import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const ensureBucket = () => {
  const storageBucketEnv = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !storageBucketEnv) {
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

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-cron-secret") || req.headers.get("cron-secret");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ status: 401, success: false, message: "Unauthorized", data: null }, { status: 401 });
    }
    const { bucket, error } = ensureBucket();
    if (!bucket) {
      return NextResponse.json({ status: 500, success: false, message: error || "Storage not configured", data: null }, { status: 500 });
    }
    const [files] = await bucket.getFiles({ prefix: "tmp/exports/inspections/" });
    const now = Date.now();
    let deleted = 0;
    for (const f of files) {
      try {
        await f.getMetadata();
        const md = (f.metadata as any) || {};
        const userMeta = (md.metadata || {}) as Record<string, string>;
        const expiresAtStr = userMeta.expiresAt;
        if (expiresAtStr) {
          const expiresAt = Date.parse(expiresAtStr);
          if (!Number.isNaN(expiresAt) && expiresAt <= now) {
            await f.delete({ ignoreNotFound: true } as any);
            deleted++;
          }
        }
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json({ status: 200, success: true, message: "Cleanup completed", data: { deleted } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { status: 500, success: false, message: e?.message || "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}
