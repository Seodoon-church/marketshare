'use client';

import { useState, useEffect } from 'react';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { createFranchiseApplication } from '@/lib/services/franchise-service';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import type { Mall } from '@/types';
import {
  BuildingStorefrontIcon,
  CheckIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// ---- Plan Data ----

interface PlanOption {
  id: string;
  name: string;
  nameEn: string;
  monthlyPrice: number;
  commission: number;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: 'free',
    name: '무료',
    nameEn: 'Free',
    monthlyPrice: 0,
    commission: 5,
    features: ['상품 30개', '500MB 스토리지', '기본 테마 3종', '통합 PG 결제'],
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  {
    id: 'starter',
    name: '스타터',
    nameEn: 'Starter',
    monthlyPrice: 19900,
    commission: 3,
    features: ['상품 300개', '5GB 스토리지', '테마 10종', '커스텀 도메인 1개', '마케팅 도구'],
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'business',
    name: '비즈니스',
    nameEn: 'Business',
    monthlyPrice: 39900,
    commission: 1.5,
    features: ['상품 무제한', '50GB 스토리지', '전체 테마', '커스텀 도메인 3개', '개별 PG', 'API 접근'],
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/30',
  },
];

// ---- Helpers ----

function formatPrice(price: number): string {
  if (price === 0) return '0';
  return price.toLocaleString('ko-KR');
}

function isHeadquartersMall(mall: Mall): boolean {
  return (
    (mall.childMallIds && mall.childMallIds.length > 0) ||
    mall.plan === 'enterprise' ||
    mall.plan === 'Enterprise'
  );
}

// ---- Component ----

export default function FranchiseClientPage({ paramSlug }: { paramSlug: string }) {
  const mallSlug = useMallSlug(paramSlug);
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);

  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    businessName: '',
    businessNumber: '',
    desiredMallName: '',
    desiredSubdomain: '',
    industry: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow lowercase letters, numbers, and hyphens
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData((prev) => ({ ...prev, desiredSubdomain: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.applicantName ||
      !formData.applicantEmail ||
      !formData.applicantPhone ||
      !formData.businessName ||
      !formData.desiredMallName ||
      !formData.desiredSubdomain
    ) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!mall) return;

    setSubmitting(true);
    try {
      await createFranchiseApplication({
        applicantName: formData.applicantName,
        applicantEmail: formData.applicantEmail,
        applicantPhone: formData.applicantPhone,
        businessName: formData.businessName,
        businessNumber: formData.businessNumber,
        desiredTheme: selectedPlan,
        desiredMallName: formData.desiredMallName,
        desiredSubdomain: formData.desiredSubdomain,
        industry: formData.industry,
        message: formData.message,
        status: 'pending',
        adminNotes: '',
        reviewedBy: null,
        mallId: null,
        parentMallId: mall.id,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || '신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Loading ----
  if (mallLoading) {
    return <FullPageLoader message="분양 정보를 불러오는 중..." />;
  }

  // ---- Mall not found ----
  if (!mall) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center px-4 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-lg font-medium text-gray-600">쇼핑몰을 찾을 수 없습니다.</p>
        <a
          href="/"
          className="mt-4 text-sm text-primary hover:underline"
        >
          홈으로 돌아가기
        </a>
      </div>
    );
  }

  // ---- Not a headquarters mall ----
  if (!isHeadquartersMall(mall)) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center px-4 text-center">
        <BuildingStorefrontIcon className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-lg font-medium text-gray-600">
          이 몰은 가맹점 분양을 진행하지 않습니다.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          가맹점 분양은 Enterprise 플랜 이상의 본사 몰에서만 가능합니다.
        </p>
        <a
          href={`/malls/${mallSlug}`}
          className="mt-4 text-sm text-primary hover:underline"
        >
          몰 홈으로 돌아가기
        </a>
      </div>
    );
  }

  // ---- Submitted successfully ----
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-20">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">분양 신청이 완료되었습니다</h1>
            <p className="mt-3 text-gray-500">
              신청 내용을 검토한 후 입력하신 이메일({formData.applicantEmail})로 결과를 안내드리겠습니다.
              심사는 영업일 기준 1~3일 소요됩니다.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={`/malls/${mallSlug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                몰 홈으로 돌아가기
              </a>
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                마켓셰어 홈
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Main form ----
  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-12 text-center md:py-16">
          {mall.logoUrl && (
            <img
              src={mall.logoUrl}
              alt={mall.name}
              className="mx-auto mb-4 h-14 w-14 rounded-xl object-contain bg-white/10 p-1"
            />
          )}
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {mall.name} 가맹점 분양 신청
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-300 md:text-base">
            {mall.description || `${mall.name}의 가맹점이 되어 함께 성장하세요.`}
          </p>
          <a
            href={`/malls/${mallSlug}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white/90"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            몰 홈으로
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-10">
        {/* ---- Plan Selection ---- */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            요금제 선택
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            비즈니스 규모에 맞는 요금제를 선택하세요. 개설 후 언제든 변경할 수 있습니다.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLAN_OPTIONS.map((plan) => {
              const isSelected = selectedPlan === plan.id;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                    isSelected
                      ? `${plan.borderColor} ${plan.bgColor} shadow-md ring-1 ring-primary/10`
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute right-3 top-3">
                      <CheckIcon className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {plan.nameEn}
                  </p>
                  <p className={`mt-1 text-lg font-bold ${isSelected ? plan.color : 'text-gray-900'}`}>
                    {plan.name}
                  </p>

                  <div className="mt-3">
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-2xl font-extrabold text-gray-900">무료</span>
                    ) : (
                      <span className="text-2xl font-extrabold text-gray-900">
                        {formatPrice(plan.monthlyPrice)}
                        <span className="text-sm font-normal text-gray-500">원/월</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    판매 수수료 {plan.commission}%
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckIcon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>

        {/* ---- Application Form ---- */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-2">
            <DocumentTextIcon className="h-5 w-5 text-primary" />
            분양 신청서
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            아래 정보를 입력해주세요. <span className="text-red-500">*</span> 표시는 필수 항목입니다.
          </p>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* 신청자 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  신청자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="applicantEmail"
                  value={formData.applicantEmail}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="applicantPhone"
                  value={formData.applicantPhone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                />
              </div>

              {/* 사업자명 (상호) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  사업자명 (상호) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="주식회사 OO"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                />
              </div>

              {/* 사업자등록번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleChange}
                  placeholder="000-00-00000"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                />
              </div>

              {/* 업종 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  업종
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                >
                  <option value="">업종을 선택해주세요</option>
                  <option value="패션/의류">패션/의류</option>
                  <option value="뷰티/화장품">뷰티/화장품</option>
                  <option value="식품/음료">식품/음료</option>
                  <option value="생활/건강">생활/건강</option>
                  <option value="디지털/가전">디지털/가전</option>
                  <option value="스포츠/레저">스포츠/레저</option>
                  <option value="유아/아동">유아/아동</option>
                  <option value="가구/인테리어">가구/인테리어</option>
                  <option value="도서/문구">도서/문구</option>
                  <option value="반려동물">반려동물</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 희망 몰 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  희망 몰 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="desiredMallName"
                  value={formData.desiredMallName}
                  onChange={handleChange}
                  placeholder="나의 쇼핑몰"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                />
              </div>

              {/* 희망 서브도메인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  희망 서브도메인 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-0">
                  <input
                    type="text"
                    name="desiredSubdomain"
                    value={formData.desiredSubdomain}
                    onChange={handleSubdomainChange}
                    placeholder="my-shop"
                    className="w-full rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                  />
                  <span className="inline-flex items-center rounded-r-xl border border-gray-200 bg-gray-100 px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                    .marketshare.kr
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  영문 소문자, 숫자, 하이픈(-)만 사용 가능
                </p>
              </div>
            </div>

            {/* 신청 메시지 */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                신청 메시지
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="본사에 전달할 메시지가 있으시면 입력해주세요. (사업 계획, 경력, 문의사항 등)"
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
              />
            </div>

            {/* Selected Plan Summary */}
            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-600">
                선택된 요금제:{' '}
                <span className="font-bold text-gray-900">
                  {PLAN_OPTIONS.find((p) => p.id === selectedPlan)?.name ?? selectedPlan}
                </span>
                <span className="ml-2 text-gray-400">
                  ({PLAN_OPTIONS.find((p) => p.id === selectedPlan)?.commission ?? 0}% 수수료)
                </span>
              </p>
            </div>

            {/* Submit */}
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <a
                href={`/malls/${mallSlug}`}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                취소
              </a>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    신청 중...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    분양 신청하기
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
