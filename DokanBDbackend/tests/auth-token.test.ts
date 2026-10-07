import { describe, expect, it } from "vitest";

import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "../src/utils/opaque-token.js";

describe("opaque authentication tokens", () => {
  it("generates a 64-character hexadecimal token", () => {
    expect(generateOpaqueToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates a different token each time", () => {
    expect(generateOpaqueToken()).not.toBe(generateOpaqueToken());
  });

  it("hashes the same token consistently without storing the raw token", () => {
    const rawToken = "a".repeat(64);
    const firstHash = hashOpaqueToken(rawToken);

    expect(firstHash).toBe(hashOpaqueToken(rawToken));
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstHash).not.toBe(rawToken);
  });
});
