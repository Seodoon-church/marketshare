'use client';

import { useState } from 'react';
import { Logo } from '@/components/common/Logo';
import { useToast } from '@/components/ui/Toast';

// Simple SVG icons for social links (avoiding extra deps)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function BlogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.944 12.979c-.489 0-.885.397-.885.885s.396.885.885.885.885-.396.885-.885-.396-.885-.885-.885zm-2.005-7.431c-.342-.342-.342-.895 0-1.237l1.768-1.768a.872.872 0 0 0 0-1.237.872.872 0 0 0-1.237 0l-1.768 1.768c-.342.342-.895.342-1.237 0-.342-.342-.342-.895 0-1.237L18.233.069a.872.872 0 0 0 0-1.237.872.872 0 0 0-1.237 0L4.571 11.257a4.38 4.38 0 0 0 0 6.186 4.38 4.38 0 0 0 6.186 0L23.182 5.018a.872.872 0 0 0 0-1.237.872.872 0 0 0-1.237 0l-1.768 1.768c-.343.341-.896.341-1.238-.001z"/>
    </svg>
  );
}

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-5.08 0-9.2 3.37-9.2 7.53 0 2.69 1.78 5.05 4.47 6.39l-1.14 4.16c-.1.37.32.66.64.45l4.95-3.27c.09 0 .19.01.28.01 5.08 0 9.2-3.37 9.2-7.53S17.08 3 12 3z"/>
    </svg>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast({ type: 'error', message: '올바른 이메일을 입력해주세요.' });
      return;
    }
    toast({ type: 'success', message: '뉴스레터 구독이 완료되었습니다.' });
    setEmail('');
  };

  return (
    <footer className="border-t border-gray-100 bg-gray-50/50">
      {/* Newsletter */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-10">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">뉴스레터 구독</h3>
              <p className="mt-1 text-sm text-gray-500">
                최신 소식과 프로모션 정보를 받아보세요
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full max-w-sm gap-2">
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <button
                type="submit"
                className="flex-shrink-0 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                구독
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="sm" />
            <p className="mt-3 text-sm leading-relaxed text-gray-500 max-w-xs">
              나만의 쇼핑몰을 5초만에 개설하세요.
              분양몰 특화 전자상거래 플랫폼.
            </p>

            {/* Social Links */}
            <div className="mt-5 flex items-center gap-3">
              {[
                { icon: InstagramIcon, label: 'Instagram', href: '#' },
                { icon: KakaoIcon, label: 'KakaoTalk', href: '#' },
                { icon: YoutubeIcon, label: 'YouTube', href: '#' },
                { icon: BlogIcon, label: 'Blog', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-all hover:bg-primary hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">쇼핑</h4>
            <ul className="space-y-2.5">
              {[
                { label: '전체상품', href: '/products' },
                { label: '베스트', href: '/products?sort=best' },
                { label: '신상품', href: '/products?sort=new' },
                { label: '특가할인', href: '/products?sort=sale' },
                { label: '브랜드', href: '/brands' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-gray-500 transition-colors hover:text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">서비스</h4>
            <ul className="space-y-2.5">
              {[
                { label: '분양몰 개설', href: '/franchise' },
                { label: '입점몰 보기', href: '/malls' },
                { label: '공급사 입점', href: '/supplier' },
                { label: '요금제', href: '/pricing' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-gray-500 transition-colors hover:text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">고객지원</h4>
            <ul className="space-y-2.5">
              {[
                { label: '공지사항', href: '#' },
                { label: 'FAQ', href: '#' },
                { label: '1:1 문의', href: '#' },
                { label: '이용약관', href: '#' },
                { label: '개인정보처리방침', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-gray-500 transition-colors hover:text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact & Payment */}
        <div className="mt-10 flex flex-col gap-6 border-t border-gray-200 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">고객센터 010-5630-0641</p>
            <p className="mt-1 text-xs text-gray-500">
              평일 09:00 - 18:00 (점심 12:00 - 13:00 / 주말, 공휴일 휴무)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {['이니시스', '카카오페이', '네이버페이', 'KCP', 'LG'].map((pg) => (
              <span
                key={pg}
                className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-500"
              >
                {pg}
              </span>
            ))}
          </div>
        </div>

        </div>

      {/* Legal Links Bar */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {[
              { label: '이용약관', href: '#' },
              { label: '전자금융거래 이용약관', href: '#' },
              { label: '개인정보 처리방침', href: '#', bold: true },
              { label: '청소년 보호정책', href: '#' },
              { label: '책임의 한계와 법적고지', href: '#' },
              { label: '안전거래가이드', href: '#' },
              { label: '고객센터', href: '#' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-xs transition-colors hover:text-primary ${
                  item.bold ? 'font-bold text-gray-700' : 'text-gray-500'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer + Business Info */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          {/* Intermediary Disclaimer */}
          <p className="text-[11px] leading-relaxed text-gray-400">
            마켓쉐어(는) 통신판매중개자이며, 통신판매의 당사자가 아닙니다. 상품, 상품정보, 거래에 관한 의무와 책임은 판매자에게 있습니다.
            또한 판매자와 구매자간의 직거래에 대하여 당사는 관여하지 않기 때문에 거래에 대해서는 책임을 지지 않습니다.
          </p>

          {/* Business Info */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
            <span>사업자등록번호 : 286-02-01290</span>
            <span className="text-gray-200">|</span>
            <span>통신판매업신고번호 : 제2019-화성동탄-0149호</span>
            <span className="text-gray-200">|</span>
            <span>대표이사 : 한광희</span>
            <span className="text-gray-200">|</span>
            <a href="#" className="text-gray-500 underline hover:text-primary">사업자정보확인</a>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            주소 : (우:18479) 경기도 화성시 동탄광역환승로 73 (동탄역 반도유보라 아이비파크 8.0) 206동 604호
          </p>

          {/* Customer Service Buttons */}
          <div className="mt-4 flex items-center gap-3">
            <a
              href="tel:010-5630-0641"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-primary hover:text-primary"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              전화상담 (전화 전 클릭)
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-primary hover:text-primary"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              1:1 문의
            </a>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-4">
          <p className="text-center text-[11px] text-gray-400">
            MarketShare Copyright &copy; {new Date().getFullYear()} MarketShare Corp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
