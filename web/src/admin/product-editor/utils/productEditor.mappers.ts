import type { CreateProductInput, CreateVariantInput, AdminProduct } from "../../../api/adminProducts";
import type {
  PriceTierDraft,
  ProductFormState,
  VariantDraft,
} from "../types/productEditor.types";
import type { ValidatedEditorValues } from "./productEditor.validation";
import { toApiDateTime } from "./productEditor.validation";

export const emptyProductForm: ProductFormState = {
  name: "",
  shortDescription: "",
  description: "",
  productTypeId: "",
  categoryId: "",
  brandId: "",
  defaultPrice: "",
  discountPrice: "",
  discountStartsAt: "",
  discountEndsAt: "",
  costPrice: "",
  status: "ACTIVE",
  isFeatured: false,
};

/** A simple product still needs one database SKU to hold price and inventory. */
export const createEmptyVariant = (): VariantDraft => ({
  key: `new-simple-${Date.now()}`,
  optionValueIds: [],
  optionLabel: "Default",
  sku: "",
  barcode: "",
  price: "",
  discountPrice: "",
  discountStartsAt: "",
  discountEndsAt: "",
  costPrice: "",
  stockQuantity: "0",
  lowStockLevel: "5",
  isDefault: true,
  isActive: true,
});

const toLocalDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

/**
 * The API may return zero for an old record that never had a discount.
 * Keep real positive discounts, but restore zero/null as an empty editor field.
 */
const normalizeDiscountPrice = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? String(value) : "";
};

/** Convert the API response into editable strings and stable editor keys. */
export function mapProductToEditor(product: AdminProduct) {
  const variants: VariantDraft[] = (product.variants ?? []).map((variant) => ({
    key: `existing-${variant.id}`,
    id: variant.id,
    optionValueIds: variant.optionValues?.map((value) => value.id) ?? [],
    optionLabel: variant.optionValues?.map((value) => value.label).join(" / ") || variant.name || "Default",
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    price: String(variant.regularPrice ?? variant.price),
    discountPrice: normalizeDiscountPrice(variant.discountPrice),
    discountStartsAt: toLocalDateTime(variant.discountStartsAt),
    discountEndsAt: toLocalDateTime(variant.discountEndsAt),
    costPrice: variant.costPrice == null ? "" : String(variant.costPrice),
    stockQuantity: String(variant.stockQuantity),
    lowStockLevel: String(variant.lowStockLevel ?? 5),
    isDefault: variant.isDefault,
    isActive: variant.isActive ?? true,
  }));
  const usableVariants = variants.length ? variants : [createEmptyVariant()];
  const productDiscountPrice = normalizeDiscountPrice(product.discountPrice);
  const keyByVariantId = new Map(
    variants.flatMap((variant) => variant.id ? [[variant.id, variant.key] as const] : []),
  );
  const priceTiers: PriceTierDraft[] = (product.priceTiers ?? []).map((tier) => ({
    key: `saved-tier-${tier.id}`,
    variantKey: tier.variantId ? keyByVariantId.get(tier.variantId) ?? "all" : "all",
    minimumQuantity: String(tier.minimumQuantity),
    unitPrice: String(tier.unitPrice),
    isPromotion: tier.isPromotion,
    isActive: tier.isActive ?? true,
  }));

  return {
    form: {
      name: product.name,
      shortDescription: product.shortDescription ?? "",
      description: product.description ?? "",
      productTypeId: product.productTypeId,
      categoryId: product.categoryId,
      brandId: product.brandId ?? "",
      defaultPrice: String(product.regularPrice),
      discountPrice: productDiscountPrice,
      discountStartsAt: toLocalDateTime(product.discountStartsAt),
      discountEndsAt: toLocalDateTime(product.discountEndsAt),
      costPrice: product.defaultCostPrice === null ? "" : String(product.defaultCostPrice),
      status: product.status,
      isFeatured: product.isFeatured,
    } satisfies ProductFormState,
    variants: usableVariants,
    originalVariantIds: variants.flatMap((variant) => variant.id ? [variant.id] : []),
    priceTiers,
    priceTierScope: priceTiers.some((tier) => tier.variantKey !== "all") ? "individual" as const : "all" as const,
    discountScope: productDiscountPrice
      ? "all" as const
      : variants.some((variant) => Boolean(variant.discountPrice)) ? "individual" as const : "all" as const,
    mediaScope: (product.media ?? []).some((item) => item.variantId !== null)
      ? "individual" as const
      : "all" as const,
    globalDiscountEnabled: Boolean(productDiscountPrice),
  };
}

export function mapProductInput(
  form: ProductFormState,
  values: ValidatedEditorValues,
  status: AdminProduct["status"],
): CreateProductInput {
  return {
    productTypeId: form.productTypeId,
    categoryId: form.categoryId,
    brandId: form.brandId || null,
    name: form.name.trim(),
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim() || form.name.trim(),
    defaultPrice: values.regularPrice,
    defaultCostPrice: values.costPrice,
    discountPrice: values.discountPrice,
    discountStartsAt: values.discountStartsAt,
    discountEndsAt: values.discountEndsAt,
    status,
    isFeatured: form.isFeatured,
    isActive: true,
  };
}

/** Translate temporary editor rows into the backend variant contract. */
export function mapVariantInputs(
  variants: VariantDraft[],
  values: ValidatedEditorValues,
): CreateVariantInput[] {
  return variants.map((variant) => ({
    sku: variant.sku.trim(),
    barcode: variant.barcode.trim() || null,
    variantName: variant.optionLabel || "Default",
    price: Number(variant.price || values.regularPrice),
    discountPrice: variant.discountPrice ? Number(variant.discountPrice) : values.discountPrice,
    discountStartsAt: variant.discountPrice
      ? toApiDateTime(variant.discountStartsAt)
      : values.discountStartsAt,
    discountEndsAt: variant.discountPrice
      ? toApiDateTime(variant.discountEndsAt)
      : values.discountEndsAt,
    costPrice: variant.costPrice ? Number(variant.costPrice) : values.costPrice,
    stockQuantity: Number(variant.stockQuantity),
    lowStockLevel: Number(variant.lowStockLevel || 0),
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    optionValueIds: variant.optionValueIds,
  }));
}
