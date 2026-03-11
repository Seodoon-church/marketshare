'use client';

import { useState, useEffect } from 'react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/product/ProductCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useSearch } from '@/lib/hooks/useSearch';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  FireIcon,
  ClockIcon,
  StarIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { Product } from '@/types';

const popularSearchTerms = [
  '티셔츠', '원피스', '운동화', '에어팟', '선크림',
  '텀블러', '가방', '향수', '비타민', '그래놀라',
];

const categoryFilters = ['전체', '패션', '전자기기', '식품', '리빙', '뷰티'];
const priceRanges = [
  { label: '전체', min: 0, max: Infinity },
  { label: '~1만원', min: 0, max: 10000 },
  { label: '1만원~3만원', min: 10000, max: 30000 },
  { label: '3만원~5만원', min: 30000, max: 50000 },
  { label: '5만원~10만원', min: 50000, max: 100000 },
  { label: '10만원~', min: 100000, max: Infinity },
];
const ratingOptions = [
  { label: '전체', value: 0 },
  { label: '4점 이상', value: 4 },
  { label: '3점 이상', value: 3 },
  { label: '2점 이상', value: 2 },
];
const sortOptions = [
  { value: 'relevance', label: '관련도순' },
  { value: 'new', label: '최신순' },
  { value: 'best', label: '인기순' },
  { value: 'price-low', label: '낮은가격순' },
  { value: 'price-high', label: '높은가격순' },
  { value: 'review', label: '리뷰많은순' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Use the search hook
  const {
    results,
    isLoading,
    error,
    totalCount,
    search,
    searchHistory,
    clearHistory
  } = useSearch(searchedQuery);

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      setSearchedQuery(trimmedQuery);
      search(trimmedQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePopularClick = (term: string) => {
    setQuery(term);
    setSearchedQuery(term);
    search(term);
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    setSearchedQuery(term);
    search(term);
  };

  // Apply client-side filters to search results
  const filteredProducts = results.filter((p) => {
    const matchesCategory = selectedCategory === '전체' || p.categoryName === selectedCategory;
    const range = priceRanges[selectedPriceRange];
    const displayPrice = p.salePrice ?? p.price;
    const matchesPrice = displayPrice >= range.min && displayPrice < range.max;
    const matchesShipping = !freeShippingOnly || p.shippingInfo?.fee === 0;
    const matchesRating = selectedRating === 0 || p.averageRating >= selectedRating;
    return matchesCategory && matchesPrice && matchesShipping && matchesRating;
  });

  // Apply client-side sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.salePrice ?? a.price;
    const priceB = b.salePrice ?? b.price;

    switch (sortBy) {
      case 'new':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'best':
        return b.salesCount - a.salesCount;
      case 'price-low':
        return priceA - priceB;
      case 'price-high':
        return priceB - priceA;
      case 'review':
        return b.reviewCount - a.reviewCount;
      case 'relevance':
      default:
        return 0;
    }
  });

  const hasResults = searchedQuery && !isLoading && !error && sortedProducts.length > 0;
  const hasNoResults = searchedQuery && !isLoading && !error && sortedProducts.length === 0;
  const showLanding = !searchedQuery;

  // Filter sidebar component
  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? '' : ''}>
      {/* Category */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">카테고리</h3>
        <div className="flex flex-col gap-1">
          {categoryFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">가격대</h3>
        <div className="flex flex-col gap-1">
          {priceRanges.map((range, idx) => (
            <button
              key={range.label}
              onClick={() => setSelectedPriceRange(idx)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedPriceRange === idx
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipping */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">배송</h3>
        <label className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={freeShippingOnly}
            onChange={(e) => setFreeShippingOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">무료배송만</span>
        </label>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">평점</h3>
        <div className="flex flex-col gap-1">
          {ratingOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedRating(opt.value)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedRating === opt.value
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.value > 0 && <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/30">
        {/* Search Bar */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
            <div className="relative mx-auto max-w-2xl">
              <MagnifyingGlassIcon className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="찾고 싶은 상품을 검색해 보세요"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-4 pl-14 pr-24 text-base text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          {/* Landing: Popular Search Terms + History */}
          {showLanding && (
            <div className="mx-auto max-w-2xl py-12">
              <div className="flex items-center gap-2 mb-6">
                <FireIcon className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">인기 검색어</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearchTerms.map((term, idx) => (
                  <button
                    key={term}
                    onClick={() => handlePopularClick(term)}
                    className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                      {idx + 1}
                    </span>
                    {term}
                  </button>
                ))}
              </div>

              {/* Recent Searches */}
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">최근 검색어</h2>
                  </div>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>
                {searchHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">최근 검색한 내역이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 10).map((term, idx) => (
                      <button
                        key={`${term}-${idx}`}
                        onClick={() => handleHistoryClick(term)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-all hover:border-primary hover:text-primary"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchedQuery && (
            <>
              {/* Loading State */}
              {isLoading && (
                <div className="py-20">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-gray-500">검색 중...</p>
                  </div>
                  <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-red-50">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-700">
                    검색 중 오류가 발생했습니다
                  </h3>
                  <p className="mt-2 text-center text-sm text-gray-400">
                    {error.message}
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => search(searchedQuery)}
                    >
                      다시 시도
                    </Button>
                  </div>
                </div>
              )}

              {/* Results Header & Grid */}
              {!isLoading && !error && (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        &lsquo;{searchedQuery}&rsquo;
                        <span className="ml-1 font-normal text-gray-500">검색 결과</span>
                      </h2>
                      <p className="mt-1 text-sm text-gray-400">
                        총 {sortedProducts.length}개의 상품을 찾았습니다
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Sort Dropdown */}
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

                      {/* Mobile Filter Toggle */}
                      <button
                        onClick={() => setShowMobileFilter(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 lg:hidden"
                      >
                        <AdjustmentsHorizontalIcon className="h-4 w-4" />
                        필터
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    {/* Desktop Sidebar Filters */}
                    <aside className="hidden w-56 shrink-0 lg:block">
                      <Card padding="md">
                        <FilterSidebar />
                      </Card>
                    </aside>

                    {/* Product Grid / Empty State */}
                    <div className="min-w-0 flex-1">
                      {hasResults && (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                          {sortedProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              style="grid"
                              showMallName
                            />
                          ))}
                        </div>
                      )}

                      {hasNoResults && (
                        <div className="flex flex-col items-center justify-center py-20">
                          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
                            <MagnifyingGlassIcon className="h-12 w-12 text-gray-300" />
                          </div>
                          <h3 className="mt-6 text-lg font-semibold text-gray-700">
                            검색 결과가 없습니다
                          </h3>
                          <p className="mt-2 text-center text-sm text-gray-400">
                            &lsquo;{searchedQuery}&rsquo;에 대한 검색 결과가 없습니다.<br />
                            다른 검색어를 입력하거나 필터를 변경해 보세요.
                          </p>
                          <div className="mt-6 flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setQuery('');
                                setSearchedQuery('');
                                setSelectedCategory('전체');
                                setSelectedPriceRange(0);
                                setFreeShippingOnly(false);
                                setSelectedRating(0);
                              }}
                            >
                              검색 초기화
                            </Button>
                          </div>

                          {/* Popular Terms in Empty State */}
                          <div className="mt-10 w-full max-w-md">
                            <div className="flex items-center gap-2 mb-4">
                              <FireIcon className="h-4 w-4 text-red-500" />
                              <h4 className="text-sm font-semibold text-gray-700">인기 검색어</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {popularSearchTerms.slice(0, 6).map((term) => (
                                <button
                                  key={term}
                                  onClick={() => handlePopularClick(term)}
                                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-primary hover:text-primary"
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMobileFilter(false)}
            />

            {/* Drawer */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">필터</h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <FilterSidebar mobile />
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setSelectedCategory('전체');
                    setSelectedPriceRange(0);
                    setFreeShippingOnly(false);
                    setSelectedRating(0);
                  }}
                >
                  초기화
                </Button>
                <Button
                  fullWidth
                  onClick={() => setShowMobileFilter(false)}
                >
                  적용하기
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
