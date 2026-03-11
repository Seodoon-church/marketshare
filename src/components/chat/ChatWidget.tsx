'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase/config';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '안녕하세요! 고객 상담 챗봇입니다. 배송, 결제, 교환/반품 등 궁금한 점을 물어보세요.',
};

const QUICK_QUESTIONS = [
  '배송 얼마나 걸려요?',
  '무료배송 기준이 뭐예요?',
  '교환/반품 하고 싶어요',
  '결제 수단이 뭐가 있어요?',
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Firestore에서 챗봇 활성화 여부 확인
  useEffect(() => {
    async function checkEnabled() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'chatbot'));
        if (snap.exists()) {
          setIsEnabled(snap.data().enabled !== false);
        } else {
          setIsEnabled(true); // 설정 문서 없으면 기본 활성화
        }
      } catch {
        setIsEnabled(true); // 에러 시 기본 활성화
      }
    }
    checkEnabled();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatbot = httpsCallable<
        { message: string; history: Message[] },
        { reply: string }
      >(functions, 'chatbot');

      const history = messages
        .filter((m) => m !== WELCOME_MESSAGE)
        .slice(-10);

      const result = await chatbot({ message: text.trim(), history });
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // 비활성화 또는 로딩 중이면 렌더링 안 함
  if (isEnabled === null || isEnabled === false) return null;

  return (
    <>
      {/* 챗봇 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="고객 상담 챗봇 열기"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(600px,calc(100vh-3rem))] w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">고객 상담</p>
                <p className="text-xs text-white/70">AI 챗봇이 도와드립니다</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="챗봇 닫기"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* 로딩 표시 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* 빠른 질문 (첫 화면에서만) */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/10"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-gray-100 px-3 py-2.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 점을 입력하세요..."
              disabled={isLoading}
              maxLength={500}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:bg-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
              aria-label="메시지 보내기"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
