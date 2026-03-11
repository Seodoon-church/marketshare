'use client';

import { cn } from '@/lib/utils/cn';
import { formatKRW, formatDate } from '@/lib/utils/format';
import type { OrderStatus } from '@/types';

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date | string;
}

interface RecentOrdersTableProps {
  orders: RecentOrder[];
  onViewDetail?: (orderId: string) => void;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: '결제대기', bg: 'bg-gray-100', text: 'text-gray-600' },
  paid: { label: '결제완료', bg: 'bg-blue-50', text: 'text-blue-600' },
  preparing: {
    label: '배송준비',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
  },
  shipped: {
    label: '배송중',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
  },
  delivered: {
    label: '배송완료',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  cancelled: { label: '취소', bg: 'bg-red-50', text: 'text-red-600' },
  refunded: { label: '환불', bg: 'bg-orange-50', text: 'text-orange-600' },
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}

export function RecentOrdersTable({
  orders,
  onViewDetail,
  className,
}: RecentOrdersTableProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white shadow-sm',
        className
      )}
    >
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-gray-900">최근 주문</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                주문번호
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">
                고객
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-medium text-gray-500 sm:table-cell">
                상품
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                결제금액
              </th>
              <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">
                상태
              </th>
              <th className="hidden px-5 py-3 text-right text-xs font-medium text-gray-500 md:table-cell">
                주문일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-gray-400"
                >
                  최근 주문이 없습니다.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className={cn(
                    'transition-colors',
                    onViewDetail &&
                      'cursor-pointer hover:bg-gray-50/50'
                  )}
                  onClick={() => onViewDetail?.(order.id)}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">
                      {order.customerName}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <span className="max-w-[200px] truncate text-sm text-gray-600">
                      {order.productName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatKRW(order.totalAmount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="hidden px-5 py-3.5 text-right md:table-cell">
                    <span className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
