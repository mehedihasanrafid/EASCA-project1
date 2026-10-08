import { describe, expect, it } from "vitest";
import { createProductTypeSchema, updateProductTypeSchema } from "./product-type.schema.js";

describe("product type validation", () => {
  it("accepts a valid type", () => expect(createProductTypeSchema.parse({ name: "Smart Phone", slug: "smart-phone" })).toMatchObject({ name: "Smart Phone", slug: "smart-phone" }));
  it("rejects invalid slugs and empty updates", () => {
    expect(() => createProductTypeSchema.parse({ name: "Phone", slug: "Bad Slug" })).toThrow();
    expect(() => updateProductTypeSchema.parse({})).toThrow();
  });
});
