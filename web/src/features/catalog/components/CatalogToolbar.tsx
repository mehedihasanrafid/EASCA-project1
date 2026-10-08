import React from "react";
import { SlidersHorizontal } from "lucide-react";

import type { ProductSort } from "../../../api/products";
import { SortSelect } from "./SortSelect";

interface Props {
  count: number;
  loading: boolean;
  onOpenFilters: () => void;
  onSortChange: (sort: ProductSort) => void;
  sort: ProductSort;
}

export const CatalogToolbar: React.FC<Props> = ({
  count,
  loading,
  onOpenFilters,
  onSortChange,
  sort,
}) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-4">
    <p className="m-0 text-sm text-muted" aria-live="polite">
      {loading ? "Loading products..." : `${count} product${count === 1 ? "" : "s"} found`}
    </p>
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="inline-flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-sm font-bold text-ink hover:border-brand hover:text-brand lg:hidden"
        type="button"
        aria-haspopup="dialog"
        onClick={onOpenFilters}
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        Filters
      </button>
      <SortSelect disabled={loading} value={sort} onChange={onSortChange} />
    </div>
  </div>
);
