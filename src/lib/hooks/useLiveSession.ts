'use client';

import { useState, useEffect } from 'react';
import { subscribeToLiveSession } from '@/lib/services/live-service';
import type { LiveSession } from '@/types/live';

interface UseLiveSessionReturn {
  session: LiveSession | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook for real-time live session updates
 *
 * @param sessionId - The ID of the live session to subscribe to
 * @returns Object containing session data, loading state, and error
 *
 * @example
 * ```tsx
 * const { session, isLoading, error } = useLiveSession(sessionId);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!session) return <div>Session not found</div>;
 *
 * return <div>{session.title}</div>;
 * ```
 */
export function useLiveSession(sessionId: string | null): UseLiveSessionReturn {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToLiveSession(sessionId, (updatedSession) => {
        setSession(updatedSession);
        setIsLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to subscribe to live session'));
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionId]);

  return {
    session,
    isLoading,
    error,
  };
}
