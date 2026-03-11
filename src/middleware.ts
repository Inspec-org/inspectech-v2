import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/signin",
  "/signup",
  "/forget-password",
  "/reset-password",
  "/accept-invitation",
]);

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/mobile-api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const sessionId = req.cookies.get("session_id")?.value;
  const hasRefresh = !!req.cookies.get("refreshToken")?.value;

  if (pathname === "/") {
    if (sessionId) {
      const userRes = await fetch(new URL("/api/auth/fetch_user", origin), {
        headers: {
          Authorization: "Bearer " + sessionId,
          cookie: req.headers.get("cookie") || "",
        },
      });
      if (userRes.ok) {
        const { user } = await userRes.json();
        const role = user?.role || "vendor";
        const url = req.nextUrl.clone();
        url.pathname = `/${role}/dashboard`;
        return NextResponse.redirect(url);
      }
    }

    if (hasRefresh) {
      const refreshRes = await fetch(new URL("/api/auth/refresh", origin), {
        headers: { cookie: req.headers.get("cookie") || "" },
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data?.success && data?.accessToken) {
          const roleRes = await fetch(new URL("/api/auth/fetch_user", origin), {
            headers: { Authorization: "Bearer " + data.accessToken },
          });
          if (roleRes.ok) {
            const { user } = await roleRes.json();
            const role = user?.role || "vendor";
            const res = NextResponse.redirect(new URL(`/${role}/dashboard`, origin));
            res.cookies.set("session_id", data.accessToken, { path: "/", sameSite: "lax" });
            return res;
          }
        }
      }
    }

    const to = req.nextUrl.clone();
    to.pathname = "/signin";
    return NextResponse.redirect(to);
  }

  if (sessionId) return NextResponse.next();

  if (!hasRefresh) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  const refreshRes = await fetch(new URL("/api/auth/refresh", origin), {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  if (refreshRes.ok) {
    const data = await refreshRes.json();
    if (data?.success && data?.accessToken) {
      const res = NextResponse.next();
      res.cookies.set("session_id", data.accessToken, { path: "/", sameSite: "lax" });
      return res;
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/signin";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/(.*)"] };