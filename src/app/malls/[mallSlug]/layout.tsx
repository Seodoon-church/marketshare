'use client';

import React, { useState } from 'react';

import { ThemeProvider } from '@/providers/ThemeProvider';
import { getThemeDefinition } from '@/lib/themes/theme-registry';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import type { Mall, ThemeDefinition } from '@/types';
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useCartStore } from '@/store/cart-store';

// ---- 몰 헤더 ----
function MallHeader({ mall, mallSlug }: { mall: Mall; mallSlug: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemCount = useCartStore((s) =>
    s.items.filter((item) => item.mallId === mall.id).reduce((sum, i) => sum + i.quantity, 0)
  );

  const basePath = `/malls/${mallSlug}`;
  const navItems = [
    { label: '홈', href: basePath },
    { label: '상품', href: `${basePath}/products` },
    { label: '라이브', href: `${basePath}/live` },
    { label: '게시판', href: `${basePath}/board` },
    { label: '고객센터', href: `${basePath}/customer` },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-[var(--content-max-width)] px-4">
        {/* 상단: 로고 + 유틸리티 */}
        <div className="flex h-16 items-center justify-between">
          {/* 로고/몰 이름 */}
          <a href={basePath} className="flex items-center gap-2.5">
            {mall.logoUrl ? (
              <img src={mall.logoUrl} alt={mall.name} className="h-9 max-w-[140px] object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                {mall.name.charAt(0)}
              </div>
            )}
            {!mall.logoUrl && (
              <span className="text-lg font-bold text-gray-900">{mall.name}</span>
            )}
          </a>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 유틸리티 */}
          <div className="flex items-center gap-2">
            <button onClick={() => { window.location.href = basePath + '/products'; }} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <a
              href={`${basePath}/cart`}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </a>
            <button onClick={() => { window.location.href = '/mypage'; }} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <UserIcon className="h-5 w-5" />
            </button>

            {/* 모바일 메뉴 토글 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="mx-auto max-w-[var(--content-max-width)] px-4 py-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

// ---- 몰 푸터 ----
function MallFooter({ mall }: { mall: Mall }) {
  const bi = mall.businessInfo;

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-10">
        {/* 몰 이름 */}
        <div className="mb-6">
          <span className="text-lg font-bold text-gray-900">{mall.name}</span>
        </div>

        {/* 사업자 정보 */}
        <div className="grid grid-cols-1 gap-6 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <p>
              <span className="font-medium text-gray-600">상호명:</span> {bi.businessName}
            </p>
            <p>
              <span className="font-medium text-gray-600">대표자:</span> {bi.representative}
            </p>
            <p>
              <span className="font-medium text-gray-600">사업자등록번호:</span> {bi.businessNumber}
            </p>
            {bi.onlineBusinessNumber && (
              <p>
                <span className="font-medium text-gray-600">통신판매업신고:</span>{' '}
                {bi.onlineBusinessNumber}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <p>
              <span className="font-medium text-gray-600">주소:</span> {bi.address}
            </p>
            <p>
              <span className="font-medium text-gray-600">전화:</span> {bi.phone}
            </p>
            <p>
              <span className="font-medium text-gray-600">이메일:</span> {bi.email}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-gray-400 leading-relaxed">
              본 쇼핑몰은 MarketShare 프랜차이즈 플랫폼을 통해 운영됩니다.
              결제 및 개인정보 보호에 관한 사항은 플랫폼 정책을 따릅니다.
            </p>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} {mall.name}. All rights reserved.</p>
          <p className="mt-1">Powered by MarketShare</p>
        </div>
      </div>
    </footer>
  );
}

// ---- 레이아웃 ----
export default function MallLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ mallSlug: string }>;
}) {
  const { mallSlug: paramSlug } = React.use(params);
  const mallSlug = useMallSlug(paramSlug);
  const { data: mall, isLoading, error } = useMallBySlug(mallSlug);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <FullPageLoader message="쇼핑몰 정보를 불러오는 중..." />
      </div>
    );
  }

  // 에러 또는 몰 없음
  if (error || !mall) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900">쇼핑몰을 찾을 수 없습니다</h1>
        <p className="text-sm text-gray-500">
          요청하신 쇼핑몰이 존재하지 않거나 현재 이용이 중단된 상태입니다.
        </p>
        <a
          href="/"
          className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          메인으로 돌아가기
        </a>
      </div>
    );
  }

  const theme = (getThemeDefinition(mall.themeId) ?? getThemeDefinition('basic'))!;

  return (
    <ThemeProvider theme={theme} mallOverrides={mall.themeConfig}>
      <div className="flex min-h-screen flex-col">
        <MallHeader mall={mall} mallSlug={mallSlug} />
        <main className="flex-1">{children}</main>
        <MallFooter mall={mall} />
      </div>
    </ThemeProvider>
  );
}
