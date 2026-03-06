'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50">
      {/* Main Footer */}
      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
                <span className="text-sm font-bold text-white">M</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                Market<span className="text-primary">Share</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              나만의 쇼핑몰을 5초만에 개설하세요.
              분양몰 특화 전자상거래 플랫폼.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">쇼핑</h4>
            <ul className="space-y-2.5">
              {['전체상품', '베스트', '신상품', '특가할인', '브랜드'].map((item) => (
                <li key={item}>
                  <Link href="/products" className="text-sm text-gray-500 transition-colors hover:text-primary">
                    {item}
                  </Link>
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
                { label: '이용안내', href: '/guide' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-gray-500 transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">고객지원</h4>
            <ul className="space-y-2.5">
              {[
                { label: '공지사항', href: '/board/notice' },
                { label: 'FAQ', href: '/board/faq' },
                { label: '1:1 문의', href: '/board/qna' },
                { label: '이용약관', href: '/terms' },
                { label: '개인정보처리방침', href: '/privacy' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-gray-500 transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact & Payment */}
        <div className="mt-10 flex flex-col gap-6 border-t border-gray-200 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">고객센터 1588-0000</p>
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

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-4">
          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} MarketShare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
