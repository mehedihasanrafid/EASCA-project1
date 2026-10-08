import { useEffect, useState } from "react";

import { BrandOption, catalogApi, CategoryOption } from "../../../api/catalog";

export function useCatalogReferences() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      catalogApi.getCategories(controller.signal),
      catalogApi.getBrands(controller.signal),
    ])
      .then(([categoryOptions, brandOptions]) => {
        setCategories(categoryOptions);
        setBrands(brandOptions);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Product filters could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { categories, brands, loading, error };
}
