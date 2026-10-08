import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

import type { CategoryOption } from "../../../api/catalog";

interface Props {
  categories: CategoryOption[];
  loading?: boolean;
}

const AUTO_ADVANCE_MS = 4500;

function productLabel(count: number) {
  return `${count} product${count === 1 ? "" : "s"}`;
}

export const CategoryNavigation: React.FC<Props> = ({ categories, loading = false }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const scrollFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const goTo = useCallback(
    (requestedIndex: number, smooth = true) => {
      if (categories.length === 0) return;
      const nextIndex = (requestedIndex + categories.length) % categories.length;
      const card = cardRefs.current[nextIndex];
      const track = trackRef.current;
      if (card && track) {
        track.scrollTo({
          left: card.offsetLeft - track.offsetLeft,
          behavior: smooth && !reducedMotion ? "smooth" : "auto",
        });
      }
      setActiveIndex(nextIndex);
    },
    [categories.length, reducedMotion],
  );

  const move = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current;
      if (!track) return;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;

      if (direction === 1 && atEnd) goTo(0);
      else if (direction === -1 && atStart) goTo(categories.length - 1);
      else goTo(activeIndex + direction);
    },
    [activeIndex, categories.length, goTo],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || categories.length <= 1) return;
    const timer = window.setTimeout(
      () => move(1),
      AUTO_ADVANCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [categories.length, move, paused, reducedMotion]);

  useEffect(() => {
    if (activeIndex >= categories.length) setActiveIndex(0);
  }, [activeIndex, categories.length]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
  }, []);

  const updateActiveCard = () => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const track = trackRef.current;
      if (!track) return;

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const distance = Math.abs(card.offsetLeft - track.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveIndex(closestIndex);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1200px] px-8 pt-12 max-[640px]:px-4" aria-label="Loading product categories">
        <div className="mb-5">
          <p className="eyebrow">Explore the catalog</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.6rem,4vw,2.2rem)]">Shop by category</h2>
        </div>
        <div className="flex gap-4 overflow-hidden pb-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              className="h-[310px] min-w-[88%] animate-pulse rounded-card bg-[#e1ece5] sm:h-[280px] sm:min-w-[calc(50%-0.5rem)] lg:h-[300px] lg:min-w-[calc(33.333%-0.667rem)]"
              key={index}
            />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section
      className="mx-auto w-full max-w-[1200px] px-8 pt-12 max-[640px]:px-4"
      aria-labelledby="shop-category-title"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Explore the catalog</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.6rem,4vw,2.2rem)]" id="shop-category-title">
            Shop by category
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink transition hover:border-brand hover:text-brand"
            type="button"
            aria-label="Previous category"
            onClick={() => move(-1)}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink transition hover:border-brand hover:text-brand"
            type="button"
            aria-label="Next category"
            onClick={() => move(1)}
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Product categories"
        onKeyDown={handleKeyDown}
        onScroll={updateActiveCard}
      >
        {categories.map((category, index) => (
          <Link
            ref={(element) => { cardRefs.current[index] = element; }}
            className="group relative h-[310px] min-w-[88%] snap-start overflow-hidden rounded-card border border-line bg-brand text-white no-underline shadow-[0_12px_35px_rgba(15,48,30,0.16)] sm:h-[280px] sm:min-w-[calc(50%-0.5rem)] lg:h-[300px] lg:min-w-[calc(33.333%-0.667rem)]"
            key={category.id}
            to={`/search?category=${encodeURIComponent(category.slug)}`}
            aria-label={`Shop ${category.name}, ${productLabel(category.productCount)}`}
          >
            {category.displayImageUrl ? (
              <img
                className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105 group-focus-visible:scale-105"
                src={category.displayImageUrl}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,var(--primary),var(--primary-hover))] text-white/70">
                <ImageIcon size={54} aria-hidden="true" />
              </span>
            )}
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,36,23,0.05)_20%,rgba(8,36,23,0.88)_100%)]" aria-hidden="true" />
            <span className="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-4 p-6">
              <span>
                <small className="mb-1 block text-xs font-bold tracking-[0.12em] text-white/75 uppercase">
                  {productLabel(category.productCount)}
                </small>
                <strong className="block text-[clamp(1.5rem,4vw,2rem)] leading-tight">{category.name}</strong>
                <span className="mt-2 block text-sm font-semibold text-white/85">Shop now</span>
              </span>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-brand transition group-hover:translate-x-1 group-focus-visible:translate-x-1">
                <ArrowRight size={19} aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label="Choose category slide">
          {categories.map((category, index) => (
            <button
              key={category.id}
              className={`h-2.5 cursor-pointer rounded-full border-0 transition-all ${index === activeIndex ? "w-8 bg-brand" : "w-2.5 bg-line hover:bg-muted"}`}
              type="button"
              aria-label={`Show ${category.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-brand" to="/search">
          All products <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing category {activeIndex + 1} of {categories.length}: {categories[activeIndex]?.name}
      </p>
    </section>
  );
};
