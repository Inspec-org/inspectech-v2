// /Users/mlb/Desktop/InspecTech/src/app/api/uploads/cloudinary/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string) || "inspections";
    const unitId = (form.get("unitId") as string) || "";
    const field = (form.get("field") as string) || "";
    if (!file) return NextResponse.json({ message: "file is required" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ message: "Cloudinary env vars missing" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: uploadForm,
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ message: json.error?.message || "Upload failed" }, { status: res.status });

    await connectDB();

    if (!unitId || !field) {
      return NextResponse.json({ secure_url: json.secure_url, public_id: json.public_id }, { status: 200 });
    }

    const updateOp = { $set: { [field]: json.secure_url } };

    const updated = await (Inspection as any).findOneAndUpdate(
      { unitId },
      updateOp,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "Inspection not found", secure_url: json.secure_url, public_id: json.public_id }, { status: 404 });
    }

    return NextResponse.json({ secure_url: json.secure_url, public_id: json.public_id, inspection: updated }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Internal Server Error" }, { status: 500 });
  }
}