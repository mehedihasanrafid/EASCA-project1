import { describe, expect, it } from "vitest";

import {
  createProductAttributeSchema,
  createProductAttributeValueSchema,
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
});
