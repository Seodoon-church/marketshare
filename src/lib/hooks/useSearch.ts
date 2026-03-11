import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '@/types';
import { searchProducts, type ProductFilters } from '@/lib/services/product-service';
import { useDebounce } from './useDebounce';

const SEARCH_HISTORY_KEY = 'marketshare-search-history';
const MAX_HISTORY_ITEMS = 20;

interface UseSearchReturn {
  results: Product[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  search: (newQuery: string) => void;
  searchHistory: string[];
  clearHistory: () => void;
}

/**
 * Reads search history from localStorage.
 */
function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a query to search history in localStorage.
 */
function saveToHistory(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const history = getSearchHistory();
    const filtered = history.filter((item) => item !== query);
    const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Search hook with debounce (300ms) and localStorage history tracking.
 *
 * @param query - The initial search query
 * @param filters - Optional search filters (category, price range, sort, etc.)
 */
export function useSearch(
  query: string,
  filters?: ProductFilters
): UseSearchReturn {
  const [currentQuery, setCurrentQuery] = useState(query);
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const isMounted = useRef(true);

  const debouncedQuery = useDebounce(currentQuery, 300);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchProducts(debouncedQuery, filters);
        if (cancelled) return;

        setResults(data.products);
        setTotalCount(data.products.length);

        // Save to history on successful search
        saveToHistory(debouncedQuery);
        setSearchHistory(getSearchHistory());
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err : new Error('검색에 실패했습니다.')
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, JSON.stringify(filters)]);

  const search = useCallback((newQuery: string) => {
    setCurrentQuery(newQuery);
  }, []);

  const clearHistory = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch {
      // Silently fail
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    totalCount,
    search,
    searchHistory,
    clearHistory,
  };
}
