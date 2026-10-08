import { useEffect, useState } from "react";

import { ApiException } from "../../../api/client";
import { PaginatedProducts, productApi } from "../../../api/products";
import type { CatalogFilters } from "../types/catalog";

const emptyResult: PaginatedProducts = {
  products: [],
  pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
};

export function useCatalogProducts(filters: CatalogFilters) {
  const [result, setResult] = useState<PaginatedProducts>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    productApi
      .getProducts(filters, controller.signal)
      .then(setResult)
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setResult(emptyResult);
        setError(
          requestError instanceof ApiException
            ? requestError.error.message
            : "Products could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  return { ...result, loading, error };
}
