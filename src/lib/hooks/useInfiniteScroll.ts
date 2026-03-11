import { useRef, useEffect, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** IntersectionObserver threshold (0 to 1). Default: 0.1 */
  threshold?: number;
  /** Root margin for the observer. Default: '100px' */
  rootMargin?: string;
  /** Whether the observer is enabled. Default: true */
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  /** Ref to attach to the sentinel element */
  ref: React.RefCallback<HTMLElement>;
  /** Whether the callback is currently executing */
  isLoading: boolean;
}

/**
 * Infinite scroll hook using IntersectionObserver.
 * Attach the returned ref to a sentinel element at the bottom of your list.
 * When the sentinel becomes visible, the callback is triggered.
 *
 * @param callback - Async function to call when sentinel is visible
 * @param options - Configuration options
 */
export function useInfiniteScroll(
  callback: () => Promise<void> | void,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options;

  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date without re-creating the observer
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      elementRef.current = node;

      if (!node || !enabled) return;

      observerRef.current = new IntersectionObserver(
        async (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !isLoading) {
            setIsLoading(true);
            try {
              await callbackRef.current();
            } finally {
              setIsLoading(false);
            }
          }
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(node);
    },
    [enabled, threshold, rootMargin, isLoading]
  );

  return { ref, isLoading };
}
