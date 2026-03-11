'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSettlements, getMallSettlementSummary } from '@/lib/services/settlement-service';
import { getSettlementReports, getTaxInvoices } from '@/lib/services/report-service';
import type { Settlement, SettlementReport, TaxInvoice, SettlementStatus } from '@/types';

export default function MallAdminSettlements() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [reports, setReports] = useState<Record<string, SettlementReport>>({});
  const [taxInvoices, setTaxInvoices] = useState<Record<string, TaxInvoice>>({});

  const [totalSettled, setTotalSettled] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalProcessing, setTotalProcessing] = useState(0);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load data
  useEffect(() => {
    if (!mallId) return;

    async function loadData() {
      setLoading(true);
      try {
        // Each call wrapped individually - Firestore composite indexes may not exist yet
        const [settlementsData, summary, reportsData, taxInvoicesData] = await Promise.all([
          getSettlements({ mallId: mallId! }).catch(() => [] as Settlement[]),
          getMallSettlementSummary(mallId!).catch(() => ({
            totalSettled: 0, totalPending: 0, totalProcessing: 0, recentSettlements: [],
          })),
          getSettlementReports({ mallId: mallId! }).catch(() => [] as SettlementReport[]),
          getTaxInvoices({ mallId: mallId! }).catch(() => [] as TaxInvoice[]),
        ]);

        setSettlements(settlementsData);
        setTotalSettled(summary.totalSettled);
        setTotalPending(summary.totalPending);
        setTotalProcessing(summary.totalProcessing);

        // Map reports by settlementId
        const reportsMap: Record<string, SettlementReport> = {};
        reportsData.forEach((report) => {
          reportsMap[report.settlementId] = report;
        });
        setReports(reportsMap);

        // Map tax invoices by settlementId
        const taxInvoicesMap: Record<string, TaxInvoice> = {};
        taxInvoicesData.forEach((invoice) => {
          taxInvoicesMap[invoice.settlementId] = invoice;
        });
        setTaxInvoices(taxInvoicesMap);
      } catch (error: any) {
        console.error('Settlement load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mallId]);

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isMallOwner || !mallId) {
    return null;
  }

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

  const getTaxInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge variant="success">발행</Badge>;
      case 'pending':
        return <Badge variant="warning">대기</Badge>;
      case 'failed':
        return <Badge variant="danger">실패</Badge>;
      case 'cancelled':
        return <Badge variant="default">취소</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleDownloadReport = (settlementId: string) => {
    const report = reports[settlementId];
    if (report?.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    } else {
      alert('정산서가 아직 생성되지 않았습니다.');
    }
  };

  const handleDownloadTaxInvoice = (settlementId: string) => {
    const invoice = taxInvoices[settlementId];
    if (invoice?.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    } else {
      alert('세금계산서가 아직 발행되지 않았습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CurrencyDollarIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">정산 내역</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 정산 금액</p>
              <p className="text-xl font-bold text-gray-900">{formatKRW(totalSettled)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">대기 중</p>
              <p className="text-xl font-bold text-gray-900">{formatKRW(totalPending)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">처리 중</p>
              <p className="text-xl font-bold text-gray-900">{formatKRW(totalProcessing)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardTitle>정산 내역</CardTitle>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  정산기간
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  주문수
                </th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                  총 매출
                </th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                  수수료
                </th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                  정산금액
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  상태
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  정산서
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  세금계산서
                </th>
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
                settlements.map((settlement) => {
                  const report = reports[settlement.id];
                  const taxInvoice = taxInvoices[settlement.id];

                  return (
                    <tr key={settlement.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm text-gray-900">
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
                      <td className="px-5 py-3 text-center">
                        {report ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReport(settlement.id)}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            다운로드
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">생성 대기</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {taxInvoice ? (
                          <div className="flex flex-col items-center gap-1">
                            {getTaxInvoiceStatusBadge(taxInvoice.status)}
                            {taxInvoice.status === 'issued' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadTaxInvoice(settlement.id)}
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                다운로드
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">미발행</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
