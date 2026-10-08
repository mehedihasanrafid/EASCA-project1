import { describe, expect, it } from "vitest";

import { createBrandSchema, updateBrandSchema } from "./brand.schema.js";

describe("brand management validation", () => {
  it("accepts a valid brand and trims its values", () => {
    expect(
      createBrandSchema.parse({
        name: "  North Star  ",
        slug: "north-star",
        isActive: true,
      }),
    ).toMatchObject({ name: "North Star", slug: "north-star", isActive: true });
  });

  it("rejects invalid slugs and empty updates", () => {
    expect(() => createBrandSchema.parse({ name: "Brand", slug: "Bad Slug" })).toThrow();
    expect(() => updateBrandSchema.parse({})).toThrow();
  });
});
