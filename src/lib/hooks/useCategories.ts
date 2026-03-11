import { useState, useEffect, useCallback } from 'react';
import type { Category } from '@/types';
import {
  getGlobalCategories,
  getMallCategories,
} from '@/lib/services/category-service';

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches platform-wide global categories.
 * These are the shared category tree used across all malls.
 */
export function useGlobalCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getGlobalCategories();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('카테고리를 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return { categories, isLoading, error, refetch };
}

/**
 * Fetches categories specific to a mall.
 * Malls may have a subset of global categories or custom category structures.
 *
 * @param mallId - The mall ID to fetch categories for
 */
export function useMallCategories(
  mallId: string | null | undefined
): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!mallId) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMallCategories(mallId);
        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('카테고리를 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [mallId, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return { categories, isLoading, error, refetch };
}
