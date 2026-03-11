'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSettlements, updateSettlementStatus } from '@/lib/services/settlement-service';
import { getMalls } from '@/lib/services/mall-service';
import { createTaxInvoice, calculateTaxAmounts } from '@/lib/services/report-service';
import type { Settlement, SettlementStatus, Mall } from '@/types';

export default function AdminSettlements() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);

  const [filterMallId, setFilterMallId] = useState('');
  const [filterStatus, setFilterStatus] = useState<SettlementStatus | ''>('');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  // Load data
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    async function loadData() {
      try {
        setLoading(true);
        const [settlementsData, mallsData] = await Promise.all([
          getSettlements({
            mallId: filterMallId || undefined,
            status: filterStatus || undefined,
          }),
          getMalls(),
        ]);
        setSettlements(settlementsData);
        setMalls(mallsData);
      } catch (error: any) {
        alert(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, isAdmin, filterMallId, filterStatus]);

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  const totalSettlement = settlements.reduce((sum, s) => sum + s.totalSettlement, 0);
  const pendingSettlements = settlements.filter((s) => s.status === 'pending');
  const processingSettlements = settlements.filter((s) => s.status === 'processing');

  const getStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">완료</Badge>;
      case 'processing':
        return <Badge variant="warning">처리 중</Badge>;
      case 'pending':
        return <Badge variant="default">대기</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleProcessSettlement = async (settlementId: string, currentStatus: SettlementStatus) => {
    if (currentStatus === 'completed') {
      alert('이미 완료된 정산입니다.');
      return;
    }

    if (!confirm('정산을 처리하시겠습니까?')) return;

    setProcessing(settlementId);
    try {
      const newStatus: SettlementStatus = currentStatus === 'pending' ? 'processing' : 'completed';
      await updateSettlementStatus(settlementId, newStatus);
      alert(`정산 상태가 "${newStatus === 'processing' ? '처리 중' : '완료'}"으로 변경되었습니다.`);

      // Reload data
      const updatedSettlements = await getSettlements({
        mallId: filterMallId || undefined,
        status: filterStatus || undefined,
      });
      setSettlements(updatedSettlements);
    } catch (error: any) {
      alert(error.message || '정산 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const handleIssueTaxInvoice = async (settlement: Settlement) => {
    if (!confirm('세금계산서를 발행하시겠습니까?')) return;

    setProcessing(settlement.id);
    try {
      const mall = malls.find((m) => m.id === settlement.mallId);
      if (!mall || !mall.businessInfo) {
        alert('몰의 사업자 정보가 없습니다.');
        return;
      }

      // Calculate tax amounts
      const { supplyAmount, taxAmount, totalAmount } = calculateTaxAmounts(
        settlement.totalSettlement
      );

      // Platform business info (hardcoded for now)
      const platformBusinessInfo = {
        businessName: 'MarketShare',
        businessNumber: '000-00-00000',
        representative: '홍길동',
        address: '서울시 강남구',
        phone: '02-0000-0000',
        email: 'contact@marketshare.co.kr',
      };

      await createTaxInvoice({
        settlementId: settlement.id,
        mallId: settlement.mallId,
        mallName: settlement.mallName,
        issuerInfo: platformBusinessInfo,
        recipientInfo: mall.businessInfo,
        period: settlement.period,
        supplyAmount,
        taxAmount,
        totalAmount,
        status: 'issued',
        externalId: null,
        issueDate: new Date(),
        pdfUrl: null,
      });

      alert('세금계산서가 발행되었습니다.');

      // Reload settlements
      const updatedSettlements = await getSettlements({
        mallId: filterMallId || undefined,
        status: filterStatus || undefined,
      });
      setSettlements(updatedSettlements);
    } catch (error: any) {
      alert(error.message || '세금계산서 발행 중 오류가 발생했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CurrencyDollarIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 정산액</p>
              <p className="text-xl font-bold text-gray-900">{formatKRW(totalSettlement)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">미처리</p>
              <p className="text-xl font-bold text-gray-900">
                {pendingSettlements.length}건
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">처리중</p>
              <p className="text-xl font-bold text-gray-900">
                {processingSettlements.length}건
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 flex-1">
            <Select
              label="몰 선택"
              value={filterMallId}
              onChange={(v) => setFilterMallId(v)}
              options={[
                { value: '', label: '전체' },
                ...malls.map((mall) => ({ value: mall.id, label: mall.name })),
              ]}
            />
            <Select
              label="상태"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as SettlementStatus | '')}
              options={[
                { value: '', label: '전체' },
                { value: 'pending', label: '대기' },
                { value: 'processing', label: '처리 중' },
                { value: 'completed', label: '완료' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Settlements Table */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardTitle>정산 목록</CardTitle>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">몰이름</th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">정산기간</th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">주문수</th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">매출</th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">수수료</th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">정산액</th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">상태</th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                    정산 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {settlement.mallName}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {settlement.period.startDate.toLocaleDateString('ko-KR')} ~<br />
                      {settlement.period.endDate.toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-900">
                      {settlement.orderCount}건
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">
                      {formatKRW(settlement.totalSales)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-red-600">
                      -{formatKRW(settlement.totalCommission)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-primary">
                      {formatKRW(settlement.totalSettlement)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {getStatusBadge(settlement.status)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-center gap-2">
                        {settlement.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleProcessSettlement(settlement.id, settlement.status)
                            }
                            disabled={processing === settlement.id}
                          >
                            {processing === settlement.id
                              ? '처리 중...'
                              : settlement.status === 'pending'
                              ? '처리 시작'
                              : '완료 처리'}
                          </Button>
                        )}
                        {!settlement.taxInvoiceId && settlement.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIssueTaxInvoice(settlement)}
                            disabled={processing === settlement.id}
                          >
                            세금계산서 발행
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
