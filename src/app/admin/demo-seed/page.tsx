'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  query,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/components/ui/Toast';

// ---- Demo Mall Data ----
const DEMO_MALL = {
  name: '마켓셰어 데모몰',
  slug: 'demo-store',
  description: '마켓셰어의 모든 기능을 체험할 수 있는 데모 쇼핑몰입니다. 건강기능식품, 뷰티, 생활용품 등 분양몰 핵심 상품을 만나보세요.',
  status: 'active',
  plan: 'enterprise',
  logoUrl: '',
  themeId: 'basic',
  themeConfig: {},
  productCount: 0,
  orderCount: 128,
  totalRevenue: 15680000,
  commissionRate: 0.5,
  parentMallId: null,
  childMallIds: [],
  domain: null,
  businessInfo: {
    businessName: '주식회사 마켓셰어',
    representative: '한광희',
    businessNumber: '286-02-01290',
    onlineBusinessNumber: '제 2024-서울강남-01234호',
    address: '서울특별시 강남구 테헤란로 123, 4층',
    phone: '010-5630-0641',
    email: 'support@marketshare.kr',
    businessCategory: '소매업',
    businessType: '전자상거래',
    sellerType: 'domestic',
  },
};

// ---- Demo Categories ----
const DEMO_CATEGORIES = [
  { name: '건강기능식품', slug: 'health', icon: '💊', sortOrder: 0 },
  { name: '뷰티/화장품', slug: 'beauty', icon: '💄', sortOrder: 1 },
  { name: '식품/음료', slug: 'food', icon: '🍎', sortOrder: 2 },
  { name: '생활용품', slug: 'living', icon: '🏠', sortOrder: 3 },
  { name: '헤어/바디케어', slug: 'hairbody', icon: '🧴', sortOrder: 4 },
  { name: '반려동물', slug: 'pet', icon: '🐶', sortOrder: 5 },
];

// ---- Demo Products ----
const DEMO_PRODUCTS = [
  // 건강기능식품
  {
    name: '프리미엄 종합비타민 골드',
    description: '하루 한 알로 필수 비타민 & 미네랄 22종을 채우세요. 미국산 원료, GMP 인증 시설에서 생산된 프리미엄 종합비타민입니다.',
    price: 38000,
    originalPrice: 48000,
    categorySlug: 'health',
    status: 'active',
    isFeatured: true,
    isNew: true,
    sku: 'VIT-GOLD-001',
    stock: 500,
    options: [],
    variants: [],
    images: [],
    tags: ['비타민', '건강', '베스트'],
  },
  {
    name: '6년근 고려홍삼정 PREMIUM',
    description: '6년근 홍삼만을 사용한 농축 홍삼정. 진세노사이드 함량 7mg/g 이상. 면역력 증진, 피로 개선에 도움을 줄 수 있습니다.',
    price: 89000,
    originalPrice: 120000,
    categorySlug: 'health',
    status: 'active',
    isFeatured: true,
    isNew: false,
    sku: 'GIN-PREM-001',
    stock: 200,
    options: [],
    variants: [],
    images: [],
    tags: ['홍삼', '면역력', '선물'],
  },
  {
    name: '생유산균 프로바이오틱스 30포',
    description: '100억 CFU 보장 생유산균. 장까지 살아서 도달하는 코팅 기술 적용. 온 가족이 함께 먹을 수 있는 요거트맛.',
    price: 29000,
    originalPrice: 35000,
    categorySlug: 'health',
    status: 'active',
    isFeatured: false,
    isNew: true,
    sku: 'PRO-30P-001',
    stock: 800,
    options: [],
    variants: [],
    images: [],
    tags: ['유산균', '장건강', '가족'],
  },
  // 뷰티/화장품
  {
    name: '히알루론산 수분 앰플 세럼',
    description: '저분자 히알루론산 5중 콤플렉스. 48시간 보습 유지. 피부 속부터 차오르는 수분감을 경험하세요.',
    price: 32000,
    originalPrice: 45000,
    categorySlug: 'beauty',
    status: 'active',
    isFeatured: true,
    isNew: true,
    sku: 'SER-HA-001',
    stock: 350,
    options: [],
    variants: [],
    images: [],
    tags: ['세럼', '보습', '히알루론산'],
  },
  {
    name: '시카 리페어 크림 50ml',
    description: '병풀추출물(시카) 함유 진정 크림. 민감성 피부를 위한 저자극 포뮬러. 피부장벽 강화에 도움.',
    price: 28000,
    originalPrice: 36000,
    categorySlug: 'beauty',
    status: 'active',
    isFeatured: false,
    isNew: false,
    sku: 'CRM-CICA-001',
    stock: 420,
    options: [],
    variants: [],
    images: [],
    tags: ['크림', '시카', '진정'],
  },
  {
    name: '톤업 선크림 SPF50+ PA++++',
    description: '자연스러운 톤업 효과와 강력한 자외선 차단. 백탁 없는 가벼운 텍스처. 데일리 선케어의 정석.',
    price: 19000,
    originalPrice: 25000,
    categorySlug: 'beauty',
    status: 'active',
    isFeatured: true,
    isNew: false,
    sku: 'SUN-TU-001',
    stock: 600,
    options: [],
    variants: [],
    images: [],
    tags: ['선크림', '자외선차단', '톤업'],
  },
  // 식품/음료
  {
    name: '제주 야생 천연벌꿀 500g',
    description: '제주도 오름에서 채취한 100% 천연 야생 벌꿀. 인공 첨가물 없이 자연 그대로의 맛과 영양을 담았습니다.',
    price: 45000,
    originalPrice: 55000,
    categorySlug: 'food',
    status: 'active',
    isFeatured: false,
    isNew: true,
    sku: 'HON-JEJU-001',
    stock: 150,
    options: [],
    variants: [],
    images: [],
    tags: ['꿀', '제주', '천연'],
  },
  {
    name: '데일리 프로틴바 12개입',
    description: '단백질 20g 함유 고단백 프로틴바. 초코/바닐라/베리 3가지 맛 구성. 운동 전후 간편한 단백질 보충.',
    price: 24000,
    originalPrice: 30000,
    categorySlug: 'food',
    status: 'active',
    isFeatured: true,
    isNew: false,
    sku: 'BAR-PRO-001',
    stock: 900,
    options: [],
    variants: [],
    images: [],
    tags: ['프로틴', '단백질', '운동'],
  },
  // 생활용품
  {
    name: '프리미엄 섬유유연제 2.5L',
    description: '은은한 플로럴 향기가 24시간 지속됩니다. 정전기 방지, 세탁물 보호 기능. 피부 테스트 완료.',
    price: 12000,
    originalPrice: 15000,
    categorySlug: 'living',
    status: 'active',
    isFeatured: false,
    isNew: false,
    sku: 'FAB-SOFT-001',
    stock: 1200,
    options: [],
    variants: [],
    images: [],
    tags: ['섬유유연제', '세탁', '생활'],
  },
  {
    name: '자연유래 주방세제 1L',
    description: '코코넛 유래 계면활성제 99% 사용. 과일/야채 세정도 가능한 안심 주방세제. 강력한 기름때 제거.',
    price: 8500,
    originalPrice: 10000,
    categorySlug: 'living',
    status: 'active',
    isFeatured: false,
    isNew: true,
    sku: 'DISH-NAT-001',
    stock: 2000,
    options: [],
    variants: [],
    images: [],
    tags: ['주방세제', '친환경', '자연유래'],
  },
  // 헤어/바디케어
  {
    name: '두피 클리닉 탈모 샴푸 500ml',
    description: '비오틴 & 카페인 함유 두피 강화 샴푸. 약산성(pH 5.5) 저자극. 모근을 튼튼하게, 건강한 두피 환경 조성.',
    price: 22000,
    originalPrice: 28000,
    categorySlug: 'hairbody',
    status: 'active',
    isFeatured: true,
    isNew: false,
    sku: 'SHA-CLI-001',
    stock: 450,
    options: [],
    variants: [],
    images: [],
    tags: ['샴푸', '두피케어', '탈모'],
  },
  // 반려동물
  {
    name: '유기농 강아지 사료 2kg',
    description: '100% 유기농 원료로 만든 강아지 사료. 인공 첨가물/보존료 무첨가. 소화 흡수율 95% 이상.',
    price: 35000,
    originalPrice: 42000,
    categorySlug: 'pet',
    status: 'active',
    isFeatured: false,
    isNew: true,
    sku: 'PET-ORG-001',
    stock: 300,
    options: [],
    variants: [],
    images: [],
    tags: ['강아지사료', '유기농', '반려동물'],
  },
];

// ---- Demo Banners ----
const DEMO_BANNERS = [
  {
    title: '데모몰 GRAND OPEN',
    subtitle: '마켓셰어의 모든 기능을 체험해보세요',
    position: 'main',
    isActive: true,
    sortOrder: 0,
    imageUrl: '',
    linkUrl: '',
  },
  {
    title: '봄 시즌 건강 특가전',
    subtitle: '홍삼·비타민·유산균 인기상품 최대 30% OFF',
    position: 'main',
    isActive: true,
    sortOrder: 1,
    imageUrl: '',
    linkUrl: '',
  },
  {
    title: '뷰티 BEST 컬렉션',
    subtitle: '피부 타입별 맞춤 스킨케어 추천',
    position: 'main',
    isActive: true,
    sortOrder: 2,
    imageUrl: '',
    linkUrl: '',
  },
];

export default function DemoSeedPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleSeed = async () => {
    // 버튼 클릭 시점에 인증 재확인
    if (authLoading) {
      toast({ type: 'error', message: '인증 확인 중입니다. 잠시 후 다시 시도해주세요.' });
      return;
    }
    if (!user || !isAdmin) {
      toast({ type: 'error', message: '관리자 권한이 필요합니다. 로그인 상태를 확인하세요.' });
      return;
    }

    setIsSeeding(true);
    setLog([]);

    try {
      // 1. Check if demo mall already exists
      addLog('데모몰 존재 여부 확인 중...');
      const existingQuery = query(
        collection(db, 'malls'),
        where('slug', '==', DEMO_MALL.slug),
        firestoreLimit(1)
      );
      const existingSnap = await getDocs(existingQuery);

      let mallId: string;

      if (!existingSnap.empty) {
        mallId = existingSnap.docs[0].id;
        addLog(`기존 데모몰 발견 (ID: ${mallId}). 데이터를 업데이트합니다.`);

        // Update mall data
        await setDoc(doc(db, 'malls', mallId), {
          ...DEMO_MALL,
          ownerId: user.id,
          productCount: DEMO_PRODUCTS.length,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        addLog('새 데모몰 생성 중...');
        const mallDoc = doc(collection(db, 'malls'));
        mallId = mallDoc.id;

        await setDoc(mallDoc, {
          ...DEMO_MALL,
          ownerId: user.id,
          productCount: DEMO_PRODUCTS.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Add mall ID to user's ownedMallIds
        const { updateDoc, arrayUnion } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.id), {
          ownedMallIds: arrayUnion(mallId),
        });
      }
      addLog(`✓ 데모몰 준비 완료 (ID: ${mallId})`);

      // 2. Create categories
      addLog('카테고리 생성 중...');
      const categoryIdMap: Record<string, string> = {};

      for (const cat of DEMO_CATEGORIES) {
        const catDoc = doc(collection(db, 'malls', mallId, 'categories'));
        await setDoc(catDoc, {
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          sortOrder: cat.sortOrder,
          productCount: DEMO_PRODUCTS.filter((p) => p.categorySlug === cat.slug).length,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        categoryIdMap[cat.slug] = catDoc.id;
      }
      addLog(`✓ ${DEMO_CATEGORIES.length}개 카테고리 생성 완료`);

      // 3. Create products
      addLog('상품 생성 중...');
      let createdCount = 0;

      for (const product of DEMO_PRODUCTS) {
        const categoryId = categoryIdMap[product.categorySlug] || '';
        const productData = {
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          categoryId,
          mallId,
          status: product.status,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          sku: product.sku,
          stock: product.stock,
          options: product.options,
          variants: product.variants,
          images: product.images,
          tags: product.tags,
          viewCount: Math.floor(Math.random() * 500) + 50,
          salesCount: Math.floor(Math.random() * 100) + 5,
          reviewCount: Math.floor(Math.random() * 30),
          averageRating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
          sourceType: 'own',
          isSharedToNetwork: false,
          networkVisibility: 'none',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          publishedAt: serverTimestamp(),
        };

        // Write to mall subcollection
        const prodDoc = await addDoc(
          collection(db, 'malls', mallId, 'products'),
          productData
        );

        // Write to aggregate collection
        try {
          await addDoc(collection(db, 'products_aggregate'), {
            ...productData,
            originalId: prodDoc.id,
          });
        } catch {
          // Aggregate write may fail due to Firestore rules - that's OK
        }

        createdCount++;
      }
      addLog(`✓ ${createdCount}개 상품 생성 완료`);

      // 4. Create banners
      addLog('배너 생성 중...');
      for (const banner of DEMO_BANNERS) {
        await addDoc(collection(db, 'malls', mallId, 'banners'), {
          ...banner,
          startDate: null,
          endDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      addLog(`✓ ${DEMO_BANNERS.length}개 배너 생성 완료`);

      // 5. Done
      addLog('');
      addLog('🎉 데모몰 시딩 완료!');
      addLog(`➜ 사용자 데모: /malls/${DEMO_MALL.slug}`);
      addLog(`➜ 관리자 데모: /mall-admin (로그인 후 접근)`);

      toast({ type: 'success', message: '데모몰 데이터 시딩이 완료되었습니다!' });
    } catch (error: any) {
      addLog(`✗ 오류 발생: ${error.message}`);
      toast({ type: 'error', message: `시딩 실패: ${error.message}` });
    } finally {
      setIsSeeding(false);
    }
  };

  // 인증 상태 표시 (가드가 아닌 안내 용도)
  const authStatusText = authLoading
    ? '인증 확인 중...'
    : user
      ? `${user.email} (${isAdmin ? '관리자' : user.role})`
      : '로그인되지 않음';

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">데모몰 데이터 시딩</h1>
        <p className="mt-2 text-sm text-gray-500">
          방문자가 체험할 수 있는 데모 쇼핑몰을 생성합니다.
          카테고리, 상품, 배너가 자동으로 생성됩니다.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          현재 계정: {authStatusText}
        </p>

        {/* Preview */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">생성될 데이터</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="text-2xl font-bold text-blue-600">{DEMO_CATEGORIES.length}</div>
              <div className="mt-1 text-xs text-blue-500">카테고리</div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <div className="text-2xl font-bold text-emerald-600">{DEMO_PRODUCTS.length}</div>
              <div className="mt-1 text-xs text-emerald-500">상품</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <div className="text-2xl font-bold text-purple-600">{DEMO_BANNERS.length}</div>
              <div className="mt-1 text-xs text-purple-500">배너</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p><strong>몰 이름:</strong> {DEMO_MALL.name}</p>
            <p><strong>URL:</strong> /malls/{DEMO_MALL.slug}</p>
            <p><strong>요금제:</strong> Enterprise</p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleSeed}
          disabled={isSeeding || authLoading}
          className="mt-6 w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {authLoading ? '인증 확인 중...' : isSeeding ? '시딩 진행 중...' : '데모몰 생성 시작'}
        </button>

        {/* Log */}
        {log.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-900 p-4">
            <h3 className="mb-2 text-xs font-semibold text-gray-400">진행 로그</h3>
            <div className="space-y-1 font-mono text-xs">
              {log.map((line, i) => (
                <p
                  key={i}
                  className={
                    line.includes('✓') ? 'text-emerald-400' :
                    line.includes('✗') ? 'text-red-400' :
                    line.includes('🎉') ? 'text-amber-400 font-bold' :
                    line.includes('➜') ? 'text-cyan-400' :
                    'text-gray-300'
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="mt-6 flex gap-3">
          <a
            href={`/malls/${DEMO_MALL.slug}`}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            사용자 데모 보기
          </a>
          <a
            href="/mall-admin"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            관리자 데모 보기
          </a>
          <a
            href="/admin"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            관리자로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
