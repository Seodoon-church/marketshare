'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { SmartCTALink } from '@/components/common/SmartCTALink';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  CheckIcon,
  XMarkIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Pricing data (hardcoded to avoid external dependency issues)
// ---------------------------------------------------------------------------

type Feature = {
  text: string;
  included: boolean;
};

type DetailItem = { label: string; value: string };

type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: Feature[];
  details: DetailItem[];
  cta: string;
  highlighted: boolean;
  commission: string;
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: '처음 시작하는 소규모 셀러를 위한 플랜',
    monthlyPrice: 0,
    yearlyPrice: 0,
    commission: '5%',
    cta: '무료로 시작',
    highlighted: false,
    features: [
      { text: '상품 30개', included: true },
      { text: '스토리지 500MB', included: true },
      { text: '기본 테마 1종', included: true },
      { text: '서브도메인', included: true },
      { text: '메인 마켓 기본 노출', included: true },
      { text: '기본 통계', included: true },
      { text: '커스텀 도메인', included: false },
      { text: '쿠폰/적립금', included: false },
      { text: '마케팅 도구', included: false },
    ],
    details: [
      { label: '판매수수료', value: '5%' },
      { label: '상품 등록', value: '최대 30개' },
      { label: '스토리지', value: '500MB' },
      { label: '테마', value: '기본 테마 1종' },
      { label: '도메인', value: '서브도메인만' },
      { label: '관리자 계정', value: '1명' },
      { label: '통계', value: '기본 통계 (일매출, 주문수)' },
      { label: '고객 지원', value: '이메일 지원' },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: '본격적으로 성장하는 셀러를 위한 플랜',
    monthlyPrice: 19900,
    yearlyPrice: 15900,
    commission: '3%',
    cta: '14일 무료 체험',
    highlighted: false,
    features: [
      { text: '상품 500개', included: true },
      { text: '스토리지 5GB', included: true },
      { text: '전체 테마 5종', included: true },
      { text: '커스텀 도메인 1개', included: true },
      { text: '메인 마켓 추천 노출', included: true },
      { text: '상세 통계', included: true },
      { text: '쿠폰/적립금', included: true },
      { text: '관리자 3명', included: true },
      { text: 'SEO 도구', included: true },
      { text: '마케팅 도구', included: false },
      { text: 'API 접근', included: false },
    ],
    details: [
      { label: '판매수수료', value: '3%' },
      { label: '상품 등록', value: '최대 500개' },
      { label: '스토리지', value: '5GB' },
      { label: '테마', value: '전체 테마 5종' },
      { label: '도메인', value: '커스텀 도메인 1개' },
      { label: '관리자 계정', value: '3명' },
      { label: '통계', value: '상세 통계 (카테고리별, 기간별)' },
      { label: '쿠폰/적립금', value: '무제한 발행' },
      { label: 'SEO', value: '메타태그, 사이트맵 자동 생성' },
      { label: '고객 지원', value: '이메일 + 채팅 지원' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: '전문 쇼핑몰 운영을 위한 올인원 플랜',
    monthlyPrice: 39900,
    yearlyPrice: 29900,
    commission: '1.5%',
    cta: '14일 무료 체험',
    highlighted: true,
    features: [
      { text: '상품 무제한', included: true },
      { text: '스토리지 30GB', included: true },
      { text: '테마 + CSS 커스텀', included: true },
      { text: '커스텀 도메인 3개', included: true },
      { text: '메인 마켓 프리미엄 노출', included: true },
      { text: '고급 통계', included: true },
      { text: '쿠폰/적립금', included: true },
      { text: '관리자 10명', included: true },
      { text: 'SEO + 마케팅 도구', included: true },
      { text: '공급사 관리', included: true },
      { text: '개별 PG 선택 가능', included: true },
      { text: 'API 접근', included: false },
      { text: '하위 분양', included: false },
    ],
    details: [
      { label: '판매수수료', value: '1.5%' },
      { label: '상품 등록', value: '무제한' },
      { label: '스토리지', value: '30GB' },
      { label: '테마', value: '전체 테마 + CSS 커스텀' },
      { label: '도메인', value: '커스텀 도메인 3개' },
      { label: '관리자 계정', value: '10명' },
      { label: '통계', value: '고급 통계 (매출 예측, 고객 분석)' },
      { label: '쿠폰/적립금', value: '무제한 + 자동 발행' },
      { label: 'SEO + 마케팅', value: '전체 도구 이용 가능' },
      { label: 'PG 설정', value: '개별 PG사 선택 가능' },
      { label: '공급사 관리', value: 'B2B 공급사 포탈' },
      { label: '고객 지원', value: '전화 + 채팅 + 이메일' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '대규모 플랫폼 사업자를 위한 맞춤 플랜',
    monthlyPrice: 99000,
    yearlyPrice: 79000,
    commission: '0.5%',
    cta: '14일 무료 체험',
    highlighted: false,
    features: [
      { text: '모든 Business 기능 포함', included: true },
      { text: '상품/스토리지/도메인/관리자 무제한', included: true },
      { text: '최상위 마켓 노출', included: true },
      { text: '완전 커스텀 디자인', included: true },
      { text: '하위 분양 시스템', included: true },
      { text: 'API 접근', included: true },
      { text: '전담 매니저', included: true },
    ],
    details: [
      { label: '판매수수료', value: '0.5%' },
      { label: '상품 등록', value: '무제한' },
      { label: '스토리지', value: '무제한' },
      { label: '테마', value: '완전 커스텀 디자인' },
      { label: '도메인', value: '무제한' },
      { label: '관리자 계정', value: '무제한' },
      { label: '통계', value: '엔터프라이즈 분석 + 리포트' },
      { label: '하위 분양', value: '하위 몰 분양 시스템' },
      { label: 'API', value: 'REST API 전체 접근' },
      { label: 'PG 설정', value: '개별 PG + 에스크로' },
      { label: '공급사 관리', value: 'B2B 포탈 + 자동 발주' },
      { label: '전담 매니저', value: '1:1 전담 매니저 배정' },
      { label: '고객 지원', value: '24/7 프리미엄 지원' },
    ],
  },
];

const testimonials = [
  {
    quote:
      'MarketShare 덕분에 쇼핑몰 개설부터 운영까지 정말 간편했어요. 쿠팡에서 넘어왔는데 수수료가 합리적이라 마진이 눈에 띄게 좋아졌습니다.',
    author: '김서연',
    role: '패션 쇼핑몰 운영 3년차',
  },
  {
    quote:
      '분양몰 시스템이 정말 혁신적이에요. 하위 몰을 개설해서 지역별로 운영하니 매출이 2배 이상 늘었습니다. Enterprise 플랜 강력 추천합니다.',
    author: '박준혁',
    role: '식품 유통 대표',
  },
  {
    quote:
      'Starter 플랜으로 시작했는데 3개월 만에 Business로 업그레이드했어요. 마케팅 도구와 통계 기능이 정말 강력합니다.',
    author: '이하은',
    role: '뷰티 브랜드 마케터',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function discountPercent(monthly: number, yearly: number): number {
  if (monthly === 0) return 0;
  return Math.round(((monthly - yearly) / monthly) * 100);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* ----------------------------------------------------------------- */}
        {/* Hero Section                                                      */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark py-20 md:py-28">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4 text-center">
            <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
              합리적인 요금, 확실한 성장
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
              무료로 시작하고, 성장에 맞춰 업그레이드하세요. 모든 유료 플랜 14일 무료 체험.
            </p>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Billing Toggle                                                    */}
        {/* ----------------------------------------------------------------- */}
        <section className="relative -mt-6 z-10">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-lg shadow-black/5">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    !isYearly
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  월간 결제
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    isYearly
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  연간 결제
                </button>
              </div>
              {isYearly && (
                <Badge variant="success" className="animate-fadeIn">
                  최대 25% 할인
                </Badge>
              )}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Pricing Cards                                                     */}
        {/* ----------------------------------------------------------------- */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => {
                const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                const discount = discountPercent(plan.monthlyPrice, plan.yearlyPrice);
                const showDiscount = isYearly && discount > 0;

                return (
                  <Card
                    key={plan.id}
                    hover
                    padding="none"
                    className={`relative flex flex-col overflow-visible ${
                      plan.highlighted
                        ? 'border-2 border-primary shadow-xl shadow-primary/10 lg:scale-105 z-10'
                        : ''
                    }`}
                  >
                    {/* Popular badge */}
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-white shadow-md px-4 py-1">
                          인기
                        </Badge>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      {/* Plan name & description */}
                      <div className="mb-5">
                        <h3 className="text-lg font-bold text-gray-900">
                          {plan.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {plan.description}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        {showDiscount && (
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(plan.monthlyPrice)}원
                            </span>
                            <Badge variant="danger" className="text-[10px]">
                              -{discount}%
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                            {price === 0 ? '0' : formatPrice(price)}
                          </span>
                          <span className="mb-1 text-sm font-medium text-gray-500">
                            원/월
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mb-6">
                        <SmartCTALink>
                          <Button
                            variant={plan.highlighted ? 'default' : plan.id === 'free' ? 'default' : 'outline'}
                            fullWidth
                            size="lg"
                          >
                            {plan.cta}
                          </Button>
                        </SmartCTALink>
                      </div>

                      {/* Feature list */}
                      <ul className="flex-1 space-y-2.5">
                        {plan.features.map((feature) => (
                          <li key={feature.text} className="flex items-start gap-2.5">
                            {feature.included ? (
                              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                            ) : (
                              <XMarkIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" />
                            )}
                            <span
                              className={`text-sm ${
                                feature.included ? 'text-gray-700' : 'text-gray-400'
                              }`}
                            >
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Detail toggle */}
                      <button
                        onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                        className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-100 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                      >
                        {expandedPlan === plan.id ? (
                          <>접기 <ChevronUpIcon className="h-3.5 w-3.5" /></>
                        ) : (
                          <>자세히 보기 <ChevronDownIcon className="h-3.5 w-3.5" /></>
                        )}
                      </button>

                      {/* Detail panel */}
                      {expandedPlan === plan.id && (
                        <div className="mt-3 space-y-2 rounded-xl bg-gray-50/80 p-4 animate-fadeIn">
                          {plan.details.map((d) => (
                            <div key={d.label} className="flex items-start justify-between gap-2 text-xs">
                              <span className="text-gray-500 flex-shrink-0">{d.label}</span>
                              <span className="text-right font-medium text-gray-800">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Commission Comparison                                             */}
        {/* ----------------------------------------------------------------- */}
        <section className="border-y border-gray-100 bg-gray-50/60 py-14 md:py-20">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 md:text-3xl">
              판매수수료 비교
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-center text-sm text-gray-500">
              메인 마켓 노출의 대가로, 쿠팡(6~12%)보다 합리적인 수수료
            </p>

            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-600 sm:px-6">
                      항목
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className={`px-3 py-3.5 text-center font-semibold sm:px-5 ${
                          plan.highlighted ? 'text-primary' : 'text-gray-600'
                        }`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-4 font-medium text-gray-700 sm:px-6">
                      판매수수료
                    </td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`px-3 py-4 text-center font-semibold sm:px-5 ${
                          plan.highlighted ? 'text-primary' : 'text-gray-900'
                        }`}
                      >
                        {plan.commission}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Trust / Social Proof                                              */}
        {/* ----------------------------------------------------------------- */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            {/* Stat headline */}
            <div className="mb-12 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5">
                <UserGroupIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  1,000+ 사업자
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                1,000+ 사업자가 MarketShare와 함께합니다
              </h2>
            </div>

            {/* Testimonials */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Card key={i} hover padding="lg" className="flex flex-col">
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <StarIcon
                        key={si}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-gray-600">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                      {t.author[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t.author}
                      </p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Bottom CTA                                                        */}
        {/* ----------------------------------------------------------------- */}
        <section className="border-t border-gray-100 bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark py-20">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4 text-center">
            <ShieldCheckIcon className="mx-auto mb-4 h-10 w-10 text-primary-light" />
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              지금 바로 시작하세요
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-gray-400">
              복잡한 절차 없이, 지금 바로 무료로 시작할 수 있습니다. 성장에 맞춰 언제든 업그레이드하세요.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <SmartCTALink>
                <Button size="xl" className="px-10">
                  무료로 시작하기
                </Button>
              </SmartCTALink>
              <Button href="/franchise" variant="outline" size="xl" className="border-white/20 bg-white/5 px-10 text-white hover:bg-white/10 hover:border-white/30">
                영업팀 문의
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
