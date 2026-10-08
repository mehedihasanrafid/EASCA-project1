import { apiClient } from "./client";

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
  stockQuantity: number;
  inStock: boolean;
  weight: Money | null;
  isDefault: boolean;
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
  isFeatured: boolean;
  category: ProductTaxonomy;
  productType: ProductTaxonomy;
  brand: ProductTaxonomy | null;
  stockQuantity: number;
  inStock: boolean;
  primaryImage: ProductMedia | null;
  variants?: ProductVariant[];
  media?: ProductMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    const url = `/products${queryString ? `?${queryString}` : ""}`;
    
    return apiClient<PaginatedProducts>(url, { method: "GET", signal });
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
