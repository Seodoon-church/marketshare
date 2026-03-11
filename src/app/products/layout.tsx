import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 상품',
  description:
    'MarketShare 입점몰의 모든 상품을 한 곳에서 만나보세요. 카테고리별, 가격별로 원하는 상품을 쉽게 찾을 수 있습니다.',
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
