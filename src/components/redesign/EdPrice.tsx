import { formatKRW } from '@/lib/utils/format';

interface EdPriceProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { price: 'text-[14px]', original: 'text-[11px]', discount: 'text-[11px]' },
  md: { price: 'text-[17px]', original: 'text-[12px]', discount: 'text-[12px]' },
  lg: { price: 'text-[22px]', original: 'text-[13px]', discount: 'text-[14px]' },
};

export function EdPrice({ price, originalPrice, size = 'md', className = '' }: EdPriceProps) {
  const s = sizeMap[size];
  const hasDiscount = originalPrice && originalPrice > price;
  const discountRate = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      {hasDiscount && (
        <span className={`font-mono font-semibold text-sale-red ${s.discount}`}>
          {discountRate}%
        </span>
      )}
      <span className={`font-mono font-semibold text-ink ${s.price}`}>
        {formatKRW(price)}
      </span>
      {hasDiscount && (
        <span className={`font-mono text-ink-light line-through ${s.original}`}>
          {formatKRW(originalPrice)}
        </span>
      )}
    </div>
  );
}
