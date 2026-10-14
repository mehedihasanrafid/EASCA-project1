import { describe, expect, it } from "vitest";

import type {
  ProductOption,
  ProductOptionAttribute,
  ProductOptionValue,
  ProductVariant,
} from "../../api/products";
import {
  changeStorefrontOption,
  findExactStorefrontVariant,
  nextStorefrontOptionName,
  selectionHasTerminalVariant,
  storefrontOptionValueStates,
} from "./productVariantSelection";

const attributes = {
  color: { id: "color", name: "Color", code: "color", inputType: "COLOR" },
  size: { id: "size", name: "Size", code: "size", inputType: "SELECT" },
  material: { id: "material", name: "Material", code: "material", inputType: "SELECT" },
} satisfies Record<string, ProductOptionAttribute>;

const value = (
  id: string,
  label: string,
  attribute: ProductOptionAttribute,
): ProductOptionValue => ({ id, label, code: id, colorHex: null, attribute });

const values = {
  black: value("black", "Black", attributes.color),
  green: value("green", "Green", attributes.color),
  xl: value("xl", "XL", attributes.size),
  x: value("x", "X", attributes.size),
  m: value("m", "M", attributes.size),
  cotton: value("cotton", "Cotton", attributes.material),
  synthetic: value("synthetic", "Synthetic", attributes.material),
};

const options: ProductOption[] = [
  { attribute: attributes.color, values: [values.black, values.green] },
  { attribute: attributes.size, values: [values.xl, values.x, values.m] },
  { attribute: attributes.material, values: [values.cotton, values.synthetic] },
];

const variant = (
  id: string,
  optionValues: ProductOptionValue[],
  inStock = true,
): ProductVariant => ({
  id,
  sku: id.toUpperCase(),
  barcode: null,
  name: null,
  color: null,
  size: null,
  price: 100,
  stockQuantity: inStock ? 5 : 0,
  inStock,
  weight: null,
  isDefault: false,
  optionValues,
});

const variants = [
  variant("black-xl-cotton", [values.black, values.xl, values.cotton]),
  variant("black-xl-synthetic", [values.black, values.xl, values.synthetic], false),
  variant("black-x", [values.black, values.x]),
  variant("green-m", [values.green, values.m]),
];

describe("storefront sparse variant selection", () => {
  it("shows only child values that exist below the selected parent", () => {
    const sizes = storefrontOptionValueStates(options, variants, { color: "green" }, "size");

    expect(sizes.map((item) => item.label)).toEqual(["M"]);
    expect(storefrontOptionValueStates(options, variants, {}, "size")).toEqual([]);
  });

  it("keeps sold-out paths visible but unavailable", () => {
    const materials = storefrontOptionValueStates(
      options,
      variants,
      { color: "black", size: "xl" },
      "material",
    );

    expect(materials.map(({ label, inStock }) => ({ label, inStock }))).toEqual([
      { label: "Cotton", inStock: true },
      { label: "Synthetic", inStock: false },
    ]);
  });

  it("clears child choices when a parent changes", () => {
    const result = changeStorefrontOption(
      options,
      variants,
      { color: "black", size: "xl", material: "cotton" },
      "color",
      "green",
    );

    expect(result.selection).toEqual({ color: "green" });
    expect(result.variant).toBeUndefined();
    expect(nextStorefrontOptionName(options, variants, result.selection)).toBe("Size");
  });

  it("does not clear children when the selected parent is clicked again", () => {
    const current = { color: "black", size: "xl", material: "cotton" };
    const result = changeStorefrontOption(options, variants, current, "color", "black");

    expect(result.selection).toBe(current);
    expect(result.variant?.id).toBe("black-xl-cotton");
  });

  it("resolves an exact terminal SKU even when a later property is optional", () => {
    const selection = { color: "black", size: "x" };

    expect(findExactStorefrontVariant(variants, selection)?.id).toBe("black-x");
    expect(selectionHasTerminalVariant(variants, selection)).toBe(true);
    expect(storefrontOptionValueStates(options, variants, selection, "material")).toEqual([]);
  });
});
