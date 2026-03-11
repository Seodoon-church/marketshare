'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { MiniStat, BarChart } from '@/components/ui/Charts';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CalculatorIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallById } from '@/lib/services/mall-service';
import { getSettlements } from '@/lib/services/settlement-service';
import type { Mall, Settlement } from '@/types';

// ---- Plan/Rate mappings ----

const PLAN_INFO: Record<string, { name: string; rate: number; monthlyFee: number }> = {
  free: { name: 'Free', rate: 5, monthlyFee: 0 },
  starter: { name: 'Starter', rate: 3, monthlyFee: 19900 },
  business: { name: 'Business', rate: 1.5, monthlyFee: 39900 },
  enterprise: { name: 'Enterprise', rate: 0.5, monthlyFee: 99000 },
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-500',
  starter: 'bg-blue-500',
  business: 'bg-primary',
  enterprise: 'bg-amber-500',
};

// ---- Helpers ----

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getMonthLabel(key: string): string {
  const [, m] = key.split('-');
  return `${parseInt(m)}월`;
}

export default function MallAdminCommissionDashboard() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [loading, setLoading] = useState(true);
  const [mall, setMall] = useState<Mall | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

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
        const [mallData, settlementsData] = await Promise.all([
          getMallById(mallId!),
          getSettlements({ mallId: mallId! }).catch(() => [] as Settlement[]),
        ]);
        setMall(mallData);
        setSettlements(settlementsData);
      } catch (error: any) {
        console.error('Commission load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mallId]);

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isMallOwner || !mallId || !mall) {
    return null;
  }

  // ---- Derived data ----

  const currentPlanKey = mall.plan || 'free';
  const currentPlan = PLAN_INFO[currentPlanKey] || PLAN_INFO.free;

  // Monthly commission breakdown
  const monthlyMap = new Map<string, { commission: number; sales: number }>();
  for (const s of settlements) {
    const key = getMonthKey(s.period.startDate);
    const existing = monthlyMap.get(key) || { commission: 0, sales: 0 };
    existing.commission += s.totalCommission;
    existing.sales += s.totalSales;
    monthlyMap.set(key, existing);
  }

  // Sort months chronologically
  const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  // Take last 12 months max
  const recentMonths = sortedMonths.slice(-12);

  const barChartData = recentMonths.map(([key, data]) => ({
    label: getMonthLabel(key),
    value: data.commission,
  }));

  // Current month stats
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const currentMonthData = monthlyMap.get(currentMonthKey) || { commission: 0, sales: 0 };

  // Accumulated totals
  const totalCommission = settlements.reduce((acc, s) => acc + s.totalCommission, 0);
  const totalSales = settlements.reduce((acc, s) => acc + s.totalSales, 0);

  // Upgrade simulation: what if the user was on Business plan?
  const businessPlan = PLAN_INFO.business;
  const simulatedCommission = totalSales * (businessPlan.rate / 100);
  const totalMonths = Math.max(1, new Set(settlements.map((s) => getMonthKey(s.period.startDate))).size);
  const businessMonthlyCost = businessPlan.monthlyFee * totalMonths;
  const simulatedTotalCost = simulatedCommission + businessMonthlyCost;

  const currentTotalCost = totalCommission + currentPlan.monthlyFee * totalMonths;
  const savings = currentTotalCost - simulatedTotalCost;

  // Plan start date
  const planStartDate = mall.franchiseStartDate
    ? mall.franchiseStartDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalculatorIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">수수료 분석</h1>
      </div>

      {/* Commission Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat
          label="이번 달 수수료"
          value={formatKRW(currentMonthData.commission)}
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="누적 수수료"
          value={formatKRW(totalCommission)}
          icon={<ChartBarIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="이번 달 매출"
          value={formatKRW(currentMonthData.sales)}
          icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="수수료율"
          value={`${currentPlan.rate}%`}
          icon={<CalculatorIcon className="h-5 w-5" />}
        />
      </div>

      {/* Current Plan Info */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>현재 요금제</CardTitle>
            <div className="mt-3 flex items-center gap-3">
              <Badge
                variant="default"
                className={`${PLAN_COLORS[currentPlanKey] || 'bg-gray-500'} text-white px-3 py-1 text-sm`}
              >
                {currentPlan.name}
              </Badge>
              <span className="text-sm text-gray-500">
                월 {currentPlan.monthlyFee > 0 ? formatKRW(currentPlan.monthlyFee) : '무료'}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-24">판매 수수료율</span>
                <span className="font-semibold text-gray-900">{currentPlan.rate}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-24">이용 시작일</span>
                <span className="font-semibold text-gray-900">{planStartDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-24">월 이용료</span>
                <span className="font-semibold text-gray-900">
                  {currentPlan.monthlyFee > 0 ? formatKRW(currentPlan.monthlyFee) : '무료'}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
            <SparklesIcon className="h-10 w-10 text-primary" />
          </div>
        </div>
      </Card>

      {/* Monthly Commission Chart */}
      <Card>
        <CardTitle>월별 수수료 현황</CardTitle>
        <p className="mt-1 text-sm text-gray-500">최근 12개월 기준</p>
        {barChartData.length > 0 ? (
          <div className="mt-4">
            <BarChart
              data={barChartData}
              height={220}
              showValues
              formatValue={(v) => formatKRW(v)}
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center py-8 text-gray-400">
            <ChartBarIcon className="h-12 w-12 mb-2" />
            <p className="text-sm">아직 정산 데이터가 없습니다.</p>
          </div>
        )}
      </Card>

      {/* Upgrade Simulation */}
      <Card>
        <div className="flex items-center gap-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
          <CardTitle>요금제 업그레이드 시뮬레이션</CardTitle>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          다른 요금제를 이용했다면 얼마나 절약할 수 있었을까요?
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">현재 플랜으로 납부한 수수료</p>
                <p className="text-lg font-bold text-gray-900">{formatKRW(totalCommission)}</p>
              </div>
              <Badge variant="default">{currentPlan.name}</Badge>
            </div>
            {currentPlan.monthlyFee > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                + 월 이용료 {formatKRW(currentPlan.monthlyFee)} x {totalMonths}개월 = {formatKRW(currentPlan.monthlyFee * totalMonths)}
              </p>
            )}
            <p className="mt-1 text-sm font-semibold text-gray-700">
              총 비용: {formatKRW(currentTotalCost)}
            </p>
          </div>

          {currentPlanKey !== 'business' && (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Business 플랜이었다면</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatKRW(Math.round(simulatedCommission))}
                  </p>
                </div>
                <Badge variant="success">Business</Badge>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                + 월 이용료 {formatKRW(businessPlan.monthlyFee)} x {totalMonths}개월 = {formatKRW(businessMonthlyCost)}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                총 비용: {formatKRW(Math.round(simulatedTotalCost))}
              </p>
              {savings > 0 && (
                <p className="mt-2 text-sm font-bold text-emerald-600">
                  {formatKRW(Math.round(savings))} 절약 가능!
                </p>
              )}
              {savings <= 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  현재 플랜이 더 경제적입니다.
                </p>
              )}
            </div>
          )}

          {currentPlanKey === 'business' && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Enterprise 플랜이었다면</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatKRW(Math.round(totalSales * (PLAN_INFO.enterprise.rate / 100)))}
                  </p>
                </div>
                <Badge variant="warning">Enterprise</Badge>
              </div>
              {(() => {
                const entCommission = totalSales * (PLAN_INFO.enterprise.rate / 100);
                const entMonthlyCost = PLAN_INFO.enterprise.monthlyFee * totalMonths;
                const entTotalCost = entCommission + entMonthlyCost;
                const entSavings = currentTotalCost - entTotalCost;
                return (
                  <>
                    <p className="mt-1 text-xs text-gray-400">
                      + 월 이용료 {formatKRW(PLAN_INFO.enterprise.monthlyFee)} x {totalMonths}개월 = {formatKRW(entMonthlyCost)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      총 비용: {formatKRW(Math.round(entTotalCost))}
                    </p>
                    {entSavings > 0 ? (
                      <p className="mt-2 text-sm font-bold text-emerald-600">
                        {formatKRW(Math.round(entSavings))} 절약 가능!
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        현재 플랜이 더 경제적입니다.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="mt-5">
          <Button
            href="/pricing"
            variant="default"
          >
            요금제 비교하기
          </Button>
        </div>
      </Card>

      {/* Monthly Breakdown Table */}
      {recentMonths.length > 0 && (
        <Card padding="none">
          <div className="p-5 pb-0">
            <CardTitle>월별 수수료 상세</CardTitle>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">월</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">매출</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">수수료</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-gray-700">수수료율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...recentMonths].reverse().map(([key, data]) => {
                  const effectiveRate = data.sales > 0
                    ? ((data.commission / data.sales) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr key={key} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{key}</td>
                      <td className="px-5 py-3 text-right text-sm text-gray-900">
                        {formatKRW(data.sales)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-red-600">
                        -{formatKRW(data.commission)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-gray-600">
                        {effectiveRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">합계</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">
                    {formatKRW(totalSales)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-red-600">
                    -{formatKRW(totalCommission)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-gray-600">
                    {totalSales > 0 ? ((totalCommission / totalSales) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
