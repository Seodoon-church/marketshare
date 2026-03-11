'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMalls } from '@/lib/hooks/useMall';
import type { Mall } from '@/types';
import type { MallFilters } from '@/lib/services/mall-service';
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

// ---------- Gradient color palettes ----------

const GRADIENT_PALETTES = [
  { accent: 'bg-rose-500', from: 'from-rose-400', to: 'to-pink-500' },
  { accent: 'bg-amber-500', from: 'from-amber-400', to: 'to-orange-500' },
  { accent: 'bg-emerald-500', from: 'from-emerald-400', to: 'to-green-500' },
  { accent: 'bg-blue-500', from: 'from-blue-400', to: 'to-indigo-500' },
  { accent: 'bg-purple-500', from: 'from-purple-400', to: 'to-fuchsia-500' },
  { accent: 'bg-teal-500', from: 'from-teal-400', to: 'to-cyan-500' },
  { accent: 'bg-red-500', from: 'from-red-400', to: 'to-rose-500' },
  { accent: 'bg-sky-500', from: 'from-sky-400', to: 'to-blue-500' },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getGradient(mallId: string) {
  return GRADIENT_PALETTES[hashString(mallId) % GRADIENT_PALETTES.length];
}

// ---------- Plan display label ----------

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
};

// ---------- Sort options mapped to MallFilters.sortBy ----------

type SortValue = 'createdAt' | 'name' | 'productCount';

const sortOptions: { value: SortValue; label: string }[] = [
  { value: 'createdAt', label: '최신순' },
  { value: 'name', label: '이름순' },
  { value: 'productCount', label: '상품많은순' },
];

// ---------- Page Component ----------

export default function MallsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortValue>('createdAt');

  // Build filters for the hook
  const filters: MallFilters = useMemo(
    () => ({
      status: 'active',
      sortBy,
      sortDirection: sortBy === 'name' ? 'asc' : 'desc',
    }),
    [sortBy]
  );

  const { data: malls, isLoading, error } = useMalls(filters);

  // Client-side search filtering
  const filteredMalls = useMemo(() => {
    if (!searchQuery.trim()) return malls;
    const q = searchQuery.trim().toLowerCase();
    return malls.filter(
      (mall) =>
        mall.name.toLowerCase().includes(q) ||
        mall.description.toLowerCase().includes(q) ||
        mall.slug.toLowerCase().includes(q)
    );
  }, [malls, searchQuery]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-primary-dark">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4 py-16 md:py-24">
            <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              입점몰 둘러보기
            </h1>
            <p className="mt-4 max-w-xl text-base text-gray-300 md:text-lg">
              다양한 입점몰을 둘러보고, 나에게 맞는 쇼핑몰을 찾아보세요.
              각 몰만의 특별한 상품과 서비스를 만나볼 수 있습니다.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="몰 이름으로 검색..."
                  className="w-full rounded-2xl border-0 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-400 backdrop-blur-sm outline-none ring-1 ring-white/20 transition-all focus:bg-white/15 focus:ring-white/40"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isLoading ? (
                '불러오는 중...'
              ) : (
                <>
                  총{' '}
                  <span className="font-semibold text-gray-900">
                    {filteredMalls.length}
                  </span>
                  개 몰
                </>
              )}
            </p>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortValue)}
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
          </div>

          {/* Loading State */}
          {isLoading && (
            <FullPageLoader message="입점몰을 불러오고 있습니다..." />
          )}

          {/* Error State */}
          {!isLoading && error && (
            <EmptyState
              title="데이터를 불러올 수 없습니다"
              description={error.message}
              className="mt-8"
            />
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredMalls.length === 0 && (
            <EmptyState
              icon={
                <BuildingStorefrontIcon className="h-12 w-12 text-gray-300" />
              }
              title={
                searchQuery.trim()
                  ? `"${searchQuery}" 검색 결과가 없습니다`
                  : '아직 입점된 몰이 없습니다'
              }
              description={
                searchQuery.trim()
                  ? '다른 검색어로 다시 시도해 보세요.'
                  : '곧 다양한 입점몰이 오픈될 예정입니다.'
              }
              className="mt-8"
            />
          )}

          {/* Mall Grid */}
          {!isLoading && !error && filteredMalls.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMalls.map((mall) => {
                const gradient = getGradient(mall.id);
                return (
                  <Card
                    key={mall.id}
                    hover
                    padding="none"
                    className="overflow-hidden"
                  >
                    {/* Theme Color Accent Bar */}
                    <div className={`h-1.5 ${gradient.accent}`} />

                    <div className="p-5">
                      {/* Mall Header */}
                      <div className="flex items-start gap-4">
                        {/* Logo or Initial */}
                        {mall.logoUrl ? (
                          <Image
                            src={mall.logoUrl}
                            alt={`${mall.name} 로고`}
                            width={56}
                            height={56}
                            className="h-14 w-14 shrink-0 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient.from} ${gradient.to} text-xl font-bold text-white shadow-sm`}
                          >
                            {mall.name[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-gray-900">
                              {mall.name}
                            </h3>
                            <Badge variant="secondary">
                              {PLAN_LABELS[mall.plan] ?? mall.plan}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {mall.description || '소개가 등록되지 않았습니다.'}
                          </p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <ShoppingBagIcon className="h-4 w-4" />
                          <span>상품 {mall.productCount.toLocaleString()}개</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                          <span>주문 {mall.orderCount.toLocaleString()}개</span>
                        </div>
                      </div>

                      {/* Visit Button */}
                      <div className="mt-4">
                        <Button
                          href={`/malls/${mall.slug}`}
                          variant="outline"
                          fullWidth
                          className="group/btn"
                        >
                          방문하기
                          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
