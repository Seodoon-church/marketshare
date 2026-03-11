import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '@/types';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getProducts,
  getMallProducts,
  getProductById,
  type ProductFilters,
} from '@/lib/services/product-service';

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Fetches a paginated list of products with optional filters.
 *
 * @param filters - Optional filters (category, mall, price range, sort, etc.)
 */
export function useProducts(filters?: ProductFilters): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const isMounted = useRef(true);

  // Reset when filters change
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    lastDocRef.current = null;
  }, [JSON.stringify(filters)]);

  // Fetch products
  useEffect(() => {
    isMounted.current = true;
    let cancelled = false;

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const serviceFilters: ProductFilters = {
          ...filters,
          ...(page > 1 && lastDocRef.current
            ? { startAfterDoc: lastDocRef.current }
            : {}),
        };
        // mallId가 있으면 malls/{mallId}/products 서브컬렉션 직접 조회
        // products_aggregate는 Cloud Functions에서만 쓰기 가능하므로 서브컬렉션이 정확한 데이터 소스
        const result = serviceFilters.mallId
          ? await getMallProducts(serviceFilters.mallId, serviceFilters)
          : await getProducts(serviceFilters);
        if (cancelled) return;

        lastDocRef.current = result.lastDoc;
        setProducts((prev) =>
          page === 1 ? result.products : [...prev, ...result.products]
        );
        setHasMore(result.hasMore);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('상품을 불러오는 데 실패했습니다.'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
      isMounted.current = false;
    };
  }, [page, JSON.stringify(filters)]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore]);

  return { products, isLoading, error, hasMore, loadMore };
}

interface UseProductReturn {
  product: Product | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches a single product by ID.
 *
 * @param productId - The product ID to fetch
 */
export function useProduct(productId: string | null | undefined): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProductById(productId);
        if (!cancelled) {
          setProduct(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('상품을 불러오는 데 실패했습니다.'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return { product, isLoading, error };
}
