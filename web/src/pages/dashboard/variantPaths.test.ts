import { describe, expect, it } from "vitest";

import type { ProductTypeAttributeAssignment } from "../../api/adminCatalog";
import {
  SKIP_OPTION_VALUE,
  analyzeVariantPathRemoval,
  buildVariantPathTree,
  changeVariantPathSelection,
  clearDeepestVariantPathChoice,
  selectedVariantPathIds,
} from "./variantPaths";

const assignments = [
  {
    attributeId: "color",
    isRequired: true,
    sortOrder: 0,
    attribute: {
      id: "color",
      name: "Color",
      code: "color",
      inputType: "COLOR",
      isActive: true,
      deletedAt: null,
      values: [
        { id: "black", attributeId: "color", label: "Black", code: "black", colorHex: "#000000", sortOrder: 0, isActive: true, deletedAt: null },
        { id: "green", attributeId: "color", label: "Green", code: "green", colorHex: "#008000", sortOrder: 1, isActive: true, deletedAt: null },
      ],
    },
  },
  {
    attributeId: "size",
    isRequired: true,
    sortOrder: 1,
    attribute: {
      id: "size",
      name: "Size",
      code: "size",
      inputType: "SELECT",
      isActive: true,
      deletedAt: null,
      values: [
        { id: "xl", attributeId: "size", label: "XL", code: "xl", colorHex: null, sortOrder: 0, isActive: true, deletedAt: null },
        { id: "m", attributeId: "size", label: "M", code: "m", colorHex: null, sortOrder: 1, isActive: true, deletedAt: null },
      ],
    },
  },
  {
    attributeId: "material",
    isRequired: false,
    sortOrder: 2,
    attribute: {
      id: "material",
      name: "Material",
      code: "material",
      inputType: "SELECT",
      isActive: true,
      deletedAt: null,
      values: [
        { id: "cotton", attributeId: "material", label: "Cotton", code: "cotton", colorHex: null, sortOrder: 0, isActive: true, deletedAt: null },
      ],
    },
  },
] satisfies ProductTypeAttributeAssignment[];

describe("product-specific variant paths", () => {
  it("clears child choices when a parent changes", () => {
    expect(changeVariantPathSelection(
      assignments,
      { color: "black", size: "xl", material: "cotton" },
      "color",
      "green",
    )).toEqual({ color: "green" });
  });

  it("keeps only real option values and supports an explicit optional skip", () => {
    expect(selectedVariantPathIds(assignments, {
      color: "green",
      size: "m",
      material: SKIP_OPTION_VALUE,
    })).toEqual(["green", "m"]);
  });

  it("keeps the parent prefix ready for a sibling leaf", () => {
    expect(clearDeepestVariantPathChoice(assignments, {
      color: "black",
      size: "xl",
      material: "cotton",
    })).toEqual({ color: "black", size: "xl" });
  });

  it("builds a sparse tree without inventing Cartesian combinations", () => {
    const tree = buildVariantPathTree(assignments, [
      { key: "sku-1", optionValueIds: ["black", "xl", "cotton"] },
      { key: "sku-optional-material", optionValueIds: ["black", "xl"] },
      { key: "sku-2", optionValueIds: ["green", "m"] },
    ]);

    expect(tree.map((node) => node.label)).toEqual(["Black", "Green"]);
    expect(tree[0]?.children[0]?.children[0]?.variantKeys).toEqual(["sku-1"]);
    expect(tree[0]?.children[0]?.terminalVariantKeys).toEqual(["sku-optional-material"]);
    expect(tree[1]?.children[0]?.variantKeys).toEqual(["sku-2"]);
  });

  it("reports every affected SKU and blocks a branch containing stock", () => {
    const result = analyzeVariantPathRemoval(["sku-1", "sku-2"], [
      { key: "sku-1", optionValueIds: ["black", "xl"], stockQuantity: "0" },
      { key: "sku-2", optionValueIds: ["black", "m"], stockQuantity: "4" },
      { key: "sku-3", optionValueIds: ["green", "m"], stockQuantity: "0" },
    ]);

    expect(result.affected.map((variant) => variant.key)).toEqual(["sku-1", "sku-2"]);
    expect(result.stocked.map((variant) => variant.key)).toEqual(["sku-2"]);
  });
});
