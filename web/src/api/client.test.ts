import { afterEach, describe, expect, it, vi } from "vitest";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("apiClient", () => {
  it("accepts successful responses without a JSON body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const { apiClient } = await import("./client");

    await expect(apiClient<void>("/admin/products/1/media/2", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("shares one refresh request and retries every concurrent unauthorized request", async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    let refreshCalls = 0;
    const protectedCalls = new Map<string, number>();

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        await refreshGate;
        return jsonResponse(200, {
          success: true,
          data: { accessToken: "refreshed-token" },
        });
      }

      const calls = (protectedCalls.get(url) ?? 0) + 1;
      protectedCalls.set(url, calls);

      if (calls === 1) {
        return jsonResponse(401, {
          success: false,
          error: { code: "TOKEN_EXPIRED", message: "Token expired." },
        });
      }

      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer refreshed-token");
      return jsonResponse(200, { success: true, data: { url } });
    });

    vi.stubGlobal("fetch", fetchMock);
    const { apiClient } = await import("./client");
    const requests = [apiClient<{ url: string }>("/first"), apiClient<{ url: string }>("/second")];

    await vi.waitFor(() => expect(refreshCalls).toBe(1));
    releaseRefresh?.();

    await expect(Promise.all(requests)).resolves.toEqual([
      { url: "/api/v1/first" },
      { url: "/api/v1/second" },
    ]);
    expect(refreshCalls).toBe(1);
  });
});
