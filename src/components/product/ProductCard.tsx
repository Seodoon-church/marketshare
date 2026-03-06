'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon, ShoppingCartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { formatKRW, calcDiscountRate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  style?: 'grid' | 'list' | 'magazine';
  showMallName?: boolean;
}

export function ProductCard({ product, style = 'grid', showMallName = true }: ProductCardProps) {
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;
  const displayPrice = product.salePrice ?? product.price;
  const discountRate = hasDiscount ? calcDiscountRate(product.price, product.salePrice!) : 0;

  if (style === 'magazine') {
    return <MagazineCard product={product} hasDiscount={hasDiscount} displayPrice={displayPrice} discountRate={discountRate} showMallName={showMallName} />;
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gray-50 product-image-hover">
        {/* Image */}
        <div className="relative aspect-square">
          {product.thumbnailUrl ? (
            <Image
              src={product.thumbnailUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCartIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {hasDiscount && (
            <span className="rounded-lg bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm sale-pulse">
              {discountRate}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-lg bg-primary px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              NEW
            </span>
          )}
          {product.status === 'soldout' && (
            <span className="rounded-lg bg-gray-800 px-2 py-0.5 text-xs font-bold text-white">
              품절
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={(e) => { e.preventDefault(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500"
          >
            <HeartIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md backdrop-blur-sm transition-colors hover:bg-primary hover:text-white"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        {showMallName && product.mallName && (
          <p className="mb-0.5 text-xs font-medium text-gray-400">
            {product.mallName}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-gray-800 transition-colors group-hover:text-primary">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-1.5 flex items-baseline gap-1.5">
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatKRW(product.price)}
            </span>
          )}
          <span className="text-base font-bold text-gray-900">
            {formatKRW(displayPrice)}
          </span>
        </div>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-gray-600">
              {product.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Shipping */}
        {product.shippingInfo?.fee === 0 && (
          <span className="mt-1.5 inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
            무료배송
          </span>
        )}
      </div>
    </Link>
  );
}

function MagazineCard({
  product,
  hasDiscount,
  displayPrice,
  discountRate,
  showMallName,
}: {
  product: Product;
  hasDiscount: boolean;
  displayPrice: number;
  discountRate: number;
  showMallName: boolean;
}) {
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl product-image-hover">
        <div className="relative aspect-[4/5]">
          {product.thumbnailUrl ? (
            <Image
              src={product.thumbnailUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCartIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Overlay Info */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 pt-16">
            {showMallName && product.mallName && (
              <p className="mb-1 text-xs font-medium text-white/70">
                {product.mallName}
              </p>
            )}
            <h3 className="line-clamp-2 text-lg font-semibold text-white">
              {product.name}
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-sm text-white/60 line-through">
                  {formatKRW(product.price)}
                </span>
              )}
              <span className="text-xl font-bold text-white">
                {formatKRW(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-bold text-red-400">
                  {discountRate}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
