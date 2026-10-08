import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { authApi } from "./auth";

describe("authApi email actions", () => {
  beforeEach(() => apiClient.mockReset());

  it("submits an email-verification token", async () => {
    apiClient.mockResolvedValue(undefined);
    await authApi.verifyEmail("a".repeat(64));
    expect(apiClient).toHaveBeenCalledWith("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token: "a".repeat(64) }),
    });
  });

  it("requests a password-reset email", async () => {
    apiClient.mockResolvedValue(undefined);
    await authApi.forgotPassword("customer@example.com");
    expect(apiClient).toHaveBeenCalledWith("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "customer@example.com" }),
    });
  });

  it("submits a new password with its reset token", async () => {
    apiClient.mockResolvedValue(undefined);
    await authApi.resetPassword("b".repeat(64), "new-password");
    expect(apiClient).toHaveBeenCalledWith("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: "b".repeat(64), password: "new-password" }),
    });
  });
});
