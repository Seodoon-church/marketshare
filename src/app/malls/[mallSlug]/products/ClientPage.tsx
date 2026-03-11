'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { ProductCard } from '@/components/product/ProductCard';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { useProducts } from '@/lib/hooks/useProducts';
import { getMallCategories } from '@/lib/services/category-service';
import { getMallDisplayProducts } from '@/lib/services/product-service';
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';
import { isDemoStore, getDemoCategoriesWithCount, getDemoProductsByCategory, DEMO_PRODUCTS } from '@/lib/data/demo-data';
import type { Category, Product } from '@/types';
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

export default function MallProductsClient({ mallSlug: paramSlug }: { mallSlug: string }) {
  const mallSlug = useMallSlug(paramSlug);
  const isDemo = isDemoStore(mallSlug);
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const basePath = `/malls/${mallSlug}`;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 분양 네트워크 여부
  const hasFranchise = !!(mall?.parentMallId || (mall?.childMallIds && mall.childMallIds.length > 0));

  // 분양 네트워크 공유 상품
  const [sharedProducts, setSharedProducts] = useState<Product[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);

  // 카테고리 로드
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    // Demo mode: skip Firestore
    if (isDemo) {
      setCategoriesLoading(false);
      return;
    }

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
  }, [mall?.id, isDemo]);

  // 분양 네트워크 공유 상품 로드
  useEffect(() => {
    if (!mall || !hasFranchise) {
      setSharedProducts([]);
      setSharedLoading(false);
      return;
    }

    let cancelled = false;
    setSharedLoading(true);

    getMallDisplayProducts(mall, { limit: 100 })
      .then((allProducts) => {
        if (!cancelled) {
          const shared = allProducts.filter(
            (p) => p.sourceType && p.sourceType !== 'own'
          );
          setSharedProducts(shared);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setSharedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mall, hasFranchise]);

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

  // 자체 상품 + 공유 상품 통합 및 소스 필터 적용
  const displayProducts = useMemo(() => {
    // Demo mode: use mock products
    if (isDemo) {
      const demoFiltered = getDemoProductsByCategory(selectedCategory);
      // Apply sort
      const sorted = [...demoFiltered];
      if (sortBy === 'price-asc') sorted.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      else if (sortBy === 'price-desc') sorted.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      else if (sortBy === 'popular') sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      else if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
      // default: latest (already random order, fine for demo)
      return sorted;
    }

    const merged: Product[] = [...products];
    // 중복 방지: sharedProducts 중 이미 products에 있는 id는 제외
    const existingIds = new Set(products.map((p) => p.id));
    for (const sp of sharedProducts) {
      if (!existingIds.has(sp.id)) {
        merged.push(sp);
      }
    }

    // 소스 필터 적용
    if (selectedSource === 'all') return merged;
    if (selectedSource === 'own') return merged.filter((p) => !p.sourceType || p.sourceType === 'own');
    if (selectedSource === 'headquarters') return merged.filter((p) => p.sourceType === 'headquarters');
    if (selectedSource === 'franchisee') return merged.filter((p) => p.sourceType === 'franchisee');
    return merged;
  }, [products, sharedProducts, selectedSource, isDemo, selectedCategory, sortBy]);

  // 소스 필터 옵션 (분양 관계가 있을 때만)
  const sourceFilterOptions = useMemo(() => {
    if (!hasFranchise) return [];
    return [
      { id: 'all', label: '전체' },
      { id: 'own', label: '자체 상품' },
      { id: 'headquarters', label: '본사 상품' },
      { id: 'franchisee', label: '협동판매' },
    ];
  }, [hasFranchise]);

  // 카테고리 리스트에 전체 옵션 추가
  const categoriesWithAll = useMemo(() => {
    if (isDemo) return getDemoCategoriesWithCount();
    const allCount = categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    return [
      { id: 'all', name: '전체', productCount: allCount },
      ...categories.map((c) => ({ id: c.id, name: c.name, productCount: c.productCount })),
    ];
  }, [categories, isDemo]);

  const isLoading = isDemo ? false : (mallLoading || productsLoading || sharedLoading);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">전체 상품</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isDemo ? '마켓셰어 데모몰의 모든 상품을 만나보세요' : mall?.name ? `${mall.name}의 모든 상품을 만나보세요` : '상품을 불러오는 중...'}
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

              {/* 소스 필터 (분양 관계 있을 때만) */}
              {sourceFilterOptions.length > 0 && (
                <>
                  <div className="my-4 border-t border-gray-100" />
                  <h3 className="mb-4 text-sm font-bold text-gray-900">상품 구분</h3>
                  <nav className="space-y-1">
                    {sourceFilterOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedSource(opt.id)}
                        className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          selectedSource === opt.id
                            ? 'bg-primary/5 font-semibold text-primary'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </nav>
                </>
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
                  총 <span className="font-semibold text-gray-900">{displayProducts.length}</span>개
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

            {/* 선택된 필터 태그 (모바일) */}
            {(selectedCategory !== 'all' || selectedSource !== 'all') && (
              <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                    {categoriesWithAll.find((c) => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('all')}>
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
                {selectedSource !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                    {sourceFilterOptions.find((s) => s.id === selectedSource)?.label}
                    <button onClick={() => setSelectedSource('all')}>
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* 상품 그리드 */}
            {isLoading && displayProducts.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                  {displayProducts.map((product) => (
                    <div key={product.id} className="relative [&_a]:!no-underline">
                      {product.sourceType && product.sourceType !== 'own' && (
                        <span className={cn(
                          'absolute top-2 left-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          product.sourceType === 'headquarters' ? 'bg-blue-100 text-blue-700' :
                          product.sourceType === 'franchisee' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        )}>
                          {product.sourceType === 'headquarters' ? '본사' : product.sourceType === 'franchisee' ? '협동' : '공급'}
                        </span>
                      )}
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
                  {selectedCategory !== 'all' || selectedSource !== 'all'
                    ? '해당 조건에 맞는 상품이 없습니다.'
                    : '등록된 상품이 없습니다.'}
                </p>
                {(selectedCategory !== 'all' || selectedSource !== 'all') && (
                  <button
                    onClick={() => { setSelectedCategory('all'); setSelectedSource('all'); }}
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
              <h3 className="text-lg font-bold text-gray-900">필터</h3>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <h4 className="mb-3 text-sm font-bold text-gray-700">카테고리</h4>
            <nav className="space-y-1">
              {categoriesWithAll.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (!hasFranchise) setShowMobileFilter(false);
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

            {/* 소스 필터 (분양 관계 있을 때만) */}
            {sourceFilterOptions.length > 0 && (
              <>
                <div className="my-4 border-t border-gray-100" />
                <h4 className="mb-3 text-sm font-bold text-gray-700">상품 구분</h4>
                <nav className="space-y-1">
                  {sourceFilterOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedSource(opt.id);
                        setShowMobileFilter(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-4 py-3 text-sm transition-colors ${
                        selectedSource === opt.id
                          ? 'bg-primary/5 font-semibold text-primary'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </nav>
              </>
            )}
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
