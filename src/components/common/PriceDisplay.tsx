import { cn } from '@/lib/utils/cn';
import { formatKRW, calcDiscountRate } from '@/lib/utils/format';

interface PriceDisplayProps {
  price: number;
  salePrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    price: 'text-sm',
    original: 'text-xs',
    badge: 'text-[10px] px-1 py-0.5',
  },
  md: {
    price: 'text-base',
    original: 'text-sm',
    badge: 'text-xs px-1.5 py-0.5',
  },
  lg: {
    price: 'text-xl',
    original: 'text-base',
    badge: 'text-sm px-2 py-0.5',
  },
};

export function PriceDisplay({
  price,
  salePrice,
  size = 'md',
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const hasDiscount =
    salePrice !== undefined && salePrice !== null && salePrice < price;
  const displayPrice = hasDiscount ? salePrice : price;
  const discountRate = hasDiscount ? calcDiscountRate(price, salePrice!) : 0;
  const styles = sizeStyles[size];

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Discount Badge */}
      {hasDiscount && showDiscount && discountRate > 0 && (
        <span
          className={cn(
            'inline-flex items-center rounded-md bg-red-50 font-bold text-red-500',
            styles.badge
          )}
        >
          {discountRate}%
        </span>
      )}

      {/* Sale / Current Price */}
      <span className={cn('font-bold text-gray-900', styles.price)}>
        {formatKRW(displayPrice)}
      </span>

      {/* Original Price (strikethrough) */}
      {hasDiscount && (
        <span
          className={cn('text-gray-400 line-through', styles.original)}
        >
          {formatKRW(price)}
        </span>
      )}
    </div>
  );
}
