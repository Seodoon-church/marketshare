'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      {/* Top Bar */}
      <div className="hidden border-b border-gray-50 bg-gray-50/50 md:block">
        <div className="mx-auto flex h-8 max-w-[var(--content-max-width)] items-center justify-between px-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <Link href="/franchise" className="hover:text-primary transition-colors">
              분양몰 개설
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/malls" className="hover:text-primary transition-colors">
              입점몰 보기
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="font-medium text-gray-700">{user?.name}님</span>
                <Link href="/mypage" className="hover:text-primary transition-colors">마이페이지</Link>
                {(user?.role === 'mall_owner' || user?.role === 'platform_admin') && (
                  <Link href={user.role === 'platform_admin' ? '/admin' : '/mall-admin'} className="hover:text-primary transition-colors">
                    관리자
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-primary transition-colors">로그인</Link>
                <Link href="/auth/register" className="hover:text-primary transition-colors">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto flex h-16 max-w-[var(--content-max-width)] items-center justify-between px-4">
        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-md shadow-primary/25">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <span className="hidden text-xl font-bold tracking-tight text-gray-900 sm:inline">
            Market<span className="text-primary">Share</span>
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden flex-1 max-w-xl mx-8 md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="상품을 검색해보세요"
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50/50 pl-4 pr-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
            <button className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          <Link
            href="/mypage/wishlist"
            className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-500 sm:flex"
          >
            <HeartIcon className="h-5 w-5" />
          </Link>

          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          <Link
            href={isAuthenticated ? '/mypage' : '/auth/login'}
            className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 sm:flex"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="hidden border-t border-gray-50 md:block">
        <div className="mx-auto flex max-w-[var(--content-max-width)] items-center gap-1 px-4">
          {[
            { label: '전체상품', href: '/products' },
            { label: '베스트', href: '/products?sort=best' },
            { label: '신상품', href: '/products?sort=new' },
            { label: '특가할인', href: '/products?sort=sale' },
            { label: '입점몰', href: '/malls' },
            { label: '브랜드', href: '/brands' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Search */}
      {isSearchOpen && (
        <div className="border-t border-gray-100 p-3 md:hidden animate-fadeIn">
          <div className="relative">
            <input
              type="text"
              placeholder="상품을 검색해보세요"
              autoFocus
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-4 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-xl md:hidden animate-fadeIn">
          <nav className="flex flex-col p-4">
            {[
              { label: '전체상품', href: '/products' },
              { label: '베스트', href: '/products?sort=best' },
              { label: '신상품', href: '/products?sort=new' },
              { label: '특가할인', href: '/products?sort=sale' },
              { label: '입점몰', href: '/malls' },
              { label: '브랜드', href: '/brands' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2" />
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login" className="rounded-lg px-3 py-3 text-sm font-medium text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                  로그인
                </Link>
                <Link href="/auth/register" className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                  회원가입
                </Link>
              </>
            ) : (
              <>
                <Link href="/mypage" className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                  마이페이지
                </Link>
                <Link href="/franchise" className="rounded-lg px-3 py-3 text-sm font-medium text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                  분양몰 개설
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
