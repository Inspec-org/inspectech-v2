import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/signin",
  "/signup",
  "/forget-password",
  "/reset-password",
  "/accept-invitation",
  "/two-factor-setup",
]);

function getBaseUrl(origin: string): string {
  return process.env.APP_URL || origin;
}
export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  const baseUrl = getBaseUrl(origin);
  const sessionId = req.cookies.get("session_id")?.value;
  const hasRefresh = !!req.cookies.get("refreshToken")?.value;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/mobile-api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/signin") {
    if (sessionId) {
      try {
        const userRes = await fetch(new URL("/api/auth/fetch_user", baseUrl), {
          headers: {
            Authorization: "Bearer " + sessionId,
            cookie: req.headers.get("cookie") || "",
          },
        });
        if (userRes.ok) {
          const { user } = await userRes.json();
          const role = user?.role || "user";
          const url = req.nextUrl.clone();
          url.pathname = (role === "superadmin" || role === "owner") ? "/superadmin" : `/${role}/departments`;
          return NextResponse.redirect(url);
        }
      } catch {}
    }
    if (hasRefresh) {
      try {
        const refreshRes = await fetch(new URL("/api/auth/refresh", baseUrl), {
          headers: { cookie: req.headers.get("cookie") || "" },
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data?.success && data?.accessToken) {
            try {
              const roleRes = await fetch(new URL("/api/auth/fetch_user", baseUrl), {
                headers: { Authorization: "Bearer " + data.accessToken },
              });
              if (roleRes.ok) {
                const { user } = await roleRes.json();
                const role = user?.role || "user";
                const res = NextResponse.redirect((role === "superadmin" || role === "owner") ? new URL("/superadmin", baseUrl) : new URL(`/${role}/departments`, baseUrl));
                res.cookies.set("session_id", data.accessToken, {
                  path: "/",
                  sameSite: "lax",
                });
                return res;
              }
            } catch {}
          }
        }
      } catch {}
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    // Try session_id first
    if (sessionId) {
      try {
        const userRes = await fetch(new URL("/api/auth/fetch_user", baseUrl), {
          headers: {
            Authorization: "Bearer " + sessionId,
            cookie: req.headers.get("cookie") || "",
          },
        });
        if (userRes.ok) {
          const { user } = await userRes.json();
          const role = user?.role || "vendor";
          const url = req.nextUrl.clone();
          url.pathname = (role === "superadmin" || role === "owner") ? "/superadmin" : `/${role}/departments`;
          return NextResponse.redirect(url);
        }
      } catch {
        // Internal fetch failed (e.g. bad origin on GCP) — fall through to refresh or signin
      }
    }

    // Try refresh token
    if (hasRefresh) {
      try {
        const refreshRes = await fetch(new URL("/api/auth/refresh", baseUrl), {
          headers: { cookie: req.headers.get("cookie") || "" },
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data?.success && data?.accessToken) {
            try {
              const roleRes = await fetch(
                new URL("/api/auth/fetch_user", baseUrl),
                {
                  headers: { Authorization: "Bearer " + data.accessToken },
                }
              );
              if (roleRes.ok) {
                const { user } = await roleRes.json();
                const role = user?.role || "vendor";
                const res = NextResponse.redirect(
                  new URL(`/${role}/dashboard`, baseUrl)
                );
                res.cookies.set("session_id", data.accessToken, {
                  path: "/",
                  sameSite: "lax",
                });
                return res;
              }
            } catch {
              // fetch_user failed — fall through to signin
            }
          }
        }
      } catch {
        // refresh fetch failed — fall through to signin
      }
    }

    // Not authenticated — redirect to signin
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

  try {
    const refreshRes = await fetch(new URL("/api/auth/refresh", baseUrl), {
      headers: { cookie: req.headers.get("cookie") || "" },
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data?.success && data?.accessToken) {
        const res = NextResponse.next();
        res.cookies.set("session_id", data.accessToken, {
          path: "/",
          sameSite: "lax",
        });
        return res;
      }
    }
  } catch {
    // refresh fetch failed — redirect to signin
  }

  const url = req.nextUrl.clone();
  url.pathname = "/signin";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/(.*)" ] };
