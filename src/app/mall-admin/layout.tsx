import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export const metadata: Metadata = {
  title: '몰 관리자',
  description:
    '내 쇼핑몰을 관리하는 관리자 대시보드입니다. 상품 등록, 주문 처리, 매출 통계, 재고 관리를 편리하게 할 수 있습니다.',
};

export default function MallAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar role="mall_owner" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-6">
          <h2 className="text-lg font-semibold text-gray-900">몰 관리</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">스타일몰</span>
            <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-violet-600">S</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
