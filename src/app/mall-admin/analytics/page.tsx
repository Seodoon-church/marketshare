'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { LineChart, DonutChart, BarChart } from '@/components/ui/Charts';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallStats } from '@/lib/services/mall-service';
import { getMallOrders } from '@/lib/services/order-service';
import { getMallProducts } from '@/lib/services/product-service';
import type { Order, Product } from '@/types';
import type { MallStats } from '@/lib/services/mall-service';
import {
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  EyeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

type Period = 'today' | 'week' | 'month' | '3months';

const periodTabs: { key: Period; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번주' },
  { key: 'month', label: '이번달' },
  { key: '3months', label: '3개월' },
];

const DONUT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
];

const STATUS_LABELS: Record<string, string> = {
  paid: '결제완료',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-blue-500',
  preparing: 'bg-amber-500',
  shipped: 'bg-violet-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-400',
};

function getDateRange(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3months':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
}

function groupOrdersByDate(orders: Order[]): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const order of orders) {
    const date = order.createdAt;
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    map.set(key, (map.get(key) ?? 0) + order.totalAmount);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}

export default function MallAdminAnalytics() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MallStats | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!mallId) return;
    setLoading(true);
    setError(null);
    try {
      const defaultStats: MallStats = { productCount: 0, orderCount: 0, totalRevenue: 0 };
      const [mallStats, ordersResult, productsResult] = await Promise.all([
        getMallStats(mallId).catch(() => defaultStats),
        getMallOrders(mallId, { limit: 200 }).catch(() => ({ orders: [] as Order[], hasMore: false })),
        getMallProducts(mallId, {
          sortBy: 'salesCount',
          sortDirection: 'desc',
          limit: 5,
        }).catch(() => ({ products: [] as Product[], hasMore: false })),
      ]);

      setStats(mallStats);
      setAllOrders(ordersResult.orders);
      setTopProducts(productsResult.products);
    } catch (err: any) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [mallId]);

  useEffect(() => {
    if (mallId) {
      fetchData();
    }
  }, [mallId, fetchData]);

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const rangeStart = getDateRange(period);
    return allOrders.filter((o) => o.createdAt >= rangeStart);
  }, [allOrders, period]);

  // Build stats cards from filtered data
  const statsData = useMemo(() => {
    const periodRevenue = filteredOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const periodOrderCount = filteredOrders.length;

    return [
      {
        label: '매출',
        value: formatKRW(periodRevenue),
        change: `${periodOrderCount}건 기준`,
        positive: true,
        icon: CurrencyDollarIcon,
        color: 'from-emerald-500 to-teal-500',
      },
      {
        label: '주문',
        value: `${periodOrderCount}건`,
        change: '선택 기간',
        positive: true,
        icon: ShoppingCartIcon,
        color: 'from-blue-500 to-cyan-500',
      },
      {
        label: '방문',
        value: '데이터 수집 중',
        change: '-',
        positive: true,
        icon: EyeIcon,
        color: 'from-violet-500 to-purple-500',
        isPlaceholder: true,
      },
      {
        label: '전환율',
        value: '데이터 수집 중',
        change: '-',
        positive: true,
        icon: ChartBarIcon,
        color: 'from-amber-500 to-orange-500',
        isPlaceholder: true,
      },
    ];
  }, [filteredOrders]);

  // Daily revenue chart data from filtered orders
  const dailyRevenueData = useMemo(() => {
    return groupOrdersByDate(filteredOrders);
  }, [filteredOrders]);

  // Compute category revenue breakdown (donut chart)
  const categoryRevenue = useMemo(() => {
    if (topProducts.length === 0) return [];

    const categoryMap = new Map<string, number>();
    let totalRevenue = 0;

    for (const product of topProducts) {
      const catName = product.categoryName || '기타';
      const revenue = (product.salePrice ?? product.price) * product.salesCount;
      categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + revenue);
      totalRevenue += revenue;
    }

    if (totalRevenue === 0) return [];

    return Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, revenue], index) => ({
        label: name,
        value: revenue,
        color: DONUT_COLORS[index % DONUT_COLORS.length],
      }));
  }, [topProducts]);

  // Order status bar chart data from filtered orders
  const orderStatusData = useMemo(() => {
    const statusCountMap = new Map<string, number>();
    const statusKeys = ['paid', 'preparing', 'shipped', 'delivered', 'cancelled'];

    for (const key of statusKeys) {
      statusCountMap.set(key, 0);
    }

    for (const order of filteredOrders) {
      if (statusCountMap.has(order.status)) {
        statusCountMap.set(order.status, statusCountMap.get(order.status)! + 1);
      }
    }

    return statusKeys.map((key) => ({
      label: STATUS_LABELS[key] ?? key,
      value: statusCountMap.get(key) ?? 0,
      color: STATUS_COLORS[key] ?? 'bg-gray-400',
    }));
  }, [filteredOrders]);

  // Loading states
  if (authLoading || (!isMallOwner && !user)) {
    return <FullPageLoader message="인증 확인 중..." />;
  }

  if (loading) {
    return <FullPageLoader message="통계 데이터를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">통계</h1>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                period === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchData}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              다시 시도
            </button>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p
                  className={`mt-1 font-bold text-gray-900 ${
                    'isPlaceholder' in stat && stat.isPlaceholder
                      ? 'text-sm'
                      : 'text-2xl'
                  }`}
                >
                  {stat.value}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {!('isPlaceholder' in stat && stat.isPlaceholder) && (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      'isPlaceholder' in stat && stat.isPlaceholder
                        ? 'text-gray-400'
                        : 'text-emerald-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Trend - Large */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-5 pb-0">
            <CardTitle>매출 추이</CardTitle>
          </div>
          <div className="p-5">
            {dailyRevenueData.length >= 2 ? (
              <LineChart
                data={dailyRevenueData}
                height={280}
                color="#6366f1"
                formatValue={(v) => formatKRW(v)}
              />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
                <div className="text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-400">
                    선택한 기간에 매출 데이터가 부족합니다
                  </p>
                  <p className="mt-1 text-xs text-gray-300">
                    2개 이상의 날짜에 주문이 있어야 차트가 표시됩니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Category Revenue - DonutChart */}
        <Card padding="none">
          <div className="p-5 pb-0">
            <CardTitle>카테고리별 매출 비중</CardTitle>
          </div>
          <div className="p-5">
            {categoryRevenue.length > 0 ? (
              <DonutChart
                segments={categoryRevenue}
                size={140}
                centerLabel="매출"
                centerValue={`${categoryRevenue.length}개`}
              />
            ) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-gray-400 text-center">
                  판매 데이터가 없습니다
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Order Status BarChart */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardTitle>주문 상태별 현황</CardTitle>
        </div>
        <div className="p-5">
          {orderStatusData.some((d) => d.value > 0) ? (
            <BarChart
              data={orderStatusData}
              orientation="horizontal"
              showValues
              formatValue={(v) => `${v}건`}
            />
          ) : (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-gray-400">
                선택한 기간에 주문 데이터가 없습니다
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Top Products */}
      <Card padding="none">
        <div className="flex items-center justify-between p-5 pb-0">
          <CardTitle>인기 상품 TOP 5</CardTitle>
          <Badge variant="secondary">판매량 기준</Badge>
        </div>
        {topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-500">판매 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-gray-50">
            {topProducts.map((product, index) => {
              const rank = index + 1;
              const revenue =
                (product.salePrice ?? product.price) * product.salesCount;
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                      rank <= 3
                        ? 'bg-primary/10 text-primary'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {product.salesCount}건 판매
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatKRW(revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
