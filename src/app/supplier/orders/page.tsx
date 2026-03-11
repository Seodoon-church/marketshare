'use client';

import { useState, useEffect } from 'react';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';
import { formatKRW } from '@/lib/utils/format';
import { getSupplierOrders } from '@/lib/services/supplier-service';

function SupplierNav() {
  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-[var(--content-max-width)] px-4">
        <div className="flex items-center gap-1">
          <a href="/supplier" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            대시보드
          </a>
          <a href="/supplier/products" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            상품관리
          </a>
          <a href="/supplier/orders" className="border-b-2 border-primary px-4 py-3 text-sm font-medium text-primary">
            주문현황
          </a>
          <a href="/supplier/settlements" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            정산내역
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function SupplierOrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const supplierId = user?.supplierIds?.[0];

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'supplier')) {
      window.location.href = '/supplier';
    }
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!supplierId) return;

    async function fetchOrders() {
      setLoading(true);
      try {
        const data = await getSupplierOrders(supplierId!, { status: statusFilter || undefined });
        setOrders(data);
      } catch (error) {
        console.error('주문 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [supplierId, statusFilter]);

  if (authLoading || loading) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (!isAuthenticated || user?.role !== 'supplier') {
    return null;
  }

  // Paginate
  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <Header />
      <SupplierNav />
      <main className="mx-auto min-h-screen max-w-[var(--content-max-width)] px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">주문 현황</h1>
            <p className="mt-1 text-sm text-gray-500">총 {orders.length}건</p>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  statusFilter === ''
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  statusFilter === 'paid'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                결제완료
              </button>
              <button
                onClick={() => setStatusFilter('preparing')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  statusFilter === 'preparing'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                배송준비
              </button>
              <button
                onClick={() => setStatusFilter('shipped')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  statusFilter === 'shipped'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                배송중
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  statusFilter === 'delivered'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                배송완료
              </button>
            </div>
          </Card>

          {/* Orders Table */}
          {paginatedOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingCartIcon className="h-12 w-12" />}
              title="주문이 없습니다"
              description="주문이 들어오면 여기에 표시됩니다."
            />
          ) : (
            <>
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">주문번호</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">주문자</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상품명</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">수량</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">금액</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            <span className="text-sm font-mono text-gray-700">{order.orderNumber}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900">{order.userName}</td>
                          <td className="px-5 py-3 text-sm text-gray-900">
                            {order.items?.[0]?.name || 'N/A'}
                            {order.items?.length > 1 && ` 외 ${order.items.length - 1}건`}
                          </td>
                          <td className="px-5 py-3 text-sm text-right text-gray-600">
                            {order.items?.[0]?.quantity || 0}
                          </td>
                          <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatKRW(order.totalAmount)}
                          </td>
                          <td className="px-5 py-3">
                            <Badge
                              variant={
                                order.status === 'paid'
                                  ? 'info'
                                  : order.status === 'preparing'
                                  ? 'warning'
                                  : order.status === 'shipped'
                                  ? 'default'
                                  : 'success'
                              }
                            >
                              {order.status === 'paid'
                                ? '결제완료'
                                : order.status === 'preparing'
                                ? '배송준비'
                                : order.status === 'shipped'
                                ? '배송중'
                                : '배송완료'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {order.createdAt instanceof Date
                              ? order.createdAt.toLocaleDateString('ko-KR')
                              : new Date(order.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
