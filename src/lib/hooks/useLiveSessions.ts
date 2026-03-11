'use client';

import { useState, useEffect } from 'react';
import { getLiveSessions, getActiveLiveSession, getChildMallLiveSessions, getActiveChildMallSessions } from '@/lib/services/live-service';
import type { LiveSession, LiveSessionStatus } from '@/types/live';

interface UseLiveSessionsReturn {
  sessions: LiveSession[];
  isLoading: boolean;
  error: Error | null;
}

interface UseActiveLiveSessionReturn {
  session: LiveSession | null;
  isLoading: boolean;
}

/**
 * React hook to fetch live sessions for a mall
 *
 * @param mallId - The ID of the mall
 * @param status - Optional status filter
 * @returns Object containing sessions array, loading state, and error
 *
 * @example
 * ```tsx
 * const { sessions, isLoading, error } = useLiveSessions(mallId, 'live');
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {sessions.map(session => (
 *       <div key={session.id}>{session.title}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useLiveSessions(
  mallId: string | null,
  status?: LiveSessionStatus,
  parentMallId?: string | null
): UseLiveSessionsReturn {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mallId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const mallIds = parentMallId ? [mallId, parentMallId] : mallId;
        const fetchedSessions = await getLiveSessions(mallIds, status);

        if (isMounted) {
          setSessions(fetchedSessions);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch live sessions'));
          setIsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [mallId, status, parentMallId]);

  return {
    sessions,
    isLoading,
    error,
  };
}

/**
 * React hook to check if a mall has an active live session
 *
 * @param mallId - The ID of the mall
 * @returns Object containing active session (if any) and loading state
 *
 * @example
 * ```tsx
 * const { session, isLoading } = useActiveLiveSession(mallId);
 *
 * if (isLoading) return <div>Checking...</div>;
 *
 * return session ? (
 *   <div>Live now: {session.title}</div>
 * ) : (
 *   <div>No active stream</div>
 * );
 * ```
 */
export function useActiveLiveSession(mallId: string | null, parentMallId?: string | null): UseActiveLiveSessionReturn {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mallId) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchActiveSession = async () => {
      try {
        setIsLoading(true);

        const mallIds = parentMallId ? [mallId, parentMallId] : mallId;
        const activeSession = await getActiveLiveSession(mallIds);

        if (isMounted) {
          setSession(activeSession);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch active live session:', err);
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    fetchActiveSession();

    return () => {
      isMounted = false;
    };
  }, [mallId, parentMallId]);

  return {
    session,
    isLoading,
  };
}

/**
 * MCN Hub: Fetch live sessions from all child malls (celebrities)
 */
export function useMCNLiveSessions(
  childMallIds: string[] | null,
  status?: LiveSessionStatus
): UseLiveSessionsReturn {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!childMallIds || childMallIds.length === 0) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedSessions = await getChildMallLiveSessions(childMallIds, status);

        if (isMounted) {
          setSessions(fetchedSessions);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch MCN live sessions'));
          setIsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [childMallIds?.join(','), status]);

  return { sessions, isLoading, error };
}

/**
 * MCN Hub: Get all currently active sessions from child malls
 */
export function useMCNActiveSessions(
  childMallIds: string[] | null
): { sessions: LiveSession[]; isLoading: boolean } {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!childMallIds || childMallIds.length === 0) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const activeSessions = await getActiveChildMallSessions(childMallIds);
        if (isMounted) {
          setSessions(activeSessions);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setSessions([]);
          setIsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => { isMounted = false; };
  }, [childMallIds?.join(',')]);

  return { sessions, isLoading };
}
