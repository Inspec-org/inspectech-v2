import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies(); // ✅ await required
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken)
    return Response.json({ success: false, message: "No refresh token" }, { status: 401 });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || "") as JwtPayload & { userId?: string; id?: string };

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return Response.json({ success: false, message: "Malformed refresh token" }, { status: 401 });
    }

    const newAccessToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || "",
      { expiresIn: "1d" }
    );

    return Response.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    return Response.json({ success: false, message: "Invalid or expired refresh token" }, { status: 401 });
  }
}
