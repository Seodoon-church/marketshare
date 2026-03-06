'use client';

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

const stats = [
  {
    label: '오늘 매출',
    value: formatKRW(2850000),
    change: '+12.5%',
    up: true,
    icon: CurrencyDollarIcon,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    label: '신규 주문',
    value: '47건',
    change: '+8.3%',
    up: true,
    icon: ShoppingCartIcon,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    label: '활성 분양몰',
    value: '53개',
    change: '+2',
    up: true,
    icon: BuildingStorefrontIcon,
    color: 'from-violet-500 to-purple-500',
  },
  {
    label: '전체 회원',
    value: '1,284명',
    change: '+24',
    up: true,
    icon: UsersIcon,
    color: 'from-amber-500 to-orange-500',
  },
];

const recentOrders = [
  { id: 'MS-20260307-A1B2C', mall: '스타일몰', customer: '김민수', amount: 89000, status: 'paid', time: '5분 전' },
  { id: 'MS-20260307-D3E4F', mall: '건강마켓', customer: '이영희', amount: 45000, status: 'preparing', time: '12분 전' },
  { id: 'MS-20260307-G5H6I', mall: '핸드메이드샵', customer: '박지훈', amount: 159000, status: 'shipped', time: '25분 전' },
  { id: 'MS-20260307-J7K8L', mall: '스타일몰', customer: '최수진', amount: 38000, status: 'delivered', time: '1시간 전' },
  { id: 'MS-20260307-M9N0O', mall: '테크스토어', customer: '정현우', amount: 290000, status: 'paid', time: '2시간 전' },
];

const topMalls = [
  { name: '스타일몰', revenue: 12500000, orders: 156, growth: 15.2 },
  { name: '건강마켓', revenue: 8900000, orders: 98, growth: 8.7 },
  { name: '핸드메이드샵', revenue: 6700000, orders: 87, growth: 22.1 },
  { name: '테크스토어', revenue: 5200000, orders: 45, growth: -3.2 },
  { name: '뷰티몰', revenue: 4800000, orders: 67, growth: 11.5 },
];

const pendingApplications = [
  { name: '김철수', mallName: '패션왕국', theme: 'shop', date: '2026.03.07' },
  { name: '이은정', mallName: '수제공방', theme: 'service', date: '2026.03.06' },
  { name: '박태호', mallName: '로컬맛집', theme: 'restaurant', date: '2026.03.06' },
];

export default function AdminDashboard() {
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
