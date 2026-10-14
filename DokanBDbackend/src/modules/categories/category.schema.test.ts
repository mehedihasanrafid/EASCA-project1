import { describe, expect, it } from "vitest";

import {
  createCategorySchema,
  setCategoryProductTypesSchema,
  updateCategorySchema,
} from "./category.schema.js";

describe("category management validation", () => {
  it("accepts product assignment, homepage visibility, and display order", () => {
    expect(
      createCategorySchema.parse({
        name: "Home appliances",
        allowProducts: false,
        showOnHomepage: true,
        sortOrder: "4",
      }),
    ).toMatchObject({
      name: "Home appliances",
      allowProducts: false,
      showOnHomepage: true,
      sortOrder: 4,
    });
  });

  it("rejects an empty update", () => {
    expect(() => updateCategorySchema.parse({})).toThrow();
  });

  it("accepts an empty grouping-category assignment and rejects duplicates", () => {
    expect(
      setCategoryProductTypesSchema.parse({ productTypeIds: ["2", "5"] }),
    ).toEqual({ productTypeIds: ["2", "5"] });
    expect(setCategoryProductTypesSchema.parse({ productTypeIds: [] })).toEqual({
      productTypeIds: [],
    });
    expect(() =>
      setCategoryProductTypesSchema.parse({ productTypeIds: ["2", "2"] }),
    ).toThrow();
  });
});
