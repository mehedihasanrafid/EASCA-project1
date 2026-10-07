let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export class ApiException extends Error {
  constructor(public statusCode: number, public error: ApiError) {
    super(error.message);
    this.name = "ApiException";
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "/api/v1";

export const apiClient = async <T>(path: string, init?: RequestInit, isRetry = false): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: { code: "PARSE_ERROR", message: "Failed to parse response" },
  }));

  if (response.ok && data.success) {
    return data.data as T;
  }

  if (response.status === 401 && !isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    if (!refreshPromise) {
      refreshPromise = apiClient<{ accessToken: string }>(
        "/auth/refresh",
        { method: "POST" },
        true,
      )
        .then(({ accessToken: refreshedToken }) => {
          setAccessToken(refreshedToken);
          return refreshedToken;
        })
        .catch(() => {
          setAccessToken(null);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("auth:session-expired"));
          }
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;

    if (newToken) {
      return apiClient<T>(path, init, true);
    }
  }

  throw new ApiException(response.status, data.error || { code: "UNKNOWN", message: data.message || "An unknown error occurred" });
};
