'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { ProductCard } from '@/components/product/ProductCard';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useProducts } from '@/lib/hooks/useProducts';
import { getMallCategories } from '@/lib/services/category-service';
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Category } from '@/types';
import type { ProductFilters } from '@/lib/services/product-service';
import {
  FunnelIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ---- 정렬 옵션 ----
const sortOptions: { id: string; label: string; sortBy: ProductFilters['sortBy']; sortDirection: ProductFilters['sortDirection'] }[] = [
  { id: 'latest', label: '최신순', sortBy: 'createdAt', sortDirection: 'desc' },
  { id: 'popular', label: '인기순', sortBy: 'salesCount', sortDirection: 'desc' },
  { id: 'price-asc', label: '가격 낮은순', sortBy: 'price', sortDirection: 'asc' },
  { id: 'price-desc', label: '가격 높은순', sortBy: 'price', sortDirection: 'desc' },
  { id: 'name', label: '이름순', sortBy: 'name', sortDirection: 'asc' },
];

export default function MallProductsClient({ mallSlug }: { mallSlug: string }) {
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const basePath = `/_mall/${mallSlug}`;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 카테고리 로드
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    if (!mall?.id) {
      setCategoriesLoading(false);
      return;
    }

    let cancelled = false;
    setCategoriesLoading(true);

    getMallCategories(mall.id)
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mall?.id]);

  // 정렬 설정
  const currentSort = sortOptions.find((s) => s.id === sortBy) || sortOptions[0];

  // 상품 로드 (필터 적용)
  const productFilters = useMemo(() => {
    if (!mall?.id) return undefined;
    const filters: Record<string, unknown> = {
      mallId: mall.id,
      sortBy: currentSort.sortBy,
      sortDirection: currentSort.sortDirection,
      limit: 24,
    };
    if (selectedCategory !== 'all') {
      filters.categoryId = selectedCategory;
    }
    return filters as import('@/lib/services/product-service').ProductFilters;
  }, [mall?.id, selectedCategory, currentSort]);

  const { products, isLoading: productsLoading, hasMore, loadMore } = useProducts(productFilters);

  // 카테고리 리스트에 전체 옵션 추가
  const categoriesWithAll = useMemo(() => {
    const allCount = categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    return [
      { id: 'all', name: '전체', productCount: allCount },
      ...categories.map((c) => ({ id: c.id, name: c.name, productCount: c.productCount })),
    ];
  }, [categories]);

  const isLoading = mallLoading || productsLoading;

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">전체 상품</h1>
          <p className="mt-1 text-sm text-gray-500">
            {mall?.name ? `${mall.name}의 모든 상품을 만나보세요` : '상품을 불러오는 중...'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
        <div className="flex gap-8">
          {/* ===== 사이드바 (데스크탑) ===== */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-gray-900">카테고리</h3>
              {categoriesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" rounded="lg" />
                  ))}
                </div>
              ) : (
                <nav className="space-y-1">
                  {categoriesWithAll.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-primary/5 font-semibold text-primary'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs text-gray-400">{cat.productCount}</span>
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </aside>

          {/* ===== 메인 콘텐츠 ===== */}
          <div className="flex-1">
            {/* 툴바 */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 모바일 필터 버튼 */}
                <button
                  onClick={() => setShowMobileFilter(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 lg:hidden"
                >
                  <FunnelIcon className="h-4 w-4" />
                  필터
                </button>

                <span className="text-sm text-gray-500">
                  총 <span className="font-semibold text-gray-900">{products.length}</span>개
                </span>
              </div>

              {/* 정렬 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300"
                >
                  {currentSort.label}
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setShowSortDropdown(false);
                        }}
                        className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          sortBy === option.id
                            ? 'bg-primary/5 font-medium text-primary'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 선택된 카테고리 태그 (모바일) */}
            {selectedCategory !== 'all' && (
              <div className="mb-4 lg:hidden">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                  {categoriesWithAll.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('all')}>
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            )}

            {/* 상품 그리드 */}
            {isLoading && products.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                  {products.map((product) => (
                    <div key={product.id} className="[&_a]:!no-underline">
                      <a href={`${basePath}/products/${product.id}`} className="block">
                        <ProductCard product={product} style="grid" showMallName={false} />
                      </a>
                    </div>
                  ))}
                </div>

                {/* 더 보기 */}
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={productsLoading}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {productsLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          불러오는 중...
                        </>
                      ) : (
                        '더 보기'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20">
                <Squares2X2Icon className="h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">
                  {selectedCategory !== 'all' ? '해당 카테고리에 상품이 없습니다.' : '등록된 상품이 없습니다.'}
                </p>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    전체 상품 보기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 모바일 필터 오버레이 ===== */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileFilter(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">카테고리</h3>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <nav className="space-y-1">
              {categoriesWithAll.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setShowMobileFilter(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary/5 font-semibold text-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.productCount}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* 정렬 드롭다운 외부 클릭 닫기 */}
      {showSortDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </div>
  );
}
