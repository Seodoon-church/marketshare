'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { SmartCTALink } from '@/components/common/SmartCTALink';
import {
  PRICING_PLANS,
  PG_FEES,
  SETTLEMENT_INFO,
} from '@/lib/data/pricing';
import type { PricingPlan } from '@/types';
import {
  CheckIcon,
  XMarkIcon,
  RocketLaunchIcon,
  SwatchIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// ---- helpers ----

function formatPrice(price: number): string {
  if (price === 0) return '0';
  return price.toLocaleString('ko-KR');
}

function renderLimit(value: number | null, unit?: string): string {
  if (value === null) return '무제한';
  if (value === 0) return 'X';
  return `${value}${unit ?? ''}`;
}

function exposureLabel(level: PricingPlan['mainMarketExposure']): string {
  const map: Record<string, string> = {
    basic: '기본',
    recommended: '추천 포함',
    premium: '프리미엄',
    top: '최상위',
  };
  return map[level] ?? level;
}

function pgLabel(auth: PricingPlan['pgPaymentAuth']): string {
  const map: Record<string, string> = {
    platform: '통합',
    individual: '통합/개별',
    selective: '통합/개별/선택',
  };
  return map[auth] ?? auth;
}

// ---- Section Components ----

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <CheckIcon className="mx-auto h-5 w-5 text-emerald-500" />
  ) : (
    <XMarkIcon className="mx-auto h-5 w-5 text-gray-300" />
  );
}

// ================================================================
// Page
// ================================================================

export default function FranchisePage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <>
      <Header />
      <main>
        {/* ============ Section 1 - Hero ============ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark py-24 md:py-32">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
              <RocketLaunchIcon className="h-4 w-4 text-amber-400" />
              MarketShare 분양몰
            </div>

            <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
              나만의 쇼핑몰,{' '}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                5초면 충분합니다
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300 md:text-xl">
              개설 즉시 MarketShare 메인 마켓에 상품이 노출됩니다.
              <br className="hidden md:block" />
              텅 빈 매장이 아닌, 유동인구가 있는 백화점에 입점하세요.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <SmartCTALink className={cn(buttonVariants({ size: 'xl' }), 'px-10')}>
                무료로 시작하기
                <ArrowRightIcon className="h-5 w-5" />
              </SmartCTALink>
              <a href="/pricing" className={cn(buttonVariants({ size: 'xl', variant: 'outline' }), 'border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50')}>
                요금제 비교하기
              </a>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              신용카드 없이 무료 체험 &middot; 14일 Business 등급 기능 제공
            </p>
          </div>
        </section>

        {/* ============ Section 2 - Pricing Cards ============ */}
        <section className="py-20 bg-gray-50" id="pricing">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                합리적인 요금제
              </h2>
              <p className="mt-3 text-gray-500">
                비즈니스 규모에 맞는 플랜을 선택하세요. 언제든 변경할 수 있습니다.
              </p>

              {/* Monthly / Yearly Toggle */}
              <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white p-1 shadow-sm border border-gray-200">
                <button
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    !isYearly
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setIsYearly(false)}
                >
                  월간 결제
                </button>
                <button
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    isYearly
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setIsYearly(true)}
                >
                  연간 결제
                  <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    할인
                  </span>
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {PRICING_PLANS.map((plan) => {
                const price = isYearly ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
                const isPopular = plan.isPopular;

                return (
                  <Card
                    key={plan.id}
                    hover
                    padding="none"
                    className={`relative flex flex-col ${
                      isPopular
                        ? 'border-2 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                        : ''
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-white px-3 py-1 text-xs font-bold shadow-sm">
                          인기
                        </Badge>
                      </div>
                    )}

                    <div className="p-6 pb-0">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        {plan.nameEn}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        {plan.name}
                      </h3>

                      <div className="mt-5">
                        {price === 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-gray-900">무료</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-gray-900">
                              {formatPrice(price)}
                            </span>
                            <span className="text-sm text-gray-500">원/월</span>
                          </div>
                        )}
                        {isYearly && plan.yearlyDiscount > 0 && (
                          <p className="mt-1 text-sm text-emerald-600 font-medium">
                            연 결제 {plan.yearlyDiscount}% 할인 적용
                          </p>
                        )}
                        {!isYearly && plan.yearlyDiscount > 0 && (
                          <p className="mt-1 text-sm text-gray-400">
                            연 결제 시{' '}
                            <span className="text-emerald-600 font-medium">
                              {formatPrice(plan.yearlyMonthlyPrice)}원/월
                            </span>
                          </p>
                        )}
                      </div>

                      <p className="mt-3 text-sm text-gray-500">
                        판매 수수료 {plan.salesCommission}%
                      </p>
                    </div>

                    <div className="flex-1 p-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm">
                            {feature.included ? (
                              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                            ) : (
                              <XMarkIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" />
                            )}
                            <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                              {feature.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 pt-0">
                      <SmartCTALink
                        className={cn(
                          buttonVariants({
                            size: 'lg',
                            fullWidth: true,
                            variant: isPopular ? 'default' : plan.id === 'free' ? 'secondary' : 'outline',
                          })
                        )}
                      >
                        {plan.id === 'free' ? '무료로 시작' : '시작하기'}
                      </SmartCTALink>
                    </div>
                  </Card>
                );
              })}
            </div>

            <p className="mt-8 text-center text-sm text-gray-400">
              모든 유료 플랜은 14일 무료 체험 제공 &middot; 체험 후 자동으로 Free 플랜으로 전환 (데이터 유지)
            </p>
          </div>
        </section>

        {/* ============ Section 3 - Feature Comparison Table ============ */}
        <section className="py-20">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                요금제 상세 비교
              </h2>
              <p className="mt-3 text-gray-500">
                모든 기능을 한눈에 비교해보세요
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-5 py-4 text-left font-semibold text-gray-600">항목</th>
                    {PRICING_PLANS.map((plan) => (
                      <th
                        key={plan.id}
                        className={`px-5 py-4 text-center font-semibold ${
                          plan.isPopular ? 'text-primary' : 'text-gray-600'
                        }`}
                      >
                        {plan.name}
                        {plan.isPopular && (
                          <Badge className="ml-1.5 bg-primary/10 text-primary text-[10px]">인기</Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* 월 요금 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">월 요금</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {p.monthlyPrice === 0 ? '무료' : `${formatPrice(p.monthlyPrice)}원`}
                      </td>
                    ))}
                  </tr>
                  {/* 판매수수료 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">판매 수수료</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {p.salesCommission}%
                      </td>
                    ))}
                  </tr>
                  {/* 상품 수 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">상품 수</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {renderLimit(p.maxProducts, '개')}
                      </td>
                    ))}
                  </tr>
                  {/* 스토리지 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">스토리지</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {p.storageGB < 1 ? `${p.storageGB * 1000}MB` : `${p.storageGB}GB`}
                      </td>
                    ))}
                  </tr>
                  {/* 테마 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">테마</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {p.availableThemes === null
                          ? '전체+커스텀'
                          : `${p.availableThemes}종`}
                      </td>
                    ))}
                  </tr>
                  {/* 도메인 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">커스텀 도메인</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {renderLimit(p.customDomains, '개')}
                      </td>
                    ))}
                  </tr>
                  {/* 관리자 수 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">관리자 수</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {renderLimit(p.maxAdmins, '명')}
                      </td>
                    ))}
                  </tr>
                  {/* 메인마켓 노출 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">메인 마켓 노출</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {exposureLabel(p.mainMarketExposure)}
                      </td>
                    ))}
                  </tr>
                  {/* PG방식 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">PG 방식</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center text-gray-600">
                        {pgLabel(p.pgPaymentAuth)}
                      </td>
                    ))}
                  </tr>
                  {/* 하위분양 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">하위 분양</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center">
                        <BoolCell value={p.allowSubFranchise} />
                      </td>
                    ))}
                  </tr>
                  {/* 마케팅 */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">마케팅 도구</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center">
                        <BoolCell value={p.marketingTools} />
                      </td>
                    ))}
                  </tr>
                  {/* API */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-700">API 접근</td>
                    {PRICING_PLANS.map((p) => (
                      <td key={p.id} className="px-5 py-3.5 text-center">
                        <BoolCell value={p.apiAccess} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============ Section 4 - Differentiators ============ */}
        <section className="py-20 bg-gray-50">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="text-center mb-14">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                MarketShare만의 차별점
              </h2>
              <p className="mt-3 text-gray-500">
                기존 쇼핑몰 플랫폼과는 근본적으로 다릅니다
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* 1. 메인 마켓 자동 노출 */}
              <Card hover padding="lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                  <SparklesIcon className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">메인 마켓 자동 노출</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  분양몰 개설 즉시 MarketShare 메인 마켓에 상품이 자동 노출됩니다.
                  텅 빈 매장이 아닌, 유동인구가 있는 백화점에 입점하는 효과를 제공합니다.
                </p>
              </Card>

              {/* 2. 5초 만에 개설 */}
              <Card hover padding="lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <RocketLaunchIcon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">5초 만에 개설</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  테마 선택 1초, 기본 정보 입력 4초. Free 플랜은 본인인증만으로
                  즉시 개설되며, 테마가 자동 적용되어 별도 디자인 작업이 불필요합니다.
                </p>
              </Card>

              {/* 3. 업종 특화 테마 */}
              <Card hover padding="lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                  <SwatchIcon className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">업종 특화 테마</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  쇼핑몰, 기업/브랜드, 음식점/배달, 서비스업 등 5가지 업종 특화 테마가
                  사전 구성되어 선택 즉시 완성된 쇼핑몰이 제공됩니다.
                </p>
              </Card>

              {/* 4. 통합 결제/정산 */}
              <Card hover padding="lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <CreditCardIcon className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">통합 결제/정산</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  플랫폼 통합 PG로 PG 가입비 0원, 심사 대기 없이 즉시 결제 수락 가능.
                  카드, 카카오페이, 네이버페이, 계좌이체, 휴대폰 결제 모두 지원합니다.
                </p>
              </Card>

              {/* 5. 하위 분양 시스템 */}
              <Card hover padding="lg" className="sm:col-span-2 lg:col-span-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
                  <BuildingStorefrontIcon className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">하위 분양 시스템</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Enterprise 플랜에서 자신의 몰 아래에 하위 분양몰을 생성할 수 있습니다.
                  프랜차이즈 사업, 지역 대리점 관리에 활용 가능한 고유 기능입니다.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ============ Section 5 - Settlement Info ============ */}
        <section className="py-20">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                투명한 정산 시스템
              </h2>
              <p className="mt-3 text-gray-500">
                월 2회 정산, 관리자 페이지에서 실시간 내역 조회
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Settlement Cycle */}
              <Card padding="lg">
                <h3 className="text-lg font-bold text-gray-900 mb-5">정산 주기</h3>
                <div className="space-y-4">
                  {SETTLEMENT_INFO.periods.map((period, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          매출 기간: {period.range}
                        </p>
                        <p className="text-sm text-gray-500">
                          정산일: {period.settlementDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">최소 정산 금액:</span>{' '}
                    {formatPrice(SETTLEMENT_INFO.minimumAmount)}원 (미달 시 다음 정산기로 이월)
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    {SETTLEMENT_INFO.accountRequirement}
                  </p>
                </div>
              </Card>

              {/* Settlement Example */}
              <Card padding="lg">
                <h3 className="text-lg font-bold text-gray-900 mb-5">
                  정산 계산 예시
                  <span className="ml-2 text-sm font-normal text-gray-400">Business 플랜 기준</span>
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">상품 판매가</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(SETTLEMENT_INFO.example.productPrice)}원
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">배송비 (수수료 계산 제외)</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(SETTLEMENT_INFO.example.shippingFee)}원
                    </span>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="flex justify-between px-4 py-2">
                    <span className="text-gray-500">
                      PG 수수료 (카드 {SETTLEMENT_INFO.example.pgFeeRate}%)
                    </span>
                    <span className="text-red-500">
                      -{formatPrice(SETTLEMENT_INFO.example.pgFee)}원
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-gray-500">
                      판매 수수료 ({SETTLEMENT_INFO.example.salesCommissionRate}%)
                    </span>
                    <span className="text-red-500">
                      -{formatPrice(SETTLEMENT_INFO.example.salesCommission)}원
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-gray-500">
                      추천 수수료 ({SETTLEMENT_INFO.example.referralCommissionRate}%)
                    </span>
                    <span className="text-red-500">
                      -{formatPrice(SETTLEMENT_INFO.example.referralCommission)}원
                    </span>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="flex justify-between rounded-xl bg-primary/5 px-4 py-4">
                    <span className="font-bold text-gray-900">정산 금액</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(SETTLEMENT_INFO.example.settlementAmount)}원
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* PG Fee Table */}
            <div className="mt-10">
              <Card padding="lg">
                <h3 className="text-lg font-bold text-gray-900 mb-5">
                  PG 결제 수수료 (플랫폼 통합 PG 기준)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">결제 수단</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">수수료율</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">비고</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.values(PG_FEES).map((fee) => (
                        <tr key={fee.label} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-700">{fee.label}</td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {fee.rate > 0 ? `${fee.rate}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{fee.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ============ Section 6 - FAQ ============ */}
        <section className="py-20 bg-gray-50">
          <div className="mx-auto max-w-3xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                자주 묻는 질문
              </h2>
              <p className="mt-3 text-gray-500">
                분양에 대해 궁금한 점을 확인하세요
              </p>
            </div>

            <Accordion
              allowMultiple={false}
              items={[
                {
                  title: '무료 플랜으로 정말 쇼핑몰을 운영할 수 있나요?',
                  content: (
                    <p>
                      네, 무료 플랜으로도 실제 쇼핑몰 운영이 가능합니다. 최대 30개 상품 등록,
                      500MB 스토리지, 기본 테마가 제공되며, 플랫폼 통합 PG를 통해 별도의 PG 가입 없이
                      바로 결제를 받을 수 있습니다. 다만 판매 수수료가 5%로 유료 플랜보다 높으며,
                      커스텀 도메인 연결이 불가합니다. 소규모 판매 또는 쇼핑몰 체험 용도로 적합합니다.
                    </p>
                  ),
                },
                {
                  title: '사업자등록 없이도 시작할 수 있나요?',
                  content: (
                    <p>
                      Free 플랜은 사업자등록 없이 본인 인증(휴대폰)만으로 즉시 개설할 수 있습니다.
                      다만, 실제 정산을 받으려면 개인사업자 이상의 사업자 등록이 필요합니다.
                      Starter 이상 유료 플랜은 사업자등록증, 통신판매업 신고증 등의 서류 제출이
                      필수이며, 1~2영업일 심사 후 개설됩니다.
                    </p>
                  ),
                },
                {
                  title: '요금제를 나중에 변경할 수 있나요?',
                  content: (
                    <p>
                      언제든지 요금제를 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시
                      즉시 상위 플랜의 기능이 활성화되며, 남은 기간에 대한 차액만 결제하면 됩니다.
                      다운그레이드 시 현재 결제 주기가 끝난 후 적용되며, 상위 플랜 전용 기능이
                      제한될 수 있습니다. 모든 유료 플랜은 14일 무료 체험 후 결정할 수 있습니다.
                    </p>
                  ),
                },
                {
                  title: '정산은 어떻게 받나요?',
                  content: (
                    <p>
                      월 2회 정산됩니다. 1일~15일 매출은 당월 25일에, 16일~말일 매출은 익월 10일에
                      정산됩니다. 정산 금액은 총 매출에서 판매 수수료, PG 수수료, 추천 수수료를
                      차감한 금액이며, 관리자 페이지에서 실시간으로 주문별 수수료 내역을 조회할 수
                      있습니다. 최소 정산 금액은 10,000원이며, 사업자 명의 계좌로만 입금됩니다.
                    </p>
                  ),
                },
                {
                  title: '플랫폼 통합 PG란 무엇인가요?',
                  content: (
                    <p>
                      MarketShare의 PG(결제대행) 계약을 공유하여 사용하는 방식입니다.
                      별도의 PG 가입비(보통 20만원 이상)와 심사 대기 없이, 분양몰 개설 즉시
                      신용카드, 카카오페이, 네이버페이, 계좌이체, 가상계좌, 휴대폰 결제를
                      모두 사용할 수 있습니다. Business/Enterprise 플랜에서는 직접 PG사와
                      계약하는 개별 PG 방식도 선택할 수 있어, 더 낮은 수수료 협상이 가능합니다.
                    </p>
                  ),
                },
                {
                  title: '하위 분양이 뭔가요?',
                  content: (
                    <p>
                      Enterprise 플랜 전용 기능으로, 자신의 몰 아래에 하위 분양몰을 만들 수 있는
                      시스템입니다. 예를 들어 프랜차이즈 본사가 Enterprise로 메인 몰을 운영하고,
                      각 지역 대리점을 하위 분양몰로 개설하여 통합 관리할 수 있습니다.
                      상품, 재고, 주문, 정산을 본사에서 일괄 관리하면서도 각 대리점은 독립적인
                      쇼핑몰 운영이 가능합니다.
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </section>

        {/* ============ Section 7 - CTA ============ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark py-20">
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4 text-center">
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              지금 바로 시작하세요
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              5초 만에 나만의 쇼핑몰을 개설하고, MarketShare 메인 마켓에서 수백만 고객을 만나보세요.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <SmartCTALink className={cn(buttonVariants({ size: 'xl' }), 'bg-white text-primary hover:bg-gray-100 px-10 shadow-lg')}>
                무료로 시작하기
                <ArrowRightIcon className="h-5 w-5" />
              </SmartCTALink>
            </div>
            <p className="mt-4 text-sm text-white/60">
              신용카드 등록 없이 즉시 시작 &middot; 언제든 해지 가능
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
