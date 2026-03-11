'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge, OrderStatusBadge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { formatKRW, formatDate } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserOrders } from '@/lib/hooks/useOrders';
import { cancelOrder, requestRefund } from '@/lib/services/order-service';
import type { Order } from '@/types';
import {
  TruckIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CreditCardIcon,
  CubeIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

const periodFilters = ['1주일', '1개월', '3개월', '6개월', '1년'];

// Gradient fallbacks for product images
const gradients = [
  'from-violet-400 to-indigo-500',
  'from-rose-400 to-pink-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-blue-400 to-cyan-500',
  'from-fuchsia-400 to-purple-500',
];

export default function OrderHistoryPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { orders, isLoading: ordersLoading, error } = useUserOrders(user?.id);
  const [activePeriod, setActivePeriod] = useState('3개월');
  const { toast } = useToast();
  const [cancelModal, setCancelModal] = useState<{ orderId: string; mallId: string; type: 'cancel' | 'refund' } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleTrackDelivery = (order: Order) => {
    if (order.trackingNumber && order.trackingCompany) {
      const trackingUrls: Record<string, string> = {
        'CJ대한통운': `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${order.trackingNumber}`,
        '한진택배': `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession_flag=4&wblnumText2=${order.trackingNumber}`,
        '롯데택배': `https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=${order.trackingNumber}`,
        '우체국택배': `https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=${order.trackingNumber}`,
      };
      const url = trackingUrls[order.trackingCompany] || `https://search.naver.com/search.naver?query=${order.trackingCompany}+${order.trackingNumber}`;
      window.open(url, '_blank');
    } else {
      toast({ type: 'info', message: '아직 송장번호가 등록되지 않았습니다.' });
    }
  };

  const handleCancelRefund = (orderId: string, mallId: string, orderStatus: string) => {
    const type = ['pending', 'paid'].includes(orderStatus) ? 'cancel' : 'refund';
    setCancelModal({ orderId, mallId, type });
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) {
      toast({ type: 'warning', message: '사유를 입력해주세요.' });
      return;
    }
    setIsCancelling(true);
    try {
      if (cancelModal.type === 'cancel') {
        await cancelOrder(cancelModal.orderId, cancelModal.mallId, cancelReason);
        toast({ type: 'success', message: '주문이 취소되었습니다.' });
      } else {
        await requestRefund(cancelModal.orderId, cancelModal.mallId, cancelReason);
        toast({ type: 'success', message: '환불이 요청되었습니다.' });
      }
      setCancelModal(null);
      window.location.reload();
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '처리 중 오류가 발생했습니다.' });
    } finally {
      setIsCancelling(false);
    }
  };

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/auth/login?redirect=/mypage';
    }
  }, [authLoading, isAuthenticated]);

  // Calculate order status summary from real orders
  const orderStatusSummary = [
    {
      label: '결제완료',
      count: orders.filter((o) => o.status === 'paid').length,
      icon: CreditCardIcon,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: '배송준비',
      count: orders.filter((o) => o.status === 'preparing').length,
      icon: CubeIcon,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: '배송중',
      count: orders.filter((o) => o.status === 'shipped').length,
      icon: TruckIcon,
      color: 'text-primary bg-primary/10',
    },
    {
      label: '배송완료',
      count: orders.filter((o) => o.status === 'delivered').length,
      icon: CheckCircleIcon,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">주문내역</h1>
          <p className="mt-1 text-sm text-gray-500">주문하신 상품의 배송 현황을 확인하세요.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">주문내역</h1>
        <p className="mt-1 text-sm text-gray-500">주문하신 상품의 배송 현황을 확인하세요.</p>
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {orderStatusSummary.map((status) => (
          <Card key={status.label} className="flex items-center gap-3 cursor-pointer" hover>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.color}`}>
              <status.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{status.label}</p>
              <p className="text-xl font-bold text-gray-900">{status.count}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Period Filter - Visual only (service doesn't support date filtering yet) */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-2">
          {periodFilters.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activePeriod === period
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading State */}
      {ordersLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <EmptyState
            icon={<ShoppingBagIcon className="h-12 w-12" />}
            title="주문 내역을 불러올 수 없습니다"
            description="잠시 후 다시 시도해주세요."
          />
        </Card>
      )}

      {/* Empty State */}
      {!ordersLoading && !error && orders.length === 0 && (
        <Card>
          <EmptyState
            icon={<ShoppingBagIcon className="h-12 w-12" />}
            title="주문 내역이 없습니다"
            description="아직 주문하신 상품이 없습니다."
            action={{
              label: '쇼핑하러 가기',
              href: '/',
            }}
          />
        </Card>
      )}

      {/* Order List */}
      {!ordersLoading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order, orderIdx) => (
            <Card key={order.id} padding="none">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {order.orderNumber || order.id}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Order Items */}
              {order.items.map((item, idx) => {
                const gradient = gradients[idx % gradients.length];
                const optionsText = item.options
                  ? Object.entries(item.options)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(' / ')
                  : '';
                const displayPrice = item.price;

                return (
                  <div key={idx} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    {/* Product Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div
                        className={`h-20 w-20 shrink-0 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}
                      />
                    )}

                    {/* Product Info */}
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/products/${item.productId}`}
                        className="truncate text-sm font-medium text-gray-900 hover:text-primary"
                      >
                        {item.name}
                      </a>
                      {optionsText && (
                        <p className="mt-0.5 text-xs text-gray-500">{optionsText}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {formatKRW(displayPrice)}
                        </span>
                        <span className="text-xs text-gray-400">/ {item.quantity}개</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                      <Button variant="outline" size="sm" onClick={() => handleTrackDelivery(order)}>
                        <TruckIcon className="h-3.5 w-3.5" />
                        배송조회
                      </Button>
                      {order.status !== 'cancelled' && order.status !== 'refunded' && (
                        <Button variant="outline" size="sm" onClick={() => handleCancelRefund(order.id, order.mallId, order.status)}>
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                          교환/반품
                        </Button>
                      )}
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm" onClick={() => { window.location.href = `/mypage/reviews?write=true&productId=${item.productId}&orderId=${order.id}`; }}>
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          리뷰작성
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Order Total (if multiple items) */}
              {order.items.length > 1 && (
                <div className="border-t border-gray-50 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">총 주문금액</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatKRW(order.totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Cancel/Refund Modal */}
      {cancelModal && (
        <Modal
          isOpen={!!cancelModal}
          onClose={() => setCancelModal(null)}
          title={cancelModal.type === 'cancel' ? '주문 취소' : '환불 요청'}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {cancelModal.type === 'cancel' ? '주문을 취소하시겠습니까?' : '환불을 요청하시겠습니까?'}
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">사유</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소/환불 사유를 입력해주세요"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelModal(null)}>취소</Button>
              <Button variant="danger" onClick={handleConfirmCancel} isLoading={isCancelling}>
                {cancelModal.type === 'cancel' ? '주문 취소' : '환불 요청'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
