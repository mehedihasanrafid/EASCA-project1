import type { AdminProduct, CategoryOption } from "../../../api/adminProducts";

/**
 * Editable product-level fields.
 *
 * Prices stay as strings while the administrator is typing. Converting an empty
 * input to a number too early would turn it into `0`, which is not the same as
 * "not entered". Conversion happens only in the validation/save layer.
 */
export interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  productTypeId: string;
  categoryId: string;
  brandId: string;
  defaultPrice: string;
  discountPrice: string;
  discountStartsAt: string;
  discountEndsAt: string;
  costPrice: string;
  status: AdminProduct["status"];
  isFeatured: boolean;
}

/** Category row prepared for the nested "Parent › Child" select label. */
export interface FlatCategoryOption extends CategoryOption {
  displayName: string;
}

/** One editable SKU row in the browser before it is converted to an API body. */
export interface VariantDraft {
  key: string;
  id?: string;
  optionValueIds: string[];
  optionLabel: string;
  sku: string;
  barcode: string;
  price: string;
  discountPrice: string;
  discountStartsAt: string;
  discountEndsAt: string;
  costPrice: string;
  stockQuantity: string;
  lowStockLevel: string;
  isDefault: boolean;
  isActive: boolean;
}

/** A file selected locally but not uploaded until a product ID exists. */
export interface VariantPendingMedia {
  key: string;
  file: File;
  variantKey: "all" | string;
}

/** Quantity-price row kept in editor keys until database variant IDs are known. */
export interface PriceTierDraft {
  key: string;
  variantKey: "all" | string;
  minimumQuantity: string;
  unitPrice: string;
  isPromotion: boolean;
  isActive: boolean;
}

/** Scope used by existing pricing/media APIs. */
export type PreferenceScope = "all" | "individual";
/** UI adds an optional Off mode without changing the backend API's scope type. */
export type ProductPreferenceMode = PreferenceScope | "off";

export type BulkField =
  | "price"
  | "discountPrice"
  | "costPrice"
  | "stockQuantity"
  | "lowStockLevel"
  | "isActive";
