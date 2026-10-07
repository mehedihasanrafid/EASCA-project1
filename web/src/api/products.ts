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

export const productApi = {
  getProducts: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    const url = `/products${queryString ? `?${queryString}` : ""}`;
    
    return apiClient<PaginatedProducts>(url, { method: "GET" });
  },

  getProductBySlug: (slug: string) => {
    return apiClient<{ product: Product }>(`/products/${encodeURIComponent(slug)}`, {
      method: "GET",
    }).then(({ product }) => product);
  },
};
