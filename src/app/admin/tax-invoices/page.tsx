'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { DocumentTextIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getTaxInvoices } from '@/lib/services/report-service';
import type { TaxInvoice, TaxInvoiceStatus } from '@/types';

export default function AdminTaxInvoices() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<TaxInvoiceStatus | ''>('');

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
        const invoicesData = await getTaxInvoices({
          status: filterStatus || undefined,
        });
        setInvoices(invoicesData);
      } catch (error: any) {
        alert(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, isAdmin, filterStatus]);

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  const getStatusBadge = (status: TaxInvoiceStatus) => {
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

  const handleDownload = (invoice: TaxInvoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    } else {
      alert('세금계산서 파일이 생성되지 않았습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DocumentTextIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">세금계산서 관리</h1>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="w-full max-w-xs">
            <Select
              label="상태"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as TaxInvoiceStatus | '')}
              options={[
                { value: '', label: '전체' },
                { value: 'pending', label: '대기' },
                { value: 'issued', label: '발행' },
                { value: 'failed', label: '실패' },
                { value: 'cancelled', label: '취소' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Tax Invoices Table */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardTitle>세금계산서 목록</CardTitle>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  몰이름
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  정산기간
                </th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                  공급가액
                </th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                  세액
                </th>
                <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">
                  합계
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  발행일
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  상태
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                    세금계산서가 없습니다.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {invoice.mallName}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {invoice.period.startDate.toLocaleDateString('ko-KR')} ~<br />
                      {invoice.period.endDate.toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-gray-900">
                      {formatKRW(invoice.supplyAmount)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-gray-600">
                      {formatKRW(invoice.taxAmount)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-primary">
                      {formatKRW(invoice.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600">
                      {invoice.issueDate
                        ? invoice.issueDate.toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {invoice.status === 'issued' && (
                        <button
                          onClick={() => handleDownload(invoice)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                          다운로드
                        </button>
                      )}
                      {invoice.status === 'pending' && (
                        <span className="text-xs text-gray-400">발행 대기</span>
                      )}
                      {invoice.status === 'failed' && (
                        <span className="text-xs text-red-500">발행 실패</span>
                      )}
                      {invoice.status === 'cancelled' && (
                        <span className="text-xs text-gray-400">취소됨</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {invoices.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          총 {invoices.length}건의 세금계산서
        </div>
      )}
    </div>
  );
}
