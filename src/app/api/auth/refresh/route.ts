import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies(); // ✅ await required
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken)
    return Response.json({ success: false, message: "No refresh token" }, { status: 401 });

  try {
    // tell TypeScript this is JwtPayload with userId
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || "") as JwtPayload & { userId: string };

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET || "",
      { expiresIn: "1d" }
    );

    return Response.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    return Response.json({ success: false, message: "Invalid or expired refresh token" }, { status: 401 });
  }
}
