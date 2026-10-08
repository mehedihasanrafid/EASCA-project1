import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilterChanges, CatalogFilters } from "../types/catalog";
import { CatalogFilters as FilterControls } from "./CatalogFilters";

interface Props {
  brands: BrandOption[];
  categories: CategoryOption[];
  filters: CatalogFilters;
  onApply: (changes: CatalogFilterChanges) => void;
  onClose: () => void;
  open: boolean;
}

export const MobileFilterDrawer: React.FC<Props> = ({
  brands,
  categories,
  filters,
  onApply,
  onClose,
  open,
}) => {
  const [draft, setDraft] = useState(filters);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(filters);
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]",
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      returnFocusRef.current?.focus();
    };
  }, [filters, onClose, open]);

  if (!open) return null;

  const apply = () => {
    onApply({
      category: draft.category,
      brand: draft.brand,
      minPrice: draft.minPrice,
      maxPrice: draft.maxPrice,
      inStock: draft.inStock,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 lg:hidden" onMouseDown={onClose}>
      <section
        ref={drawerRef}
        aria-labelledby="mobile-filter-title"
        aria-modal="true"
        className="ml-auto flex h-full w-[min(90vw,390px)] flex-col bg-surface shadow-2xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="m-0 text-xl" id="mobile-filter-title">Filter products</h2>
          <button
            ref={closeButtonRef}
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink hover:border-brand hover:text-brand"
            type="button"
            aria-label="Close product filters"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <FilterControls
            brands={brands}
            categories={categories}
            filters={draft}
            idPrefix="mobile-catalog"
            onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))}
          />
        </div>
        <footer className="border-t border-line p-4">
          <button
            className="w-full cursor-pointer rounded-control border-0 bg-brand px-5 py-3 font-bold text-white hover:bg-brand-hover"
            type="button"
            onClick={apply}
          >
            Apply filters
          </button>
        </footer>
      </section>
    </div>
  );
};
