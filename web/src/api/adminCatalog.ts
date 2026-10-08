import { apiClient } from "./client";

export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminProductType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SaveCategoryInput {
  name: string;
  slug?: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
}

export interface SaveBrandInput {
  name: string;
  slug?: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
}

export interface SaveProductTypeInput {
  name: string;
  slug?: string;
  description: string | null;
  isActive: boolean;
}

export const adminCatalogApi = {
  getCategories: (includeDeleted = true) =>
    apiClient<{ categories: AdminCategory[] }>(
      `/admin/categories?includeDeleted=${includeDeleted}`,
      { method: "GET" },
    ).then(({ categories }) => categories),

  createCategory: (input: SaveCategoryInput) =>
    apiClient<{ category: AdminCategory }>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ category }) => category),

  updateCategory: (id: string, input: Partial<SaveCategoryInput>) =>
    apiClient<{ category: AdminCategory }>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ category }) => category),

  deleteCategory: (id: string) =>
    apiClient<void>(`/admin/categories/${id}`, { method: "DELETE" }),

  restoreCategory: (id: string) =>
    apiClient<{ category: AdminCategory }>(`/admin/categories/${id}/restore`, {
      method: "POST",
    }).then(({ category }) => category),

  getBrands: (includeDeleted = true) =>
    apiClient<{ brands: AdminBrand[] }>(
      `/admin/brands?includeDeleted=${includeDeleted}`,
      { method: "GET" },
    ).then(({ brands }) => brands),

  createBrand: (input: SaveBrandInput) =>
    apiClient<{ brand: AdminBrand }>("/admin/brands", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ brand }) => brand),

  updateBrand: (id: string, input: Partial<SaveBrandInput>) =>
    apiClient<{ brand: AdminBrand }>(`/admin/brands/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ brand }) => brand),

  deleteBrand: (id: string) =>
    apiClient<void>(`/admin/brands/${id}`, { method: "DELETE" }),

  restoreBrand: (id: string) =>
    apiClient<{ brand: AdminBrand }>(`/admin/brands/${id}/restore`, {
      method: "POST",
    }).then(({ brand }) => brand),

  getProductTypes: (includeDeleted = true) =>
    apiClient<{ productTypes: AdminProductType[] }>(
      `/admin/product-types?includeDeleted=${includeDeleted}`,
      { method: "GET" },
    ).then(({ productTypes }) => productTypes),

  createProductType: (input: SaveProductTypeInput) =>
    apiClient<{ productType: AdminProductType }>("/admin/product-types", {
      method: "POST",
      body: JSON.stringify(input),
    }).then(({ productType }) => productType),

  updateProductType: (id: string, input: Partial<SaveProductTypeInput>) =>
    apiClient<{ productType: AdminProductType }>(`/admin/product-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ productType }) => productType),

  deleteProductType: (id: string) =>
    apiClient<void>(`/admin/product-types/${id}`, { method: "DELETE" }),

  restoreProductType: (id: string) =>
    apiClient<{ productType: AdminProductType }>(`/admin/product-types/${id}/restore`, {
      method: "POST",
    }).then(({ productType }) => productType),
};
