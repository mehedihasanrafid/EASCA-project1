import React from "react";
import { X } from "lucide-react";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilterChanges, CatalogFilters } from "../types/catalog";
import { flattenCategories } from "../utils/catalogOptions";
import { formatProductPrice } from "../utils/formatters";

interface Props {
  brands: BrandOption[];
  categories: CategoryOption[];
  filters: CatalogFilters;
  onChange: (changes: CatalogFilterChanges) => void;
  onClear: () => void;
}

export const ActiveFilterChips: React.FC<Props> = ({
  brands,
  categories,
  filters,
  onChange,
  onClear,
}) => {
  const chips: Array<{ key: string; label: string; remove: CatalogFilterChanges }> = [];
  const category = flattenCategories(categories).find(({ slug }) => slug === filters.category);
  const brand = brands.find(({ slug }) => slug === filters.brand);

  if (filters.category) chips.push({
    key: "category",
    label: `Category: ${category?.name ?? filters.category}`,
    remove: { category: undefined },
  });
  if (filters.brand) chips.push({
    key: "brand",
    label: `Brand: ${brand?.name ?? filters.brand}`,
    remove: { brand: undefined },
  });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const range = filters.minPrice !== undefined && filters.maxPrice !== undefined
      ? `${formatProductPrice(filters.minPrice)}–${formatProductPrice(filters.maxPrice)}`
      : filters.minPrice !== undefined
        ? `From ${formatProductPrice(filters.minPrice)}`
        : `Up to ${formatProductPrice(filters.maxPrice ?? 0)}`;
    chips.push({ key: "price", label: range, remove: { minPrice: undefined, maxPrice: undefined } });
  }
  if (filters.inStock !== undefined) chips.push({
    key: "stock",
    label: filters.inStock ? "In stock" : "Out of stock",
    remove: { inStock: undefined },
  });

  if (chips.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-brand/25 bg-positive-soft px-3 py-1.5 text-xs font-bold text-brand hover:border-brand"
          type="button"
          onClick={() => onChange(chip.remove)}
          aria-label={`Remove ${chip.label} filter`}
        >
          {chip.label}
          <X size={14} aria-hidden="true" />
        </button>
      ))}
      <button
        className="cursor-pointer border-0 bg-transparent px-2 py-1 text-xs font-bold text-muted underline hover:text-brand"
        type="button"
        onClick={onClear}
      >
        Clear filters
      </button>
    </div>
  );
};
