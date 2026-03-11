import type { Metadata } from 'next';
import { MyPageSidebar } from '@/components/layout/MyPageSidebar';

export const metadata: Metadata = {
  title: '마이페이지',
  description:
    '주문내역, 위시리스트, 리뷰 관리, 배송지 관리 등 내 계정 정보를 한곳에서 확인하고 관리하세요.',
};

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MyPageSidebar>{children}</MyPageSidebar>;
}
