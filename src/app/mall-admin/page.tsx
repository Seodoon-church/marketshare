'use client';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import Link from 'next/link';

const stats = [
  { label: '오늘 매출', value: formatKRW(485000), change: '+18.2%', icon: CurrencyDollarIcon, color: 'from-emerald-500 to-teal-500' },
  { label: '신규 주문', value: '12건', change: '+5건', icon: ShoppingCartIcon, color: 'from-blue-500 to-cyan-500' },
  { label: '등록 상품', value: '87개', change: '3개 품절', icon: CubeIcon, color: 'from-violet-500 to-purple-500' },
  { label: '오늘 방문', value: '324명', change: '+22.1%', icon: EyeIcon, color: 'from-amber-500 to-orange-500' },
];

const pendingOrders = [
  { id: 'MS-20260307-X1Y2Z', customer: '김민수', items: '프리미엄 면 티셔츠 외 1건', amount: 52000, time: '10분 전' },
  { id: 'MS-20260307-A3B4C', customer: '이영희', items: '핸드메이드 가죽 지갑', amount: 89000, time: '25분 전' },
  { id: 'MS-20260307-D5E6F', customer: '박지훈', items: '프리미엄 실크 스카프 외 2건', amount: 195000, time: '1시간 전' },
];

const lowStockProducts = [
  { name: '프리미엄 면 티셔츠 (화이트/L)', stock: 2, sku: 'TS-W-L' },
  { name: '핸드메이드 가죽 지갑 (브라운)', stock: 1, sku: 'WL-BR' },
  { name: '에코 캔버스 백팩', stock: 3, sku: 'BP-EC-01' },
];

export default function MallAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link href="/mall-admin/products/create">
          <Button size="md">
            <PlusIcon className="h-4 w-4" />
            상품 등록
          </Button>
        </Link>
        <Link href="/mall-admin/orders">
          <Button variant="outline" size="md">
            주문 확인
            <Badge variant="danger" className="ml-1.5">3</Badge>
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="mt-1 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
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
        {/* Pending Orders */}
        <Card className="lg:col-span-2" padding="none">
          <div className="flex items-center justify-between p-5 pb-0">
            <CardTitle>처리 대기 주문</CardTitle>
            <Badge variant="danger">{pendingOrders.length}건</Badge>
          </div>
          <div className="mt-4 divide-y divide-gray-50">
            {pendingOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-500">{order.id}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {order.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-900">{order.customer} - {order.items}</p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatKRW(order.amount)}</span>
                  <Button size="sm">확인</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/mall-admin/orders" className="block text-center text-sm text-primary hover:underline">
              전체 주문 보기
            </Link>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card padding="none">
          <div className="flex items-center gap-2 p-5 pb-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
            <CardTitle>재고 부족 알림</CardTitle>
          </div>
          <div className="mt-3 divide-y divide-gray-50">
            {lowStockProducts.map((product) => (
              <div key={product.sku} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                  <Badge variant={product.stock <= 1 ? 'danger' : 'warning'}>
                    잔여 {product.stock}개
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3">
            <Link
              href="/mall-admin/products"
              className="block rounded-lg bg-gray-50 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              상품 관리로 이동
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
