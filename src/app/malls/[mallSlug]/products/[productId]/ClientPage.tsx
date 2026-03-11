'use client';

import React, { useState, useEffect } from 'react';

import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatKRW, calcDiscountRate } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart-store';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useMallSlug, useMallSubParam } from '@/lib/hooks/useMallSlug';
import { useProduct, useProducts } from '@/lib/hooks/useProducts';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { getProductReviews, getProductInquiries, getComments } from '@/lib/services/board-service';
import type { Product, BoardPost } from '@/types';
import type { Comment } from '@/lib/services/board-service';
import {
  StarIcon,
  HeartIcon,
  ShareIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  HomeIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ---- 이미지 그라데이션 (데모) ----
const imageGradients = [
  'from-rose-200 to-pink-300',
  'from-blue-200 to-indigo-300',
  'from-emerald-200 to-teal-300',
  'from-amber-200 to-orange-300',
  'from-violet-200 to-purple-300',
];

// ---- 옵션 ----
const colorOptions = ['블랙', '화이트', '네이비', '베이지'];
const sizeOptions = ['S', 'M', 'L', 'XL'];

// ---- 날짜 포맷 ----
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

// ---- 작성자명 마스킹 ----
function maskAuthorName(name: string): string {
  if (name.length <= 1) return name + '**';
  return name.charAt(0) + '**';
}

// ---- 별점 컴포넌트 ----
function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(rating)) {
          return <StarSolidIcon key={i} className={`${sizeClass} text-amber-400`} />;
        }
        if (i < Math.ceil(rating) && rating % 1 >= 0.5) {
          return (
            <div key={i} className="relative">
              <StarIcon className={`${sizeClass} text-gray-200`} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <StarSolidIcon className={`${sizeClass} text-amber-400`} />
              </div>
            </div>
          );
        }
        return <StarIcon key={i} className={`${sizeClass} text-gray-200`} />;
      })}
    </div>
  );
}

export default function MallProductDetailClient({
  mallSlug: paramSlug,
  productId: paramProductId,
}: {
  mallSlug: string;
  productId: string;
}) {
  const mallSlug = useMallSlug(paramSlug);
  const productId = useMallSubParam(paramProductId);
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const { product, isLoading: productLoading } = useProduct(productId);
  const { products: relatedProducts } = useProducts(
    product?.mallId ? { mallId: product.mallId, limit: 5 } : undefined
  );
  const basePath = `/malls/${mallSlug}`;

  const addItem = useCartStore((s) => s.addItem);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWished, setIsWished] = useState(false);

  // ---- 리뷰 & 문의 상태 ----
  const [reviews, setReviews] = useState<BoardPost[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [inquiries, setInquiries] = useState<BoardPost[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiryComments, setInquiryComments] = useState<Record<string, Comment[]>>({});

  // ---- 리뷰 로드 ----
  useEffect(() => {
    if (!mall?.id || !productId) {
      setReviewsLoading(false);
      return;
    }

    let cancelled = false;
    setReviewsLoading(true);

    getProductReviews(mall.id, productId)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch(() => {
        // 리뷰 로드 실패 시 빈 배열 유지
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });

    return () => { cancelled = true; };
  }, [mall?.id, productId]);

  // ---- 문의 로드 ----
  useEffect(() => {
    if (!mall?.id || !productId) {
      setInquiriesLoading(false);
      return;
    }

    let cancelled = false;
    setInquiriesLoading(true);

    getProductInquiries(mall.id, productId)
      .then(async (data) => {
        if (cancelled) return;
        setInquiries(data);

        // 각 문의에 대한 댓글(답변) 로드
        const commentsMap: Record<string, Comment[]> = {};
        await Promise.all(
          data.map(async (inquiry) => {
            try {
              const comments = await getComments(mall!.id, inquiry.id);
              if (!cancelled) {
                commentsMap[inquiry.id] = comments;
              }
            } catch {
              // 댓글 로드 실패는 무시
            }
          })
        );
        if (!cancelled) setInquiryComments(commentsMap);
      })
      .catch(() => {
        // 문의 로드 실패 시 빈 배열 유지
      })
      .finally(() => {
        if (!cancelled) setInquiriesLoading(false);
      });

    return () => { cancelled = true; };
  }, [mall?.id, productId]);

  if (mallLoading || productLoading) {
    return <FullPageLoader message="상품 정보를 불러오는 중..." />;
  }

  if (!product || !mall) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">상품을 찾을 수 없습니다.</p>
        <Button href={`${basePath}/products`} variant="outline" size="md" className="rounded-xl">
          상품 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;
  const displayPrice = product.salePrice ?? product.price;
  const discountRate = hasDiscount ? calcDiscountRate(product.price, product.salePrice!) : 0;
  const isSoldOut = product.status === 'soldout';
  const freeShipping = product.shippingInfo?.fee === 0;
  const totalPrice = displayPrice * quantity;
  const filteredRelatedProducts = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    if (isSoldOut) return;
    addItem({
      productId: product.id,
      mallId: product.mallId,
      mallName: product.mallName,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      quantity,
      options: {
        ...(selectedColor && { color: selectedColor }),
        ...(selectedSize && { size: selectedSize }),
      },
      imageUrl: '',
      stock: product.stock,
    });
    alert('장바구니에 추가되었습니다.');
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    handleAddToCart();
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 브레드크럼 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <a href={basePath} className="flex items-center hover:text-primary transition-colors">
              <HomeIcon className="h-4 w-4" />
            </a>
            <ChevronRightIcon className="h-3 w-3 text-gray-300" />
            <a href={`${basePath}/products`} className="hover:text-primary transition-colors">
              전체상품
            </a>
            <ChevronRightIcon className="h-3 w-3 text-gray-300" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* 상품 상세 영역 */}
      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* 좌측: 이미지 갤러리 */}
          <div className="flex gap-3">
            {/* 썸네일 리스트 (세로) */}
            <div className="hidden flex-col gap-2 sm:flex">
              {imageGradients.map((gradient, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl transition-all ${
                    selectedImageIndex === index
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'ring-1 ring-gray-200 hover:ring-gray-300'
                  }`}
                >
                  <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
                </button>
              ))}
            </div>

            {/* 메인 이미지 */}
            <div className="flex-1">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${imageGradients[selectedImageIndex]}`}>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white/30">{selectedImageIndex + 1}</div>
                    <p className="mt-2 text-sm font-medium text-white/50">상품 이미지</p>
                  </div>
                </div>
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  {hasDiscount && (
                    <span className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      {discountRate}% OFF
                    </span>
                  )}
                  {product.isNew && (
                    <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      NEW
                    </span>
                  )}
                  {isSoldOut && (
                    <span className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-bold text-white">
                      품절
                    </span>
                  )}
                </div>
              </div>

              {/* 모바일 썸네일 */}
              <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
                {imageGradients.map((gradient, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-primary ring-offset-1'
                        : 'ring-1 ring-gray-200'
                    }`}
                  >
                    <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 상품 정보 */}
          <div className="flex flex-col">
            <span className="mb-1.5 text-sm font-medium text-gray-400">{mall.name}</span>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* 평점 */}
            <div className="mt-3 flex items-center gap-2">
              <RatingStars rating={product.averageRating} size="md" />
              <span className="text-sm font-semibold text-gray-700">{product.averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">리뷰 {product.reviewCount}건</span>
              <span className="text-gray-200">|</span>
              <span className="text-sm text-gray-400">구매 {product.salesCount}건</span>
            </div>

            {/* 가격 */}
            <div className="mt-5 rounded-2xl bg-gray-50 p-5">
              {hasDiscount && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400 line-through">{formatKRW(product.price)}</span>
                  <Badge variant="danger">{discountRate}% 할인</Badge>
                </div>
              )}
              <div className="flex items-baseline gap-1">
                {hasDiscount && (
                  <span className="text-2xl font-bold text-red-500">{discountRate}%</span>
                )}
                <span className="text-3xl font-bold text-gray-900">{formatKRW(displayPrice)}</span>
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="mt-4 flex items-center gap-2">
              <TruckIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {freeShipping ? (
                <Badge variant="success">무료배송</Badge>
              ) : (
                <span className="text-sm text-gray-600">배송비 {formatKRW(product.shippingInfo.fee)}</span>
              )}
              <span className="text-xs text-gray-400">| 도착예정 {product.shippingInfo.estimatedDays}일 이내</span>
            </div>

            <hr className="my-5 border-gray-100" />

            {/* 옵션 선택 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">색상</label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="">색상을 선택해주세요</option>
                  {colorOptions.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">사이즈</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="">사이즈를 선택해주세요</option>
                  {sizeOptions.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">수량</label>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-l-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <div className="flex h-11 w-14 items-center justify-center border-y border-gray-200 bg-white text-sm font-semibold text-gray-900">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-r-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 총 금액 */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-900 px-5 py-4">
              <span className="text-sm font-medium text-gray-300">총 상품 금액</span>
              <span className="text-xl font-bold text-white">{formatKRW(totalPrice)}</span>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsWished(!isWished)}
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-all ${
                  isWished
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500'
                }`}
              >
                <HeartIcon className={`h-5 w-5 ${isWished ? 'fill-current' : ''}`} />
              </button>
              <Button variant="outline" size="lg" fullWidth onClick={handleAddToCart} disabled={isSoldOut} className="rounded-xl">
                장바구니 담기
              </Button>
              <Button variant="default" size="lg" fullWidth onClick={handleBuyNow} disabled={isSoldOut} className="rounded-xl">
                {isSoldOut ? '품절된 상품입니다' : '바로 구매하기'}
              </Button>
            </div>

            {/* 공유 */}
            <button className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ShareIcon className="h-4 w-4" />
              공유하기
            </button>

            {/* 안내 태그 */}
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                안전결제
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600">
                <ArrowPathIcon className="h-3.5 w-3.5" />
                7일 이내 교환/반품
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                정품 보장
              </div>
            </div>
          </div>
        </div>

        {/* ===== 탭 영역 ===== */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'description', label: '상품상세' },
                { id: 'reviews', label: `리뷰(${reviews.length})` },
                { id: 'inquiry', label: `문의(${inquiries.length})` },
                { id: 'shipping', label: '배송/교환/반품' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 py-4 text-center text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {/* 상품상세 */}
            {activeTab === 'description' && (
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">상품 상세정보</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
                  <div className="space-y-4">
                    {imageGradients.slice(0, 3).map((gradient, index) => (
                      <div
                        key={index}
                        className={`flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}
                      >
                        <p className="text-lg font-medium text-white/50">상세 이미지 {index + 1}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8">
                    <h4 className="text-base font-bold text-gray-900 mb-3">상품 정보</h4>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <tbody>
                          {[
                            ['상품명', product.name],
                            ['카테고리', product.categoryName],
                            ['판매몰', product.mallName],
                            ['배송비', freeShipping ? '무료배송' : formatKRW(product.shippingInfo.fee)],
                            ['배송예정', `주문 후 ${product.shippingInfo.estimatedDays}일 이내 출고`],
                            ['상품상태', '새상품'],
                          ].map(([label, value], index) => (
                            <tr key={label} className={index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                              <td className="w-1/3 border-b border-gray-100 px-4 py-3 font-medium text-gray-500">{label}</td>
                              <td className="border-b border-gray-100 px-4 py-3 text-gray-700">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 리뷰 */}
            {activeTab === 'reviews' && (
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex items-center gap-8 mb-8 pb-8 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{product.averageRating.toFixed(1)}</div>
                    <RatingStars rating={product.averageRating} size="lg" />
                    <p className="mt-1 text-sm text-gray-400">{reviews.length}개 리뷰</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const total = reviews.length || 1;
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-4 text-xs font-medium text-gray-500 text-right">{star}</span>
                          <StarSolidIcon className="h-3 w-3 text-amber-400" />
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="w-8 text-xs text-gray-400 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {reviewsLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="pb-6 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-8 w-8" rounded="full" />
                          <div>
                            <Skeleton className="h-4 w-16 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full ml-10" />
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="pb-6 border-b border-gray-50 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                              {maskAuthorName(review.authorName).charAt(0)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">{maskAuthorName(review.authorName)}</span>
                              <div className="flex items-center gap-1.5">
                                <RatingStars rating={review.rating ?? 5} size="sm" />
                                <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {review.title && (
                          <p className="text-sm font-medium text-gray-800 ml-10 mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-gray-600 leading-relaxed ml-10">{review.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <StarIcon className="h-12 w-12 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">아직 작성된 리뷰가 없습니다.</p>
                    <p className="text-xs text-gray-300 mt-1">첫 번째 리뷰를 남겨보세요!</p>
                  </div>
                )}
              </div>
            )}

            {/* 문의 */}
            {activeTab === 'inquiry' && (
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">상품 문의</h3>
                  <Button variant="outline" size="sm">
                    <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                    문의하기
                  </Button>
                </div>
                {inquiriesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : inquiries.length > 0 ? (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => {
                      const comments = inquiryComments[inquiry.id] ?? [];
                      const hasAnswer = comments.length > 0;
                      const answer = hasAnswer ? comments[0] : null;
                      return (
                        <div key={inquiry.id} className="rounded-xl border border-gray-100 overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">{maskAuthorName(inquiry.authorName)}</span>
                                <span className="text-xs text-gray-400">{formatDate(inquiry.createdAt)}</span>
                              </div>
                              <Badge variant={hasAnswer ? 'success' : 'secondary'}>
                                {hasAnswer ? '답변완료' : '답변대기'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">Q. {inquiry.title || inquiry.content}</p>
                          </div>
                          {hasAnswer && answer && (
                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-primary">A. </span>
                                {answer.content}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ChatBubbleLeftEllipsisIcon className="h-12 w-12 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">아직 등록된 문의가 없습니다.</p>
                    <p className="text-xs text-gray-300 mt-1">궁금한 점이 있으면 문의해주세요!</p>
                  </div>
                )}
              </div>
            )}

            {/* 배송/교환/반품 */}
            {activeTab === 'shipping' && (
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TruckIcon className="h-5 w-5 text-gray-600" />
                      <h3 className="text-base font-bold text-gray-900">배송 안내</h3>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-5 space-y-2.5">
                      <div className="flex gap-3">
                        <span className="text-sm font-medium text-gray-500 w-20 flex-shrink-0">배송비</span>
                        <span className="text-sm text-gray-700">
                          {freeShipping
                            ? '무료배송'
                            : `${formatKRW(product.shippingInfo.fee)} (${formatKRW(product.shippingInfo.freeShippingThreshold)} 이상 무료)`}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-sm font-medium text-gray-500 w-20 flex-shrink-0">배송방법</span>
                        <span className="text-sm text-gray-700">택배 배송</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-sm font-medium text-gray-500 w-20 flex-shrink-0">배송기간</span>
                        <span className="text-sm text-gray-700">
                          결제 확인 후 {product.shippingInfo.estimatedDays}~{product.shippingInfo.estimatedDays + 1}일 이내 출고 (주말/공휴일 제외)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowPathIcon className="h-5 w-5 text-gray-600" />
                      <h3 className="text-base font-bold text-gray-900">교환/반품 안내</h3>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-5 space-y-2.5">
                      <div className="flex gap-3">
                        <span className="text-sm font-medium text-gray-500 w-20 flex-shrink-0">교환/반품</span>
                        <span className="text-sm text-gray-700">수령 후 7일 이내 가능</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-sm font-medium text-gray-500 w-20 flex-shrink-0">반품 배송비</span>
                        <span className="text-sm text-gray-700">편도 3,000원 (고객 변심 시)</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-sm font-medium text-gray-500 w-20 flex-shrink-0">교환 배송비</span>
                        <span className="text-sm text-gray-700">6,000원 (고객 변심 시)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
                      <h3 className="text-base font-bold text-gray-900">교환/반품 불가 사유</h3>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-5">
                      <ul className="space-y-2 text-sm text-gray-600">
                        {[
                          '수령일로부터 7일이 경과한 경우',
                          '상품을 사용하였거나 일부 소비된 경우',
                          '포장을 개봉하여 상품 가치가 훼손된 경우',
                          '고객의 주문에 따라 개별 제작되는 상품의 경우',
                          '시간이 경과하여 재판매가 곤란할 정도로 상품의 가치가 하락한 경우',
                        ].map((text) => (
                          <li key={text} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-400 flex-shrink-0" />
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== 연관 상품 ===== */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">연관 상품</h2>
            <a
              href={`${basePath}/products`}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
            >
              더보기
              <ChevronRightIcon className="h-4 w-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {filteredRelatedProducts.map((p) => (
              <div key={p.id} className="[&_a]:!no-underline">
                <a href={`${basePath}/products/${p.id}`} className="block">
                  <ProductCard product={p} style="grid" showMallName={false} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
