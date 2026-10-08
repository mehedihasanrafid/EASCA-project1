import React, { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, Package, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ProductSuggestion } from "../../../api/products";
import { formatProductPrice } from "../utils/formatters";
import { useProductSuggestions } from "../hooks/useProductSuggestions";

interface Props {
  className?: string;
  initialValue?: string;
  placeholder?: string;
}

interface HighlightedTextProps {
  query: string;
  text: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ query, text }) => {
  const index = text.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());
  if (index < 0 || !query.trim()) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-warning-soft px-0 text-inherit">
        {text.slice(index, index + query.trim().length)}
      </mark>
      {text.slice(index + query.trim().length)}
    </>
  );
};

export const ProductSearch: React.FC<Props> = ({
  className = "",
  initialValue = "",
  placeholder = "Search products, brands, categories or SKU",
}) => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = `product-search-${useId().replace(/:/g, "")}`;
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { suggestions, loading, error } = useProductSuggestions(query);
  const normalizedQuery = query.trim();
  const showDropdown = open && normalizedQuery.length >= 2;

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  const openSuggestion = (suggestion: ProductSuggestion) => {
    setOpen(false);
    navigate(`/products/${suggestion.slug}`);
  };

  const openResults = () => {
    if (normalizedQuery.length < 2) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(normalizedQuery)}`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      openSuggestion(suggestions[activeIndex]);
      return;
    }
    openResults();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
  };

  return (
    <div className={`relative z-20 mx-auto w-full max-w-2xl ${className}`} ref={rootRef}>
      <form className="flex items-stretch rounded-card bg-surface p-1.5 shadow-[0_18px_45px_rgba(15,48,30,0.18)] focus-within:ring-4 focus-within:ring-brand/20" onSubmit={submit} role="search">
        <label className="sr-only" htmlFor={`${listboxId}-input`}>Search products</label>
        <Search className="my-auto ml-3 shrink-0 text-muted" aria-hidden="true" size={21} />
        <input
          id={`${listboxId}-input`}
          type="search"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-left text-base text-ink outline-none placeholder:text-muted"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (normalizedQuery.length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control border-0 bg-brand px-5 font-bold text-white transition-colors hover:bg-brand-hover"
        >
          <span className="max-[480px]:sr-only">Search</span>
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </form>

      {showDropdown && (
        <div className="absolute top-full right-0 left-0 mt-2 overflow-hidden rounded-card border border-line bg-surface text-left text-ink shadow-[0_20px_55px_rgba(15,48,30,0.2)]">
          <div id={listboxId} role="listbox" aria-label="Product suggestions" className="max-h-[26rem] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted" role="status">
                <LoaderCircle className="animate-spin" size={18} />
                Finding products...
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-5 text-sm text-danger" role="status">
                {error} Press Enter to search the catalog.
              </div>
            )}

            {!loading && !error && suggestions.length === 0 && (
              <div className="px-4 py-5 text-sm text-muted" role="status">
                No product suggestions for “{normalizedQuery}”.
              </div>
            )}

            {!loading && !error && suggestions.map((suggestion, index) => (
              <button
                id={`${listboxId}-option-${index}`}
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-control border-0 px-3 py-2.5 text-left transition-colors ${activeIndex === index ? "bg-positive-soft" : "bg-transparent hover:bg-page"}`}
                onClick={() => openSuggestion(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control border border-line bg-page text-muted">
                  {suggestion.thumbnail ? (
                    <img
                      src={suggestion.thumbnail.url}
                      alt={suggestion.thumbnail.altText || suggestion.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package aria-hidden="true" size={22} />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="truncate text-sm">
                    <HighlightedText text={suggestion.name} query={normalizedQuery} />
                  </strong>
                  <span className="truncate text-xs text-muted">
                    {suggestion.category.name}{suggestion.brand ? ` · ${suggestion.brand.name}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <strong className="text-sm text-brand">{formatProductPrice(suggestion.price)}</strong>
                  <small className={suggestion.inStock ? "text-positive" : "text-danger"}>
                    {suggestion.inStock ? "In stock" : "Out of stock"}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between border-0 border-t border-line bg-page px-5 py-3 text-left text-sm font-bold text-brand hover:bg-positive-soft"
            onClick={openResults}
          >
            View all results for “{normalizedQuery}”
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      )}
    </div>
  );
};
