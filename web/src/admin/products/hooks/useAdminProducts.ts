import { useCallback, useEffect, useState } from "react";

import { AdminProduct, adminProductApi } from "../../../api/adminProducts";
import { ApiException } from "../../../api/client";

/** Owns product-list loading so the page only describes its layout and actions. */
export function useAdminProducts(search: string) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminProductApi.getProducts(search);
      setProducts(result.products);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not load the product catalog.",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return { error, loading, products, reload: loadProducts };
}
