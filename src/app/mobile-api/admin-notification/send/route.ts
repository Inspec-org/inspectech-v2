import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import { connectDB } from "@/lib/db/db";
import Inspection from "@/lib/models/Inspections";
import Review from "@/lib/models/Reviews";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    // ================= AUTH =================
    const token = req.headers.get("Authorization")?.split(" ")[1];
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({
        status: 401,
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });
    }

    const body = await req.json();

    const {
      recipients,
      unitIds,
      vendorName,
      vendorId,
      departmentId
    } = body;

    // ================= VALIDATION =================
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "recipients must be a non-empty array",
        data: null
      }, { status: 400 });
    }

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "unitIds must be a non-empty array",
        data: null
      }, { status: 400 });
    }

    if (!vendorId || !departmentId) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: "vendorId and departmentId required",
        data: null
      }, { status: 400 });
    }

    await connectDB();

    const safeVendor = vendorName || "N/A";
    const count = unitIds.length;

    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    // ================= EMAIL HTML =================
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
        <div class="header"><h1 class="title">Admin Notification</h1><p class="subtitle">InspecTech Inspection Management System</p></div>
        <div class="section">
         <div class="box"><p class="heading">Notification Details</p><div class="detail-row"><span class="label">Vendor:</span> ${safeVendor}</div> <div class="detail-row"><span class="label">Date:</span> ${dateStr}</div></div>
          <div style="height:12px"></div>
          <div class="box">
            <div><span class="heading">Unit IDs (${count} item${count > 1 ? "s" : ""})</span></div>
            <div style="height:8px"></div>
            <div class="list">Please see attached CSV file:<ul class="bullet"><li>Unit ID list</li></ul></div>
          </div>
          <div style="height:16px"></div>
          <p class="muted">This is a manual admin notification regarding the listed Unit IDs.</p>
          <p style="margin-top:10px;">Thank you,<br/><strong>The InspecTech Team</strong></p>
        </div>
        <div class="footer">This is an automated message from the InspecTech inspection management system.</div>
      </div></body></html>
    `;

    // ================= CSV =================
    const csv = "unitId\n" + unitIds.join("\n");
    const attachments = [
      {
        filename: "unit_ids.csv",
        content: csv,
        contentType: "text/csv"
      }
    ];

    // ================= BULK UPDATE REVIEWS =================
    const reviewUpdateResult = await Review.updateMany(
      {
        unitId: { $in: unitIds },
        vendorId,
        departmentId
      },
      {
        $set: { emailNotification: "manually sent" }
      }
    );

    // ================= BULK UPDATE INSPECTIONS =================
    const inspectionUpdateResult = await Inspection.updateMany(
      {
        unitId: { $in: unitIds },
        vendorId,
        departmentId
      },
      {
        $set: { emailNotification: "manually sent" }
      }
    );

    // ================= SEND EMAIL =================
    await sendEmail(recipients, "Admin Notification", emailHtml, attachments);

    // ================= RESPONSE =================
    return NextResponse.json({
      status: 200,
      success: true,
      message: "Email sent successfully",
      data: {
        sentTo: recipients,
        unitCount: unitIds.length,
        vendorId,
        departmentId,
        reviewUpdated: {
          matched: reviewUpdateResult.matchedCount,
          modified: reviewUpdateResult.modifiedCount
        },
        inspectionUpdated: {
          matched: inspectionUpdateResult.matchedCount,
          modified: inspectionUpdateResult.modifiedCount
        }
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