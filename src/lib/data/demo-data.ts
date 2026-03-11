// ============================================
// MarketShare - Demo Store Mock Data
// Firestore 없이 데모 체험을 위한 목업 데이터
// ============================================

import type { Category, Product, Banner } from '@/types';

// ──────────────────────────────────────
// Categories
// ──────────────────────────────────────

export const DEMO_CATEGORIES: (Pick<Category, 'id' | 'name'> & { productCount: number })[] = [
  { id: 'health', name: '건강기능식품', productCount: 4 },
  { id: 'beauty', name: '뷰티/화장품', productCount: 4 },
  { id: 'hairbody', name: '헤어/바디케어', productCount: 3 },
  { id: 'living', name: '생활용품', productCount: 3 },
  { id: 'food', name: '식품/음료', productCount: 3 },
  { id: 'fashion', name: '패션/잡화', productCount: 3 },
];

// ──────────────────────────────────────
// Products
// ──────────────────────────────────────

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

const CATEGORY_NAMES: Record<string, string> = {
  health: '건강기능식품',
  beauty: '뷰티/화장품',
  hairbody: '헤어/바디케어',
  living: '생활용품',
  food: '식품/음료',
  fashion: '패션/잡화',
};

function makeProduct(
  id: string,
  name: string,
  price: number,
  salePrice: number | null,
  categoryId: string,
  opts?: { isNew?: boolean; isFeatured?: boolean; salesCount?: number }
): Product {
  const sc = opts?.salesCount ?? Math.floor(Math.random() * 500);
  return {
    id,
    mallId: 'demo-mall',
    mallName: '마켓셰어 데모몰',
    mallSlug: 'demo-store',
    name,
    slug: id,
    description: `${name} - 고품질 프리미엄 제품입니다.`,
    shortDescription: name,
    price,
    salePrice,
    costPrice: Math.round(price * 0.5),
    currency: 'KRW',
    categoryId,
    categoryName: CATEGORY_NAMES[categoryId] || '',
    categoryPath: [categoryId],
    brandId: null,
    brandName: null,
    supplierId: null,
    supplierName: null,
    images: [],
    thumbnailUrl: '',
    options: [],
    variants: [],
    stock: 100,
    sku: `DEMO-${id.toUpperCase()}`,
    weight: 0,
    status: 'active',
    isFeatured: opts?.isFeatured ?? false,
    isNew: opts?.isNew ?? false,
    isFromPlatform: false,
    tags: [],
    viewCount: Math.floor(Math.random() * 3000),
    salesCount: sc,
    reviewCount: Math.floor(Math.random() * 80),
    averageRating: +(4 + Math.random() * 0.9).toFixed(1),
    shippingInfo: { method: 'delivery', fee: 0, freeShippingThreshold: 30000 } as Product['shippingInfo'],
    levelPrices: [],
    seoTitle: name,
    seoDescription: `${name} - 마켓셰어 데모몰`,
    createdAt: daysAgo(Math.floor(Math.random() * 60)),
    updatedAt: daysAgo(Math.floor(Math.random() * 10)),
    publishedAt: daysAgo(Math.floor(Math.random() * 60)),
  };
}

export const DEMO_PRODUCTS: Product[] = [
  // 건강기능식품
  makeProduct('dp1', '프리미엄 종합비타민 60정', 39900, 29900, 'health', { isFeatured: true, salesCount: 1240 }),
  makeProduct('dp2', '정관장 홍삼정 에브리타임 30포', 55000, 45000, 'health', { isFeatured: true, salesCount: 890 }),
  makeProduct('dp3', '프로바이오틱스 유산균 90캡슐', 35000, 24900, 'health', { isNew: true }),
  makeProduct('dp4', 'MSM 글루코사민 관절건강 120정', 42000, 33000, 'health'),

  // 뷰티/화장품
  makeProduct('dp5', '히알루론산 수분 세럼 50ml', 49900, 29900, 'beauty', { isFeatured: true, salesCount: 2100 }),
  makeProduct('dp6', '시카 리페어 크림 100ml', 52000, 35000, 'beauty', { isNew: true }),
  makeProduct('dp7', '비타민C 브라이트닝 앰플 30ml', 39900, 24900, 'beauty'),
  makeProduct('dp8', '콜라겐 탄력 아이크림 25ml', 48000, 32000, 'beauty', { isNew: true }),

  // 헤어/바디케어
  makeProduct('dp9', '두피강화 탈모케어 샴푸 500ml', 28000, 19900, 'hairbody', { isFeatured: true, salesCount: 1580 }),
  makeProduct('dp10', '아르간오일 헤어 트리트먼트 200ml', 25000, 18000, 'hairbody'),
  makeProduct('dp11', '릴렉싱 바디워시 로즈마리 1000ml', 22000, 15900, 'hairbody', { isNew: true }),

  // 생활용품
  makeProduct('dp12', '울트라클린 섬유유연제 3L', 15900, 11900, 'living', { isFeatured: true, salesCount: 3200 }),
  makeProduct('dp13', '천연 주방세제 식물유래 1L', 12900, 9900, 'living'),
  makeProduct('dp14', '프리미엄 죽염 치약 세트 (3개입)', 18000, 13500, 'living', { isNew: true }),

  // 식품/음료
  makeProduct('dp15', '유기농 카모마일 허브티 30포', 19900, 14900, 'food', { isFeatured: true, salesCount: 780 }),
  makeProduct('dp16', '콜드브루 원두커피 드립백 20개', 25000, 18900, 'food', { isNew: true }),
  makeProduct('dp17', '오가닉 그래놀라 아사이베리 500g', 16900, 12900, 'food'),

  // 패션/잡화
  makeProduct('dp18', '소프트터치 캐시미어 머플러', 59000, 39000, 'fashion', { isNew: true }),
  makeProduct('dp19', '에코 캔버스 토트백 라지', 35000, 25000, 'fashion', { isFeatured: true, salesCount: 650 }),
  makeProduct('dp20', '실버925 미니멀 반지 세트', 29000, 22000, 'fashion'),
];

// ──────────────────────────────────────
// Banners
// ──────────────────────────────────────

export const DEMO_BANNERS = [
  {
    id: 'db1',
    title: '봄 맞이 스킨케어 특가전',
    subtitle: '프리미엄 뷰티 제품 최대 40% OFF',
    gradient: 'from-pink-500 to-rose-500',
    cta: '쇼핑하기',
    imageUrl: '',
    linkUrl: '',
  },
  {
    id: 'db2',
    title: '건강기능식품 BEST 기획전',
    subtitle: '인기 영양제 모음전 - 면역력 UP',
    gradient: 'from-emerald-500 to-teal-500',
    cta: '기획전 보기',
    imageUrl: '',
    linkUrl: '',
  },
  {
    id: 'db3',
    title: 'LIVE 커머스 쇼핑',
    subtitle: '실시간 방송으로 만나는 특별한 가격',
    gradient: 'from-red-500 to-pink-500',
    cta: '라이브 보기',
    imageUrl: '',
    linkUrl: '',
  },
];

// ──────────────────────────────────────
// Helper
// ──────────────────────────────────────

export function isDemoStore(mallSlug: string): boolean {
  return mallSlug === 'demo-store' || mallSlug === 'demo';
}

export function getDemoProductsByCategory(categoryId: string): Product[] {
  if (categoryId === 'all') return DEMO_PRODUCTS;
  return DEMO_PRODUCTS.filter((p) => p.categoryId === categoryId);
}

export function getDemoCategoriesWithCount() {
  const allCount = DEMO_PRODUCTS.length;
  return [
    { id: 'all', name: '전체', productCount: allCount },
    ...DEMO_CATEGORIES,
  ];
}
