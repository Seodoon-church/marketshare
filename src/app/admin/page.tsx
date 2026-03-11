'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import {
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingCartIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAllOrders } from '@/lib/services/order-service';
import { getMalls } from '@/lib/services/mall-service';
import { getFranchiseApplications } from '@/lib/services/franchise-service';
import type { Order, Mall, FranchiseApplication } from '@/types';

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [applications, setApplications] = useState<FranchiseApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin auth check
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      window.location.href = '/';
    }
  }, [authLoading, user, isAdmin]);

  // Fetch data
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [orderResult, mallResult, appResult] = await Promise.all([
          getAllOrders({ limit: 20 }),
          getMalls(),
          getFranchiseApplications({ status: 'pending' }),
        ]);
        setOrders(orderResult.orders);
        setMalls(mallResult);
        setApplications(appResult);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAdmin]);

  if (authLoading || loading) {
    return <FullPageLoader message="대시보드 로딩 중..." />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  // Compute stats
  const today = new Date();
  const paidStatuses = ['paid', 'preparing', 'shipped', 'delivered'];

  const todayOrders = orders.filter((o) => {
    const orderDate = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
    return (
      orderDate.getFullYear() === today.getFullYear() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getDate() === today.getDate() &&
      paidStatuses.includes(o.status)
    );
  });

  // 플랫폼 총 거래액 (GMV)
  const todayGMV = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // 플랫폼 수수료 수입 (각 주문의 commission 합산)
  const todayCommission = todayOrders.reduce((sum, o) => sum + (o.commission || 0), 0);

  // 총 누적 수수료 (전체 주문 기준)
  const totalCommission = orders
    .filter((o) => paidStatuses.includes(o.status))
    .reduce((sum, o) => sum + (o.commission || 0), 0);

  const activeMalls = malls.filter((m) => m.status === 'active').length;

  const stats = [
    {
      label: '플랫폼 거래액 (오늘)',
      value: formatKRW(todayGMV),
      change: `${todayOrders.length}건`,
      up: true,
      icon: ShoppingCartIcon,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: '수수료 수입 (오늘)',
      value: formatKRW(todayCommission),
      change: totalCommission > 0 ? `누적 ${formatKRW(totalCommission)}` : '',
      up: true,
      icon: CurrencyDollarIcon,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: '활성 분양몰',
      value: `${activeMalls}개`,
      change: `전체 ${malls.length}개`,
      up: activeMalls > 0,
      icon: BuildingStorefrontIcon,
      color: 'from-violet-500 to-purple-500',
    },
    {
      label: '분양 신청 대기',
      value: `${applications.length}건`,
      change: '',
      up: applications.length > 0,
      icon: UsersIcon,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  // Recent orders: first 5
  const recentOrders = orders.slice(0, 5).map((order) => ({
    id: order.orderNumber,
    mall: order.mallName || order.mallId,
    customer: order.userName || 'N/A',
    amount: order.totalAmount,
    status: order.status,
    time: getRelativeTime(order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)),
  }));

  // Top malls: sort by productCount descending, take 5
  const topMalls = [...malls]
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 5)
    .map((mall) => ({
      name: mall.name,
      revenue: mall.totalRevenue || 0,
      orders: mall.orderCount || 0,
      growth: 0,
    }));

  // Pending applications (already filtered by status 'pending' in fetch)
  const pendingApplications = applications.map((app) => ({
    name: app.applicantName,
    mallName: app.desiredMallName,
    theme: app.desiredTheme,
    date: app.createdAt instanceof Date
      ? `${app.createdAt.getFullYear()}.${String(app.createdAt.getMonth() + 1).padStart(2, '0')}.${String(app.createdAt.getDate()).padStart(2, '0')}`
      : new Date(app.createdAt).toLocaleDateString('ko-KR'),
  }));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="mt-1 flex items-center gap-1">
                  {stat.up ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${stat.up ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-400">vs 어제</span>
                </div>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2" padding="none">
          <div className="flex items-center justify-between p-5 pb-0">
            <CardTitle>최근 주문</CardTitle>
            <a href="/admin/orders" className="text-sm text-primary hover:underline">전체보기</a>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">주문번호</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">입점몰</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">고객</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">금액</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">시간</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-mono text-gray-700">{order.id}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{order.mall}</td>
                    <td className="px-5 py-3 text-sm text-gray-900">{order.customer}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatKRW(order.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={
                        order.status === 'paid' ? 'info' :
                        order.status === 'preparing' ? 'warning' :
                        order.status === 'shipped' ? 'default' :
                        'success'
                      }>
                        {order.status === 'paid' ? '결제완료' :
                         order.status === 'preparing' ? '배송준비' :
                         order.status === 'shipped' ? '배송중' : '배송완료'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {order.time}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Malls */}
          <Card padding="none">
            <div className="p-5 pb-0">
              <CardTitle>매출 TOP 입점몰</CardTitle>
            </div>
            <div className="mt-3 divide-y divide-gray-50">
              {topMalls.map((mall, i) => (
                <div key={mall.name} className="flex items-center gap-3 px-5 py-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-100 text-gray-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{mall.name}</p>
                    <p className="text-xs text-gray-400">{mall.orders}건</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatKRW(mall.revenue)}</p>
                    <p className={`text-xs ${mall.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {mall.growth >= 0 ? '+' : ''}{mall.growth}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Applications */}
          <Card padding="none">
            <div className="flex items-center justify-between p-5 pb-0">
              <CardTitle>분양 신청</CardTitle>
              <Badge variant="danger">{pendingApplications.length}건</Badge>
            </div>
            <div className="mt-3 divide-y divide-gray-50">
              {pendingApplications.map((app) => (
                <div key={app.mallName} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.mallName}</p>
                    <p className="text-xs text-gray-400">{app.name} | {app.date}</p>
                  </div>
                  <Badge variant="secondary">{app.theme}</Badge>
                </div>
              ))}
            </div>
            <div className="p-3">
              <a href="/admin/franchise" className="block rounded-lg bg-gray-50 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-100">
                전체 신청 보기
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
