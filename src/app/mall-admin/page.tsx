'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { LineChart, MiniStat } from '@/components/ui/Charts';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  BoltIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallStats, getMallById } from '@/lib/services/mall-service';
import { getMallOrders } from '@/lib/services/order-service';
import { getMallProducts } from '@/lib/services/product-service';
import type { Order, Product, Mall } from '@/types';
import type { MallStats } from '@/lib/services/mall-service';
import { useLiveSessions } from '@/lib/hooks/useLiveSessions';
import { LiveBadge } from '@/components/live/LiveBadge';

const planNames: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
};

const commissionRates: Record<string, number> = {
  free: 5,
  starter: 3,
  business: 1.5,
  enterprise: 0.5,
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
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

export default function MallAdminDashboard() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [stats, setStats] = useState<MallStats | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [mall, setMall] = useState<Mall | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const mallId = user?.ownedMallIds?.[0];

  // 라이브 현황
  const { sessions: liveSessions } = useLiveSessions(mallId ?? null);
  const activeLive = liveSessions.find((s) => s.status === 'live');
  const scheduledLives = liveSessions.filter((s) => s.status === 'scheduled');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/';
    }
  }, [authLoading, isMallOwner]);

  // Fetch dashboard data
  useEffect(() => {
    if (!mallId) return;

    async function fetchDashboardData() {
      setDataLoading(true);
      try {
        const defaultStats: MallStats = { productCount: 0, orderCount: 0, totalRevenue: 0 };
        const [mallStats, ordersResult, productsResult, mallData] = await Promise.all([
          getMallStats(mallId!).catch(() => defaultStats),
          getMallOrders(mallId!, { limit: 100 }).catch(() => ({ orders: [] as Order[], hasMore: false })),
          getMallProducts(mallId!, { limit: 50 }).catch(() => ({ products: [] as Product[], hasMore: false })),
          getMallById(mallId!),
        ]);

        setStats(mallStats);
        setAllOrders(ordersResult.orders);
        setMall(mallData);
        setLowStockProducts(
          productsResult.products.filter((p) => p.stock <= 5)
        );
      } catch (error) {
        console.error('대시보드 데이터 로딩 실패:', error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchDashboardData();
  }, [mallId]);

  // Computed: pending orders (from all orders)
  const pendingOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'paid'),
    [allOrders]
  );

  // Computed: today's stats
  const todayStats = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const todayOrders = allOrders.filter(
      (o) => o.createdAt >= todayMidnight
    );
    const todayRevenue = todayOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    return {
      orderCount: todayOrders.length,
      revenue: todayRevenue,
      pendingCount: pendingOrders.length,
    };
  }, [allOrders, pendingOrders]);

  // Computed: 7-day sales trend
  const salesTrend = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = allOrders.filter(
      (o) => o.createdAt >= sevenDaysAgo
    );

    // Create entries for all 7 days (even if no orders)
    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      dayMap.set(key, 0);
    }

    for (const order of recentOrders) {
      const d = order.createdAt;
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (dayMap.has(key)) {
        dayMap.set(key, dayMap.get(key)! + order.totalAmount);
      }
    }

    return Array.from(dayMap.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }, [allOrders]);

  // Computed: commission summary
  const commissionSummary = useMemo(() => {
    const plan = mall?.plan ?? 'free';
    const rate = commissionRates[plan] ?? 5;
    const planName = planNames[plan] ?? 'Free';

    // Monthly revenue: sum of orders from this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = allOrders
      .filter((o) => o.createdAt >= monthStart)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const estimatedCommission = Math.round(monthRevenue * (rate / 100));

    return { planName, rate, monthRevenue, estimatedCommission };
  }, [mall, allOrders]);

  // Show loading while auth is resolving or data is loading
  if (authLoading || (!isMallOwner && !authLoading)) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (dataLoading) {
    return <FullPageLoader message="대시보드를 불러오는 중..." />;
  }

  const dashboardStats = [
    {
      label: '총 매출',
      value: formatKRW(stats?.totalRevenue ?? 0),
      change: '',
      icon: CurrencyDollarIcon,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: '처리 대기 주문',
      value: `${pendingOrders.length}건`,
      change: '',
      icon: ShoppingCartIcon,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: '등록 상품',
      value: `${stats?.productCount ?? 0}개`,
      change: lowStockProducts.length > 0 ? `${lowStockProducts.length}개 재고 부족` : '',
      icon: CubeIcon,
      color: 'from-violet-500 to-purple-500',
    },
    {
      label: '총 주문',
      value: `${stats?.orderCount ?? 0}건`,
      change: '',
      icon: EyeIcon,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  // Display only first 5 pending orders
  const displayPendingOrders = pendingOrders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Today's Stats Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat
          label="오늘 주문"
          value={`${todayStats.orderCount}건`}
          icon={<ShoppingCartIcon className="h-4 w-4" />}
        />
        <MiniStat
          label="오늘 매출"
          value={formatKRW(todayStats.revenue)}
          icon={<CurrencyDollarIcon className="h-4 w-4" />}
        />
        <MiniStat
          label="신규 문의"
          value="0건"
          icon={<MegaphoneIcon className="h-4 w-4" />}
        />
        <MiniStat
          label="미처리 건수"
          value={`${todayStats.pendingCount}건`}
          icon={<BoltIcon className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button href="/mall-admin/products/create" size="md">
          <PlusIcon className="h-4 w-4" />
          상품 등록
        </Button>
        <Button href="/mall-admin/orders" variant="outline" size="md">
          주문 확인
          {pendingOrders.length > 0 && (
            <Badge variant="danger" className="ml-1.5">{pendingOrders.length}</Badge>
          )}
        </Button>
      </div>

      {/* 라이브 현황 */}
      {(activeLive || scheduledLives.length > 0) && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VideoCameraIcon className="h-5 w-5 text-red-500" />
              <CardTitle>라이브 현황</CardTitle>
            </div>
            <Button href="/mall-admin/live" variant="ghost" size="sm">전체 보기</Button>
          </div>
          <div className="mt-4 space-y-3">
            {activeLive && (
              <a href={`/mall-admin/live/${activeLive.id}`} className="flex items-center justify-between rounded-lg bg-red-50 p-3 transition-colors hover:bg-red-100">
                <div className="flex items-center gap-3">
                  <LiveBadge />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activeLive.title}</p>
                    <p className="text-xs text-gray-500">{activeLive.viewerCount}명 시청 중</p>
                  </div>
                </div>
                <Badge variant="danger">방송중</Badge>
              </a>
            )}
            {scheduledLives.slice(0, 2).map((session) => (
              <a key={session.id} href={`/mall-admin/live/${session.id}`} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{session.title}</p>
                  <p className="text-xs text-gray-500">
                    {session.scheduledAt.toLocaleDateString('ko-KR')} {session.scheduledAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge variant="info">예정</Badge>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <div className="mt-1 flex items-center gap-1">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
                  </div>
                )}
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 7-day Sales Trend Chart */}
      <Card padding="none">
        <div className="p-5 pb-0">
          <CardTitle>최근 7일 매출 추이</CardTitle>
        </div>
        <div className="p-5">
          {salesTrend.length >= 2 ? (
            <LineChart
              data={salesTrend}
              height={220}
              color="#6366f1"
              formatValue={(v) => formatKRW(v)}
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              매출 데이터가 부족합니다.
            </div>
          )}
        </div>
      </Card>

      {/* Commission Summary + HQ Announcements Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Commission Summary (분양몰 specific) */}
        <Card>
          <CardTitle>수수료 현황</CardTitle>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">현재 요금제</span>
              <Badge variant="default">{commissionSummary.planName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">수수료율</span>
              <span className="text-sm font-semibold text-gray-900">
                {commissionSummary.rate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">이번 달 매출</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatKRW(commissionSummary.monthRevenue)}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">예상 수수료</span>
                <span className="text-lg font-bold text-primary">
                  {formatKRW(commissionSummary.estimatedCommission)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/pricing"
              className="block rounded-lg bg-primary/5 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              요금제 업그레이드
            </a>
          </div>
        </Card>

        {/* HQ Announcements */}
        <Card>
          <CardTitle>본사 공지사항</CardTitle>
          <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
            <MegaphoneIcon className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-400">
              아직 공지사항이 없습니다.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Orders */}
        <Card className="lg:col-span-2" padding="none">
          <div className="flex items-center justify-between p-5 pb-0">
            <CardTitle>처리 대기 주문</CardTitle>
            <Badge variant="danger">{pendingOrders.length}건</Badge>
          </div>
          <div className="mt-4 divide-y divide-gray-50">
            {displayPendingOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                처리 대기 중인 주문이 없습니다.
              </div>
            ) : (
              displayPendingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-500">{order.orderNumber}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {getRelativeTime(order.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {order.userName} - {order.items[0]?.name}{order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatKRW(order.totalAmount)}</span>
                    <Button size="sm" href="/mall-admin/orders">확인</Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <a href="/mall-admin/orders" className="block text-center text-sm text-primary hover:underline">
              전체 주문 보기
            </a>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card padding="none">
          <div className="flex items-center gap-2 p-5 pb-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
            <CardTitle>재고 부족 알림</CardTitle>
          </div>
          <div className="mt-3 divide-y divide-gray-50">
            {lowStockProducts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                재고 부족 상품이 없습니다.
              </div>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                    <Badge variant={product.stock <= 1 ? 'danger' : 'warning'}>
                      잔여 {product.stock}개
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3">
            <a
              href="/mall-admin/products"
              className="block rounded-lg bg-gray-50 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              상품 관리로 이동
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
