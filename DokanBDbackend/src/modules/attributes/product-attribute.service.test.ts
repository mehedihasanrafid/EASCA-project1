import { describe, expect, it } from "vitest";

import {
  attributeSkuUsageMessage,
  productTypeAttributeRemovalMessage,
  productTypeAttributeRequiredMessage,
} from "./product-attribute.service.js";

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

  it("explains why a used attribute cannot be removed from a Product Type", () => {
    expect(productTypeAttributeRemovalMessage("T-Shirt", "Color", {
      count: 2,
      examples: ["SHIRT-BLK-M", "SHIRT-RED-L"],
    })).toBe(
      "Cannot remove “Color” from T-Shirt because 2 existing SKUs use it (SHIRT-BLK-M, SHIRT-RED-L). Reassign or delete the affected SKU variants first.",
    );
  });

  it("explains why an attribute cannot become required while SKUs are missing it", () => {
    expect(productTypeAttributeRequiredMessage("T-Shirt", "Material", {
      count: 1,
      examples: ["SHIRT-BLK-M"],
    })).toBe(
      "Cannot require “Material” for T-Shirt because 1 existing SKU has no value (SHIRT-BLK-M). Add a value to every affected SKU first.",
    );
  });
});
