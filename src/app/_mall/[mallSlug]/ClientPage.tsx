'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useProducts } from '@/lib/hooks/useProducts';
import { getMallCategories } from '@/lib/services/category-service';
import { getMallBanners } from '@/lib/services/mall-service';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import type { Category, Banner } from '@/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  FireIcon,
  TagIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ---- 배너 폴백 (Firestore에 배너가 없을 때 사용) ----
const fallbackBanners = [
  {
    id: 'fb1',
    title: '봄 신상 컬렉션',
    subtitle: '새로운 시즌, 새로운 스타일을 만나보세요',
    gradient: 'from-violet-500 to-purple-600',
    cta: '컬렉션 보기',
    imageUrl: '',
    linkUrl: '',
  },
  {
    id: 'fb2',
    title: '회원가입 특별 혜택',
    subtitle: '첫 구매 10% 할인 + 무료배송 쿠폰',
    gradient: 'from-blue-500 to-cyan-500',
    cta: '혜택 받기',
    imageUrl: '',
    linkUrl: '',
  },
  {
    id: 'fb3',
    title: '베스트셀러 모음',
    subtitle: '가장 많이 사랑받은 인기 상품 BEST',
    gradient: 'from-rose-500 to-pink-500',
    cta: '쇼핑하기',
    imageUrl: '',
    linkUrl: '',
  },
];

// ---- 배너 그라데이션 (이미지 없는 배너용) ----
const bannerGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
];

// ---- 카테고리 아이콘 매핑 ----
const categoryIcons: Record<string, string> = {
  '패션/의류': '👕',
  '가방/잡화': '👜',
  '식품/건강': '🍎',
  '뷰티/케어': '💄',
  '리빙/인테리어': '🏠',
  '전자/디지털': '📱',
};

function getCategoryIcon(name: string): string {
  return categoryIcons[name] || '📦';
}

export default function MallHomeClient({ mallSlug }: { mallSlug: string }) {
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const { products, isLoading: productsLoading } = useProducts(
    mall?.id ? { mallId: mall.id, limit: 12 } : undefined
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  const basePath = `/_mall/${mallSlug}`;
  const [currentBanner, setCurrentBanner] = useState(0);

  // 배너 데이터: Firestore에서 로드된 배너가 있으면 사용, 없으면 fallback
  const displayBanners = banners.length > 0
    ? banners.map((b, i) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle ?? '',
        gradient: bannerGradients[i % bannerGradients.length],
        cta: '쇼핑하기',
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
      }))
    : fallbackBanners;

  // 카테고리 로드
  useEffect(() => {
    if (!mall?.id) {
      setCategoriesLoading(false);
      return;
    }

    let cancelled = false;
    setCategoriesLoading(true);

    getMallCategories(mall.id)
      .then((cats) => {
        if (!cancelled) {
          setCategories(cats);
        }
      })
      .catch(() => {
        // 카테고리 로드 실패 시 빈 배열 유지
      })
      .finally(() => {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mall?.id]);

  // 배너 로드
  useEffect(() => {
    if (!mall?.id) {
      setBannersLoading(false);
      return;
    }

    let cancelled = false;
    setBannersLoading(true);

    getMallBanners(mall.id)
      .then((data) => {
        if (!cancelled) {
          setBanners(data);
        }
      })
      .catch(() => {
        // 배너 로드 실패 시 빈 배열 유지 (fallback 사용)
      })
      .finally(() => {
        if (!cancelled) {
          setBannersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mall?.id]);

  // 배너 자동 슬라이드
  useEffect(() => {
    if (displayBanners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  // 상품 분류
  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured).slice(0, 4),
    [products]
  );
  const newProducts = useMemo(
    () => products.filter((p) => p.isNew).slice(0, 4),
    [products]
  );
  const bestProducts = useMemo(
    () => [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4),
    [products]
  );

  const isLoading = mallLoading || productsLoading;

  // 몰을 찾을 수 없음 (layout에서 이미 처리하지만 안전 장치)
  if (!mallLoading && !mall) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">몰을 찾을 수 없습니다</h2>
        <p className="text-sm text-gray-500">요청하신 쇼핑몰이 존재하지 않습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* ===== 히어로 배너 ===== */}
      <section className="relative overflow-hidden">
        <div className="relative h-[320px] sm:h-[400px] lg:h-[480px]">
          {displayBanners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
                index === currentBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${banner.imageUrl ? '' : `bg-gradient-to-br ${banner.gradient}`}`}
              style={banner.imageUrl ? {
                backgroundImage: `url(${banner.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              {banner.imageUrl && (
                <div className="absolute inset-0 bg-black/30" />
              )}
              <div className="relative mx-auto max-w-[var(--content-max-width)] px-4 text-center">
                <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  {banner.title}
                </h2>
                <p className="mt-3 text-base text-white/80 sm:text-lg">{banner.subtitle}</p>
                <Button href={banner.linkUrl || `${basePath}/products`} variant="outline" size="lg" className="mt-6 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/50">
                  {banner.cta}
                </Button>
              </div>
            </div>
          ))}

          {/* 배너 네비게이션 */}
          <button
            onClick={() => setCurrentBanner((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentBanner((prev) => (prev + 1) % displayBanners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>

          {/* 배너 인디케이터 */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {displayBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentBanner ? 'w-6 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 카테고리 쇼케이스 ===== */}
      <section className="py-12">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">카테고리</h2>
            <p className="mt-1 text-sm text-gray-500">원하는 카테고리를 선택해보세요</p>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm">
                  <Skeleton className="h-8 w-8" rounded="full" />
                  <Skeleton className="mt-2 h-4 w-16" />
                  <Skeleton className="mt-1 h-3 w-10" />
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
              {categories.slice(0, 6).map((cat) => (
                <a
                  key={cat.id}
                  href={`${basePath}/products?category=${cat.id}`}
                  className="group flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="text-3xl">{getCategoryIcon(cat.name)}</span>
                  <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-primary">
                    {cat.name}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-400">{cat.productCount}개</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400">등록된 카테고리가 없습니다.</p>
          )}
        </div>
      </section>

      {/* ===== 추천 상품 ===== */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">추천 상품</h2>
            </div>
            <a
              href={`${basePath}/products`}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
            >
              전체보기
              <ChevronRightIcon className="h-4 w-4" />
            </a>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="[&_a]:!no-underline">
                  <a href={`${basePath}/products/${product.id}`} className="block">
                    <ProductCard product={product} style="grid" showMallName={false} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">추천 상품이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ===== 신상품 ===== */}
      <section className="py-12">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TagIcon className="h-6 w-6 text-emerald-500" />
              <h2 className="text-2xl font-bold text-gray-900">신상품</h2>
            </div>
            <a
              href={`${basePath}/products`}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
            >
              전체보기
              <ChevronRightIcon className="h-4 w-4" />
            </a>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : newProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {newProducts.map((product) => (
                <div key={product.id} className="[&_a]:!no-underline">
                  <a href={`${basePath}/products/${product.id}`} className="block">
                    <ProductCard product={product} style="grid" showMallName={false} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">신상품이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ===== 베스트셀러 ===== */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FireIcon className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">베스트셀러</h2>
            </div>
            <a
              href={`${basePath}/products`}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
            >
              전체보기
              <ChevronRightIcon className="h-4 w-4" />
            </a>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : bestProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {bestProducts.map((product, index) => (
                <div key={product.id} className="relative [&_a]:!no-underline">
                  {/* 순위 뱃지 */}
                  <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-white shadow-md">
                    {index + 1}
                  </div>
                  <a href={`${basePath}/products/${product.id}`} className="block">
                    <ProductCard product={product} style="grid" showMallName={false} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">베스트셀러 상품이 없습니다.</p>
          )}
        </div>
      </section>

      {/* ===== 몰 소개 ===== */}
      {mall && (
        <section className="py-16">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <BuildingStorefrontIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                {mall.name}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-gray-300 leading-relaxed">
                {mall.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{mall.productCount}+</div>
                  <div className="mt-1 text-sm text-gray-400">상품 수</div>
                </div>
                <div className="h-8 w-px bg-gray-700" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{mall.orderCount.toLocaleString()}+</div>
                  <div className="mt-1 text-sm text-gray-400">누적 주문</div>
                </div>
                <div className="h-8 w-px bg-gray-700" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.8</div>
                  <div className="mt-1 text-sm text-gray-400">고객 만족도</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
