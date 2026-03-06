'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { getAllThemes } from '@/lib/themes/theme-registry';
import {
  CheckCircleIcon,
  RocketLaunchIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const themes = getAllThemes();

export default function FranchisePage() {
  const [selectedTheme, setSelectedTheme] = useState('shop');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessNumber: '',
    desiredMallName: '',
    desiredSubdomain: '',
    industry: '',
    message: '',
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const themeColors: Record<string, string> = {
    basic: 'from-blue-500 to-cyan-500',
    shop: 'from-gray-800 to-gray-900',
    company: 'from-blue-700 to-blue-900',
    restaurant: 'from-red-500 to-red-700',
    service: 'from-emerald-500 to-teal-600',
  };

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-gray-900 to-primary-dark py-20">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm mb-6">
              <RocketLaunchIcon className="h-4 w-4 text-amber-400" />
              5초만에 나만의 쇼핑몰 개설
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">
              분양몰 개설 신청
            </h1>
            <p className="mt-4 text-lg text-gray-300">
              테마를 선택하고 간단한 정보만 입력하면 나만의 쇼핑몰이 바로 만들어집니다
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4">
            {/* Step 1: Theme Selection */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
                <h2 className="text-xl font-bold text-gray-900">테마 선택</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
                      selectedTheme === theme.id
                        ? 'border-primary shadow-lg shadow-primary/10'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`h-24 rounded-xl bg-gradient-to-br ${themeColors[theme.id] || 'from-gray-400 to-gray-500'} mb-4 flex items-center justify-center`}>
                      <BuildingStorefrontIcon className="h-10 w-10 text-white/80" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{theme.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{theme.description}</p>
                    {selectedTheme === theme.id && (
                      <CheckCircleIcon className="absolute right-3 top-3 h-6 w-6 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Information */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
                <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>
              </div>
              <Card>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="이름 *" placeholder="홍길동" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
                  <Input label="이메일 *" type="email" placeholder="name@example.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} required />
                  <Input label="연락처 *" type="tel" placeholder="010-0000-0000" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} required />
                  <Input label="업종" placeholder="패션, 식품, 뷰티 등" value={form.industry} onChange={(e) => updateForm('industry', e.target.value)} />
                  <Input label="사업자명" placeholder="(주)마이쇼핑" value={form.businessName} onChange={(e) => updateForm('businessName', e.target.value)} />
                  <Input label="사업자등록번호" placeholder="123-45-67890" value={form.businessNumber} onChange={(e) => updateForm('businessNumber', e.target.value)} />
                  <Input label="원하는 쇼핑몰 이름 *" placeholder="마이패션몰" value={form.desiredMallName} onChange={(e) => updateForm('desiredMallName', e.target.value)} required />
                  <div>
                    <Input
                      label="원하는 도메인 *"
                      placeholder="myfashion"
                      value={form.desiredSubdomain}
                      onChange={(e) => updateForm('desiredSubdomain', e.target.value.replace(/[^a-z0-9-]/g, ''))}
                      hint={form.desiredSubdomain ? `${form.desiredSubdomain}.marketshare.co.kr` : '영문 소문자, 숫자, 하이픈만 가능'}
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    추가 메시지
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                    placeholder="추가로 전달할 내용이 있으면 입력해주세요"
                    value={form.message}
                    onChange={(e) => updateForm('message', e.target.value)}
                  />
                </div>
              </Card>
            </div>

            {/* Submit */}
            <div className="text-center">
              <Button size="xl" className="px-12">
                분양 신청하기
                <ArrowRightIcon className="h-5 w-5" />
              </Button>
              <p className="mt-3 text-sm text-gray-400">
                신청 후 영업일 기준 1-2일 내 승인 결과를 알려드립니다
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
