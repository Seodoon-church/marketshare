'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProducts } from '@/lib/hooks/useProducts';
import { useGlobalCategories } from '@/lib/hooks/useCategories';
import {
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  XMarkIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { ProductFilters } from '@/lib/services/product-service';

const sortOptions = [
  { value: 'new', label: '최신순' },
  { value: 'best', label: '인기순' },
  { value: 'price-low', label: '낮은가격순' },
  { value: 'price-high', label: '높은가격순' },
  { value: 'review', label: '리뷰많은순' },
];

// Sort value to ProductFilters mapping
const getSortFilters = (sortValue: string): Pick<ProductFilters, 'sortBy' | 'sortDirection'> => {
  switch (sortValue) {
    case 'new':
      return { sortBy: 'createdAt', sortDirection: 'desc' };
    case 'best':
      return { sortBy: 'salesCount', sortDirection: 'desc' };
    case 'price-low':
      return { sortBy: 'price', sortDirection: 'asc' };
    case 'price-high':
      return { sortBy: 'price', sortDirection: 'desc' };
    case 'review':
      return { sortBy: 'salesCount', sortDirection: 'desc' }; // No reviewCount sort available
    default:
      return { sortBy: 'createdAt', sortDirection: 'desc' };
  }
};

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('new');
  const [showFilter, setShowFilter] = useState(false);

  // Fetch categories
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useGlobalCategories();

  // Build product filters
  const productFilters = useMemo<ProductFilters>(() => {
    const sortFilters = getSortFilters(sortBy);
    return {
      ...sortFilters,
      categoryId: selectedCategoryId || undefined,
      status: 'active',
      limit: 12,
    };
  }, [sortBy, selectedCategoryId]);

  // Fetch products
  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    hasMore,
    loadMore,
  } = useProducts(productFilters);

  const isLoading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/30">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900">전체상품</h1>
            <p className="mt-1 text-sm text-gray-500">
              입점몰의 모든 상품을 한 곳에서 만나보세요
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategoryId === null
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              전체
            </button>
            {categoriesLoading ? (
              // Loading skeleton for categories
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-16 animate-pulse rounded-full bg-gray-200"
                />
              ))
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategoryId === cat.id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 <span className="font-semibold text-gray-900">{products.length}</span>개 상품
            </p>
            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              {/* View Toggle */}
              <div className="hidden items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 sm:flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Button (Mobile) */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:hidden"
              >
                <FunnelIcon className="h-4 w-4" />
                필터
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mt-8">
              <EmptyState
                icon={<ExclamationTriangleIcon className="h-12 w-12" />}
                title="상품을 불러올 수 없습니다"
                description={error.message || '잠시 후 다시 시도해주세요.'}
                action={{
                  label: '다시 시도',
                  onClick: () => window.location.reload(),
                }}
              />
            </div>
          )}

          {/* Loading State */}
          {!error && isLoading && products.length === 0 && (
            <div className={`mt-6 grid gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-2'
            }`}>
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} hasImage />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!error && !isLoading && products.length === 0 && (
            <div className="mt-8">
              <EmptyState
                icon={<ShoppingBagIcon className="h-12 w-12" />}
                title="상품이 없습니다"
                description="선택하신 조건에 맞는 상품이 없습니다. 다른 카테고리를 선택해보세요."
                action={{
                  label: '전체 상품 보기',
                  onClick: () => setSelectedCategoryId(null),
                }}
              />
            </div>
          )}

          {/* Product Grid */}
          {!error && products.length > 0 && (
            <>
              <div className={`mt-6 grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1 md:grid-cols-2'
              }`}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    style={viewMode}
                    showMallName
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={loadMore}
                    disabled={productsLoading}
                  >
                    {productsLoading ? '로딩 중...' : '더보기'}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
