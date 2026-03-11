import type { PricingPlan, FranchiseCondition } from '@/types';

// ============================================
// MarketShare - 분양 요금제 데이터
// ============================================

export const PRICING_PLANS: PricingPlan[] = [
  // ---- Free ----
  {
    id: 'free',
    name: '무료',
    nameEn: 'Free',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlyDiscount: 0,
    salesCommission: 5.0,
    maxProducts: 30,
    storageGB: 0.5,
    availableThemes: 1,
    customDomains: 0,
    maxAdmins: 1,
    features: [
      { label: '기본 테마 1종', included: true },
      { label: '서브도메인 제공', included: true },
      { label: '기본 통계 (일별 방문자, 매출)', included: true },
      { label: '공지사항, 상품후기 게시판', included: true },
      { label: '메인 마켓 기본 노출', included: true },
      { label: '플랫폼 통합 PG', included: true },
      { label: '커스텀 도메인', included: false },
      { label: '쿠폰/적립금', included: false },
      { label: '마케팅 도구', included: false },
      { label: 'API 접근', included: false },
    ],
    mainMarketExposure: 'basic',
    pgPaymentAuth: 'platform',
    allowSubFranchise: false,
    marketingTools: false,
    apiAccess: false,
  },

  // ---- Starter ----
  {
    id: 'starter',
    name: '스타터',
    nameEn: 'Starter',
    monthlyPrice: 19900,
    yearlyMonthlyPrice: 15900,
    yearlyDiscount: 20,
    salesCommission: 3.0,
    maxProducts: 500,
    storageGB: 5,
    availableThemes: 5,
    customDomains: 1,
    maxAdmins: 3,
    features: [
      { label: '전체 5종 테마', included: true },
      { label: '커스텀 도메인 1개', included: true },
      { label: '상세 통계 (유입 경로, 전환율)', included: true },
      { label: '공지, 후기, FAQ, Q&A 게시판', included: true },
      { label: '메인 마켓 추천 영역 노출', included: true },
      { label: '쿠폰/적립금', included: true },
      { label: 'SEO 도구', included: true },
      { label: 'MarketShare 로고 제거', included: true },
      { label: '마케팅 도구', included: false },
      { label: 'API 접근', included: false },
    ],
    mainMarketExposure: 'recommended',
    pgPaymentAuth: 'platform',
    allowSubFranchise: false,
    marketingTools: false,
    apiAccess: false,
  },

  // ---- Business ----
  {
    id: 'business',
    name: '비즈니스',
    nameEn: 'Business',
    monthlyPrice: 39900,
    yearlyMonthlyPrice: 29900,
    yearlyDiscount: 25,
    salesCommission: 1.5,
    maxProducts: null,
    storageGB: 30,
    availableThemes: null,
    customDomains: 3,
    maxAdmins: 10,
    features: [
      { label: '전체 테마 + CSS 커스터마이징', included: true },
      { label: '커스텀 도메인 3개', included: true },
      { label: '고급 통계 (코호트, 세그먼트, 예측)', included: true },
      { label: '전체 게시판 + 자유게시판', included: true },
      { label: '프리미엄 마켓 노출 + 배너', included: true },
      { label: '쿠폰/적립금 + 등급별 가격', included: true },
      { label: '고급 SEO + 마케팅 도구', included: true },
      { label: '공급사 관리', included: true },
      { label: '폐쇄몰/승인몰', included: true },
      { label: 'API 접근', included: false },
    ],
    mainMarketExposure: 'premium',
    pgPaymentAuth: 'individual',
    allowSubFranchise: false,
    marketingTools: true,
    apiAccess: false,
    isPopular: true,
  },

  // ---- Enterprise ----
  {
    id: 'enterprise',
    name: '엔터프라이즈',
    nameEn: 'Enterprise',
    monthlyPrice: 99000,
    yearlyMonthlyPrice: 79000,
    yearlyDiscount: 20,
    salesCommission: 0.5,
    maxProducts: null,
    storageGB: 100,
    availableThemes: null,
    customDomains: null,
    maxAdmins: null,
    features: [
      { label: '완전 커스텀 디자인', included: true },
      { label: '무제한 커스텀 도메인', included: true },
      { label: '엔터프라이즈 통계 + API 연동', included: true },
      { label: '무제한 게시판', included: true },
      { label: '최상위 마켓 노출 + 기획전', included: true },
      { label: '무제한 등급 + 무제한 공급사', included: true },
      { label: '전체 SEO + 구조화 데이터', included: true },
      { label: '마케팅 무제한 (이메일, SMS, 알림톡)', included: true },
      { label: '하위 분양 시스템', included: true },
      { label: 'API 접근 + 전담 매니저', included: true },
    ],
    mainMarketExposure: 'top',
    pgPaymentAuth: 'selective',
    allowSubFranchise: true,
    marketingTools: true,
    apiAccess: true,
  },
];

// ============================================
// 분양 조건 (플랜별)
// ============================================

export const FRANCHISE_CONDITIONS: FranchiseCondition[] = [
  {
    planId: 'free',
    requireBusinessLicense: false,
    requireIdentityVerification: true,
    requiredDocuments: ['본인 인증 (휴대폰)'],
    approvalType: 'instant',
    approvalDays: 0,
  },
  {
    planId: 'starter',
    requireBusinessLicense: true,
    requireIdentityVerification: true,
    requiredDocuments: [
      '본인 인증 (휴대폰)',
      '사업자등록증 사본',
      '통신판매업 신고증',
      '대표자 신분증 사본',
      '정산용 통장 사본',
    ],
    approvalType: 'review',
    approvalDays: 2,
  },
  {
    planId: 'business',
    requireBusinessLicense: true,
    requireIdentityVerification: true,
    requiredDocuments: [
      '본인 인증 (휴대폰)',
      '사업자등록증 사본',
      '통신판매업 신고증',
      '대표자 신분증 사본',
      '정산용 통장 사본',
      '인감증명서 (선택)',
    ],
    approvalType: 'review',
    approvalDays: 2,
  },
  {
    planId: 'enterprise',
    requireBusinessLicense: true,
    requireIdentityVerification: true,
    requiredDocuments: [
      '본인 인증 (휴대폰)',
      '사업자등록증 사본',
      '통신판매업 신고증',
      '대표자 신분증 사본',
      '정산용 통장 사본',
      '인감증명서',
    ],
    approvalType: 'review',
    approvalDays: 2,
  },
];

// ============================================
// PG 수수료율
// ============================================

export const PG_FEES = {
  card: { label: '신용카드', rate: 2.5, note: 'VAT 별도' },
  kakaopay: { label: '카카오페이', rate: 2.5, note: '간편결제' },
  naverpay: { label: '네이버페이', rate: 2.8, note: '간편결제' },
  bank_transfer: { label: '계좌이체', rate: 1.5, note: '최저 200원' },
  virtual_account: { label: '가상계좌', rate: 0, note: '건당 300원' },
  phone: { label: '휴대폰결제', rate: 3.5, note: '소액결제' },
} as const;

// ============================================
// 정산 규칙
// ============================================

export const SETTLEMENT_INFO = {
  cyclePerMonth: 2,
  periods: [
    { range: '1일 ~ 15일', settlementDate: '당월 25일' },
    { range: '16일 ~ 말일', settlementDate: '익월 10일' },
  ],
  formula: '총 매출 - 판매수수료 - PG수수료 - 추천수수료 = 정산금액',
  minimumAmount: 10000,
  accountRequirement: '사업자 명의 계좌만 가능 (개인사업자 포함)',
  example: {
    productPrice: 100000,
    shippingFee: 3000,
    pgFeeRate: 2.5,
    pgFee: 2500,
    salesCommissionRate: 1.5,
    salesCommission: 1500,
    referralCommissionRate: 0.5,
    referralCommission: 500,
    settlementAmount: 98500,
  },
} as const;

// ============================================
// 판매 제한 품목
// ============================================

export const RESTRICTED_ITEMS: string[] = [
  '의약품, 마약류, 전문의약품',
  '무기, 총기, 도검류',
  '위조/모조품, 불법 복제물',
  '음란물, 불법 도박 관련 상품',
  '개인정보, 계정 거래',
  '관련 법령에 위반되는 상품',
];
