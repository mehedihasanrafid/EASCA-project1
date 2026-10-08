import React, { FormEvent, useEffect, useMemo, useState } from "react";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilterChanges, CatalogFilters as CatalogFilterValues } from "../types/catalog";
import { flattenCategories } from "../utils/catalogOptions";

interface Props {
  brands: BrandOption[];
  categories: CategoryOption[];
  disabled?: boolean;
  filters: CatalogFilterValues;
  idPrefix?: string;
  onChange: (changes: CatalogFilterChanges) => void;
}

const controlClass =
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:opacity-60";

export const CatalogFilters: React.FC<Props> = ({
  brands,
  categories,
  disabled = false,
  filters,
  idPrefix = "catalog",
  onChange,
}) => {
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const [minimum, setMinimum] = useState(filters.minPrice?.toString() ?? "");
  const [maximum, setMaximum] = useState(filters.maxPrice?.toString() ?? "");
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    setMinimum(filters.minPrice?.toString() ?? "");
    setMaximum(filters.maxPrice?.toString() ?? "");
  }, [filters.maxPrice, filters.minPrice]);

  const applyPrice = (event: FormEvent) => {
    event.preventDefault();
    const minPrice = minimum === "" ? undefined : Number(minimum);
    const maxPrice = maximum === "" ? undefined : Number(maximum);

    if (
      (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))
    ) {
      setPriceError("Prices must be zero or greater.");
      return;
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setPriceError("Minimum price cannot be greater than maximum price.");
      return;
    }

    setPriceError("");
    onChange({ minPrice, maxPrice });
  };

  return (
    <div className="space-y-6" aria-label="Product filters">
      <div>
        <label className="mb-2 block text-sm font-bold text-ink" htmlFor={`${idPrefix}-category`}>
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          className={controlClass}
          value={filters.category ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ category: event.target.value || undefined })}
        >
          <option value="">All categories</option>
          {flatCategories.map((category) => (
            <option key={category.id} value={category.slug}>
              {`${"— ".repeat(category.depth)}${category.name}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-ink" htmlFor={`${idPrefix}-brand`}>
          Brand
        </label>
        <select
          id={`${idPrefix}-brand`}
          className={controlClass}
          value={filters.brand ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ brand: event.target.value || undefined })}
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>{brand.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={applyPrice}>
        <fieldset className="m-0 border-0 p-0" disabled={disabled}>
          <legend className="mb-2 text-sm font-bold text-ink">Price range</legend>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="sr-only">Minimum price</span>
              <input
                className={controlClass}
                inputMode="decimal"
                min="0"
                placeholder="Minimum"
                type="number"
                value={minimum}
                onChange={(event) => setMinimum(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Maximum price</span>
              <input
                className={controlClass}
                inputMode="decimal"
                min="0"
                placeholder="Maximum"
                type="number"
                value={maximum}
                onChange={(event) => setMaximum(event.target.value)}
              />
            </label>
          </div>
          {priceError && <p className="mt-2 mb-0 text-xs text-danger" role="alert">{priceError}</p>}
          <button
            className="mt-3 w-full cursor-pointer rounded-control border border-brand bg-transparent px-3 py-2 text-sm font-bold text-brand transition hover:bg-positive-soft disabled:cursor-not-allowed"
            type="submit"
          >
            Apply price
          </button>
        </fieldset>
      </form>

      <label className="flex cursor-pointer items-center gap-3 rounded-control border border-line p-3 text-sm font-semibold text-ink">
        <input
          className="size-4 accent-brand"
          type="checkbox"
          checked={filters.inStock === true}
          disabled={disabled}
          onChange={(event) => onChange({ inStock: event.target.checked ? true : undefined })}
        />
        In-stock products only
      </label>
    </div>
  );
};
