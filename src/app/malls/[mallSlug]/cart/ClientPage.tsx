'use client';

import React from 'react';

import { Button } from '@/components/ui/Button';
import { formatKRW } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart-store';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  ArrowLeftIcon,
  TruckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function MallCartClient({ mallSlug: paramSlug }: { mallSlug: string }) {
  const mallSlug = useMallSlug(paramSlug);
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const basePath = `/malls/${mallSlug}`;

  const items = useCartStore((s) => s.items.filter((item) => mall && item.mallId === mall.id));

  if (mallLoading) return <FullPageLoader message="장바구니를 불러오는 중..." />;
  if (!mall) return <div className="flex min-h-[400px] items-center justify-center text-gray-500">쇼핑몰을 찾을 수 없습니다.</div>;
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearMallItems = useCartStore((s) => s.clearMallItems);

  const subtotal = items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.quantity, 0);
  const shippingFee = subtotal >= 50000 ? 0 : subtotal > 0 ? 3000 : 0;
  const total = subtotal + shippingFee;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">장바구니</h1>
          <p className="mt-1 text-sm text-gray-500">
            {mall.name} 장바구니 ({totalItemCount}개 상품)
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
        {items.length === 0 ? (
          /* 빈 장바구니 */
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
            <ShoppingCartIcon className="h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-lg font-semibold text-gray-700">장바구니가 비어있습니다</h2>
            <p className="mt-2 text-sm text-gray-500">
              {mall.name}의 상품을 둘러보세요
            </p>
            <Button href={`${basePath}/products`} variant="default" size="lg" className="mt-6 rounded-xl">
              쇼핑하러 가기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ===== 장바구니 상품 목록 ===== */}
            <div className="lg:col-span-2">
              {/* 전체 선택/삭제 */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  총 <span className="font-semibold text-gray-900">{items.length}</span>개 상품
                </span>
                <button
                  onClick={() => clearMallItems(mall.id)}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  전체 삭제
                </button>
              </div>

              {/* 상품 리스트 */}
              <div className="space-y-3">
                {items.map((item) => {
                  const displayPrice = item.salePrice ?? item.price;
                  const hasDiscount = item.salePrice !== null && item.salePrice < item.price;
                  const optionText = Object.values(item.options).join(' / ');

                  return (
                    <div
                      key={`${item.productId}-${JSON.stringify(item.options)}`}
                      className="rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <div className="flex gap-4">
                        {/* 상품 이미지 (데모) */}
                        <a href={`${basePath}/products/${item.productId}`} className="flex-shrink-0">
                          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 sm:h-28 sm:w-28">
                            <ShoppingCartIcon className="h-8 w-8 text-gray-300" />
                          </div>
                        </a>

                        {/* 상품 정보 */}
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <a
                                href={`${basePath}/products/${item.productId}`}
                                className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2"
                              >
                                {item.name}
                              </a>
                              {optionText && (
                                <p className="mt-1 text-xs text-gray-400">{optionText}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.productId, item.options)}
                              className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          {/* 가격 & 수량 */}
                          <div className="mt-auto flex items-end justify-between pt-3">
                            {/* 수량 */}
                            <div className="flex items-center gap-0">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.options)}
                                className="flex h-8 w-8 items-center justify-center rounded-l-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
                              >
                                <MinusIcon className="h-3 w-3" />
                              </button>
                              <div className="flex h-8 w-10 items-center justify-center border-y border-gray-200 bg-white text-xs font-semibold text-gray-900">
                                {item.quantity}
                              </div>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.options)}
                                className="flex h-8 w-8 items-center justify-center rounded-r-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
                              >
                                <PlusIcon className="h-3 w-3" />
                              </button>
                            </div>

                            {/* 가격 */}
                            <div className="text-right">
                              {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through">
                                  {formatKRW(item.price * item.quantity)}
                                </span>
                              )}
                              <p className="text-base font-bold text-gray-900">
                                {formatKRW(displayPrice * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 쇼핑 계속하기 */}
              <a
                href={`${basePath}/products`}
                className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                쇼핑 계속하기
              </a>
            </div>

            {/* ===== 주문 요약 ===== */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-5">주문 요약</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">상품 금액</span>
                    <span className="font-medium text-gray-900">{formatKRW(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">배송비</span>
                    <span className={`font-medium ${shippingFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {shippingFee === 0 ? '무료' : formatKRW(shippingFee)}
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <p className="text-xs text-gray-400">
                      {formatKRW(50000 - subtotal)} 추가 구매 시 무료배송
                    </p>
                  )}
                </div>

                <hr className="my-5 border-gray-100" />

                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">총 결제금액</span>
                  <span className="text-xl font-bold text-primary">{formatKRW(total)}</span>
                </div>

                <Button variant="default" size="lg" fullWidth className="mt-5 rounded-xl">
                  주문하기 ({totalItemCount}개)
                </Button>

                {/* 안내 */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <TruckIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>50,000원 이상 구매 시 무료배송</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <ShieldCheckIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>안전한 결제 시스템</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
