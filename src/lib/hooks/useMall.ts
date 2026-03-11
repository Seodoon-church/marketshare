import { useState, useEffect, useCallback } from 'react';
import type { Mall } from '@/types';
import {
  getMallById,
  getMallBySlug,
  getMalls,
  getMallStats,
  type MallFilters,
  type MallStats,
} from '@/lib/services/mall-service';

interface UseMallReturn {
  data: Mall | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseMallsReturn {
  data: Mall[];
  isLoading: boolean;
  error: Error | null;
}

interface UseMallStatsReturn {
  data: MallStats | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches a single mall by its ID.
 *
 * @param mallId - The mall ID to fetch
 */
export function useMall(mallId: string | null | undefined): UseMallReturn {
  const [data, setData] = useState<Mall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mallId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMall = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const mall = await getMallById(mallId);
        if (!cancelled) {
          setData(mall);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('쇼핑몰 정보를 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchMall();

    return () => {
      cancelled = true;
    };
  }, [mallId]);

  return { data, isLoading, error };
}

/**
 * Fetches a single mall by its slug (URL-friendly name).
 *
 * @param slug - The mall slug to look up
 */
export function useMallBySlug(slug: string | null | undefined): UseMallReturn {
  const [data, setData] = useState<Mall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMall = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const mall = await getMallBySlug(slug);
        if (!cancelled) {
          setData(mall);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('쇼핑몰 정보를 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchMall();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { data, isLoading, error };
}

/**
 * Fetches a list of malls with optional filters.
 *
 * @param filters - Optional filters (status, search query, etc.)
 */
export function useMalls(filters?: MallFilters): UseMallsReturn {
  const [data, setData] = useState<Mall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchMalls = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const malls = await getMalls(filters);
        if (!cancelled) {
          setData(malls);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('쇼핑몰 목록을 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchMalls();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filters)]);

  return { data, isLoading, error };
}

/**
 * Fetches statistics for a specific mall (revenue, orders, products, etc.).
 *
 * @param mallId - The mall ID to fetch stats for
 */
export function useMallStats(mallId: string | null | undefined): UseMallStatsReturn {
  const [data, setData] = useState<MallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mallId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const stats = await getMallStats(mallId);
        if (!cancelled) {
          setData(stats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err
              : new Error('쇼핑몰 통계를 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [mallId]);

  return { data, isLoading, error };
}
