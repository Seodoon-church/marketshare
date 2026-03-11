import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/types';
import {
  getUserOrders,
  getMallOrders,
  getOrderById,
  type OrderFilters,
} from '@/lib/services/order-service';

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseOrderReturn {
  order: Order | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches orders for a specific user.
 *
 * @param userId - The user ID to fetch orders for
 * @param filters - Optional order filters (status, date range, etc.)
 */
export function useUserOrders(
  userId: string | null | undefined,
  filters?: OrderFilters
): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserOrders(userId, filters);
        if (!cancelled) {
          setOrders(result.orders);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('주문 목록을 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [userId, JSON.stringify(filters), refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return { orders, isLoading, error, refetch };
}

/**
 * Fetches orders for a specific mall (mall owner perspective).
 *
 * @param mallId - The mall ID to fetch orders for
 * @param filters - Optional order filters (status, date range, etc.)
 */
export function useMallOrders(
  mallId: string | null | undefined,
  filters?: OrderFilters
): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!mallId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getMallOrders(mallId, filters);
        if (!cancelled) {
          setOrders(result.orders);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('주문 목록을 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [mallId, JSON.stringify(filters), refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return { orders, isLoading, error, refetch };
}

/**
 * Fetches a single order by ID.
 *
 * @param orderId - The order ID to fetch
 */
export function useOrder(orderId: string | null | undefined): UseOrderReturn {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOrderById(orderId);
        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('주문 정보를 불러오는 데 실패했습니다.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return { order, isLoading, error, refetch };
}
