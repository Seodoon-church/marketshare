'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLiveSession } from '@/lib/hooks/useLiveSession';
import { useLiveChat } from '@/lib/hooks/useLiveChat';
import { startLiveSession, endLiveSession, updateLiveSession } from '@/lib/services/live-service';
import { getMallProducts } from '@/lib/services/product-service';
import type { LiveSessionStatus, LiveMessage } from '@/types/live';
import type { Product } from '@/types';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';

const statusConfig: Record<
  LiveSessionStatus,
  { label: string; variant: 'success' | 'danger' | 'secondary' | 'warning' }
> = {
  scheduled: { label: '예정', variant: 'warning' },
  live: { label: '라이브', variant: 'danger' },
  ended: { label: '종료', variant: 'secondary' },
  cancelled: { label: '취소', variant: 'secondary' },
};

export default function ClientPage({ sessionId }: { sessionId: string }) {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const { session, isLoading: sessionLoading } = useLiveSession(sessionId);
  const { messages, sendMessage: sendChatMessage } = useLiveChat(sessionId);

  const [streamUrl, setStreamUrl] = useState('');
  const [vodUrl, setVodUrl] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load stream URL when session loads
  useEffect(() => {
    if (session) {
      setStreamUrl(session.streamUrl || '');
      setVodUrl(session.vodUrl || '');
    }
  }, [session]);

  // Load products for this session
  useEffect(() => {
    if (!session?.mallId || !session?.productIds?.length) {
      setProductsLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        const result = await getMallProducts(session.mallId, { limit: 100 });
        const filtered = result.products.filter((p) =>
          session.productIds.includes(p.id)
        );
        setProducts(filtered);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [session?.mallId, session?.productIds]);

  const handleStartLive = async () => {
    if (!streamUrl.trim()) {
      toast({ type: 'error', message: '스트리밍 URL을 입력해주세요.' });
      return;
    }

    setActionLoading(true);
    try {
      await startLiveSession(sessionId, streamUrl.trim());
      toast({ type: 'success', message: '라이브 방송이 시작되었습니다.' });
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || '라이브 시작 중 오류가 발생했습니다.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndLive = async () => {
    setActionLoading(true);
    try {
      await endLiveSession(sessionId, vodUrl.trim() || undefined);
      toast({ type: 'success', message: '라이브 방송이 종료되었습니다.' });
      setShowEndConfirm(false);
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || '라이브 종료 중 오류가 발생했습니다.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveVodUrl = async () => {
    setActionLoading(true);
    try {
      await updateLiveSession(sessionId, { vodUrl: vodUrl.trim() });
      toast({ type: 'success', message: 'VOD URL이 저장되었습니다.' });
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || 'VOD URL 저장 중 오류가 발생했습니다.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeaturedProduct = async (productId: string) => {
    const newFeaturedId =
      session?.featuredProductId === productId ? null : productId;

    try {
      await updateLiveSession(sessionId, { featuredProductId: newFeaturedId });
      toast({
        type: 'success',
        message: newFeaturedId ? '하이라이트 상품이 설정되었습니다.' : '하이라이트가 해제되었습니다.',
      });
    } catch (error: any) {
      toast({ type: 'error', message: '상품 하이라이트 설정 중 오류가 발생했습니다.' });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      await sendChatMessage(chatInput);
      setChatInput('');
    } catch (error: any) {
      toast({ type: 'error', message: '메시지 전송 중 오류가 발생했습니다.' });
    }
  };

  // Loading state
  if (authLoading || !isMallOwner || sessionLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="h-96 w-full animate-pulse rounded bg-gray-100" />
            </Card>
          </div>
          <div>
            <Card>
              <div className="h-96 w-full animate-pulse rounded bg-gray-100" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              window.location.href = '/mall-admin/live';
            }}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">세션을 찾을 수 없습니다</h1>
        </div>
      </div>
    );
  }

  const config = statusConfig[session.status];
  const isLive = session.status === 'live';
  const isScheduled = session.status === 'scheduled';
  const isEnded = session.status === 'ended';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              window.location.href = '/mall-admin/live';
            }}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(session.scheduledAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Video + Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Preview */}
          <Card>
            {isLive && session.streamUrl ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={session.streamUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <PlayIcon className="h-16 w-16 mx-auto mb-3" />
                  <p className="text-sm">
                    {isScheduled
                      ? '라이브 방송 대기 중'
                      : isEnded
                      ? '라이브 방송이 종료되었습니다'
                      : '스트리밍 URL을 입력하고 방송을 시작하세요'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Scheduled State */}
          {isScheduled && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">방송 시작</h3>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    스트리밍 URL
                  </label>
                  <Input
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    type="url"
                  />
                </div>
                <Button
                  onClick={handleStartLive}
                  isLoading={actionLoading}
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlayIcon className="h-4 w-4" />
                  방송 시작
                </Button>
              </div>
            </Card>
          )}

          {/* Live State */}
          {isLive && (
            <>
              {/* Stats */}
              <Card>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <UserGroupIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {session.viewerCount}
                    </div>
                    <div className="text-xs text-gray-500">시청자</div>
                  </div>
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {session.chatMessageCount}
                    </div>
                    <div className="text-xs text-gray-500">채팅</div>
                  </div>
                  <div className="text-center">
                    <ShoppingBagIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {session.totalOrders}
                    </div>
                    <div className="text-xs text-gray-500">주문</div>
                  </div>
                  <div className="text-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {formatKRW(session.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500">매출</div>
                  </div>
                </div>
              </Card>

              {/* Products */}
              {products.length > 0 && (
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">상품 목록</h3>
                    <div className="space-y-2">
                      {products.map((product) => {
                        const isFeatured = session.featuredProductId === product.id;
                        return (
                          <div
                            key={product.id}
                            className={`flex items-center gap-3 rounded-lg border p-3 ${
                              isFeatured ? 'border-primary bg-primary/5' : 'border-gray-200'
                            }`}
                          >
                            {product.thumbnailUrl ? (
                              <img
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-100 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatKRW(product.price)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={isFeatured ? 'default' : 'outline'}
                              onClick={() => handleToggleFeaturedProduct(product.id)}
                            >
                              {isFeatured ? '하이라이트 중' : '하이라이트'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {/* End Live */}
              <Card className="bg-red-50 border-red-200">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-900">방송 종료</h3>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-red-900">
                      VOD URL (선택)
                    </label>
                    <Input
                      value={vodUrl}
                      onChange={(e) => setVodUrl(e.target.value)}
                      placeholder="다시보기 URL을 입력하세요"
                      type="url"
                    />
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => setShowEndConfirm(true)}
                    fullWidth
                  >
                    <StopIcon className="h-4 w-4" />
                    방송 종료
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Ended State */}
          {isEnded && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">최종 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">최대 시청자</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {session.peakViewerCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">총 채팅</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {session.chatMessageCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">총 주문</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {session.totalOrders}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">총 매출</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatKRW(session.totalRevenue)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    VOD URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={vodUrl}
                      onChange={(e) => setVodUrl(e.target.value)}
                      placeholder="다시보기 URL을 입력하세요"
                      type="url"
                    />
                    <Button onClick={handleSaveVodUrl} isLoading={actionLoading}>
                      저장
                    </Button>
                  </div>
                </div>

                {session.vodUrl && (
                  <div className="pt-2">
                    <a
                      href={session.vodUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      다시보기 보기 →
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Chat */}
        <div className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              실시간 채팅
            </h3>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {messages.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  아직 메시지가 없습니다
                </div>
              )}
            </div>

            {/* Input */}
            {(isScheduled || isLive) && (
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="메시지를 입력하세요"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="rounded-lg bg-primary px-3 text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* End Confirm Dialog */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onConfirm={handleEndLive}
        onCancel={() => setShowEndConfirm(false)}
        title="방송 종료"
        message="라이브 방송을 종료하시겠습니까? 종료 후에는 다시 시작할 수 없습니다."
        confirmText="종료"
        cancelText="취소"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}

function ChatMessage({ message }: { message: LiveMessage }) {
  const isSystem = message.type === 'system';
  const isMallOwner = message.userRole === 'mall_owner';

  return (
    <div
      className={`text-sm ${
        isSystem ? 'bg-blue-50 rounded-lg p-2 text-center text-blue-700' : ''
      }`}
    >
      {isSystem ? (
        <span>{message.message}</span>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium ${isMallOwner ? 'text-primary' : 'text-gray-900'}`}>
              {message.userName}
            </span>
            {isMallOwner && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                호스트
              </Badge>
            )}
            <span className="text-xs text-gray-400">
              {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-gray-700">{message.message}</p>
        </div>
      )}
    </div>
  );
}
