'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatKRW, formatDateTime } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallOrders, updateOrderStatus, cancelOrder, requestRefund } from '@/lib/services/order-service';
import type { Order, OrderStatus } from '@/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TruckIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 20;

export default function MallAdminOrders() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDocStack, setLastDocStack] = useState<(DocumentSnapshot | null)[]>([null]);
  const [hasMore, setHasMore] = useState(false);
  const [totalEstimatedPages, setTotalEstimatedPages] = useState(1);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [trackingCompany, setTrackingCompany] = useState('CJ대한통운');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Batch processing state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchShipModal, setShowBatchShipModal] = useState(false);
  const [batchTrackingCompany, setBatchTrackingCompany] = useState('CJ대한통운');
  const [batchTrackingNumber, setBatchTrackingNumber] = useState('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchAction, setBatchAction] = useState<'preparing' | 'delivered' | null>(null);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load orders
  useEffect(() => {
    if (!mallId) return;
    loadOrders();
  }, [mallId, currentPage]);

  async function loadOrders(startAfterDoc?: DocumentSnapshot | null) {
    if (!mallId) return;
    setLoading(true);
    try {
      const docToUse = startAfterDoc !== undefined ? startAfterDoc : lastDocStack[currentPage - 1] ?? undefined;
      const result = await getMallOrders(mallId, {
        limit: PAGE_SIZE,
        startAfterDoc: docToUse || undefined,
      });
      setOrders(result.orders);
      setHasMore(result.hasMore);

      // Update total estimated pages
      if (result.hasMore) {
        setTotalEstimatedPages(Math.max(totalEstimatedPages, currentPage + 1));
      } else {
        setTotalEstimatedPages(currentPage);
      }

      // Save the lastDoc for next page navigation
      if (result.lastDoc && currentPage < lastDocStack.length) {
        // Already have this entry
      } else if (result.lastDoc) {
        setLastDocStack(prev => {
          const newStack = [...prev];
          newStack[currentPage] = result.lastDoc;
          return newStack;
        });
      }
    } catch (error) {
      console.error('주문 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  // Compute status tab counts dynamically from loaded data
  const statusTabs = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const order of orders) {
      counts[order.status] = (counts[order.status] || 0) + 1;
    }
    const cancelledCount = (counts['cancelled'] || 0) + (counts['refunded'] || 0);

    return [
      { key: 'all' as OrderStatus | 'all', label: '전체', count: orders.length },
      { key: 'paid' as OrderStatus | 'all', label: '결제완료', count: counts['paid'] || 0 },
      { key: 'preparing' as OrderStatus | 'all', label: '배송준비', count: counts['preparing'] || 0 },
      { key: 'shipped' as OrderStatus | 'all', label: '배송중', count: counts['shipped'] || 0 },
      { key: 'delivered' as OrderStatus | 'all', label: '배송완료', count: counts['delivered'] || 0 },
      { key: 'cancelled' as OrderStatus | 'all', label: '취소/환불', count: cancelledCount },
    ];
  }, [orders]);

  const filtered = orders.filter((o) => {
    const matchTab =
      activeTab === 'all' ||
      o.status === activeTab ||
      (activeTab === 'cancelled' && (o.status === 'cancelled' || o.status === 'refunded'));
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.userName.includes(search);
    return matchTab && matchSearch;
  });

  // Checkbox handling
  const allFilteredSelected = filtered.length > 0 && filtered.every(o => selectedIds.has(o.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get selected orders
  const selectedOrders = filtered.filter(o => selectedIds.has(o.id));
  const selectedPaidOrders = selectedOrders.filter(o => o.status === 'paid');
  const selectedPreparingOrders = selectedOrders.filter(o => o.status === 'preparing');
  const selectedShippedOrders = selectedOrders.filter(o => o.status === 'shipped');

  // Modal openers
  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openShipModal = (order: Order) => {
    setSelectedOrder(order);
    setTrackingCompany('CJ대한통운');
    setTrackingNumber('');
    setShowShipModal(true);
  };

  const openCancelModal = (order: Order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const openRefundModal = (order: Order) => {
    setSelectedOrder(order);
    setRefundReason('');
    setShowRefundModal(true);
  };

  // Reload orders
  const reloadOrders = async () => {
    if (!mallId) return;
    const result = await getMallOrders(mallId, {
      limit: PAGE_SIZE,
      startAfterDoc: lastDocStack[currentPage - 1] || undefined,
    });
    setOrders(result.orders);
    setHasMore(result.hasMore);
    setSelectedIds(new Set());
  };

  // Status change handler
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, trackingInfo?: { trackingNumber: string; trackingCompany: string }) => {
    if (!mallId) return;
    setProcessing(true);
    try {
      await updateOrderStatus(orderId, mallId, newStatus, trackingInfo);
      await reloadOrders();
      setShowShipModal(false);
      setShowDetailModal(false);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleShipConfirm = async () => {
    if (!selectedOrder || !trackingNumber.trim()) return;
    await handleStatusChange(selectedOrder.id, 'shipped', { trackingNumber, trackingCompany });
  };

  const handleCancelConfirm = async () => {
    if (!selectedOrder || !mallId || !cancelReason.trim()) return;
    setProcessing(true);
    try {
      await cancelOrder(selectedOrder.id, mallId, cancelReason);
      await reloadOrders();
      setShowCancelModal(false);
    } catch (error) {
      console.error('주문 취소 실패:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRefundConfirm = async () => {
    if (!selectedOrder || !mallId || !refundReason.trim()) return;
    setProcessing(true);
    try {
      await requestRefund(selectedOrder.id, mallId, refundReason);
      await reloadOrders();
      setShowRefundModal(false);
    } catch (error) {
      console.error('반품 접수 실패:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Batch actions
  const handleBatchPreparing = () => {
    if (selectedPaidOrders.length === 0) return;
    setBatchAction('preparing');
    setShowBatchConfirm(true);
  };

  const handleBatchShipOpen = () => {
    if (selectedPreparingOrders.length === 0) return;
    setBatchTrackingCompany('CJ대한통운');
    setBatchTrackingNumber('');
    setShowBatchShipModal(true);
  };

  const handleBatchDelivered = () => {
    if (selectedShippedOrders.length === 0) return;
    setBatchAction('delivered');
    setShowBatchConfirm(true);
  };

  const handleBatchConfirm = async () => {
    if (!mallId || !batchAction) return;
    setBatchProcessing(true);
    try {
      const targetOrders = batchAction === 'preparing' ? selectedPaidOrders : selectedShippedOrders;
      for (const order of targetOrders) {
        await updateOrderStatus(order.id, mallId, batchAction);
      }
      await reloadOrders();
      setShowBatchConfirm(false);
      setBatchAction(null);
    } catch (error) {
      console.error('일괄 처리 실패:', error);
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchShipConfirm = async () => {
    if (!mallId || !batchTrackingNumber.trim()) return;
    setBatchProcessing(true);
    try {
      for (const order of selectedPreparingOrders) {
        await updateOrderStatus(order.id, mallId, 'shipped', {
          trackingNumber: batchTrackingNumber,
          trackingCompany: batchTrackingCompany,
        });
      }
      await reloadOrders();
      setShowBatchShipModal(false);
    } catch (error) {
      console.error('일괄 배송처리 실패:', error);
    } finally {
      setBatchProcessing(false);
    }
  };

  // Pagination handler
  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    setSelectedIds(new Set());
  };

  // Derive display values from Order items
  const getProductDisplay = (order: Order): string => {
    if (order.items.length === 0) return '-';
    const firstName = order.items[0].name;
    if (order.items.length > 1) {
      return `${firstName} 외 ${order.items.length - 1}건`;
    }
    return firstName;
  };

  const getTotalQuantity = (order: Order): number => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Auth loading or redirect state
  if (authLoading || !isMallOwner) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <Card>
          <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
        </Card>
        <Card padding="none">
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>

      {/* Status Tabs */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 min-w-[20px] text-xs ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="주문번호 또는 주문자명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.size}건 선택
            </span>
            <div className="h-4 w-px bg-gray-300" />
            {selectedPaidOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchPreparing}
              >
                <CheckIcon className="h-4 w-4" />
                일괄 발주확인 ({selectedPaidOrders.length})
              </Button>
            )}
            {selectedPreparingOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchShipOpen}
              >
                <TruckIcon className="h-4 w-4" />
                일괄 배송처리 ({selectedPreparingOrders.length})
              </Button>
            )}
            {selectedShippedOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelivered}
              >
                <CheckIcon className="h-4 w-4" />
                일괄 배송완료 ({selectedShippedOrders.length})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              선택 해제
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" />
                <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[768px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      주문번호
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      주문자
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      상품
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      수량
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                      결제금액
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      주문일시
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelectOne(order.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {order.userName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                        {getProductDisplay(order)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {getTotalQuantity(order)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatKRW(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(order)}>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {order.status === 'paid' && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(order.id, 'preparing')}>
                              배송준비
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button variant="outline" size="sm" onClick={() => openShipModal(order)}>
                              <TruckIcon className="h-4 w-4" />
                              송장입력
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(order.id, 'delivered')}>
                              <CheckIcon className="h-4 w-4" />
                              배송완료
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => openRefundModal(order)}>
                              <ArrowPathIcon className="h-4 w-4" />
                              반품 접수
                            </Button>
                          )}
                          {['pending', 'paid'].includes(order.status) && (
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openCancelModal(order)}>
                              <XMarkIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}
          </>
        )}
      </Card>

      {/* Pagination */}
      {totalEstimatedPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalEstimatedPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="주문 상세">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">주문번호</span><p className="font-mono font-medium">{selectedOrder.orderNumber}</p></div>
              <div><span className="text-gray-500">주문상태</span><p><OrderStatusBadge status={selectedOrder.status} /></p></div>
              <div><span className="text-gray-500">주문자</span><p className="font-medium">{selectedOrder.userName}</p></div>
              <div><span className="text-gray-500">결제금액</span><p className="font-bold text-primary">{formatKRW(selectedOrder.totalAmount)}</p></div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">주문 상품</p>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity}개 / {formatKRW(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedOrder.shippingAddress && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">배송지</p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.name} / {selectedOrder.shippingAddress.phone}</p>
                <p className="text-sm text-gray-600">[{selectedOrder.shippingAddress.zipcode}] {selectedOrder.shippingAddress.address} {selectedOrder.shippingAddress.addressDetail}</p>
              </div>
            )}
            {selectedOrder.trackingNumber && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">배송정보</p>
                <p className="text-sm text-gray-600">{selectedOrder.trackingCompany} - {selectedOrder.trackingNumber}</p>
              </div>
            )}
            {selectedOrder.memo && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">메모</p>
                <p className="text-sm text-gray-600">{selectedOrder.memo}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Ship Modal - Tracking Number Input */}
      {showShipModal && selectedOrder && (
        <Modal isOpen={showShipModal} onClose={() => setShowShipModal(false)} title="송장번호 입력">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">택배사</label>
              <select
                value={trackingCompany}
                onChange={(e) => setTrackingCompany(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="CJ대한통운">CJ대한통운</option>
                <option value="한진택배">한진택배</option>
                <option value="롯데택배">롯데택배</option>
                <option value="우체국택배">우체국택배</option>
                <option value="로젠택배">로젠택배</option>
              </select>
            </div>
            <Input
              label="송장번호"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="송장번호를 입력하세요"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowShipModal(false)}>취소</Button>
              <Button onClick={handleShipConfirm} disabled={!trackingNumber.trim() || processing}>
                {processing ? '처리 중...' : '배송 시작'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="주문 취소">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">주문번호: {selectedOrder.orderNumber}</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">취소 사유</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력하세요"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>닫기</Button>
              <Button variant="danger" onClick={handleCancelConfirm} disabled={!cancelReason.trim() || processing}>
                {processing ? '처리 중...' : '주문 취소'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <Modal isOpen={showRefundModal} onClose={() => setShowRefundModal(false)} title="반품 접수">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">주문번호: {selectedOrder.orderNumber}</p>
            <p className="text-sm text-gray-600">결제금액: {formatKRW(selectedOrder.totalAmount)}</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">반품 사유</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="반품 사유를 입력하세요"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRefundModal(false)}>닫기</Button>
              <Button variant="danger" onClick={handleRefundConfirm} disabled={!refundReason.trim() || processing}>
                {processing ? '처리 중...' : '반품 접수'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Batch Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBatchConfirm}
        onConfirm={handleBatchConfirm}
        onCancel={() => { setShowBatchConfirm(false); setBatchAction(null); }}
        title={batchAction === 'preparing' ? '일괄 발주확인' : '일괄 배송완료'}
        message={
          batchAction === 'preparing'
            ? `선택한 ${selectedPaidOrders.length}건의 주문을 배송준비 상태로 변경하시겠습니까?`
            : `선택한 ${selectedShippedOrders.length}건의 주문을 배송완료 상태로 변경하시겠습니까?`
        }
        confirmText="확인"
        cancelText="취소"
        variant="warning"
        isLoading={batchProcessing}
      />

      {/* Batch Ship Modal */}
      {showBatchShipModal && (
        <Modal isOpen={showBatchShipModal} onClose={() => setShowBatchShipModal(false)} title="일괄 배송처리">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              선택한 {selectedPreparingOrders.length}건의 주문에 동일한 송장번호를 입력합니다.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">택배사</label>
              <select
                value={batchTrackingCompany}
                onChange={(e) => setBatchTrackingCompany(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="CJ대한통운">CJ대한통운</option>
                <option value="한진택배">한진택배</option>
                <option value="롯데택배">롯데택배</option>
                <option value="우체국택배">우체국택배</option>
                <option value="로젠택배">로젠택배</option>
              </select>
            </div>
            <Input
              label="송장번호"
              value={batchTrackingNumber}
              onChange={(e) => setBatchTrackingNumber(e.target.value)}
              placeholder="송장번호를 입력하세요"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBatchShipModal(false)}>취소</Button>
              <Button onClick={handleBatchShipConfirm} disabled={!batchTrackingNumber.trim() || batchProcessing}>
                {batchProcessing ? '처리 중...' : `${selectedPreparingOrders.length}건 배송 시작`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
