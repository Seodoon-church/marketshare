import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '분양몰 개설',
  description:
    '5초 만에 나만의 쇼핑몰을 개설하세요. 개설 즉시 MarketShare 메인 마켓에 상품이 자동 노출되며, 통합 PG로 별도 가입 없이 결제를 받을 수 있습니다.',
};

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
