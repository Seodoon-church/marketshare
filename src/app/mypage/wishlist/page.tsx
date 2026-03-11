'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatKRW, calcDiscountRate } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { useCartStore } from '@/store/cart-store';
import { useToast } from '@/components/ui/Toast';
import { getProductById } from '@/lib/services/product-service';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Product } from '@/types';
import {
  ShoppingCartIcon,
  FaceFrownIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function WishlistPage() {
  const { user } = useAuth();
  const { items: wishlistItems, isLoading: wishlistLoading, removeFromWishlist } = useWishlist(user?.id);
  const addCartItem = useCartStore((s) => s.addItem);
  const { toast } = useToast();

  const [products, setProducts] = useState<Record<string, Product>>({});
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch product details for each wishlist item
  useEffect(() => {
    if (wishlistLoading || wishlistItems.length === 0) {
      setProductsLoading(false);
      return;
    }

    let cancelled = false;
    setProductsLoading(true);

    const fetchProducts = async () => {
      const productMap: Record<string, Product> = {};
      const fetchPromises = wishlistItems.map(async (item) => {
        if (products[item.productId]) {
          productMap[item.productId] = products[item.productId];
          return;
        }
        try {
          const product = await getProductById(item.productId);
          if (product) {
            productMap[item.productId] = product;
          }
        } catch {
          // Skip products that can't be fetched
        }
      });
      await Promise.all(fetchPromises);
      if (!cancelled) {
        setProducts(productMap);
        setProductsLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [wishlistItems, wishlistLoading]);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast({ type: 'success', message: '위시리스트에서 제거되었습니다.' });
    } catch {
      toast({ type: 'error', message: '제거에 실패했습니다.' });
    }
  };

  const handleAddToCart = (product: Product) => {
    addCartItem({
      productId: product.id,
      mallId: product.mallId,
      mallName: product.mallName,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      quantity: 1,
      options: {},
      imageUrl: product.thumbnailUrl || '',
      stock: product.stock,
    });
    toast({ type: 'success', message: '장바구니에 추가되었습니다.' });
  };

  const isLoading = wishlistLoading || productsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">위시리스트</h1>
          <p className="mt-1 text-sm text-gray-500">관심 있는 상품을 모아보세요.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">위시리스트</h1>
          <p className="mt-1 text-sm text-gray-500">관심 있는 상품을 모아보세요.</p>
        </div>
        <Card className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FaceFrownIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mt-4 text-base font-medium text-gray-900">위시리스트가 비어있어요</p>
          <p className="mt-1 text-sm text-gray-500">마음에 드는 상품을 하트를 눌러 담아보세요.</p>
          <Button href="/products" variant="default" className="mt-6">
              상품 둘러보기
          </Button>
        </Card>
      </div>
    );
  }

  // Gradient fallback colors
  const gradients = [
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-violet-400 to-indigo-500',
    'from-sky-400 to-blue-500',
    'from-stone-400 to-neutral-500',
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">위시리스트</h1>
          <p className="mt-1 text-sm text-gray-500">관심 있는 상품을 모아보세요.</p>
        </div>
        <Badge variant="secondary">{wishlistItems.length}개 상품</Badge>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wishlistItems.map((item, idx) => {
          const product = products[item.productId];
          const hasDiscount = product && product.salePrice !== null && product.salePrice < product.price;
          const discountRate = hasDiscount ? calcDiscountRate(product.price, product.salePrice!) : 0;

          return (
            <Card key={item.id} padding="none" hover>
              {/* Image */}
              <div className="relative">
                {product?.thumbnailUrl ? (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.name}
                    className="h-48 w-full rounded-t-2xl object-cover"
                  />
                ) : (
                  <div className={`h-48 w-full rounded-t-2xl bg-gradient-to-br ${gradients[idx % gradients.length]}`} />
                )}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                  title="위시리스트에서 제거"
                >
                  <HeartSolidIcon className="h-5 w-5 text-red-500" />
                </button>
                {hasDiscount && (
                  <div className="absolute left-3 top-3">
                    <Badge variant="danger">{discountRate}% OFF</Badge>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <p className="text-xs text-gray-400">{product?.mallName || '몰'}</p>
                <a href={`/products/${item.productId}`}>
                  <p className="mt-1 truncate text-sm font-medium text-gray-900 hover:text-primary transition-colors">
                    {product?.name || '상품 정보 로딩 중...'}
                  </p>
                </a>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-base font-bold text-gray-900">
                    {product ? formatKRW(product.salePrice ?? product.price) : '-'}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatKRW(product.price)}
                    </span>
                  )}
                </div>

                {product && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="mt-3"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.status === 'soldout'}
                  >
                    <ShoppingCartIcon className="h-4 w-4" />
                    {product.status === 'soldout' ? '품절' : '장바구니 담기'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
