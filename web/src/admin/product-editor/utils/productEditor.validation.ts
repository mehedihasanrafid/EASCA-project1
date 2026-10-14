import type { ProductMedia } from "../../../api/products";
import type {
  PriceTierDraft,
  PreferenceScope,
  VariantPendingMedia,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";

/** Convert a regular price and percentage into the final customer price. */
export function discountPriceFromPercentage(
  regularPriceValue: string,
  percentageValue: string,
) {
  const regularPrice = Number(regularPriceValue);
  const percentage = Number(percentageValue);
  if (
    regularPriceValue === "" ||
    percentageValue === "" ||
    !Number.isFinite(regularPrice) ||
    !Number.isFinite(percentage) ||
    regularPrice < 0 ||
    percentage < 0 ||
    percentage > 100
  ) return "";
  return (regularPrice * (1 - percentage / 100)).toFixed(2);
}

/** Show the percentage represented by an already-entered final discount price. */
export function discountPercentageFromPrice(
  regularPriceValue: string,
  discountPriceValue: string,
) {
  const regularPrice = Number(regularPriceValue);
  const discountPrice = Number(discountPriceValue);
  if (
    regularPriceValue === "" ||
    discountPriceValue === "" ||
    !Number.isFinite(regularPrice) ||
    !Number.isFinite(discountPrice) ||
    regularPrice <= 0 ||
    // Zero is the legacy/unset value in some product records. It must not make
    // a blank discount look like an intentional 100% offer in the editor.
    discountPrice <= 0 ||
    discountPrice > regularPrice
  ) return "";
  return String(Number((((regularPrice - discountPrice) / regularPrice) * 100).toFixed(2)));
}

export const toApiDateTime = (value: string) =>
  value ? new Date(value).toISOString() : null;

export interface ValidatedEditorValues {
  regularPrice: number;
  discountPrice: number | null;
  costPrice: number | null;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
}

interface ValidationInput {
  form: ProductFormState;
  variants: VariantDraft[];
  tiers: PriceTierDraft[];
  globalDiscountEnabled: boolean;
  // Optional for compatibility with existing validation callers; the page supplies all four.
  media?: ProductMedia[];
  pendingMedia?: VariantPendingMedia[];
  mediaScope?: PreferenceScope;
  requestedStatus?: string;
}

/**
 * Validate the complete editor before any write request starts.
 *
 * Keeping these rules outside React makes them reusable in tests and prevents a
 * partially-created product caused by discovering a bad SKU halfway through save.
 */
export function validateProductEditor(
  input: ValidationInput,
): { ok: false; error: string } | { ok: true; values: ValidatedEditorValues } {
  const { form, globalDiscountEnabled, tiers, variants } = input;
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const regularPrice = Number(defaultVariant?.price || form.defaultPrice);
  const discountPrice = globalDiscountEnabled && form.discountPrice
    ? Number(form.discountPrice)
    : null;
  const costPrice = defaultVariant?.costPrice
    ? Number(defaultVariant.costPrice)
    : form.costPrice ? Number(form.costPrice) : null;
  const discountStartsAt = discountPrice === null ? null : toApiDateTime(form.discountStartsAt);
  const discountEndsAt = discountPrice === null ? null : toApiDateTime(form.discountEndsAt);

  if (!form.name.trim()) return { ok: false, error: "Enter the product name." };
  if (!form.categoryId) return { ok: false, error: "Choose a category." };
  if (!form.productTypeId) return { ok: false, error: "Choose a product type assigned to this category." };
  if (!defaultVariant || defaultVariant.price === "" || !Number.isFinite(regularPrice)) {
    return { ok: false, error: "Choose a default variant and enter its selling price." };
  }
  if (discountPrice !== null && discountPrice > regularPrice) {
    return { ok: false, error: "The discount price cannot be higher than the regular price." };
  }
  if (discountStartsAt && discountEndsAt && discountStartsAt > discountEndsAt) {
    return { ok: false, error: "The product offer end date must be after its start date." };
  }
  if (variants.length === 0 || variants.some((variant) => !variant.sku.trim())) {
    return { ok: false, error: "Add at least one variant and provide a unique SKU for every row." };
  }

  const normalizedSkus = variants.map((variant) => variant.sku.trim().toUpperCase());
  if (new Set(normalizedSkus).size !== normalizedSkus.length) {
    return { ok: false, error: "Every variant needs a unique SKU. Remove or rename the duplicate SKU before saving." };
  }

  const invalidPrice = variants.find((variant) =>
    variant.price === "" || !Number.isFinite(Number(variant.price)) || Number(variant.price) < 0,
  );
  if (invalidPrice) {
    return { ok: false, error: `${invalidPrice.optionLabel || invalidPrice.sku} needs a selling price.` };
  }

  const invalidInventory = variants.find((variant) => {
    const stock = Number(variant.stockQuantity);
    const lowStock = Number(variant.lowStockLevel || 0);
    return variant.stockQuantity === "" || !Number.isInteger(stock) || stock < 0 ||
      !Number.isInteger(lowStock) || lowStock < 0;
  });
  if (invalidInventory) {
    return { ok: false, error: `${invalidInventory.optionLabel || invalidInventory.sku} needs non-negative whole numbers for stock and low-stock warning.` };
  }

  const invalidCost = variants.find((variant) => variant.costPrice !== "" && (
    !Number.isFinite(Number(variant.costPrice)) || Number(variant.costPrice) < 0
  ));
  if (invalidCost) {
    return { ok: false, error: `${invalidCost.optionLabel || invalidCost.sku} contains an invalid cost price.` };
  }

  const invalidGlobalDiscount = discountPrice === null
    ? undefined
    : variants.find((variant) => !variant.discountPrice && discountPrice > Number(variant.price));
  if (invalidGlobalDiscount) {
    return { ok: false, error: `The all-variant discount is higher than ${invalidGlobalDiscount.optionLabel || invalidGlobalDiscount.sku}'s selling price.` };
  }

  const invalidVariantDiscount = variants.find((variant) => variant.discountPrice && (
    !Number.isFinite(Number(variant.discountPrice)) ||
    Number(variant.discountPrice) < 0 ||
    Number(variant.discountPrice) > Number(variant.price || regularPrice)
  ));
  if (invalidVariantDiscount) {
    return { ok: false, error: `${invalidVariantDiscount.optionLabel || invalidVariantDiscount.sku}'s discount price is higher than its selling price.` };
  }

  const invalidVariantSchedule = variants.find((variant) => {
    const startsAt = toApiDateTime(variant.discountStartsAt);
    const endsAt = toApiDateTime(variant.discountEndsAt);
    return startsAt && endsAt && startsAt > endsAt;
  });
  if (invalidVariantSchedule) {
    return { ok: false, error: `${invalidVariantSchedule.optionLabel || invalidVariantSchedule.sku}'s offer end date must be after its start date.` };
  }

  // Media is checked on Publish, not Save Draft. A video does not replace a product image.
  if (input.requestedStatus === "ACTIVE" && input.mediaScope) {
    const savedImages = (input.media ?? []).filter((item) => item.type === "IMAGE");
    const pendingImages = (input.pendingMedia ?? []).filter((item) => item.file.type.startsWith("image/"));
    if (input.mediaScope === "all") {
      const hasShared = savedImages.some((item) => item.variantId === null) ||
        pendingImages.some((item) => item.variantKey === "all");
      if (!hasShared) return { ok: false, error: "Add at least one shared product image before publishing." };
    } else {
      // A shared fallback image does NOT satisfy an Individual SKU requirement.
      const missing = variants.find((variant) => variant.isActive && !(
        savedImages.some((item) => Boolean(variant.id) && item.variantId === variant.id) ||
        pendingImages.some((item) => item.variantKey === variant.key)
      ));
      if (missing) return { ok: false, error: `${missing.optionLabel || missing.sku} needs its own image before publishing.` };
    }
  }

  const tierSignatures = new Set<string>();
  for (const tier of tiers) {
    if (Number(tier.minimumQuantity) < 2 || tier.unitPrice === "") {
      return { ok: false, error: "Every block price needs a minimum quantity of 2 or more and a unit price." };
    }
    const signature = `${tier.variantKey}:${tier.minimumQuantity}`;
    if (tierSignatures.has(signature)) {
      return { ok: false, error: "The same price scope cannot contain duplicate minimum quantities." };
    }
    tierSignatures.add(signature);
  }

  return { ok: true,
    values: { costPrice, discountEndsAt, discountPrice, discountStartsAt, regularPrice },
  };
}
