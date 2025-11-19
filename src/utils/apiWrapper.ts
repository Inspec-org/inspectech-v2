const API_KEY = "v10gv2f4vdfhbtymhsdfvweuyv678gv8erh";

export function buildRequestBody(data: object) {
  return {
    api_key: API_KEY,
    data,
  };
}

// utils/apiRequest.ts
export async function apiRequest(url: string, options: RequestInit = {}) {
  let accessToken = localStorage.getItem("session_id");

  // Add Authorization header if token exists
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  // If token expired, try refreshing
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh");
    const refreshData = await refreshRes.json();

    if (refreshData.success) {
      localStorage.setItem("accessToken", refreshData.accessToken);

      // Retry original request with new access token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshData.accessToken}`,
        },
      });
    } else {
      // Refresh token invalid → logout
      localStorage.removeItem("accessToken");
      window.location.href = "/signin";
      return res;
    }
  }

  return res;
}
