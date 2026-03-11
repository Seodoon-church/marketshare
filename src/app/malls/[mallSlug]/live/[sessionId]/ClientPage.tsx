'use client';

import React from 'react';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useLiveSession } from '@/lib/hooks/useLiveSession';
import { useLiveChat } from '@/lib/hooks/useLiveChat';
import { useProducts } from '@/lib/hooks/useProducts';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LiveVideoPlayer } from '@/components/live/LiveVideoPlayer';
import { LiveChatBox } from '@/components/live/LiveChatBox';
import { LiveProductCarousel } from '@/components/live/LiveProductCarousel';
import { LiveBadge } from '@/components/live/LiveBadge';
import { DemoLiveWatchPage } from '@/components/live/DemoLiveWatchPage';
import type { Product } from '@/types';
import { formatKRW } from '@/lib/utils/format';
import {
  VideoCameraIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function ClientPage({
  mallSlug: paramSlug,
  sessionId: paramSessionId,
}: {
  mallSlug: string;
  sessionId: string;
}) {
  const mallSlug = useMallSlug(paramSlug);
  const isDemo = mallSlug === 'demo-store' || mallSlug === 'demo';

  // Extract sessionId from URL for static export
  const [sessionId, setSessionId] = React.useState(paramSessionId);
  React.useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split('/live/');
    if (parts[1]) {
      const urlSessionId = parts[1].split('/')[0];
      if (urlSessionId && urlSessionId !== sessionId) {
        setSessionId(urlSessionId);
      }
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const { session, isLoading: sessionLoading } = useLiveSession(sessionId);
  const { products: allProducts, isLoading: productsLoading } = useProducts({
    mallId: mall?.id,
  });

  const [isChatOpen, setIsChatOpen] = React.useState(true);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const user = useAuthStore((state) => state.user);
  const addToCart = useCartStore((state) => state.addItem);

  // Filter products for this live session
  const liveProducts = React.useMemo(() => {
    if (!allProducts || !session) return [];
    return allProducts.filter((p) => session.productIds.includes(p.id));
  }, [allProducts, session]);

  // Get featured product
  const featuredProduct = React.useMemo(() => {
    if (!session?.featuredProductId) return null;
    return liveProducts.find((p) => p.id === session.featuredProductId);
  }, [liveProducts, session]);

  // Countdown for scheduled sessions
  const [countdown, setCountdown] = React.useState('');

  React.useEffect(() => {
    if (session?.status !== 'scheduled') return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(session.scheduledAt).getTime();
      const diff = start - now;

      if (diff <= 0) {
        setCountdown('곧 시작됩니다');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}일 ${hours}시간 ${minutes}분`);
      } else if (hours > 0) {
        setCountdown(`${hours}시간 ${minutes}분 ${seconds}초`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}분 ${seconds}초`);
      } else {
        setCountdown(`${seconds}초`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleAddToCart = (product: Product) => {
    if (!mall) return;

    addToCart({
      productId: product.id,
      mallId: mall.id,
      mallName: mall.name,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice ?? null,
      quantity: 1,
      options: {},
      imageUrl: product.images[0]?.url || '',
      stock: product.stock,
    });

    setToastMessage('장바구니에 담았습니다');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isLoading = mallLoading || sessionLoading || productsLoading;

  // Demo mode - show demo watch page
  if (isDemo) {
    return <DemoLiveWatchPage mallSlug={mallSlug} />;
  }

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!mall) {
    return (
      <EmptyState
        icon={<VideoCameraIcon className="h-12 w-12" />}
        title="몰을 찾을 수 없습니다"
        description="요청하신 몰이 존재하지 않습니다."
      />
    );
  }

  if (!session) {
    return (
      <EmptyState
        icon={<VideoCameraIcon className="h-12 w-12" />}
        title="라이브 방송을 찾을 수 없습니다"
        description="요청하신 라이브 방송이 존재하지 않습니다."
      />
    );
  }

  // Scheduled state
  if (session.status === 'scheduled') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Preview Image */}
            <div className="relative aspect-video bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <CalendarIcon className="h-24 w-24 mb-4 opacity-80" />
                <h2 className="text-3xl font-bold mb-2">방송 예정</h2>
                <div className="text-xl mb-4">
                  {new Date(session.scheduledAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-2xl font-bold">
                  {countdown}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-6 sm:p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {session.title}
              </h1>
              {session.description && (
                <p className="text-gray-600 mb-6 text-lg">
                  {session.description}
                </p>
              )}

              {/* Products Preview */}
              {liveProducts.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    방송 예정 상품 ({liveProducts.length}개)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {liveProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                          {product.name}
                        </h4>
                        <p className="text-purple-600 font-bold">
                          {formatKRW(product.salePrice || product.price)}
                        </p>
                      </div>
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

  // Ended state (VOD or finished)
  if (session.status === 'ended') {
    if (!session.vodUrl) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-gray-600 to-gray-800">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <ClockIcon className="h-24 w-24 mb-4 opacity-80" />
                  <h2 className="text-3xl font-bold mb-4">
                    방송이 종료되었습니다
                  </h2>
                  <div className="text-lg text-gray-300 space-y-2">
                    <p>최고 시청자: {session.viewerCount.toLocaleString()}명</p>
                    <p>채팅 메시지: {session.chatMessageCount.toLocaleString()}건</p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {session.title}
                </h1>
                {session.description && (
                  <p className="text-gray-600 text-lg">{session.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Live or VOD watching experience
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1920px] mx-auto">
        {/* Desktop Layout (lg+) */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-[1fr_400px] gap-0">
            {/* Left: Video + Products */}
            <div className="bg-black">
              {/* Video Player */}
              <div className="relative">
                <LiveVideoPlayer
                  platform={session.streamPlatform}
                  url={session.vodUrl || session.streamUrl}
                  isLive={session.status === 'live'}
                />
              </div>

              {/* Stats Bar */}
              {session.status === 'live' && (
                <div className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5" />
                    <span>시청자 {session.viewerCount.toLocaleString()}명</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    <span>채팅 {session.chatMessageCount.toLocaleString()}건</span>
                  </div>
                  <LiveBadge />
                </div>
              )}

              {/* Title & Description */}
              <div className="bg-white px-6 py-4 border-b">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {session.title}
                </h1>
                {session.description && (
                  <p className="text-gray-600">{session.description}</p>
                )}
              </div>

              {/* Featured Product */}
              {featuredProduct && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-6 border-b">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <h2 className="text-lg font-bold text-gray-900">
                      현재 소개 상품
                    </h2>
                  </div>
                  <div className="flex gap-4 bg-white rounded-xl p-4 shadow-md">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                        {featuredProduct.name}
                      </h3>
                      <div className="mb-3">
                        {featuredProduct.salePrice &&
                          featuredProduct.salePrice < featuredProduct.price && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatKRW(featuredProduct.price)}
                            </div>
                          )}
                        <div className="text-2xl font-bold text-purple-600">
                          {formatKRW(
                            featuredProduct.salePrice || featuredProduct.price
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(featuredProduct)}
                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCartIcon className="h-5 w-5" />
                        장바구니 담기
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Carousel */}
              <div className="bg-white px-6 py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  방송 상품 ({liveProducts.length}개)
                </h2>
                <LiveProductCarousel
                  products={liveProducts}
                  featuredProductId={session.featuredProductId}
                  mallSlug={mallSlug}
                  onAddToCart={(productId) => {
                    const product = liveProducts.find((p) => p.id === productId);
                    if (product) handleAddToCart(product);
                  }}
                />
              </div>
            </div>

            {/* Right: Chat */}
            <div className="bg-white border-l flex flex-col h-screen sticky top-0">
              <div className="border-b px-4 py-3 bg-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  실시간 채팅
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <LiveChatBox sessionId={sessionId} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout (< lg) */}
        <div className="lg:hidden">
          {/* Video Player */}
          <div className="relative bg-black">
            <LiveVideoPlayer
              platform={session.streamPlatform}
              url={session.vodUrl || session.streamUrl}
              isLive={session.status === 'live'}
            />
          </div>

          {/* Stats Bar */}
          {session.status === 'live' && (
            <div className="bg-gray-900 text-white px-4 py-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <UserGroupIcon className="h-4 w-4" />
                <span>{session.viewerCount.toLocaleString()}명</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>{session.chatMessageCount.toLocaleString()}건</span>
              </div>
              <LiveBadge size="sm" />
            </div>
          )}

          {/* Title */}
          <div className="bg-white px-4 py-3 border-b">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              {session.title}
            </h1>
            {session.description && (
              <p className="text-sm text-gray-600">{session.description}</p>
            )}
          </div>

          {/* Featured Product */}
          {featuredProduct && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-bold text-gray-900">현재 소개 상품</h2>
              </div>
              <div className="flex gap-3 bg-white rounded-lg p-3 shadow-md">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                    {featuredProduct.name}
                  </h3>
                  <div className="text-lg font-bold text-purple-600 mb-2">
                    {formatKRW(
                      featuredProduct.salePrice || featuredProduct.price
                    )}
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
          )}

          {/* Product Carousel */}
          <div className="bg-white px-4 py-4 border-b">
            <h2 className="text-sm font-bold text-gray-900 mb-3">
              방송 상품 ({liveProducts.length}개)
            </h2>
            <LiveProductCarousel
              products={liveProducts}
              featuredProductId={session.featuredProductId}
              mallSlug={mallSlug}
              onAddToCart={(productId) => {
                const product = liveProducts.find((p) => p.id === productId);
                if (product) handleAddToCart(product);
              }}
            />
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
              <div className="h-96 border-t">
                <LiveChatBox sessionId={sessionId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
