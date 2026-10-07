import { apiClient } from "./client";
import type { Money, Product, ProductMedia, ProductTaxonomy } from "./products";

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
  children: CategoryOption[];
}

interface AdminProductList {
  products: AdminProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  status: AdminProduct["status"];
  isFeatured: boolean;
  isActive: boolean;
}

export interface CreateVariantInput {
  sku: string;
  variantName?: string;
  color?: string;
  size?: string;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
  isDefault: boolean;
  isActive: boolean;
}

export type UpdateVariantInput = Partial<Omit<CreateVariantInput, "isDefault">> & {
  isDefault?: boolean;
};

export const adminProductApi = {
  getProducts: () =>
    apiClient<AdminProductList>("/admin/products?limit=100&includeDeleted=false", {
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
    apiClient(`/admin/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateVariant: (productId: string, variantId: string, input: UpdateVariantInput) =>
    apiClient(`/admin/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  updateProduct: (productId: string, input: Partial<CreateProductInput>) =>
    apiClient<{ product: AdminProduct }>(`/admin/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ product }) => product),

  uploadMedia: (productId: string, files: File[], altText?: string) => {
    const body = new FormData();
    files.forEach((file) => body.append("media", file));
    if (altText) body.append("altText", altText);

    return apiClient<{ media: ProductMedia[] }>(`/admin/products/${productId}/media`, {
      method: "POST",
      body,
    }).then(({ media }) => media);
  },

  updateMedia: (
    productId: string,
    mediaId: string,
    input: { altText?: string | null; sortOrder?: number; isPrimary?: boolean },
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
