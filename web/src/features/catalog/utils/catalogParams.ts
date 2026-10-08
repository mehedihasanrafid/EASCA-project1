import type { ProductSort } from "../../../api/products";
import type { CatalogFilterChanges, CatalogFilters } from "../types/catalog";

const validSorts: ProductSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
];

function optionalText(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalMoney(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function positivePage(value: string | null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 1;
}

export function parseCatalogFilters(searchParams: URLSearchParams): CatalogFilters {
  const requestedSort = searchParams.get("sort") as ProductSort | null;
  const search = optionalText(searchParams.get("q"));
  const stock = searchParams.get("inStock");

  return {
    search: search && search.length >= 2 ? search : undefined,
    category: optionalText(searchParams.get("category")),
    brand: optionalText(searchParams.get("brand")),
    minPrice: optionalMoney(searchParams.get("minPrice")),
    maxPrice: optionalMoney(searchParams.get("maxPrice")),
    inStock: stock === "true" ? true : stock === "false" ? false : undefined,
    sort: requestedSort && validSorts.includes(requestedSort) ? requestedSort : "newest",
    page: positivePage(searchParams.get("page")),
    limit: 12,
  };
}

function parameterName(key: keyof CatalogFilterChanges) {
  return key === "search" ? "q" : key;
}

export function updateCatalogParameters(
  current: URLSearchParams,
  changes: CatalogFilterChanges,
) {
  const next = new URLSearchParams(current);

  for (const [key, value] of Object.entries(changes) as Array<
    [keyof CatalogFilterChanges, string | number | boolean | undefined]
  >) {
    const name = parameterName(key);
    if (value === undefined || value === "") next.delete(name);
    else next.set(name, String(value));
  }

  if (!(Object.keys(changes).length === 1 && changes.page !== undefined)) {
    next.set("page", "1");
  }

  return next;
}

export function clearCatalogParameters(
  current: URLSearchParams,
  preserveSearch = true,
) {
  const next = new URLSearchParams();
  const search = current.get("q")?.trim();
  if (preserveSearch && search) next.set("q", search);
  return next;
}
