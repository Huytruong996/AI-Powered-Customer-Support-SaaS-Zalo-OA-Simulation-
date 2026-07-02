const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_VERSION = "v1";

export async function Fetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_URL}/api/${API_VERSION}${endpoint}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    throw new Error("Request failed");
  }

  return response.json();
}

export const apiFetch = {
  get: <T>( endpoint: string,
  options?: RequestInit) => Fetch<T>(endpoint, { method: "GET", ...options }),
  post: <T>( endpoint: string,
  options?: RequestInit) => Fetch<T>(endpoint, { method: "POST", ...options }),
  put: <T>( endpoint: string,
  options?: RequestInit) => Fetch<T>(endpoint, { method: "PUT", ...options }),
  patch: <T>( endpoint: string,
  options?: RequestInit) => Fetch<T>(endpoint, { method: "PATCH", ...options }),
  delete: <T>( endpoint: string,
  options?: RequestInit) => Fetch<T>(endpoint, { method: "DELETE", ...options }),
}