import { describe, expect, it } from "vitest";
import type { AdminProduct } from "../../../api/adminProducts";
import type { ProductMedia } from "../../../api/products";
import { resolveDiscountPreferenceMode } from "../hooks/useProductEditor";
import {
  createEmptyVariant,
  emptyProductForm,
  mapProductToEditor,
} from "../utils/productEditor.mappers";
import {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
  validateProductEditor,
} from "../utils/productEditor.validation";

const form = { ...emptyProductForm, name: "Example shirt", categoryId: "1", productTypeId: "2" };
const variant = { ...createEmptyVariant(), key: "variant-1", sku: "SHIRT-1", price: "100" };
const input = { form, variants: [variant], tiers: [], globalDiscountEnabled: false };

describe("media publication requirements", () => {
  it("allows incomplete media on Save Draft", () => {
    expect(validateProductEditor({ ...input, requestedStatus: "DRAFT", mediaScope: "all" }).ok).toBe(true);
  });
  it("rejects missing shared image on Publish", () => {
    expect(validateProductEditor({ ...input, requestedStatus: "ACTIVE", mediaScope: "all" })).toEqual({
      ok: false, error: "Add at least one shared product image before publishing.",
    });
  });
  it("rejects a shared image as fulfillment of individual SKU image requirement", () => {
    const shared = { id: "image1", type: "IMAGE", variantId: null } as ProductMedia;
    expect(validateProductEditor({ ...input, requestedStatus: "ACTIVE", mediaScope: "individual", media: [shared] }).ok).toBe(false);
  });
  it("accepts an image pending for the exact SKU", () => {
    const file = new File(["image"], "picture.jpg", { type: "image/jpeg" });
    expect(validateProductEditor({
      ...input,
      requestedStatus: "ACTIVE", mediaScope: "individual",
      pendingMedia: [{ key: "file-1", file, variantKey: "variant-1" }],
    }).ok).toBe(true);
  });
});

describe("discount preference regressions", () => {
  it("resolves a new product's remembered All scope to Off until explicitly enabled", () => {
    expect(resolveDiscountPreferenceMode(false, "all")).toBe("off");
    expect(resolveDiscountPreferenceMode(true, "all")).toBe("all");
  });

  it("keeps blank and legacy zero discount prices from displaying 100 percent", () => {
    expect(discountPercentageFromPrice("100", "")).toBe("");
    expect(discountPercentageFromPrice("100", "0")).toBe("");
    expect(discountPriceFromPercentage("100", "")).toBe("");
  });

  it("still calculates legitimate discounts", () => {
    expect(discountPercentageFromPrice("100", "70")).toBe("30");
    expect(discountPriceFromPercentage("100", "30")).toBe("70.00");
  });

  it("preserves a legitimate product discount when editing", () => {
    const product = {
      id: "product-1",
      name: "Existing shirt",
      shortDescription: null,
      description: "Existing shirt",
      productTypeId: "type-1",
      categoryId: "category-1",
      brandId: null,
      regularPrice: 100,
      discountPrice: 70,
      discountStartsAt: null,
      discountEndsAt: null,
      defaultCostPrice: null,
      status: "ACTIVE",
      isFeatured: false,
      variants: [],
      priceTiers: [],
      media: [],
    } as unknown as AdminProduct;

    const mapped = mapProductToEditor(product);
    expect(mapped.globalDiscountEnabled).toBe(true);
    expect(mapped.discountScope).toBe("all");
    expect(mapped.form.discountPrice).toBe("70");
  });

  it("treats a legacy zero product discount as Off", () => {
    const product = {
      id: "product-2",
      name: "Product without an offer",
      shortDescription: null,
      description: "Product without an offer",
      productTypeId: "type-1",
      categoryId: "category-1",
      brandId: null,
      regularPrice: 100,
      discountPrice: 0,
      discountStartsAt: null,
      discountEndsAt: null,
      defaultCostPrice: null,
      status: "ACTIVE",
      isFeatured: false,
      variants: [],
      priceTiers: [],
      media: [],
    } as unknown as AdminProduct;

    const mapped = mapProductToEditor(product);
    expect(mapped.globalDiscountEnabled).toBe(false);
    expect(mapped.form.discountPrice).toBe("");
  });
});
