import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import Invitation from "@/lib/models/Invitation";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/sendEmail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, role, vendorId, vendorName } = body;

        if (!email || !name || !role) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }
        console.log(email, name, role, vendorId, vendorName)

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        console.log("existingUser", existingUser)
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User already exists" },
                { status: 400 }
            );
        }

        // Check if invitation already exists
        let invitation = await Invitation.findOne({ email });
        const token = crypto.randomBytes(32).toString("hex");
        console.log("invitation", invitation)

        if (invitation) {
            // Update existing invitation
            invitation.token = token;
            invitation.name = name;
            invitation.role = role;
            invitation.vendorId = vendorId || undefined;
            invitation.vendorName = vendorName || undefined;
            invitation.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
            await invitation.save();
        } else {
            // Create new invitation
            invitation = await Invitation.create({
                email,
                name,
                role,
                vendorId: vendorId || undefined,
                vendorName: vendorName || undefined,
                token,
            });
        }

        // Send Email
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation?token=${token}`;
        
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: #6f42c1; color: #fff; padding: 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
                    .header h2 { margin: 10px 0 0; font-size: 20px; font-weight: normal; }
                    .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
                    .content { padding: 30px; }
                    .details-box { border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin-bottom: 25px; background-color: #fafafa; }
                    .details-title { font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #555; }
                    .detail-row { margin-bottom: 8px; }
                    .detail-label { font-weight: bold; color: #666; }
                    .detail-value { color: #333; }
                    .detail-value a { color: #6f42c1; text-decoration: none; }
                    .message-box { background-color: #e8f0fe; color: #1967d2; padding: 15px; border-radius: 6px; margin-bottom: 25px; font-size: 14px; border: 1px solid #d2e3fc; }
                    .btn-container { text-align: center; margin: 30px 0; }
                    .btn { display: inline-block; background-color: #8a5cf6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; }
                    .link-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 13px; color: white; border-left: 4px solid #8a5cf6; }
                    .link-box a { color: #6f42c1; }
                    .note-box { background-color: #e8f0fe; color: #1967d2; padding: 15px; border-radius: 6px; margin-top: 25px; font-size: 14px; border-left: 4px solid #1967d2; }
                    .footer { padding: 30px; text-align: center; font-size: 12px; color: #999; background-color: #f9f9f9; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>InspecTech</h1>
                        <h2>Complete Your Registration</h2>
                        <p>Advanced Inventory Monitoring & Analytics Suite</p>
                    </div>
                    <div class="content">
                        <div class="details-box">
                            <div class="details-title">Invitation Details</div>
                            <div class="detail-row"><span class="detail-label">Name:</span> <br> <span class="detail-value">${name}</span></div>
                            <div class="detail-row"><span class="detail-label">Vendor:</span> <br> <span class="detail-value">${vendorName || 'N/A'}</span></div>
                            <div class="detail-row"><span class="detail-label">Role:</span> <br> <span class="detail-value">${role.charAt(0).toUpperCase() + role.slice(1)}</span></div>
                            <div class="detail-row"><span class="detail-label">Email:</span> <br> <span class="detail-value"><a href="mailto:${email}">${email}</a></span></div>
                        </div>

                        <div class="message-box">
                            Please click the button below to complete your account setup. You'll use your email address and a password to sign in.
                        </div>

                        <div class="btn-container">
                            <a href="${inviteLink}" class="btn">➔ Accept Invitation</a>
                        </div>

                        <p>Or copy and paste this URL into your browser:</p>
                        <div class="link-box">
                            <a href="${inviteLink}">${inviteLink}</a>
                        </div>

                        <div class="note-box">
                            <strong>Note:</strong> This invitation will expire in 48 hours.
                        </div>

                        <p style="margin-top: 30px;">Thank you,<br><strong>The InspecTech Team</strong></p>
                    </div>
                    <div class="footer">
                        This is an automated message, please do not reply to this email.
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail(email, "Complete Your Registration - InspecTech", emailHtml);

        return NextResponse.json({
            success: true,
            message: "Invitation sent successfully"
        });

    } catch (error: any) {
        console.error("INVITE ERROR:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}