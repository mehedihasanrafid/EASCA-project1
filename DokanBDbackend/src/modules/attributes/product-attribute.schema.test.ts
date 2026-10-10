import { describe, expect, it } from "vitest";

import {
  createProductAttributeSchema,
  createProductAttributeValueSchema,
  setProductTypeAttributesSchema,
} from "./product-attribute.schema.js";

describe("product attribute schemas", () => {
  it("accepts reusable color properties and hex values", () => {
    expect(createProductAttributeSchema.parse({ name: "Color", inputType: "COLOR" })).toMatchObject({ name: "Color", inputType: "COLOR" });
    expect(createProductAttributeValueSchema.parse({ label: "Ocean blue", colorHex: "#0066CC" })).toMatchObject({ label: "Ocean blue", colorHex: "#0066CC" });
  });

  it("rejects duplicate product-type assignments", () => {
    expect(() => setProductTypeAttributesSchema.parse({ attributes: [
      { attributeId: "1" }, { attributeId: "1" },
    ] })).toThrow();
  });
});
