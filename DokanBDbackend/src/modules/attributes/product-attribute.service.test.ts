import { describe, expect, it } from "vitest";

import { attributeSkuUsageMessage } from "./product-attribute.service.js";

describe("product attribute SKU protection", () => {
  it("explains why a used attribute cannot be deleted", () => {
    expect(attributeSkuUsageMessage("attribute", "Color", {
      count: 4,
      examples: ["SHIRT-BLK-M", "SHIRT-BLK-L", "SHIRT-RED-M"],
    })).toBe(
      "Cannot delete the “Color” attribute because 4 SKUs use it (SHIRT-BLK-M, SHIRT-BLK-L, SHIRT-RED-M, …). Reassign or delete the affected SKU variants first.",
    );
  });

  it("uses clear singular wording for one affected SKU value", () => {
    expect(attributeSkuUsageMessage("value", "Black", {
      count: 1,
      examples: ["SHIRT-BLK-M"],
    })).toBe(
      "Cannot delete the “Black” value because 1 SKU uses it (SHIRT-BLK-M). Reassign or delete the affected SKU variants first.",
    );
  });
});
