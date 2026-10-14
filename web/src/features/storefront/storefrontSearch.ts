/** Large page search bars carry this marker so the header knows when to take over. */
export const HEADER_SEARCH_SOURCE_SELECTOR = "[data-header-search-source='true']";

/** Search text is shared between the large page search and compact header search. */
export const PRODUCT_SEARCH_DRAFT_EVENT = "dokanbd:product-search-draft";

export function publishProductSearchDraft(query: string) {
  window.dispatchEvent(new CustomEvent<string>(PRODUCT_SEARCH_DRAFT_EVENT, { detail: query }));
}

/**
 * Show the compact search after the bottom of the large search reaches the
 * sticky header. If a page has no large search, show it immediately.
 */
export function shouldShowHeaderSearch(sourceBottom: number | null) {
  if (sourceBottom === null) return true;
  const stickyHeaderEdge = 80;
  return sourceBottom <= stickyHeaderEdge;
}
