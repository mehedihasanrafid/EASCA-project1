import React from "react";

import type { ProductSort } from "../../../api/products";

interface Props {
  disabled?: boolean;
  onChange: (sort: ProductSort) => void;
  value: ProductSort;
}

export const SortSelect: React.FC<Props> = ({ disabled = false, onChange, value }) => (
  <label className="flex items-center gap-3 text-sm font-semibold text-ink">
    <span className="shrink-0">Sort by</span>
    <select
      className="rounded-control border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as ProductSort)}
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: low to high</option>
      <option value="price_desc">Price: high to low</option>
      <option value="name_asc">Name: A–Z</option>
    </select>
  </label>
);
