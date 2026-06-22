'use client';

import { useState } from 'react';
import { EdHeading } from '@/components/redesign/EdHeading';
import { EdLabel } from '@/components/redesign/EdLabel';
import { EdChip } from '@/components/redesign/EdChip';
import { EdBottomTabBar } from '@/components/redesign/EdBottomTabBar';
import { IconSearch, IconX } from '@/components/redesign/icons';
import { useSearch } from '@/lib/hooks/useSearch';
import type { Product } from '@/types';

const popularTerms = ['세럼', '비타민', '샴푸', '선크림', '텀블러', '원피스', '에어팟', '향수'];
const categoryFilters = ['전체', '뷰티', '건강', '패션', '리빙', '식품', '디지털'];
const sortOptions = [
  { value: 'relevance', label: '관련도' },
  { value: 'new', label: '최신순' },
  { value: 'best', label: '인기순' },
  { value: 'price-low', label: '낮은가격' },
  { value: 'price-high', label: '높은가격' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('relevance');

  const { results, isLoading, error, search, searchHistory, clearHistory } = useSearch(searchedQuery);

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed) {
      setSearchedQuery(trimmed);
      search(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleTermClick = (term: string) => {
    setQuery(term);
    setSearchedQuery(term);
    search(term);
  };

  const filteredProducts = results.filter((p) => {
    if (selectedCategory === '전체') return true;
    return p.categoryName === selectedCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.salePrice ?? a.price;
    const priceB = b.salePrice ?? b.price;
    switch (sortBy) {
      case 'new': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'best': return b.salesCount - a.salesCount;
      case 'price-low': return priceA - priceB;
      case 'price-high': return priceB - priceA;
      default: return 0;
    }
  });

  const showLanding = !searchedQuery;
  const hasResults = searchedQuery && !isLoading && !error && sortedProducts.length > 0;
  const hasNoResults = searchedQuery && !isLoading && !error && sortedProducts.length === 0;

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Search bar */}
      <div className="sticky top-0 z-40 bg-paper px-[18px] md:px-10 pt-[50px] md:pt-6 pb-3">
        <div className="md:max-w-[1280px] md:mx-auto flex items-center gap-3">
          <a href="/" className="w-9 h-9 border border-ink flex items-center justify-center flex-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1815" strokeWidth="1.6"><path d="M15 19l-7-7 7-7" /></svg>
          </a>
          <div className="flex-1 flex items-center border-[1.5px] border-ink">
            <div className="pl-3 flex-none">
              <IconSearch size={18} className="text-[#8A7C68]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="검색어를 입력하세요"
              className="flex-1 border-none outline-none py-[12px] px-3 font-mono text-[14px] text-ink bg-transparent placeholder:text-[#A89B86]"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchedQuery(''); }} className="pr-3 flex-none cursor-pointer">
                <IconX size={16} className="text-[#8A7C68]" />
              </button>
            )}
          </div>
          <button onClick={handleSearch} className="flex-none bg-ink text-paper font-mono text-[13px] font-medium py-[12px] px-[18px] cursor-pointer">
            검색
          </button>
        </div>
      </div>

      <div className="px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto">
        {/* Landing state */}
        {showLanding && (
          <div className="pt-6">
            {/* Popular terms */}
            <div>
              <div className="flex items-center gap-[7px]">
                <span className="font-mono text-[10.5px] text-brass tracking-[.04em]">POPULAR</span>
                <EdHeading level={3} className="text-[16px]">인기 검색어</EdHeading>
              </div>
              <div className="flex flex-wrap gap-[7px] mt-[13px]">
                {popularTerms.map((term, idx) => (
                  <button
                    key={term}
                    onClick={() => handleTermClick(term)}
                    className="flex items-center gap-[7px] border border-[#E3DACA] py-[10px] px-[14px] bg-transparent cursor-pointer hover:bg-cream transition-colors"
                  >
                    <span className="font-mono text-[10px] font-semibold text-brass">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-[13px] text-ink">{term}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent searches */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[7px]">
                  <span className="font-mono text-[10.5px] text-brass tracking-[.04em]">RECENT</span>
                  <EdHeading level={3} className="text-[16px]">최근 검색어</EdHeading>
                </div>
                {searchHistory.length > 0 && (
                  <button onClick={clearHistory} className="font-mono text-[10.5px] text-[#8A7C68] cursor-pointer">전체 삭제</button>
                )}
              </div>
              {searchHistory.length === 0 ? (
                <p className="text-[12.5px] text-[#A89B86] mt-3">최근 검색 내역이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-[6px] mt-[13px]">
                  {searchHistory.slice(0, 10).map((term, idx) => (
                    <button
                      key={`${term}-${idx}`}
                      onClick={() => handleTermClick(term)}
                      className="border border-[#E3DACA] py-[7px] px-[12px] font-mono text-[12px] text-[#6E6253] bg-transparent cursor-pointer hover:bg-cream transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search results */}
        {searchedQuery && (
          <div className="pt-4">
            {/* Result header */}
            <div className="flex items-baseline justify-between pb-3 border-b-[1.5px] border-ink">
              <div>
                <EdHeading level={3} className="text-[18px]">
                  &lsquo;{searchedQuery}&rsquo; <span className="font-sans text-[14px] font-normal text-[#8A7C68]">검색 결과</span>
                </EdHeading>
                <div className="font-mono text-[11px] text-[#A89B86] mt-1">{sortedProducts.length}개 상품</div>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="font-mono text-[11px] text-ink bg-transparent border border-[#E3DACA] py-1.5 px-2 outline-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Category chips */}
            <div className="flex gap-[6px] mt-[13px] overflow-x-auto no-scrollbar">
              {categoryFilters.map((cat) => (
                <EdChip
                  key={cat}
                  selected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </EdChip>
              ))}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center py-20">
                <div className="w-6 h-6 border-[2px] border-ink border-t-transparent animate-spin" />
                <span className="font-mono text-[11px] text-[#8A7C68] mt-3">검색 중...</span>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-[56px] h-[56px] border-[2px] border-sale-red flex items-center justify-center">
                  <span className="text-sale-red text-[24px] font-serif">!</span>
                </div>
                <p className="text-[14px] text-ink font-semibold mt-4">오류가 발생했습니다</p>
                <p className="text-[12px] text-[#8A7C68] mt-1">{error.message}</p>
                <button
                  onClick={() => search(searchedQuery)}
                  className="mt-4 border border-ink py-2 px-5 font-mono text-[12px] text-ink bg-transparent cursor-pointer"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* Results grid */}
            {hasResults && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 mt-[13px] border-t border-[#E3DACA]">
                {sortedProducts.map((p) => {
                  const displayPrice = p.salePrice ?? p.price;
                  const hasDiscount = p.salePrice && p.salePrice < p.price;
                  const discountRate = hasDiscount ? Math.round((1 - p.salePrice! / p.price) * 100) : 0;
                  return (
                    <a
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="border-b border-r border-[#E3DACA] p-[13px] block group"
                    >
                      <div className="aspect-square bg-cream overflow-hidden">
                        <img
                          src={p.images?.[0]?.url || '/images/redesign/dp5.png'}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="font-mono text-[10px] text-brass tracking-[.04em] mt-[9px]">{p.mallName || p.brandName || '마켓셰어'}</div>
                      <div className="text-[13px] text-[#2A2520] font-medium leading-[1.4] mt-1 line-clamp-2">{p.name}</div>
                      <div className="flex items-baseline gap-[5px] mt-[6px]">
                        {hasDiscount && <span className="font-mono text-[13px] font-bold text-sale-red">{discountRate}%</span>}
                        <span className="font-mono text-[15px] font-semibold text-ink">{displayPrice.toLocaleString()}<span className="text-[11px]">원</span></span>
                      </div>
                      {hasDiscount && (
                        <span className="font-mono text-[11px] text-[#A89B86] line-through">{p.price.toLocaleString()}원</span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {hasNoResults && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="w-[56px] h-[56px] border-[2px] border-[#E3DACA] flex items-center justify-center">
                  <IconSearch size={24} className="text-[#C9BBA3]" />
                </div>
                <p className="text-[14px] text-ink font-semibold mt-4">검색 결과가 없습니다</p>
                <p className="text-[12px] text-[#8A7C68] mt-1 leading-relaxed">
                  &lsquo;{searchedQuery}&rsquo;에 대한 결과가 없어요.<br />다른 검색어를 시도해 보세요.
                </p>
                <div className="flex flex-wrap gap-[6px] mt-6 justify-center">
                  {popularTerms.slice(0, 5).map((term) => (
                    <button
                      key={term}
                      onClick={() => handleTermClick(term)}
                      className="border border-[#E3DACA] py-[7px] px-[12px] font-mono text-[12px] text-[#6E6253] bg-transparent cursor-pointer hover:bg-cream transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <EdBottomTabBar activeTab="shop" />
    </div>
  );
}
