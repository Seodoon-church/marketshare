'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';
import { formatKRW } from '@/lib/utils/format';
import { getSupplierDashboard } from '@/lib/services/supplier-service';
import type { SupplierDashboard } from '@/lib/services/supplier-service';

function SupplierNav() {
  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-[var(--content-max-width)] px-4">
        <div className="flex items-center gap-1">
          <a
            href="/supplier"
            className="border-b-2 border-primary px-4 py-3 text-sm font-medium text-primary"
          >
            대시보드
          </a>
          <a
            href="/supplier/products"
            className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            상품관리
          </a>
          <a
            href="/supplier/orders"
            className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            주문현황
          </a>
          <a
            href="/supplier/settlements"
            className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            정산내역
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function SupplierDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const supplierId = user?.supplierIds?.[0];

  const [dashboard, setDashboard] = useState<SupplierDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth check - redirect if not authenticated or not a supplier with supplierIds
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.supplierIds?.length)) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isAuthenticated, user]);

  // Fetch dashboard data
  useEffect(() => {
    if (!supplierId) return;

    async function fetchDashboard() {
      setLoading(true);
      try {
        const data = await getSupplierDashboard(supplierId!);
        setDashboard(data);
      } catch (error) {
        console.error('대시보드 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [supplierId]);

  if (authLoading) {
    return <FullPageLoader message="로딩 중..." />;
  }

  // Show access denied if not supplier
  if (!isAuthenticated || user?.role !== 'supplier') {
    return (
      <>
        <Header />
        <main className="mx-auto min-h-screen max-w-[var(--content-max-width)] px-4 py-12">
          <Card className="text-center">
            <div className="py-12">
              <CubeIcon className="mx-auto h-16 w-16 text-gray-300" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                공급사 계정이 필요합니다
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                공급사 포탈은 승인된 공급사 회원만 이용할 수 있습니다.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button href="/supplier/apply" size="md">
                  공급사 입점 신청
                </Button>
                <Button href="/" variant="outline" size="md">
                  홈으로 이동
                </Button>
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <SupplierNav />
      <main className="mx-auto min-h-screen max-w-[var(--content-max-width)] px-4 py-8">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">등록 상품 수</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {dashboard?.totalProducts || 0}개
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                    <CubeIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">주문 건수</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {dashboard?.totalOrders || 0}건
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <ShoppingCartIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">총 매출액</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {formatKRW(dashboard?.totalSales || 0)}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">대기 정산액</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {formatKRW(dashboard?.pendingSettlement || 0)}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                    <BanknotesIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card padding="none">
              <div className="flex items-center justify-between p-5 pb-0">
                <CardTitle>최근 주문</CardTitle>
                <a href="/supplier/orders" className="text-sm text-primary hover:underline">
                  전체보기
                </a>
              </div>
              <div className="mt-4 overflow-x-auto">
                {!dashboard?.recentOrders || dashboard.recentOrders.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    최근 주문이 없습니다.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-5 py-3 text-xs font-medium text-gray-500">주문번호</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500">상품명</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500">수량</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">
                          금액
                        </th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500">날짜</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <span className="text-sm font-mono text-gray-700">
                              {order.orderNumber}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900">
                            {order.items?.[0]?.name || 'N/A'}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {order.items?.[0]?.quantity || 0}
                          </td>
                          <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
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
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
