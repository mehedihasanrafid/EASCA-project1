import { describe, expect, it } from "vitest";

import { shouldShowHeaderSearch } from "./storefrontSearch";

describe("storefront sticky search", () => {
  it("shows immediately when the page has no large search", () => {
    expect(shouldShowHeaderSearch(null)).toBe(true);
  });

  it("takes over only when the large search reaches the header", () => {
    expect(shouldShowHeaderSearch(240)).toBe(false);
    expect(shouldShowHeaderSearch(80)).toBe(true);
    expect(shouldShowHeaderSearch(-20)).toBe(true);
  });
});
