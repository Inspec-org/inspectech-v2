import Cookies from "js-cookie";
const API_KEY = "v10gv2f4vdfhbtymhsdfvweuyv678gv8erh";

export function buildRequestBody(data: object) {
  return {
    api_key: API_KEY,
    data,
  };
}

// utils/apiRequest.ts
export async function apiRequest(url: string, options: RequestInit = {}) {
  const stored = Cookies.get("session_id");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(stored ? { Authorization: `Bearer ${stored}` } : {}),
    },
  });

  if (res.status !== 401) return res;

  const refreshRes = await fetch("/api/auth/refresh", { credentials: "include" });
  const refreshData = await refreshRes.json();

  if (refreshRes.ok && refreshData.success && refreshData.accessToken) {
    Cookies.set("session_id", refreshData.accessToken);

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${refreshData.accessToken}`,
      },
    });
  }

  Cookies.remove("session_id");
  if (typeof window !== "undefined") window.location.href = "/signin";
  return res;
}
