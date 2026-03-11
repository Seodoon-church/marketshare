'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveBadge } from './LiveBadge';
import { formatKRW } from '@/lib/utils/format';
import {
  VideoCameraIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  PlayCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// ──────────────────────────────────────
// Mock Data
// ──────────────────────────────────────

interface DemoChatMessage {
  id: string;
  userName: string;
  message: string;
  type: 'chat' | 'system' | 'purchase';
  isHost?: boolean;
  time: string;
}

interface DemoProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  color: string;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'p1',
    name: '프리미엄 히알루론산 세럼 50ml',
    price: 29900,
    originalPrice: 49900,
    color: 'bg-pink-200',
  },
  {
    id: 'p2',
    name: '시카 리커버리 크림 100ml',
    price: 35000,
    originalPrice: 52000,
    color: 'bg-green-200',
  },
  {
    id: 'p3',
    name: '비타민C 브라이트닝 앰플 30ml',
    price: 24900,
    originalPrice: 39900,
    color: 'bg-yellow-200',
  },
  {
    id: 'p4',
    name: '콜라겐 탄력 아이크림 25ml',
    price: 32000,
    originalPrice: 48000,
    color: 'bg-purple-200',
  },
  {
    id: 'p5',
    name: '수분 장벽 선크림 SPF50+ 60ml',
    price: 19900,
    originalPrice: 28000,
    color: 'bg-blue-200',
  },
];

const CHAT_SCRIPT: Omit<DemoChatMessage, 'id' | 'time'>[] = [
  { userName: '뷰티맘', message: '안녕하세요~ 기대하고 왔어요!', type: 'chat' },
  {
    userName: '호스트',
    message: '여러분 환영합니다! 오늘 봄맞이 특가전 준비했어요',
    type: 'chat',
    isHost: true,
  },
  {
    userName: '스킨케어러',
    message: '히알루론산 세럼 기대됩니다',
    type: 'chat',
  },
  { userName: '김*영', message: '', type: 'purchase' },
  {
    userName: '뷰티초보',
    message: '이 제품 건성 피부에도 괜찮나요?',
    type: 'chat',
  },
  {
    userName: '호스트',
    message: '네! 건성 피부에 특히 추천드려요. 히알루론산이 수분을 꽉 잡아줍니다',
    type: 'chat',
    isHost: true,
  },
  { userName: '화장품덕후', message: '와 가격 진짜 좋다', type: 'chat' },
  {
    userName: '민감성피부',
    message: '성분 안전한가요?',
    type: 'chat',
  },
  { userName: '이*호', message: '', type: 'purchase' },
  {
    userName: '호스트',
    message: 'EWG 그린 등급 성분만 사용했어요. 민감성 피부 분들도 안심하세요!',
    type: 'chat',
    isHost: true,
  },
  { userName: '서울맘', message: '시카크림도 같이 사면 할인 되나요?', type: 'chat' },
  {
    userName: '호스트',
    message: '네! 세트로 구매하시면 추가 10% 할인 적용됩니다',
    type: 'chat',
    isHost: true,
  },
  { userName: '박*진', message: '', type: 'purchase' },
  { userName: '피부과학', message: '성분표 보여주실 수 있나요?', type: 'chat' },
  { userName: '데일리뷰티', message: '배송 얼마나 걸려요?', type: 'chat' },
  {
    userName: '호스트',
    message: '라이브 중 구매 시 내일 출고! 2-3일 내 받아보실 수 있어요',
    type: 'chat',
    isHost: true,
  },
  { userName: '쇼핑왕', message: '아이크림도 괜찮아보여요', type: 'chat' },
  { userName: '최*수', message: '', type: 'purchase' },
  { userName: '뷰티맘', message: '저도 장바구니 담았어요!', type: 'chat' },
  {
    userName: '호스트',
    message: '지금이 최저가예요! 라이브 끝나면 원래 가격으로 돌아갑니다',
    type: 'chat',
    isHost: true,
  },
];

// ──────────────────────────────────────
// Component
// ──────────────────────────────────────

export function DemoLiveWatchPage({ mallSlug }: { mallSlug: string }) {
  const [chatMessages, setChatMessages] = useState<DemoChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(1247);
  const [chatCount, setChatCount] = useState(89);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const scriptIndex = useRef(0);

  // Auto-add chat messages
  useEffect(() => {
    // Add initial batch of messages
    const initial: DemoChatMessage[] = CHAT_SCRIPT.slice(0, 3).map(
      (msg, i) => ({
        ...msg,
        id: `init-${i}`,
        time: formatNow(-180 + i * 45),
      })
    );
    setChatMessages(initial);
    scriptIndex.current = 3;

    const interval = setInterval(() => {
      if (scriptIndex.current >= CHAT_SCRIPT.length) {
        scriptIndex.current = 0; // loop
      }

      const msg = CHAT_SCRIPT[scriptIndex.current];
      const newMsg: DemoChatMessage = {
        ...msg,
        id: `msg-${Date.now()}-${scriptIndex.current}`,
        time: formatNow(0),
      };

      setChatMessages((prev) => [...prev.slice(-30), newMsg]);
      setChatCount((c) => c + 1);
      scriptIndex.current++;

      // Randomly fluctuate viewer count
      setViewerCount((v) => v + Math.floor(Math.random() * 7) - 2);
    }, 2500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleAddToCart = useCallback(
    (product: DemoProduct) => {
      setToastMessage(`"${product.name}" 장바구니에 담았습니다`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Add purchase message to chat
      const purchaseMsg: DemoChatMessage = {
        id: `purchase-${Date.now()}`,
        userName: '나',
        message: '',
        type: 'purchase',
        time: formatNow(0),
      };
      setChatMessages((prev) => [...prev.slice(-30), purchaseMsg]);
    },
    []
  );

  const featuredProduct = DEMO_PRODUCTS[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <span className="text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">
        {/* ── Desktop Layout ── */}
        <div className="hidden lg:block">
          {/* Title Bar - full width */}
          <div className="bg-white px-6 py-3 border-b flex items-center gap-3">
            <LiveBadge />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                봄맞이 뷰티 특가전 - 프리미엄 스킨케어 세트
              </h1>
              <p className="text-xs text-gray-500">
                인기 스킨케어 브랜드의 봄 한정 세트를 라이브 특가로 만나보세요!
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4" />
                <span>{viewerCount.toLocaleString()}명</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>{chatCount.toLocaleString()}건</span>
              </div>
            </div>
          </div>

          {/* Video + Chat row (same height) */}
          <div className="grid grid-cols-[1fr_340px]">
            {/* Left: Video */}
            <div className="bg-black">
              <div
                className="relative w-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-600"
                style={{ aspectRatio: '16/9' }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <PlayCircleIcon className="h-20 w-20 text-white/70 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">
                      데모 모드 - 실제 방송 시 YouTube 영상이 재생됩니다
                    </p>
                  </div>
                </div>
                <div className="absolute top-3 left-3 z-10">
                  <LiveBadge size="sm" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-80" />
              </div>
            </div>

            {/* Right: Chat (matches video height) */}
            <div className="bg-white border-l flex flex-col" style={{ aspectRatio: '340/483' }}>
              <div className="border-b px-4 py-2.5 bg-gray-50 flex-shrink-0">
                <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  실시간 채팅
                </h2>
              </div>
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto px-3 py-2 min-h-0"
              >
                <div className="space-y-0.5">
                  {chatMessages.map((msg) => (
                    <ChatMessageItem key={msg.id} message={msg} />
                  ))}
                </div>
              </div>
              <div className="px-3 py-2.5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setToastMessage('데모 모드에서는 채팅이 비활성화되어 있습니다');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={200}
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    전송
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Products Section - below video */}
          <div className="bg-white border-t">
            {/* Featured Product - compact */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-gray-900">현재 소개 상품</span>
                </div>
                <div className="flex items-center gap-4 flex-1 min-w-0 bg-white rounded-lg px-4 py-3 shadow-sm">
                  <div
                    className={`w-14 h-14 ${featuredProduct.color} rounded-lg flex-shrink-0 flex items-center justify-center`}
                  >
                    <span className="text-lg font-bold text-white">
                      {featuredProduct.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {featuredProduct.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      {featuredProduct.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatKRW(featuredProduct.originalPrice)}
                        </span>
                      )}
                      {featuredProduct.originalPrice && (
                        <span className="text-xs font-bold text-red-600">
                          {Math.round(
                            ((featuredProduct.originalPrice - featuredProduct.price) /
                              featuredProduct.originalPrice) * 100
                          )}%
                        </span>
                      )}
                      <span className="text-lg font-bold text-purple-600">
                        {formatKRW(featuredProduct.price)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(featuredProduct)}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <ShoppingCartIcon className="h-4 w-4" />
                    담기
                  </button>
                </div>
              </div>
            </div>

            {/* All Products */}
            <div className="px-6 py-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                방송 상품 ({DEMO_PRODUCTS.length}개)
              </h2>
              <div className="grid grid-cols-5 gap-4">
                {DEMO_PRODUCTS.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFeatured={product.id === featuredProduct.id}
                    onAddToCart={() => handleAddToCart(product)}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile Layout ── */}
        <div className="lg:hidden">
          {/* Video Player (mock) */}
          <div
            className="relative w-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-600"
            style={{ aspectRatio: '16/9' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircleIcon className="h-16 w-16 text-white/70" />
            </div>
            <div className="absolute top-3 left-3">
              <LiveBadge size="sm" />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-gray-900 text-white px-4 py-2 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <UserGroupIcon className="h-4 w-4" />
              <span>{viewerCount.toLocaleString()}명</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>{chatCount.toLocaleString()}건</span>
            </div>
            <LiveBadge size="sm" />
            <span className="ml-auto text-gray-400">데모</span>
          </div>

          {/* Title */}
          <div className="bg-white px-4 py-3 border-b">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              [LIVE] 봄맞이 뷰티 특가전 - 프리미엄 스킨케어 세트
            </h1>
            <p className="text-sm text-gray-600">
              인기 스킨케어 브랜드의 봄 한정 세트를 라이브 특가로 만나보세요!
            </p>
          </div>

          {/* Featured Product */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900">
                현재 소개 상품
              </h2>
            </div>
            <div className="flex gap-3 bg-white rounded-lg p-3 shadow-md">
              <div
                className={`w-20 h-20 ${featuredProduct.color} rounded-lg flex-shrink-0 flex items-center justify-center`}
              >
                <span className="text-xl font-bold text-white">
                  {featuredProduct.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                  {featuredProduct.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  {featuredProduct.originalPrice && (
                    <span className="text-xs font-bold text-red-600">
                      {Math.round(
                        ((featuredProduct.originalPrice -
                          featuredProduct.price) /
                          featuredProduct.originalPrice) *
                          100
                      )}
                      %
                    </span>
                  )}
                  <span className="text-lg font-bold text-purple-600">
                    {formatKRW(featuredProduct.price)}
                  </span>
                </div>
                <button
                  onClick={() => handleAddToCart(featuredProduct)}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                  담기
                </button>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white px-4 py-4 border-b">
            <h2 className="text-sm font-bold text-gray-900 mb-3">
              방송 상품 ({DEMO_PRODUCTS.length}개)
            </h2>
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2">
                {DEMO_PRODUCTS.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFeatured={product.id === featuredProduct.id}
                    onAddToCart={() => handleAddToCart(product)}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chat - Collapsible */}
          <div className="bg-white border-t">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="w-full px-4 py-3 flex items-center justify-between font-bold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>실시간 채팅</span>
              </div>
              {isChatOpen ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronUpIcon className="h-5 w-5" />
              )}
            </button>
            {isChatOpen && (
              <div className="h-96 border-t overflow-y-auto px-4 py-2">
                <div className="space-y-1">
                  {chatMessages.map((msg) => (
                    <ChatMessageItem key={msg.id} message={msg} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Sub-components
// ──────────────────────────────────────

function ChatMessageItem({ message }: { message: DemoChatMessage }) {
  if (message.type === 'system') {
    return (
      <div className="text-center py-2">
        <span className="text-sm text-gray-500 italic">{message.message}</span>
      </div>
    );
  }

  if (message.type === 'purchase') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-2">
        <p className="text-sm font-medium text-yellow-800">
          {message.userName}님이 구매했습니다!
        </p>
      </div>
    );
  }

  const isHost = message.isHost;

  return (
    <div className="py-2">
      <div className="flex items-start gap-2">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
            isHost
              ? 'bg-blue-500'
              : 'bg-gray-400'
          }`}
        >
          {message.userName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-sm ${
                isHost ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              {message.userName}
            </span>
            {isHost && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                호스트
              </span>
            )}
            <span className="text-xs text-gray-400">{message.time}</span>
          </div>
          <p className="text-sm text-gray-800 mt-1 break-words">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  isFeatured,
  onAddToCart,
  compact,
}: {
  product: DemoProduct;
  isFeatured: boolean;
  onAddToCart: () => void;
  compact?: boolean;
}) {
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100
      )
    : 0;

  return (
    <div
      className={`flex-shrink-0 bg-white border rounded-xl overflow-hidden hover:shadow-md transition ${
        compact ? 'w-44' : 'w-64'
      } ${isFeatured ? 'ring-2 ring-red-500' : 'border-gray-200'}`}
    >
      <div
        className={`relative ${compact ? 'aspect-square' : 'aspect-square'}`}
      >
        <div
          className={`w-full h-full ${product.color} flex items-center justify-center`}
        >
          <span
            className={`font-bold text-white ${
              compact ? 'text-2xl' : 'text-4xl'
            }`}
          >
            {product.name.charAt(0)}
          </span>
        </div>
        {isFeatured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
            추천
          </div>
        )}
      </div>

      <div className={compact ? 'p-3' : 'p-4'}>
        <h4
          className={`font-medium text-gray-900 line-clamp-2 mb-2 ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {product.name}
        </h4>
        <div className="mb-2">
          {hasDiscount && (
            <div className="text-xs text-gray-400 line-through">
              {formatKRW(product.originalPrice!)}
            </div>
          )}
          <div className="flex items-baseline gap-1">
            {hasDiscount && (
              <span
                className={`font-bold text-red-600 ${
                  compact ? 'text-xs' : 'text-sm'
                }`}
              >
                {discountPercent}%
              </span>
            )}
            <span
              className={`font-bold text-gray-900 ${
                compact ? 'text-sm' : 'text-lg'
              }`}
            >
              {formatKRW(product.price)}
            </span>
          </div>
        </div>
        <button
          onClick={onAddToCart}
          className={`w-full bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          장바구니
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function formatNow(offsetSeconds: number): string {
  const d = new Date(Date.now() + offsetSeconds * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}
