'use client';

import Link from 'next/link';
import { formatKRW } from '@/lib/utils/format';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string;
  stock: number;
}

interface LiveProductCarouselProps {
  products: Product[];
  featuredProductId?: string | null;
  mallSlug: string;
  onAddToCart?: (productId: string) => void;
  className?: string;
}

const COLORS = [
  'bg-blue-200',
  'bg-green-200',
  'bg-yellow-200',
  'bg-purple-200',
  'bg-pink-200',
  'bg-indigo-200',
  'bg-red-200',
  'bg-teal-200',
];

function getColorForProduct(productId: string): string {
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

export function LiveProductCarousel({
  products,
  featuredProductId,
  mallSlug,
  onAddToCart,
  className = '',
}: LiveProductCarouselProps) {
  if (products.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-xl p-8 text-center ${className}`}>
        <p className="text-gray-500">라이브 방송에서 소개할 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900">라이브 쇼핑 상품</h3>
        <span className="text-sm text-gray-500">{products.length}개 상품</span>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex gap-4 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
          {products.map((product) => {
            const isFeatured = product.id === featuredProductId;
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;

            return (
              <div
                key={product.id}
                className={`flex-shrink-0 w-64 bg-white border rounded-xl overflow-hidden hover:shadow-md transition ${
                  isFeatured ? 'ring-2 ring-red-500' : 'border-gray-200'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Thumbnail */}
                <Link href={`/malls/${mallSlug}/products/${product.id}`}>
                  <div className="relative aspect-square">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full ${getColorForProduct(product.id)} flex items-center justify-center`}
                      >
                        <span className="text-4xl font-bold text-white">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {isFeatured && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                        추천
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product info */}
                <div className="p-4">
                  <Link href={`/malls/${mallSlug}/products/${product.id}`}>
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-blue-600 transition mb-2">
                      {product.name}
                    </h4>
                  </Link>

                  <div className="mb-3">
                    {hasDiscount && (
                      <div className="text-xs text-gray-400 line-through">
                        {formatKRW(product.originalPrice!)}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      {hasDiscount && (
                        <span className="text-sm font-bold text-red-600">
                          {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
                        </span>
                      )}
                      <span className="text-lg font-bold text-gray-900">
                        {formatKRW(product.price)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddToCart?.(product.id)}
                    disabled={product.stock <= 0}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {product.stock <= 0 ? '품절' : '장바구니'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
