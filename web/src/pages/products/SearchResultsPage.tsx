import React, { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Pagination } from "../../components/ui/Pagination";
import { ActiveFilterChips } from "../../features/catalog/components/ActiveFilterChips";
import { CatalogFilters } from "../../features/catalog/components/CatalogFilters";
import { CatalogToolbar } from "../../features/catalog/components/CatalogToolbar";
import { MobileFilterDrawer } from "../../features/catalog/components/MobileFilterDrawer";
import { ProductGrid } from "../../features/catalog/components/ProductGrid";
import { ProductSearch } from "../../features/catalog/components/ProductSearch";
import { useCatalogFilters } from "../../features/catalog/hooks/useCatalogFilters";
import { useCatalogProducts } from "../../features/catalog/hooks/useCatalogProducts";
import { useCatalogReferences } from "../../features/catalog/hooks/useCatalogReferences";

export const SearchResultsPage: React.FC = () => {
  const { filters, updateFilters, clearFilters } = useCatalogFilters();
  const { products, pagination, loading, error } = useCatalogProducts(filters);
  const references = useCatalogReferences();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const closeMobileFilters = useCallback(() => setMobileFiltersOpen(false), []);
  const heading = filters.search ? `Results for “${filters.search}”` : "All products";

  const changePage = (nextPage: number) => {
    updateFilters({ page: nextPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-page">
      <section className="bg-brand px-8 py-12 max-[640px]:px-4">
        <div className="mx-auto max-w-[1200px]">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-white/85 hover:text-white">
            <ArrowLeft size={18} aria-hidden="true" />
            Storefront
          </Link>
          <p className="m-0 text-center text-sm font-bold tracking-[0.14em] text-white/80 uppercase">Product discovery</p>
          <h1 className="mt-2 mb-7 text-center text-[clamp(2rem,5vw,3.25rem)] leading-tight text-white">Find your next product</h1>
          <ProductSearch initialValue={filters.search ?? ""} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-8 py-12 max-[640px]:px-4">
        <div className="mb-7">
          <p className="eyebrow">Catalog</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.8rem,4vw,2.5rem)]">{heading}</h2>
        </div>

        {references.error && <div className="alert alert-error">{references.error}</div>}

        <CatalogToolbar
          count={pagination.total}
          loading={loading}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          onSortChange={(sort) => updateFilters({ sort })}
          sort={filters.sort}
        />

        <ActiveFilterChips
          brands={references.brands}
          categories={references.categories}
          filters={filters}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        <div className="grid items-start gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="sticky top-24 hidden rounded-card border border-line bg-surface p-5 lg:block">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
              <h2 className="m-0 text-xl">Filters</h2>
              <button
                className="cursor-pointer border-0 bg-transparent text-xs font-bold text-muted underline hover:text-brand"
                type="button"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>
            <CatalogFilters
              brands={references.brands}
              categories={references.categories}
              disabled={references.loading}
              filters={filters}
              onChange={updateFilters}
            />
          </aside>

          <main>
            <ProductGrid
              error={error}
              loading={loading}
              onClearFilters={clearFilters}
              products={products}
            />
            <Pagination
              ariaLabel="Catalog result pages"
              disabled={loading}
              onPageChange={changePage}
              page={pagination.page}
              totalPages={pagination.totalPages}
            />
          </main>
        </div>

        <MobileFilterDrawer
          brands={references.brands}
          categories={references.categories}
          filters={filters}
          onApply={updateFilters}
          onClose={closeMobileFilters}
          open={mobileFiltersOpen}
        />
      </section>
    </div>
  );
};
