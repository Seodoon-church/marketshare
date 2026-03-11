'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatKRW, formatDateTime } from '@/lib/utils/format';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { getAllOrders } from '@/lib/services/order-service';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Order } from '@/types';

const statusTabs = [
  { key: 'all', label: '전체' },
  { key: 'paid', label: '결제완료' },
  { key: 'preparing', label: '배송준비' },
  { key: 'shipped', label: '배송중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'cancel_refund', label: '취소/환불' },
] as const;

type StatusFilter = (typeof statusTabs)[number]['key'];

export default function AdminOrdersPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    async function fetchOrders() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getAllOrders({ limit: 50 });
        setOrders(result.orders);
      } catch (err: any) {
        setError(err.message || '주문 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [authLoading, isAdmin]);

  const filteredOrders = orders.filter((order) => {
    // Status filter
    let matchesStatus = false;
    if (activeTab === 'all') {
      matchesStatus = true;
    } else if (activeTab === 'cancel_refund') {
      matchesStatus = order.status === 'cancelled' || order.status === 'refunded';
    } else {
      matchesStatus = order.status === activeTab;
    }

    // Search filter
    const matchesSearch =
      search === '' ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (order.userName || '').includes(search);

    // Date filter
    let matchesDate = true;
    if (startDate) {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      matchesDate = matchesDate && orderDate >= new Date(startDate);
    }
    if (endDate) {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      const endOfDay = new Date(endDate + 'T23:59:59');
      matchesDate = matchesDate && orderDate <= endOfDay;
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <ShoppingCartIcon className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">전체 주문 관리</h1>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range & Search */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="주문번호 또는 주문자명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <div className="py-12 text-center text-sm text-red-500">{error}</div>
        </Card>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px]">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">주문번호</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">주문자</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">상품</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">결제금액</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">몰명</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">주문일시</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-mono text-gray-700">{order.orderNumber}</span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {order.userName || 'N/A'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-600 line-clamp-1 max-w-[200px]">
                        {order.items?.[0]?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatKRW(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{order.mallName || order.mallId}</td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {formatDateTime(
                        order.createdAt instanceof Date
                          ? order.createdAt.toISOString()
                          : String(order.createdAt)
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Button variant="outline" size="sm" onClick={() => alert('주문 상세 페이지는 준비 중입니다.')}>
                        상세
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                      {orders.length === 0 ? '주문 내역이 없습니다.' : '검색 결과가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
