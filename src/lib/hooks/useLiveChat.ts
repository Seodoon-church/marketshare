'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToChatMessages, sendChatMessage } from '@/lib/services/live-service';
import { useAuthStore } from '@/store/auth-store';
import type { LiveMessage } from '@/types/live';

interface UseLiveChatReturn {
  messages: LiveMessage[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
}

/**
 * React hook for real-time live chat
 *
 * @param sessionId - The ID of the live session
 * @returns Object containing messages, loading state, and sendMessage function
 *
 * @example
 * ```tsx
 * const { messages, isLoading, sendMessage } = useLiveChat(sessionId);
 *
 * const handleSend = async (text: string) => {
 *   await sendMessage(text);
 * };
 *
 * return (
 *   <div>
 *     {messages.map(msg => (
 *       <div key={msg.id}>{msg.userName}: {msg.message}</div>
 *     ))}
 *     <button onClick={() => handleSend('Hello!')}>Send</button>
 *   </div>
 * );
 * ```
 */
export function useLiveChat(sessionId: string | null): UseLiveChatReturn {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToChatMessages(sessionId, (updatedMessages) => {
      setMessages(updatedMessages);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || !user) {
        throw new Error('Cannot send message: session or user not available');
      }

      if (!text.trim()) {
        return;
      }

      await sendChatMessage(sessionId, {
        userId: user.id,
        userName: user.name || user.email || 'Anonymous',
        userProfileUrl: user.profileImageUrl || null,
        userRole: (user.role === 'mall_owner' || user.role === 'platform_admin') ? user.role : 'customer',
        message: text.trim(),
        type: 'chat',
      });
    },
    [sessionId, user]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
