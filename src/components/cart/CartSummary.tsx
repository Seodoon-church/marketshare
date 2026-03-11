'use client';

import { cn } from '@/lib/utils/cn';
import { formatKRW } from '@/lib/utils/format';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface CartSummaryProps {
  subtotal: number;
  shippingFee: number;
  discount?: number;
  total: number;
  freeShippingThreshold?: number;
  className?: string;
}

export function CartSummary({
  subtotal,
  shippingFee,
  discount = 0,
  total,
  freeShippingThreshold = 50000,
  className,
}: CartSummaryProps) {
  const remaining = freeShippingThreshold - subtotal;

  return (
    <div className={cn('lg:w-[360px]', className)}>
      <div className="sticky top-24">
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900">주문 요약</h2>

          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">상품금액</span>
              <span className="text-gray-900">{formatKRW(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">배송비</span>
              <span className="text-gray-900">
                {shippingFee === 0 ? (
                  <span className="font-medium text-primary">무료</span>
                ) : (
                  formatKRW(shippingFee)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">할인금액</span>
              <span className="text-gray-900">
                {discount > 0 ? `-${formatKRW(discount)}` : '0원'}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-gray-100" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">
              총 결제금액
            </span>
            <span className="text-xl font-bold text-primary">
              {formatKRW(total)}
            </span>
          </div>

          {/* Checkout Button */}
          <Button href="/checkout" variant="default" size="xl" fullWidth className="mt-6">
              주문하기
              <ArrowRightIcon className="h-5 w-5" />
          </Button>

          {/* Free Shipping Notice */}
          <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3">
            <p className="text-center text-xs text-blue-600">
              {formatKRW(freeShippingThreshold)} 이상 구매 시 무료배송
            </p>
            {remaining > 0 && (
              <p className="mt-1 text-center text-xs text-blue-400">
                {formatKRW(remaining)} 더 담으면 무료배송!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
