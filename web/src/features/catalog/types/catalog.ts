import type { ProductListParams, ProductSort } from "../../../api/products";

export interface CatalogFilters extends ProductListParams {
  sort: ProductSort;
  page: number;
  limit: number;
}

export type CatalogFilterChanges = Partial<
  Pick<
    CatalogFilters,
    "search" | "category" | "brand" | "minPrice" | "maxPrice" | "inStock" | "sort" | "page"
  >
>;
