import { describe, expect, it } from "vitest";

import {
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../src/modules/auth/auth.schema.js";

describe("authentication request validation", () => {
  it("normalizes a valid registration email", () => {
    const result = registerSchema.parse({
      name: "Test Customer",
      phone: "01700000001",
      email: "CUSTOMER@EXAMPLE.COM",
      password: "TestPass123",
    });

    expect(result.email).toBe("customer@example.com");
  });

  it("rejects an invalid Bangladesh phone number", () => {
    const result = registerSchema.safeParse({
      name: "Test Customer",
      phone: "12345",
      password: "TestPass123",
    });

    expect(result.success).toBe(false);
  });

  it("requires a 64-character email token", () => {
    expect(verifyEmailSchema.safeParse({ token: "short" }).success).toBe(false);
    expect(
      verifyEmailSchema.safeParse({ token: "a".repeat(64) }).success,
    ).toBe(true);
  });

  it("requires a strong-enough replacement password", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "a".repeat(64),
        password: "short",
      }).success,
    ).toBe(false);
  });
});
