import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { CatalogFilterChanges } from "../types/catalog";
import {
  clearCatalogParameters,
  parseCatalogFilters,
  updateCatalogParameters,
} from "../utils/catalogParams";

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => parseCatalogFilters(searchParams),
    [searchParams],
  );

  const updateFilters = (changes: CatalogFilterChanges) => {
    setSearchParams(updateCatalogParameters(searchParams, changes));
  };

  const clearFilters = () => {
    setSearchParams(clearCatalogParameters(searchParams));
  };

  return { filters, updateFilters, clearFilters };
}
