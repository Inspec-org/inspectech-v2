import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import Department from "@/lib/models/Departments";

export async function POST(req: NextRequest) {
  try {
    const { recipients, unitIds, vendorName, vendorId, departmentId } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        {
          status: 400,
          success: false,
          message: "recipients must be a non-empty array",
          data: null,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json(
        {
          status: 400,
          success: false,
          message: "unitIds must be a non-empty array",
          data: null,
        },
        { status: 400 }
      );
    }

    if (!vendorId || !departmentId) {
      return NextResponse.json(
        {
          status: 400,
          success: false,
          message: "vendorId and departmentId required",
          data: null,
        },
        { status: 400 }
      );
    }

    const safeVendor = vendorName || "N/A";
    const count = unitIds.length;
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

     const emailHtml = `
      <!DOCTYPE html><html><head><meta charSet="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background:#f6f7fb; margin:0; padding:0; color:#1f2937; }
        .container { max-width: 640px; margin: 24px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08); border:1px solid #e5e7eb;}
        .header { background:#10b981; color:#fff; padding:28px 32px; text-align:center; }
        .title { font-size:22px; font-weight:700; margin:0 0 6px; }
        .subtitle { font-size:13px; opacity:0.95; margin:0; }
        .section { padding:24px 32px; }
        .box { background:#ecfdf5; border:1px solid #34d399; border-radius:10px; padding:12px; margin-top:10px; }
        .muted { font-size:12px; color:#6b7280; }
        .footer { padding:32px 32px; background:#f9fafb; font-size:12px; color:#6b7280; text-align:center; }
        .pill { display:inline-block; background:#ecfeff; color:#0ea5e9; border:1px solid #bae6fd; padding:8px 12px; border-radius:10px; font-size:13px; }
        .list { background:#ffffff; border:1px dashed #a7f3d0; border-radius:8px; padding:14px; font-size:14px;}
        .bullet { margin: 0; padding-left: 18px; }
        .heading { font-weight: 600; color: #047857; font-size: 18px; margin: 0 0 24px 0;}
        .label { font-size: 14px; font-weight: 600;}
        .detail-row { margin-bottom: 16px;}
      </style>
      </head><body><div class="container">
        <div class="header"><h1 class="title">Admin Review Request</h1><p class="subtitle">InspecTech Inspection Management System</p></div>
        <div class="section">
         <div class="box"><p class="heading">Request Details</p><div class="detail-row"><span class="label">Vendor:</span> ${safeVendor}</div> <div class="detail-row"><span class="label">Date:</span> ${dateStr}</div></div>
          <div style="height:12px"></div>
          <div class="box">
            <div><span class="heading">Unit IDs for Review (${count} item${count > 1 ? "s" : ""})</span></div>
            <div style="height:8px"></div>
            <div class="list">Please see attached CSV file:<ul class="bullet"><li>Unit ID list</li></ul></div>
          </div>
          <div style="height:16px"></div>
          <p class="muted">A vendor has submitted the above Unit IDs for admin review. This submission includes detailed analysis results with inspection status classifications.</p>
          <p style="margin-top:10px;">Thank you,<br/><strong>The InspecTech Team</strong></p>
        </div>
        <div class="footer">This is an automated message from the InspecTech inspection management system.</div>
      </div></body></html>
    `;

    await connectDB();

    const dept: any = await Department.findById(departmentId).select("name").lean();
    const isCanadaTrailers = String(((dept as any)?.name) || "").toLowerCase() === "canada trailers";

    const requiredA = [
      "poNumber",
      "equipmentNumber",
      "vin",
      "licensePlateId",
      "licensePlateCountry",
      "licensePlateExpiration",
      "licensePlateState",
      "possessionOrigin",
    ];
    const requiredB = [
      "manufacturer",
      "modelYear",
      "length",
      "height",
      "grossAxleWeightRating",
      "axleType",
      "brakeType",
      "suspensionType",
      "tireModel",
      "tireBrand",
      "leftFrontOuter",
      "leftFrontInner",
      "leftRearOuter",
      "leftRearInner",
      "rightFrontOuter",
      "rightFrontInner",
      "rightRearOuter",
      "rightRearInner",
      "aerokits",
      "doorBranding",
      "doorColor",
      "doorSensor",
      "doorType",
      "lashSystem",
      "mudFlapType",
      "panelBranding",
      "noseBranding",
      "skirted",
      "skirtColor",
      "captiveBeam",
      "cargoCameras",
      "cartbars",
      "tpms",
      "trailerHeightDecal",
      "absSensor",
      "airTankMonitor",
      "atisregulator",
      "lightOutSensor",
      "sensorError",
      "ultrasonicCargoSensor",
    ];

    const getVal = (obj: any, key: string) => String(obj?.[key] || "").trim();

    const rows: string[] = [];
    for (const unitId of unitIds) {
      const doc: any = await Inspection.findOne({ unitId, vendorId, departmentId }).lean();
      if (doc) {
        const need = [...requiredA, ...requiredB].concat(isCanadaTrailers ? ["owner", "conspicuityTape"] : []);
        const missing = need.filter((k) => !getVal(doc, k));
        const checklistStatus = (missing.length ? "FAIL" : "PASS");
        const imgs = [
          (doc as any).frontLeftSideUrl,
          (doc as any).frontRightSideUrl,
          (doc as any).rearLeftSideUrl,
          (doc as any).rearRightSideUrl,
          (doc as any).insideTrailerImageUrl,
          (doc as any).doorDetailsImageUrl,
        ].map((v: any) => String(v || "").trim());
        const imageStatus = "";
        rows.push(`${unitId},${checklistStatus},${imageStatus}`);
      } else {
        rows.push(`${unitId},N/A,N/A`);
      }
    }

    const csv = `Unit ID,Inspection Checklist,Inspection Media Central\n${rows.join("\n")}`;
    const attachments = [{ filename: "inspection_details.csv", content: csv, contentType: "text/csv" }];

    for (const unitId of unitIds) {
      const insp = (await Inspection.findOne({
        unitId,
        vendorId,
        departmentId,
      })
        .select("_id")
        .lean()) as { _id: any } | null;

      await Review.findOneAndUpdate(
        { unitId, vendorId, departmentId },
        {
          $set: {
            emailNotification: "no",
            reviewCompletedAt: null,
          },
          $setOnInsert: {
            inspectionId: insp?._id || null,
            reviewRequestedAt: new Date(),
            missingData: "none",
          },
        },
        { upsert: true }
      );
    }

    await sendEmail(recipients, "Admin Review Request", emailHtml, attachments);

    return NextResponse.json(
      {
        status: 200,
        success: true,
        message: "Email sent successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error);

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
