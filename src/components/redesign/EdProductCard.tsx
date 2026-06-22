'use client';

import { EdPrice } from './EdPrice';
import { EdBadge } from './EdBadge';
import { IconStar } from './icons';

interface EdProductCardProps {
  id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: 'best' | 'new';
  mallSlug?: string;
  horizontal?: boolean;
  className?: string;
}

export function EdProductCard({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating,
  reviewCount,
  badge,
  mallSlug,
  horizontal,
  className = '',
}: EdProductCardProps) {
  const href = `/products/${id}`;

  if (horizontal) {
    return (
      <a href={href} className={`flex gap-3 group ${className}`}>
        <div className="w-[88px] h-[88px] flex-shrink-0 overflow-hidden border border-hairline">
          <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          {brand && <p className="font-mono text-[10px] tracking-[.08em] text-ink-light truncate">{brand}</p>}
          <p className="text-[13px] text-ink mt-0.5 line-clamp-2 leading-snug">{name}</p>
          <EdPrice price={price} originalPrice={originalPrice} size="sm" className="mt-1.5" />
        </div>
      </a>
    );
  }

  return (
    <a href={href} className={`block group ${className}`}>
      <div className="relative overflow-hidden border border-hairline aspect-[4/5]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {badge && (
          <div className="absolute top-2 left-2">
            <EdBadge variant={badge}>{badge === 'best' ? 'BEST' : 'NEW'}</EdBadge>
          </div>
        )}
        {originalPrice && originalPrice > price && (
          <div className="absolute top-2 right-2">
            <EdBadge variant="discount">-{Math.round((1 - price / originalPrice) * 100)}%</EdBadge>
          </div>
        )}
      </div>
      <div className="mt-2.5">
        {brand && (
          <p className="font-mono text-[10px] tracking-[.08em] text-ink-light">{brand}</p>
        )}
        <p className="text-[13px] text-ink mt-0.5 line-clamp-2 leading-snug">{name}</p>
        <EdPrice price={price} originalPrice={originalPrice} size="sm" className="mt-1.5" />
        {rating !== undefined && (
          <div className="flex items-center gap-1 mt-1.5">
            <IconStar size={12} className="text-brass" />
            <span className="font-mono text-[11px] text-ink-light">{rating.toFixed(1)}</span>
            {reviewCount !== undefined && (
              <span className="font-mono text-[10px] text-ink-light/60">({reviewCount})</span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}
