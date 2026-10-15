import { apiClient } from "./client";
import type { Money, Product, ProductMedia, ProductPriceTier, ProductTaxonomy, ProductVariant } from "./products";

import type { PaginationMeta } from "../shared/types/pagination";


export interface AdminProduct extends Product {
  productTypeId: string;
  categoryId: string;
  brandId: string | null;
  defaultCostPrice: Money | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  isActive: boolean;
  deletedAt: string | null;
}

export interface CategoryOption extends ProductTaxonomy {
  parentId: string | null;
  allowProducts: boolean;
  children: CategoryOption[];
}


interface AdminProductList {
  products: AdminProduct[];
  pagination: PaginationMeta;
}


export interface CreateProductInput {
  productTypeId: string;
  categoryId: string;
  brandId: string | null;
  name: string;
  shortDescription: string | null;
  description: string;
  defaultPrice: number;
  defaultCostPrice: number | null;
  discountPrice: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  status: AdminProduct["status"];
  isFeatured: boolean;
  isActive: boolean;
}

export interface CreateVariantInput {
  sku: string;
  barcode?: string | null;
  variantName?: string;
  color?: string;
  size?: string;
  price: number;
  discountPrice?: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  costPrice: number | null;
  stockQuantity: number;
  lowStockLevel?: number;
  weight?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  isDefault: boolean;
  isActive: boolean;
  optionValueIds?: string[];
}

export type UpdateVariantInput = Partial<Omit<CreateVariantInput, "isDefault">> & {
  isDefault?: boolean;
};

export const adminProductApi = {
  getProducts: (search = "") =>
    apiClient<AdminProductList>(`/admin/products?limit=100&includeDeleted=false${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ""}`, {
      method: "GET",
    }),

  getCategories: () =>
    apiClient<{ categories: CategoryOption[] }>("/categories", { method: "GET" }).then(
      ({ categories }) => categories,
    ),

  getProduct: (productId: string) =>
    apiClient<{ product: AdminProduct }>(`/admin/products/${productId}`, {
      method: "GET",
    }).then(({ product }) => product),

  createProduct: (input: CreateProductInput) =>
    apiClient<{ product: AdminProduct }>("/admin/products", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ product }) => product),

  createVariant: (productId: string, input: CreateVariantInput) =>
    apiClient<{ variant: ProductVariant }>(`/admin/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ variant }) => variant),

  createVariantsBulk: (productId: string, variants: CreateVariantInput[]) =>
    apiClient<{ variants: ProductVariant[] }>(`/admin/products/${productId}/variants/bulk`, {
      method: "POST",
      body: JSON.stringify({ variants }),
    }).then(({ variants: created }) => created),

  updateVariant: (productId: string, variantId: string, input: UpdateVariantInput) =>
    apiClient(`/admin/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteVariant: (productId: string, variantId: string) =>
    apiClient<void>(`/admin/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    }),

  updateProduct: (productId: string, input: Partial<CreateProductInput>) =>
    apiClient<{ product: AdminProduct }>(`/admin/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ product }) => product),

  replacePriceTiers: (
    productId: string,
    tiers: Array<{
      variantId: string | null;
      minimumQuantity: number;
      unitPrice: number;
      isPromotion: boolean;
      isActive: boolean;
    }>,
  ) => apiClient<{ priceTiers: ProductPriceTier[] }>(
    `/admin/products/${productId}/price-tiers`,
    { method: "PUT", body: JSON.stringify({ tiers }) },
  ).then(({ priceTiers }) => priceTiers),

  uploadMedia: (productId: string, files: File[], altText?: string, variantId?: string) => {
    const body = new FormData();
    files.forEach((file) => body.append("media", file));
    if (altText) body.append("altText", altText);
    if (variantId) body.append("variantId", variantId);

    return apiClient<{ media: ProductMedia[] }>(`/admin/products/${productId}/media`, {
      method: "POST",
      body,
    }).then(({ media }) => media);
  },

  updateMedia: (
    productId: string,
    mediaId: string,
    input: { altText?: string | null; sortOrder?: number; isPrimary?: boolean; variantId?: string | null },
  ) =>
    apiClient<{ media: ProductMedia }>(`/admin/products/${productId}/media/${mediaId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ media }) => media),

  deleteMedia: (productId: string, mediaId: string) =>
    apiClient<void>(`/admin/products/${productId}/media/${mediaId}`, {
      method: "DELETE",
    }),
};
