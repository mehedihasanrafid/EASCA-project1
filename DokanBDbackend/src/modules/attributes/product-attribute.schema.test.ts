import { describe, expect, it } from "vitest";

import {
  createProductAttributeSchema,
  createProductAttributeValueSchema,
  setProductAttributesSchema,
  setProductTypeAttributesSchema,
} from "./product-attribute.schema.js";

describe("product attribute schemas", () => {
  it("accepts reusable color properties and hex values", () => {
    expect(createProductAttributeSchema.parse({ name: "Color", inputType: "COLOR" })).toMatchObject({ name: "Color", inputType: "COLOR" });
    expect(createProductAttributeSchema.parse({ name: "Size", values: ["S", "M", "L"] })).toMatchObject({
      name: "Size",
      inputType: "SELECT",
      values: ["S", "M", "L"],
    });
    expect(createProductAttributeValueSchema.parse({ label: "Ocean blue", colorHex: "#0066CC" })).toMatchObject({ label: "Ocean blue", colorHex: "#0066CC" });
  });

  it("rejects duplicate values when creating an attribute", () => {
    expect(() => createProductAttributeSchema.parse({ name: "Size", values: ["XL", "xl"] })).toThrow();
  });

  it("rejects duplicate product-type assignments", () => {
    expect(() => setProductTypeAttributesSchema.parse({ attributes: [
      { attributeId: "1" }, { attributeId: "1" },
    ] })).toThrow();
  });

  it("accepts product-specific parent relationships", () => {
    expect(setProductAttributesSchema.parse({ attributes: [
      { attributeId: "1", parentAttributeId: null, sortOrder: 0 },
      { attributeId: "2", parentAttributeId: "1", sortOrder: 1 },
    ] })).toMatchObject({ attributes: [
      { attributeId: "1", parentAttributeId: null },
      { attributeId: "2", parentAttributeId: "1" },
    ] });
  });

  it("rejects a missing or self parent", () => {
    expect(() => setProductAttributesSchema.parse({ attributes: [
      { attributeId: "2", parentAttributeId: "1" },
    ] })).toThrow();
    expect(() => setProductAttributesSchema.parse({ attributes: [
      { attributeId: "2", parentAttributeId: "2" },
    ] })).toThrow();
  });
});
