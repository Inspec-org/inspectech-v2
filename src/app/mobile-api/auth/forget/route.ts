import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // 1️⃣ Validate email
        if (!email) {
            return NextResponse.json({
                status: 400,
                success: false,
                message: "Email is required",
                data: null
            }, { status: 400 });
        }

        await connectDB();

        // 2️⃣ Find user
        const user = await User.findOne({ email, isDeleted: false });

        if (!user) {
            return NextResponse.json({
                status: 401,
                success: false,
                message: "User not found",
                data: null
            }, { status: 401 });
        }

        // 3️⃣ Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000);

        // 4️⃣ Send Email
        await sendEmail(
            user.email,
            "Reset Your Password - Verification Code Inside",
            getResetPasswordEmailTemplate(otp, user.name)
        );

        // 5️⃣ Save OTP
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        return NextResponse.json({
            status: 200,
            success: true,
            message: "Email Sent Successfully",
            data: null
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            status: 500,
            success: false,
            message: error.message || "Server error",
            data: null
        }, { status: 500 });
    }
}

export const getResetPasswordEmailTemplate = (otp: number, userName?: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 0; text-align: center;">
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e8e8e8;">
                            <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${userName ? `<p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">Hi ${userName},</p>` : ''}
                            
                            <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                                We received a request to reset your password. Use the verification code below to proceed:
                            </p>
                            
                            <!-- OTP Box -->
                            <table role="presentation" style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 40px; border-radius: 8px;">
                                            <span style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                                This code will expire in <strong>1 hour</strong>.
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; border-radius: 4px;">
                                <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                                    <strong>Security tip:</strong> Never share this code with anyone. Our team will never ask for your verification code.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e8e8e8; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; text-align: center;">
                                Thanks,<br>
                                <strong>Your App Team</strong>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Bottom Footer -->
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 20px auto 0;">
                    <tr>
                        <td style="text-align: center; padding: 0 20px;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                © ${new Date().getFullYear()} Your Company. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};