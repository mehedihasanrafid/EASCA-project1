import { describe, expect, it } from "vitest";

import { createCategorySchema, updateCategorySchema } from "./category.schema.js";

describe("category management validation", () => {
  it("accepts homepage visibility and display order", () => {
    expect(
      createCategorySchema.parse({
        name: "Home appliances",
        showOnHomepage: true,
        sortOrder: "4",
      }),
    ).toMatchObject({
      name: "Home appliances",
      showOnHomepage: true,
      sortOrder: 4,
    });
  });

  it("rejects an empty update", () => {
    expect(() => updateCategorySchema.parse({})).toThrow();
  });
});
