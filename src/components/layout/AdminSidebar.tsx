'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingCartIcon,
  UsersIcon,
  TagIcon,
  SparklesIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  SwatchIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const platformAdminItems: SidebarItem[] = [
  { label: '대시보드', href: '/admin', icon: HomeIcon },
  { label: '분양몰 관리', href: '/admin/malls', icon: BuildingStorefrontIcon },
  { label: '전체 상품', href: '/admin/products', icon: CubeIcon },
  { label: '전체 주문', href: '/admin/orders', icon: ShoppingCartIcon },
  { label: '회원 관리', href: '/admin/users', icon: UsersIcon },
  { label: '카테고리', href: '/admin/categories', icon: TagIcon },
  { label: '브랜드', href: '/admin/brands', icon: SparklesIcon },
  { label: '배너 관리', href: '/admin/banners', icon: PhotoIcon },
  { label: '테마 관리', href: '/admin/themes', icon: SwatchIcon },
  { label: '게시판', href: '/admin/boards', icon: ChatBubbleLeftRightIcon },
  { label: '분양 신청', href: '/admin/franchise', icon: DocumentTextIcon },
  { label: '정산 관리', href: '/admin/payments', icon: CurrencyDollarIcon },
  { label: '통계/분석', href: '/admin/analytics', icon: ChartBarIcon },
  { label: '설정', href: '/admin/settings', icon: Cog6ToothIcon },
];

const mallAdminItems: SidebarItem[] = [
  { label: '대시보드', href: '/mall-admin', icon: HomeIcon },
  { label: '상품 관리', href: '/mall-admin/products', icon: CubeIcon },
  { label: '주문 관리', href: '/mall-admin/orders', icon: ShoppingCartIcon },
  { label: '카테고리', href: '/mall-admin/categories', icon: TagIcon },
  { label: '배너 관리', href: '/mall-admin/banners', icon: PhotoIcon },
  { label: '게시판', href: '/mall-admin/boards', icon: ChatBubbleLeftRightIcon },
  { label: '배송 관리', href: '/mall-admin/shipping', icon: TruckIcon },
  { label: '통계', href: '/mall-admin/analytics', icon: ChartBarIcon },
  { label: '몰 설정', href: '/mall-admin/settings', icon: Cog6ToothIcon },
];

interface AdminSidebarProps {
  role: 'platform_admin' | 'mall_owner';
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const items = role === 'platform_admin' ? platformAdminItems : mallAdminItems;
  const title = role === 'platform_admin' ? '플랫폼 관리' : '몰 관리';

  const sidebar = (
    <div
      className={cn(
        'flex h-full flex-col bg-white border-r border-gray-100 transition-all duration-300',
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">MarketShare</p>
              <p className="text-[10px] text-gray-400">{title}</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:block"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && item.href !== '/mall-admin' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/5 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary' : 'text-gray-400'
                    )}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      {!isCollapsed && (
        <div className="border-t border-gray-100 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
          >
            <HomeIcon className="h-4 w-4" />
            사이트로 돌아가기
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0">
        {sidebar}
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg lg:hidden"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            {sidebar}
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
