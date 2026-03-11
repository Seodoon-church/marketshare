'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatKRW, formatDate } from '@/lib/utils/format';
import {
  getSettlements,
  updateSettlementStatus,
} from '@/lib/services/settlement-service';
import type { Settlement as SettlementType, SettlementStatus } from '@/types';
import {
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const statusConfig: Record<
  SettlementStatus,
  { label: string; variant: 'warning' | 'info' | 'success' }
> = {
  pending: { label: '대기', variant: 'warning' },
  processing: { label: '처리중', variant: 'info' },
  completed: { label: '완료', variant: 'success' },
};

const filterTabs: { key: SettlementStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'processing', label: '처리중' },
  { key: 'completed', label: '완료' },
];

export default function AdminPaymentsPage() {
  const [activeFilter, setActiveFilter] = useState<SettlementStatus | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMall, setSelectedMall] = useState('all');
  const [settlements, setSettlements] = useState<SettlementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSettlements();
      setSettlements(data);
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '정산 데이터를 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleProcessSettlement = async (settlementId: string) => {
    try {
      await updateSettlementStatus(settlementId, 'processing');
      toast({ type: 'success', message: '정산 처리가 시작되었습니다.' });
      await fetchSettlements();
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '정산 처리 중 오류가 발생했습니다.' });
    }
  };

  const filteredSettlements = settlements.filter((s) => {
    const matchesFilter = activeFilter === 'all' || s.status === activeFilter;
    const matchesMall = selectedMall === 'all' || s.mallName === selectedMall;
    return matchesFilter && matchesMall;
  });

  const mallNames = Array.from(new Set(settlements.map((s) => s.mallName)));

  // Compute summary cards from real data
  const totalSettlementAmount = settlements.reduce(
    (sum, s) => sum + s.totalSettlement,
    0
  );

  const pendingAmount = settlements
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.totalSettlement, 0);

  const completedAmount = settlements
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.totalSettlement, 0);

  const totalCount = settlements.length;

  const summaryCards = [
    {
      label: '이번 달 정산액',
      value: totalSettlementAmount,
      icon: BanknotesIcon,
      color: 'from-emerald-500 to-teal-500',
      isCount: false,
    },
    {
      label: '대기중',
      value: pendingAmount,
      icon: ClockIcon,
      color: 'from-amber-500 to-orange-500',
      isCount: false,
    },
    {
      label: '완료',
      value: completedAmount,
      icon: CheckCircleIcon,
      color: 'from-blue-500 to-cyan-500',
      isCount: false,
    },
    {
      label: '정산 건수',
      value: totalCount,
      icon: DocumentTextIcon,
      color: 'from-violet-500 to-purple-500',
      isCount: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          입점몰별 매출 정산을 관리하고 처리합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {card.isCount ? `${card.value}건` : formatKRW(card.value)}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {filterTabs.map((tab) => {
              const count =
                tab.key === 'all'
                  ? settlements.length
                  : settlements.filter((s) => s.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeFilter === tab.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      activeFilter === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">전체 기간</option>
                <option value="2026-03">2026년 3월</option>
                <option value="2026-02">2026년 2월</option>
                <option value="2026-01">2026년 1월</option>
              </select>
            </div>

            <select
              value={selectedMall}
              onChange={(e) => setSelectedMall(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">전체 몰</option>
              {mallNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500">정산기간</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">몰명</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">매출액</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">수수료</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">정산액</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">처리일</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettlements.map((settlement) => {
                const config = statusConfig[settlement.status];
                const periodStr = `${formatDate(settlement.period.startDate)} ~ ${formatDate(settlement.period.endDate)}`;
                return (
                  <tr
                    key={settlement.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-700">{periodStr}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {settlement.mallName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatKRW(settlement.totalSales)}
                    </td>
                    <td className="px-5 py-3 text-sm text-red-500 text-right">
                      -{formatKRW(settlement.totalCommission)}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900 text-right">
                      {formatKRW(settlement.totalSettlement)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {settlement.status === 'pending' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessSettlement(settlement.id)}
                        >
                          정산 처리
                        </Button>
                      ) : settlement.processedAt ? (
                        <span className="text-sm text-gray-500">
                          {formatDate(settlement.processedAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredSettlements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm text-gray-400">해당 조건의 정산 내역이 없습니다.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
