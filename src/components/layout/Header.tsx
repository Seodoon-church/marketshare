'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { cn } from '@/lib/utils/cn';
import { Logo } from '@/components/common/Logo';

const NAV_ITEMS = [
  { label: '전체상품', href: '/products' },
  { label: '베스트', href: '/products?sort=best' },
  { label: '신상품', href: '/products?sort=new' },
  { label: '특가할인', href: '/products?sort=sale' },
  { label: '입점몰', href: '/malls' },
  { label: '브랜드', href: '/brands' },
  { label: '요금제', href: '/pricing' },
];

const POPULAR_KEYWORDS = ['원피스', '운동화', '에어팟', '비타민', '선크림'];

const SEARCH_HISTORY_KEY = 'ms_search_history';

function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSearchHistory(query: string) {
  const history = getSearchHistory().filter((h) => h !== query);
  history.unshift(query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 8)));
}

function removeSearchHistoryItem(query: string) {
  const history = getSearchHistory().filter((h) => h !== query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch - only show auth/cart state after mount
  useEffect(() => { setMounted(true); }, []);

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Load search history
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, [isSearchFocused]);

  const handleSearch = useCallback((query?: string) => {
    const q = (query || searchQuery).trim();
    if (!q) return;
    saveSearchHistory(q);
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsSearchFocused(false);
    setIsMobileMenuOpen(false);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setIsSearchFocused(false);
  };

  const handleRemoveHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearchHistoryItem(item);
    setSearchHistory(getSearchHistory());
  };

  const showDropdown = isSearchFocused && !searchQuery;

  // Check if nav item is active
  const isActiveNav = (href: string) => {
    if (href === '/products' && pathname === '/products') return true;
    if (href.includes('?') && pathname === '/products') {
      const param = new URLSearchParams(href.split('?')[1]);
      return false; // Query params need client-side check
    }
    return pathname === href;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-xl transition-shadow duration-300',
        scrolled ? 'border-gray-200/80 shadow-sm shadow-gray-200/30' : 'border-gray-100'
      )}
    >
      {/* Top Bar */}
      <div className="hidden border-b border-gray-50 bg-gray-50/50 md:block">
        <div className="mx-auto flex h-8 max-w-[var(--content-max-width)] items-center justify-between px-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <a href="/franchise" className="hover:text-primary transition-colors">
              분양몰 개설
            </a>
            <span className="text-gray-300">|</span>
            <a href="/malls" className="hover:text-primary transition-colors">
              입점몰 보기
            </a>
          </div>
          <div className="flex items-center gap-4">
            {!mounted ? (
              <span className="inline-block w-24 h-3">&nbsp;</span>
            ) : isAuthenticated ? (
              <>
                <span className="font-medium text-gray-700">{user?.name || user?.email?.split('@')[0] || '회원'}님</span>
                <a href="/mypage" className="hover:text-primary transition-colors">마이페이지</a>
                {(user?.role === 'mall_owner' || user?.role === 'platform_admin') && (
                  <a href={user.role === 'platform_admin' ? '/admin' : '/mall-admin'} className="hover:text-primary transition-colors">
                    관리자
                  </a>
                )}
                <button onClick={logout} className="hover:text-primary transition-colors">로그아웃</button>
              </>
            ) : (
              <>
                <a href="/auth/login" className="hover:text-primary transition-colors">로그인</a>
                <a href="/auth/register" className="hover:text-primary transition-colors">회원가입</a>
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
        <Logo size="md" className="hidden sm:flex" />
        <Logo size="md" showText={false} className="sm:hidden" />

        {/* Search Bar - Desktop */}
        <div ref={searchRef} className="relative hidden flex-1 max-w-xl mx-8 md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="상품을 검색해보세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              className={cn(
                'h-10 w-full rounded-full border bg-gray-50/50 pl-4 pr-10 text-sm outline-none transition-all placeholder:text-gray-400',
                isSearchFocused
                  ? 'border-primary bg-white ring-2 ring-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            />
            <button onClick={() => handleSearch()} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-gray-200/30 animate-fadeIn z-50">
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">최근 검색어</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleSearch(item)}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                      >
                        <ClockIcon className="h-3.5 w-3.5 text-gray-300 group-hover:text-primary/50" />
                        {item}
                        <button
                          onClick={(e) => handleRemoveHistory(item, e)}
                          className="ml-0.5 rounded-full p-0.5 text-gray-300 hover:bg-gray-200 hover:text-gray-500"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Keywords */}
              <div>
                <h4 className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  <FireIcon className="h-3.5 w-3.5 text-orange-400" />
                  인기 검색어
                </h4>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_KEYWORDS.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleSearch(keyword)}
                      className="rounded-full bg-gray-50 px-3 py-1.5 text-sm text-gray-600 transition-all hover:bg-primary/5 hover:text-primary"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          <a
            href="/mypage/wishlist"
            className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-500 sm:flex"
          >
            <HeartIcon className="h-5 w-5" />
          </a>

          <a
            href="/cart"
            className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            {mounted && itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </a>

          <a
            href={mounted && isAuthenticated ? '/mypage' : '/auth/login'}
            className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 sm:flex"
          >
            <UserIcon className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="hidden border-t border-gray-50 md:block">
        <div className="mx-auto flex max-w-[var(--content-max-width)] items-center gap-1 px-4">
          {NAV_ITEMS.map((item) => {
            const active = isActiveNav(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-primary'
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary" />
                )}
              </a>
            );
          })}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-4 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <button onClick={() => handleSearch()} className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:text-primary">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-xl md:hidden animate-fadeIn">
          <nav className="flex flex-col p-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-3 text-sm font-medium',
                  isActiveNav(item.href)
                    ? 'bg-primary/5 text-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <hr className="my-2" />
            {!mounted ? null : !isAuthenticated ? (
              <>
                <a href="/auth/login" className="rounded-lg px-3 py-3 text-sm font-medium text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                  로그인
                </a>
                <a href="/auth/register" className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                  회원가입
                </a>
              </>
            ) : (
              <>
                <a href="/mypage" className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                  마이페이지
                </a>
                <a href="/franchise" className="rounded-lg px-3 py-3 text-sm font-medium text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                  분양몰 개설
                </a>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="rounded-lg px-3 py-3 text-left text-sm font-medium text-red-500">
                  로그아웃
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
