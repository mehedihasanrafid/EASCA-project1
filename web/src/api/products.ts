import { apiClient } from "./client";

import { buildQueryParams } from "../shared/utils/queryParams";

import type { PaginationMeta } from "../shared/types/pagination";


export type Money = string | number;

export interface ProductMedia {
  id: string;
  variantId: string | null;
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string | null;
  name: string | null;
  color: string | null;
  size: string | null;
  price: Money;
  regularPrice?: Money;
  discountPrice?: Money | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  stockQuantity: number;
  inStock: boolean;
  weight: Money | null;
  lengthCm?: Money | null;
  widthCm?: Money | null;
  heightCm?: Money | null;
  isDefault: boolean;
  optionValues: ProductOptionValue[];
  costPrice?: Money | null;
  isActive?: boolean;
  lowStockLevel?: number;
  priceTiers?: ProductPriceTier[];
}

export interface ProductPriceTier {
  id: string;
  variantId: string | null;
  minimumQuantity: number;
  unitPrice: Money;
  isPromotion: boolean;
  isActive?: boolean;
}

export interface ProductOptionValue {
  id: string;
  label: string;
  code: string;
  colorHex: string | null;
  attribute: ProductOptionAttribute;
}

export interface ProductOptionAttribute {
  id: string;
  name: string;
  code: string;
  inputType: "SELECT" | "COLOR" | "TEXT";
}

export interface ProductOption {
  attribute: ProductOptionAttribute;
  values: Array<Omit<ProductOptionValue, "attribute">>;
}

export interface ProductTaxonomy {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description?: string;
  price: Money;
  regularPrice: Money;
  discountPrice: Money | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  isFeatured: boolean;
  category: ProductTaxonomy;
  productType: ProductTaxonomy;
  brand: ProductTaxonomy | null;
  stockQuantity: number;
  inStock: boolean;
  primaryImage: ProductMedia | null;
  variants?: ProductVariant[];
  options?: ProductOption[];
  media?: ProductMedia[];
  priceTiers?: ProductPriceTier[];
  createdAt: string;
  updatedAt: string;
}


export interface PaginatedProducts {
  products: Product[];
  pagination: PaginationMeta;
}


export interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: Money;
  regularPrice: Money;
  discountPrice: Money | null;
  category: ProductTaxonomy;
  brand: ProductTaxonomy | null;
  inStock: boolean;
  thumbnail: {
    url: string;
    altText: string | null;
  } | null;
}

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface ProductListParams {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export const productApi = {
 
getProducts: (params: ProductListParams = {}, signal?: AbortSignal) => {
  const queryString = buildQueryParams(params);
  const url = `/products${queryString ? `?${queryString}` : ""}`;

  return apiClient<PaginatedProducts>(url, {
    method: "GET",
    signal,
  });
},


  getSearchSuggestions: (search: string, limit = 8, signal?: AbortSignal) => {
    const query = new URLSearchParams({ q: search.trim(), limit: String(limit) });
    return apiClient<{ suggestions: ProductSuggestion[] }>(
      `/products/search-suggestions?${query.toString()}`,
      { method: "GET", signal },
    ).then(({ suggestions }) => suggestions);
  },

  getProductBySlug: (slug: string) => {
    return apiClient<{ product: Product }>(`/products/${encodeURIComponent(slug)}`, {
      method: "GET",
    }).then(({ product }) => product);
  },
};
