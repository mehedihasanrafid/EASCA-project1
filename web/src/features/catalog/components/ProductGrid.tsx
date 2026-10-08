import React from "react";
import { PackageSearch } from "lucide-react";

import type { Product } from "../../../api/products";
import { ProductCard } from "../../../components/ProductCard";

interface Props {
  error: string;
  loading: boolean;
  onClearFilters: () => void;
  products: Product[];
}

export const ProductGrid: React.FC<Props> = ({ error, loading, onClearFilters, products }) => {
  if (error) return <div className="alert alert-error">{error}</div>;

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6" aria-label="Loading products">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="overflow-hidden rounded-control border border-line bg-surface" key={index}>
            <div className="aspect-square animate-pulse bg-[#e7eee9]" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#e7eee9]" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-[#e7eee9]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-10 text-center">
        <PackageSearch className="mx-auto text-brand" size={44} />
        <h2 className="mt-4 mb-2 text-2xl">No products match these filters</h2>
        <p className="m-0 text-muted">Try a different category, brand, price range, or stock option.</p>
        <button
          className="mt-5 cursor-pointer rounded-control border-0 bg-brand px-5 py-2.5 font-bold text-white hover:bg-brand-hover"
          type="button"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
};
