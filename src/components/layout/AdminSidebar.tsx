'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LogoIcon } from '@/components/common/Logo';
import { useAuthStore } from '@/store/auth-store';
import { getMallById } from '@/lib/services/mall-service';
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
  TicketIcon,
  TrophyIcon,
  LinkIcon,
  VideoCameraIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

// ──── 플랫폼 관리자 ────

const platformAdminGroups: SidebarGroup[] = [
  {
    title: '',
    items: [
      { label: '대시보드', href: '/admin', icon: HomeIcon },
    ],
  },
  {
    title: '회원관리',
    items: [
      { label: '회원 정보관리', href: '/admin/users', icon: UsersIcon },
    ],
  },
  {
    title: '분양몰관리',
    items: [
      { label: '분양몰 전체목록', href: '/admin/malls', icon: BuildingStorefrontIcon },
      { label: '분양 신청관리', href: '/admin/franchise', icon: DocumentTextIcon },
      { label: '수수료/정산', href: '/admin/settlements', icon: CurrencyDollarIcon },
    ],
  },
  {
    title: '공급사관리',
    items: [
      { label: '공급사 리스트', href: '/admin/suppliers', icon: TruckIcon },
      { label: '세금계산서', href: '/admin/tax-invoices', icon: DocumentTextIcon },
    ],
  },
  {
    title: '상품관리',
    items: [
      { label: '전체 상품관리', href: '/admin/products', icon: CubeIcon },
      { label: '카테고리 관리', href: '/admin/categories', icon: TagIcon },
    ],
  },
  {
    title: '주문관리',
    items: [
      { label: '주문 리스트', href: '/admin/orders', icon: ShoppingCartIcon },
    ],
  },
  {
    title: '통계분석',
    items: [
      { label: '통계/분석', href: '/admin/analytics', icon: ChartBarIcon },
    ],
  },
  {
    title: '고객지원',
    items: [
      { label: '게시판 관리', href: '/admin/boards', icon: ChatBubbleLeftRightIcon },
      { label: '쿠폰 관리', href: '/admin/coupons', icon: TicketIcon },
      { label: '알림 관리', href: '/admin/notifications', icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    title: '디자인관리',
    items: [
      { label: '배너 관리', href: '/admin/banners', icon: PhotoIcon },
      { label: '테마 관리', href: '/admin/themes', icon: SwatchIcon },
    ],
  },
  {
    title: '환경설정',
    items: [
      { label: '설정', href: '/admin/settings', icon: Cog6ToothIcon },
    ],
  },
];

// ──── 몰 관리자 (동적 - 몰 타입에 따라 메뉴 변경) ────

type MallType = 'headquarters' | 'franchisee' | 'independent';

function getMallAdminGroups(mallType: MallType): SidebarGroup[] {
  const groups: SidebarGroup[] = [
    {
      title: '',
      items: [
        { label: '대시보드', href: '/mall-admin', icon: HomeIcon },
      ],
    },
  ];

  // HQ-only: 분양 관리 group
  if (mallType === 'headquarters') {
    groups.push({
      title: '분양 관리',
      items: [
        { label: '가맹점 목록', href: '/mall-admin/franchise/malls', icon: BuildingStorefrontIcon },
        { label: '분양 신청관리', href: '/mall-admin/franchise/applications', icon: DocumentTextIcon },
        { label: '네트워크 상품', href: '/mall-admin/franchise/products', icon: LinkIcon },
      ],
    });
  }

  // Products & Orders group
  const productItems: SidebarItem[] = [
    { label: '상품 관리', href: '/mall-admin/products', icon: CubeIcon },
  ];
  // Franchisee-only: 본사 상품 관리
  if (mallType === 'franchisee') {
    productItems.push({ label: '본사 상품 관리', href: '/mall-admin/headquarters-products', icon: LinkIcon });
  }
  productItems.push(
    { label: '주문 관리', href: '/mall-admin/orders', icon: ShoppingCartIcon },
    { label: '카테고리', href: '/mall-admin/categories', icon: TagIcon },
    { label: '배송 관리', href: '/mall-admin/shipping', icon: TruckIcon },
  );
  groups.push({ title: '상품 · 주문', items: productItems });

  // Members & Marketing
  groups.push({
    title: '회원 · 마케팅',
    items: [
      { label: '회원 관리', href: '/mall-admin/members', icon: UsersIcon },
      { label: '회원등급', href: '/mall-admin/grades', icon: TrophyIcon },
      { label: '포인트 관리', href: '/mall-admin/points', icon: CurrencyDollarIcon },
      { label: '쿠폰 관리', href: '/mall-admin/coupons', icon: TicketIcon },
    ],
  });

  // Content
  groups.push({
    title: '콘텐츠',
    items: [
      { label: '배너 관리', href: '/mall-admin/banners', icon: PhotoIcon },
      { label: '게시판', href: '/mall-admin/boards', icon: ChatBubbleLeftRightIcon },
      { label: '알림 설정', href: '/mall-admin/notifications/history', icon: ChatBubbleLeftRightIcon },
    ],
  });

  // Live Commerce
  groups.push({
    title: '라이브 커머스',
    items: [
      { label: '라이브 관리', href: '/mall-admin/live', icon: VideoCameraIcon },
      { label: '다시보기', href: '/mall-admin/live/replays', icon: PlayCircleIcon },
    ],
  });

  // Settlement & Analytics - HQ gets extra "가맹점 정산"
  const settlementItems: SidebarItem[] = [
    { label: '정산 내역', href: '/mall-admin/settlements', icon: CurrencyDollarIcon },
  ];
  if (mallType === 'headquarters') {
    settlementItems.push({ label: '가맹점 정산', href: '/mall-admin/franchise/settlements', icon: CurrencyDollarIcon });
  }
  settlementItems.push(
    { label: '수수료 분석', href: '/mall-admin/settlements/commission', icon: ChartBarIcon },
    { label: '통계', href: '/mall-admin/analytics', icon: ChartBarIcon },
  );
  groups.push({ title: '정산 · 분석', items: settlementItems });

  // Settings
  groups.push({
    title: '',
    items: [
      { label: '몰 설정', href: '/mall-admin/settings', icon: Cog6ToothIcon },
    ],
  });

  return groups;
}

interface AdminSidebarProps {
  role: 'platform_admin' | 'mall_owner';
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mallType, setMallType] = useState<MallType>('independent');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (role !== 'mall_owner' || !user?.ownedMallIds?.length) return;

    getMallById(user.ownedMallIds[0]).then((mall) => {
      if (!mall) return;
      if (mall.childMallIds && mall.childMallIds.length > 0) {
        setMallType('headquarters');
      } else if (mall.parentMallId) {
        setMallType('franchisee');
      } else {
        setMallType('independent');
      }
    }).catch(() => {});
  }, [role, user?.ownedMallIds]);

  const groups = role === 'platform_admin' ? platformAdminGroups : getMallAdminGroups(mallType);
  const title = role === 'platform_admin' ? '플랫폼 관리' : '몰 관리';

  const sidebar = (
    <div
      className={cn(
        'flex h-full flex-col transition-all duration-300',
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}
      style={{ backgroundColor: '#1a6b4e' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {!isCollapsed && (
          <a href="/" className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">MarketShare</p>
              <p className="text-[10px] text-white/50">{title}</p>
            </div>
          </a>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white lg:block"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {groups.map((group, gi) => (
          <div key={gi}>
            {/* Group title + separator */}
            {group.title && !isCollapsed && (
              <div className="mt-5 mb-1.5 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {group.title}
                </p>
              </div>
            )}
            {group.title && isCollapsed && (
              <div className="my-2 mx-2 border-t border-white/10" />
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && item.href !== '/mall-admin' && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all cursor-pointer',
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 hover:bg-white/8 hover:text-white'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] flex-shrink-0',
                          isActive ? 'text-white' : 'text-white/45'
                        )}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#03C75A' }} />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      {!isCollapsed && (
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white"
          >
            <HomeIcon className="h-4 w-4" />
            사이트로 돌아가기
          </a>
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
