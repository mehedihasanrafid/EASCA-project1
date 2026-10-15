
import { describe, expect, it } from "vitest";
import { buildQueryParams } from "./queryParams";

describe("buildQueryParams", () => {
  it("builds search and pagination", () => {
    expect(buildQueryParams({ search: "phone", page: 2 }))
      .toBe("search=phone&page=2");
  });

  it("ignores missing or empty values", () => {
    expect(buildQueryParams({
      search: "",
      category: undefined,
      brand: null,
      page: 1,
    })).toBe("page=1");
  });

  it("preserves zero and false", () => {
    expect(buildQueryParams({ minPrice: 0, inStock: false }))
      .toBe("minPrice=0&inStock=false");
  });

  it("encodes special characters", () => {
    expect(buildQueryParams({ search: "red & blue" }))
      .toBe("search=red+%26+blue");
  });
});
