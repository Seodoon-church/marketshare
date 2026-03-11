'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types';
import {
  ClipboardDocumentListIcon,
  HeartIcon,
  ChatBubbleLeftEllipsisIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TicketIcon,
  TrophyIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

const sidebarNavItems = [
  { label: '주문내역', href: '/mypage', icon: ClipboardDocumentListIcon },
  { label: '포인트', href: '/mypage/points', icon: CurrencyDollarIcon },
  { label: '쿠폰함', href: '/mypage/coupons', icon: TicketIcon },
  { label: '회원등급', href: '/mypage/grade', icon: TrophyIcon },
  { label: '위시리스트', href: '/mypage/wishlist', icon: HeartIcon },
  { label: '리뷰 관리', href: '/mypage/reviews', icon: ChatBubbleLeftEllipsisIcon },
  { label: '1:1 문의', href: '/mypage/inquiries', icon: QuestionMarkCircleIcon },
  { label: '회원정보 수정', href: '/mypage/profile', icon: UserCircleIcon },
  { label: '배송지 관리', href: '/mypage/addresses', icon: MapPinIcon },
];

const roleLabels: Record<UserRole, string> = {
  platform_admin: '관리자',
  mall_owner: '몰 관리자',
  customer: '일반 회원',
  supplier: '공급사',
};

export function MyPageSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const isActive = (href: string) => {
    if (href === '/mypage') return pathname === '/mypage';
    return pathname.startsWith(href);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50/30">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
          {/* Mobile: horizontal scroll tabs */}
          <div className="mb-6 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {sidebarNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop: sidebar */}
            <aside className="hidden w-64 shrink-0 md:block">
              {/* User profile summary */}
              <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    {user.profileImageUrl ? (
                      <Image
                        src={user.profileImageUrl}
                        alt={user.name || '프로필'}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                        <span className="text-xl font-bold text-primary">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-gray-900">
                        {user.name || '회원'}
                      </p>
                      {user.email && (
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                      )}
                      <Badge variant="default" className="mt-1">
                        {roleLabels[user.role] || '일반 회원'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">로그인이 필요합니다</p>
                    <a
                      href="/auth/login"
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      로그인하기
                    </a>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <ul className="p-2">
                  {sidebarNavItems.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary/5 text-primary'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive(item.href) ? 'text-primary' : 'text-gray-400'}`} />
                        {item.label}
                      </a>
                    </li>
                  ))}
                  {isAuthenticated && (
                    <li className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-gray-400" />
                        로그아웃
                      </button>
                    </li>
                  )}
                </ul>
              </nav>
            </aside>

            {/* Main content */}
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
