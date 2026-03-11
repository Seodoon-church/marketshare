'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { getBrands } from '@/lib/services/brand-service';
import type { Brand } from '@/types';

// ---------- Deterministic gradient for brand placeholder ----------

const gradientPairs = [
  { from: 'from-emerald-400', to: 'to-green-500' },
  { from: 'from-orange-400', to: 'to-amber-500' },
  { from: 'from-purple-400', to: 'to-fuchsia-500' },
  { from: 'from-blue-400', to: 'to-indigo-500' },
  { from: 'from-yellow-400', to: 'to-orange-500' },
  { from: 'from-lime-400', to: 'to-green-500' },
  { from: 'from-red-400', to: 'to-rose-500' },
  { from: 'from-slate-400', to: 'to-gray-600' },
  { from: 'from-cyan-400', to: 'to-teal-500' },
  { from: 'from-pink-400', to: 'to-rose-500' },
];

function getBrandGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradientPairs.length;
  return gradientPairs[index];
}

// ---------- Chosung (Korean initial consonant) utilities ----------

const chosung = ['전체', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'A-Z'];

function getChosung(char: string): string {
  const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return char.toUpperCase();
  return chosungList[Math.floor(code / 588)];
}

function matchesChosungFilter(brandName: string, filter: string): boolean {
  if (filter === '전체') return true;
  if (filter === 'A-Z') {
    return /^[A-Za-z]/.test(brandName);
  }
  const firstChar = brandName[0];
  const brandChosung = getChosung(firstChar);
  const doubleToSingle: Record<string, string> = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
  const normalized = doubleToSingle[brandChosung] || brandChosung;
  return normalized === filter;
}

// ---------- Page Component ----------

export default function BrandsPage() {
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      try {
        setLoading(true);
        setError(null);
        const data = await getBrands({ isActive: true, sortBy: 'name', sortDirection: 'asc' });
        setBrands(data);
      } catch (err: any) {
        console.error('브랜드 로딩 실패:', err);
        setError(err.message || '브랜드 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  const filteredBrands = brands.filter((brand) => {
    const matchesFilter = matchesChosungFilter(brand.name, selectedFilter);
    const matchesSearch = searchQuery === '' || brand.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/30">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900">브랜드</h1>
            <p className="mt-1 text-sm text-gray-500">
              인기 브랜드의 상품을 한눈에 살펴보세요
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
          {/* Search Input */}
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="브랜드명을 검색하세요"
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Alphabet / 초성 Filter */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {chosung.map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedFilter(ch)}
                className={`min-w-[2.5rem] rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${
                  selectedFilter === ch
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <FullPageLoader message="브랜드를 불러오는 중..." />
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="mt-16 flex flex-col items-center justify-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
              <p className="mt-4 text-base font-medium text-gray-700">
                브랜드를 불러올 수 없습니다
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {error}
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* Content (only when loaded without error) */}
          {!loading && !error && (
            <>
              {/* Results Count */}
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  총 <span className="font-semibold text-gray-900">{filteredBrands.length}</span>개 브랜드
                </p>
              </div>

              {/* Brand Grid */}
              {filteredBrands.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                  {filteredBrands.map((brand) => {
                    const gradient = getBrandGradient(brand.name);
                    return (
                      <a key={brand.id} href={`/brands/${brand.slug}`} className="group">
                        <Card hover padding="md" className="flex flex-col items-center text-center">
                          {/* Logo or Gradient Placeholder */}
                          {brand.logoUrl ? (
                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gray-50 transition-transform duration-300 group-hover:scale-105">
                              <Image
                                src={brand.logoUrl}
                                alt={brand.name}
                                fill
                                className="object-contain p-2"
                                sizes="80px"
                              />
                            </div>
                          ) : (
                            <div
                              className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient.from} ${gradient.to} text-2xl font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105`}
                            >
                              {brand.name[0]}
                            </div>
                          )}

                          {/* Brand Name */}
                          <h3 className="mt-4 text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {brand.name}
                          </h3>

                          {/* Description (truncated) */}
                          {brand.description && (
                            <p className="mt-1.5 text-xs text-gray-400 line-clamp-1">
                              {brand.description}
                            </p>
                          )}
                        </Card>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Empty State (no brands match filter/search) */}
              {filteredBrands.length === 0 && brands.length > 0 && (
                <div className="mt-16 flex flex-col items-center justify-center py-12">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="mt-4 text-base font-medium text-gray-500">
                    해당 조건의 브랜드가 없습니다
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    다른 초성이나 검색어로 시도해 보세요
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => {
                      setSelectedFilter('전체');
                      setSearchQuery('');
                    }}
                  >
                    전체 보기
                  </Button>
                </div>
              )}

              {/* Empty State (no brands at all in database) */}
              {brands.length === 0 && (
                <div className="mt-16 flex flex-col items-center justify-center py-12">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                    <ShoppingBagIcon className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="mt-4 text-base font-medium text-gray-500">
                    등록된 브랜드가 없습니다
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    브랜드가 등록되면 여기에 표시됩니다
                  </p>
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
