'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveChat } from '@/lib/hooks/useLiveChat';
import { useAuthStore } from '@/store/auth-store';
import type { LiveMessage } from '@/types/live';

interface LiveChatBoxProps {
  sessionId: string;
  isHost?: boolean;
  className?: string;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function LiveChatBox({ sessionId, isHost = false, className = '' }: LiveChatBoxProps) {
  const { messages, isLoading, sendMessage } = useLiveChat(sessionId);
  const { user } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    await sendMessage(inputValue.trim());
    setInputValue('');
  };

  const renderMessage = (message: LiveMessage) => {
    const messageTime = formatTime(message.createdAt);

    // System message
    if (message.type === 'system') {
      return (
        <div key={message.id} className="text-center py-2">
          <span className="text-sm text-gray-500 italic">{message.message}</span>
        </div>
      );
    }

    // Purchase message
    if (message.type === 'purchase') {
      return (
        <div key={message.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-2">
          <p className="text-sm font-medium text-yellow-800">
            🎉 {message.userName}님이 구매했습니다!
          </p>
        </div>
      );
    }

    // Chat message
    const isOwner = message.userRole === 'mall_owner';
    const nameColor = isOwner ? 'text-blue-600' : 'text-gray-900';

    return (
      <div key={message.id} className="py-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
            {message.userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${nameColor}`}>{message.userName}</span>
              {isOwner && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  호스트
                </span>
              )}
              <span className="text-xs text-gray-400">{messageTime}</span>
            </div>
            <p className="text-sm text-gray-800 mt-1 break-words">{message.message}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-bold text-gray-900">실시간 채팅</h3>
        <p className="text-xs text-gray-500 mt-0.5">{messages.length}개의 메시지</p>
      </div>

      {/* Chat messages area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-2 min-h-0" style={{ maxHeight: '400px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-sm">메시지를 불러오는 중...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-sm">첫 메시지를 남겨보세요!</div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map(renderMessage)}
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        {user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </form>
        ) : (
          <div className="text-center py-2 text-sm text-gray-500">
            로그인 후 채팅에 참여하세요
          </div>
        )}
      </div>
    </div>
  );
}
