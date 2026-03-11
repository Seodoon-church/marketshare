'use client';

import { useMemo } from 'react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatKRW } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart-store';
import { useProducts } from '@/lib/hooks/useProducts';
import type { CartItem } from '@/types';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getShippingFee = useCartStore((s) => s.getShippingFee);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const total = getTotal();

  // Fetch recommended products
  const { products: recommendedProducts, isLoading: recommendedLoading } = useProducts({ sortBy: 'salesCount', sortDirection: 'desc', limit: 5 });

  // Group items by mall
  const groupedItems = useMemo(() => {
    const groups: Record<string, { mallId: string; mallName: string; items: CartItem[] }> = {};
    items.forEach((item) => {
      if (!groups[item.mallId]) {
        groups[item.mallId] = {
          mallId: item.mallId,
          mallName: item.mallName,
          items: [],
        };
      }
      groups[item.mallId].items.push(item);
    });
    return Object.values(groups);
  }, [items]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/30">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              장바구니
              {itemCount > 0 && (
                <span className="ml-2 text-lg font-medium text-primary">
                  ({itemCount}개)
                </span>
              )}
            </h1>
          </div>

          {items.length === 0 ? (
            /* ===== Empty Cart State ===== */
            <div className="flex flex-col items-center justify-center py-24">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <ShoppingBagIcon className="h-12 w-12 text-gray-300" />
              </div>
              <p className="mt-6 text-lg font-medium text-gray-500">
                장바구니가 비어있습니다
              </p>
              <p className="mt-2 text-sm text-gray-400">
                원하는 상품을 장바구니에 담아보세요
              </p>
              <Button href="/products" variant="default" size="lg" className="mt-8">
                  쇼핑 계속하기
                  <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* ===== Cart Content ===== */
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Left: Cart Items */}
              <div className="flex-1 space-y-6">
                {/* Clear Cart Button */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={clearCart}
                    className="text-sm text-gray-400 transition-colors hover:text-red-500"
                  >
                    장바구니 비우기
                  </button>
                </div>

                {/* Items Grouped by Mall */}
                {groupedItems.map((group) => (
                  <Card key={group.mallId} padding="none" className="overflow-hidden">
                    {/* Mall Header */}
                    <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3.5">
                      <a
                        href={`/malls/${group.mallId}`}
                        className="text-sm font-semibold text-gray-900 transition-colors hover:text-primary"
                      >
                        {group.mallName}
                      </a>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-50">
                      {group.items.map((item) => {
                        const displayPrice = item.salePrice ?? item.price;
                        const hasDiscount = item.salePrice !== null && item.salePrice < item.price;

                        return (
                          <div
                            key={`${item.productId}-${JSON.stringify(item.options)}`}
                            className="flex gap-4 p-5"
                          >
                            {/* Product Image Placeholder */}
                            <a
                              href={`/products/${item.productId}`}
                              className="flex-shrink-0"
                            >
                              <div className="h-24 w-24 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 sm:h-28 sm:w-28">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ShoppingBagIcon className="h-8 w-8 text-gray-300" />
                                  </div>
                                )}
                              </div>
                            </a>

                            {/* Product Info */}
                            <div className="flex flex-1 flex-col justify-between">
                              <div>
                                <a
                                  href={`/products/${item.productId}`}
                                  className="text-sm font-medium text-gray-900 transition-colors hover:text-primary sm:text-base"
                                >
                                  {item.name}
                                </a>

                                {/* Selected Options */}
                                {Object.keys(item.options).length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {Object.entries(item.options).map(([key, value]) => (
                                      <span
                                        key={key}
                                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                                      >
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Price */}
                                <div className="mt-2 flex items-center gap-2">
                                  {hasDiscount && (
                                    <span className="text-xs text-gray-400 line-through">
                                      {formatKRW(item.price)}
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-gray-900 sm:text-base">
                                    {formatKRW(displayPrice)}
                                  </span>
                                </div>
                              </div>

                              {/* Quantity & Remove */}
                              <div className="mt-3 flex items-center justify-between">
                                {/* Quantity Selector */}
                                <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.productId,
                                        item.quantity - 1,
                                        item.options
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                                    disabled={item.quantity <= 1}
                                  >
                                    <MinusIcon className="h-3.5 w-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={item.stock}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      if (!isNaN(val) && val >= 1) {
                                        updateQuantity(item.productId, val, item.options);
                                      }
                                    }}
                                    className="h-8 w-10 border-x border-gray-200 bg-white text-center text-sm font-medium text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.productId,
                                        item.quantity + 1,
                                        item.options
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30"
                                    disabled={item.quantity >= item.stock}
                                  >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                {/* Item Subtotal & Remove */}
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-gray-900">
                                    {formatKRW(displayPrice * item.quantity)}
                                  </span>
                                  <button
                                    onClick={() => removeItem(item.productId, item.options)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                    title="삭제"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Right: Order Summary Sidebar */}
              <div className="lg:w-[360px]">
                <div className="sticky top-24">
                  <Card padding="lg">
                    <h2 className="text-lg font-semibold text-gray-900">
                      주문 요약
                    </h2>

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
                        <span className="text-gray-900">0원</span>
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
                        50,000원 이상 구매 시 무료배송
                      </p>
                      {subtotal < 50000 && (
                        <p className="mt-1 text-center text-xs text-blue-400">
                          {formatKRW(50000 - subtotal)} 더 담으면 무료배송!
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ===== Recommended Products Section ===== */}
          {items.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                함께 구매하면 좋은 상품
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {recommendedLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} padding="none" className="overflow-hidden">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </Card>
                  ))
                ) : (
                  recommendedProducts
                    .filter((p) => !items.some((item) => item.productId === p.id))
                    .slice(0, 5)
                    .map((p) => (
                      <ProductCard key={p.id} product={p} style="grid" showMallName />
                    ))
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
