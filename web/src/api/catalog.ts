import { apiClient } from "./client";
import type { ProductTaxonomy } from "./products";

export interface CategoryOption extends ProductTaxonomy {
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl: string | null;
  productCount: number;
  sortOrder: number;
  children: CategoryOption[];
}

export interface BrandOption extends ProductTaxonomy {
  logoUrl: string | null;
}

export const catalogApi = {
  getCategories: (signal?: AbortSignal) =>
    apiClient<{ categories: CategoryOption[] }>("/categories", {
      method: "GET",
      signal,
    }).then(({ categories }) => categories),

  getBrands: (signal?: AbortSignal) =>
    apiClient<{ brands: BrandOption[] }>("/brands", {
      method: "GET",
      signal,
    }).then(({ brands }) => brands),
};
