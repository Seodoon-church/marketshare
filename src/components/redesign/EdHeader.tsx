'use client';

import { IconSearch, IconUser, IconCart } from './icons';

interface EdHeaderProps {
  currentPath?: string;
}

export function EdHeader({ currentPath }: EdHeaderProps) {
  const navItems = [
    { label: '상가 둘러보기', href: '/shop' },
    { label: '분양 안내', href: '/franchise' },
    { label: '판매자 센터', href: '/mall-admin' },
    { label: '고객지원', href: '/support' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper/92 backdrop-blur-[12px] border-b border-ink">
      {/* Mobile Header */}
      <div className="md:hidden px-[18px] pt-[10px]">
        <div className="flex items-center justify-between pb-[10px]">
          <a href="/" className="flex items-center gap-[9px]">
            <div className="w-6 h-6 border border-ink rounded-full flex items-center justify-center">
              <div className="w-[9px] h-[9px] bg-jade rounded-full" />
            </div>
            <span className="font-serif text-[18px] font-bold tracking-tight text-ink">마켓셰어</span>
          </a>
          <div className="flex items-center gap-[15px]">
            <a href="/search" className="flex"><IconSearch size={18} className="text-ink" /></a>
            <a href="/cart" className="flex"><IconCart size={18} className="text-ink" /></a>
            <a href="/mypage" className="flex"><IconUser size={18} className="text-ink" /></a>
          </div>
        </div>
        <div className="flex items-center py-[7px] border-t border-ink border-b border-b-[#E3DACA]">
          <span className="font-mono text-[10px] tracking-[.16em] text-ink">디지털 상가 · 분양 안내소</span>
          <div className="flex-1" />
          <span className="font-mono text-[10px] tracking-[.1em] text-[#8A7C68]">VOL.04 — 2026</span>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="max-w-[1280px] mx-auto h-[72px] px-10 flex items-center gap-9">
          <a href="/" className="flex items-center gap-[10px]">
            <div className="w-[26px] h-[26px] border-[1.5px] border-ink rounded-full flex items-center justify-center">
              <div className="w-[10px] h-[10px] bg-jade rounded-full" />
            </div>
            <span className="font-serif text-[21px] font-bold text-ink">마켓셰어</span>
          </a>
          <nav className="flex gap-7 text-[14.5px] font-semibold">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`no-underline transition-colors ${
                  currentPath === item.href ? 'text-brass' : 'text-[#3A3024] hover:text-brass'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-5">
            <a href="/search"><IconSearch size={19} className="text-ink" /></a>
            <a href="/auth/login" className="text-sm font-semibold text-[#3A3024]">로그인</a>
            <a href="/franchise" className="bg-ink text-paper border-none text-sm font-bold py-[11px] px-5 inline-block">분양 신청</a>
          </div>
        </div>
      </div>
    </header>
  );
}
