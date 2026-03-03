import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies(); // ✅ must await

  const allCookies = cookieStore.getAll();

  allCookies.forEach((cookie) => {
    cookieStore.delete(cookie.name);
  });

  return Response.json({ success: true, message: "All cookies cleared" });
}