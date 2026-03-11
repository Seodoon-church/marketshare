import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '브랜드',
  description:
    'MarketShare에 입점한 인기 브랜드를 한눈에 살펴보세요. 초성 검색으로 원하는 브랜드를 빠르게 찾을 수 있습니다.',
};

export default function BrandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
