import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '상품 검색',
  description:
    'MarketShare에서 원하는 상품을 검색하세요. 카테고리, 가격대, 평점 등 다양한 필터로 정확한 상품을 찾을 수 있습니다.',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
