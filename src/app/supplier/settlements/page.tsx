'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';
import { formatKRW } from '@/lib/utils/format';
import { getSupplierSettlements } from '@/lib/services/supplier-service';
import type { SupplierSettlement } from '@/types';

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
          <a href="/supplier/orders" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            주문현황
          </a>
          <a href="/supplier/settlements" className="border-b-2 border-primary px-4 py-3 text-sm font-medium text-primary">
            정산내역
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function SupplierSettlementsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const supplierId = user?.supplierIds?.[0];

  const [settlements, setSettlements] = useState<SupplierSettlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'supplier')) {
      window.location.href = '/supplier';
    }
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!supplierId) return;

    async function fetchSettlements() {
      setLoading(true);
      try {
        const data = await getSupplierSettlements(supplierId!);
        setSettlements(data);
      } catch (error) {
        console.error('정산 내역 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettlements();
  }, [supplierId]);

  if (authLoading || loading) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (!isAuthenticated || user?.role !== 'supplier') {
    return null;
  }

  // Calculate summary
  const totalSettlement = settlements.reduce((sum, s) => sum + s.totalSettlement, 0);
  const pendingSettlement = settlements
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.totalSettlement, 0);
  const processingSettlement = settlements
    .filter((s) => s.status === 'processing')
    .reduce((sum, s) => sum + s.totalSettlement, 0);

  return (
    <>
      <Header />
      <SupplierNav />
      <main className="mx-auto min-h-screen max-w-[var(--content-max-width)] px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">정산 내역</h1>
            <p className="mt-1 text-sm text-gray-500">총 {settlements.length}건</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500">총 정산금액</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatKRW(totalSettlement)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">대기 중</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{formatKRW(pendingSettlement)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">처리 중</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{formatKRW(processingSettlement)}</p>
            </Card>
          </div>

          {/* Settlements Table */}
          {settlements.length === 0 ? (
            <EmptyState
              icon={<BanknotesIcon className="h-12 w-12" />}
              title="정산 내역이 없습니다"
              description="정산이 생성되면 여기에 표시됩니다."
            />
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">정산기간</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">매출</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">수수료</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">정산금액</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((settlement) => {
                      const startDate = settlement.period.startDate instanceof Date
                        ? settlement.period.startDate
                        : new Date(settlement.period.startDate);
                      const endDate = settlement.period.endDate instanceof Date
                        ? settlement.period.endDate
                        : new Date(settlement.period.endDate);

                      return (
                        <tr key={settlement.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-5 py-3 text-sm text-gray-900">
                            {startDate.toLocaleDateString('ko-KR')} - {endDate.toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-5 py-3 text-sm text-right text-gray-900">
                            {formatKRW(settlement.totalSales)}
                          </td>
                          <td className="px-5 py-3 text-sm text-right text-red-600">
                            -{formatKRW(settlement.totalCommission)}
                          </td>
                          <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatKRW(settlement.totalSettlement)}
                          </td>
                          <td className="px-5 py-3">
                            <Badge
                              variant={
                                settlement.status === 'pending'
                                  ? 'warning'
                                  : settlement.status === 'processing'
                                  ? 'info'
                                  : 'success'
                              }
                            >
                              {settlement.status === 'pending'
                                ? '대기'
                                : settlement.status === 'processing'
                                ? '처리중'
                                : '완료'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {settlement.createdAt instanceof Date
                              ? settlement.createdAt.toLocaleDateString('ko-KR')
                              : new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
