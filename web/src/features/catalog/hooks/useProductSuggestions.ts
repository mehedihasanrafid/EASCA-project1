import { useEffect, useState } from "react";

import { ApiException } from "../../../api/client";
import { ProductSuggestion, productApi } from "../../../api/products";

interface SuggestionState {
  error: string;
  loading: boolean;
  suggestions: ProductSuggestion[];
}

const emptyState: SuggestionState = {
  error: "",
  loading: false,
  suggestions: [],
};

export function useProductSuggestions(query: string, delay = 280) {
  const [state, setState] = useState<SuggestionState>(emptyState);

  useEffect(() => {
    const search = query.trim();

    if (search.length < 2) {
      setState(emptyState);
      return;
    }

    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(async () => {
      setState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const suggestions = await productApi.getSearchSuggestions(search, 8, controller.signal);
        if (active) setState({ suggestions, loading: false, error: "" });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setState({
          suggestions: [],
          loading: false,
          error: error instanceof ApiException
            ? error.error.message
            : "Suggestions are temporarily unavailable.",
        });
      }
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [delay, query]);

  return state;
}
