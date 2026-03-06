'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import {
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { Product } from '@/types';

// 데모 상품 데이터
const demoProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: [
    '프리미엄 면 티셔츠 (남녀공용)',
    '핸드메이드 가죽 지갑',
    '유기농 꿀 선물세트',
    '무선 블루투스 이어폰 Pro',
    '천연 아로마 디퓨저',
    '스테인리스 텀블러 500ml',
    '프리미엄 실크 스카프',
    '수제 그래놀라 바',
    '에코 캔버스 백팩',
    '아이패드 케이스 (다크네이비)',
    '수제 비누 기프트 박스',
    '미니 LED 무드등',
  ][i],
  slug: `product-${i + 1}`,
  description: '',
  shortDescription: '',
  price: [29000, 89000, 45000, 159000, 38000, 25000, 120000, 18000, 65000, 35000, 28000, 22000][i],
  salePrice: i % 3 === 0 ? [23200, null, null, 127200, null, null, 96000, null, null, 28000, null, null][i] : null,
  costPrice: 0,
  currency: 'KRW',
  categoryId: 'cat-1',
  categoryName: ['패션', '패션', '식품', '전자기기', '리빙', '리빙', '패션', '식품', '패션', '전자기기', '뷰티', '리빙'][i],
  categoryPath: [],
  brandId: null,
  brandName: null,
  mallId: `mall-${(i % 3) + 1}`,
  mallName: ['스타일몰', '핸드메이드샵', '건강마켓'][i % 3],
  mallSlug: ['style-mall', 'handmade-shop', 'health-market'][i % 3],
  supplierId: null,
  supplierName: null,
  images: [],
  thumbnailUrl: '',
  options: [],
  variants: [],
  stock: i === 5 ? 0 : 100,
  sku: '',
  weight: 0,
  status: i === 5 ? 'soldout' : 'active',
  isFeatured: i < 4,
  isNew: i >= 8,
  isFromPlatform: false,
  tags: [],
  viewCount: Math.floor(Math.random() * 500),
  salesCount: Math.floor(Math.random() * 200),
  reviewCount: Math.floor(Math.random() * 50),
  averageRating: 3.5 + Math.random() * 1.5,
  shippingInfo: { fee: i % 2 === 0 ? 0 : 3000, freeShippingThreshold: 50000, method: 'delivery', estimatedDays: 2 },
  levelPrices: [],
  seoTitle: '',
  seoDescription: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
}));

const categories = ['전체', '패션', '전자기기', '식품', '리빙', '뷰티'];
const sortOptions = [
  { value: 'new', label: '최신순' },
  { value: 'best', label: '인기순' },
  { value: 'price-low', label: '낮은가격순' },
  { value: 'price-high', label: '높은가격순' },
  { value: 'review', label: '리뷰많은순' },
];

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('new');
  const [showFilter, setShowFilter] = useState(false);

  const filteredProducts = selectedCategory === '전체'
    ? demoProducts
    : demoProducts.filter((p) => p.categoryName === selectedCategory);

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
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 <span className="font-semibold text-gray-900">{filteredProducts.length}</span>개 상품
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

          {/* Product Grid */}
          <div className={`mt-6 grid gap-4 ${
            viewMode === 'grid'
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                style={viewMode}
                showMallName
              />
            ))}
          </div>

          {/* Load More */}
          <div className="mt-10 flex justify-center">
            <Button variant="outline" size="lg">
              더보기
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
