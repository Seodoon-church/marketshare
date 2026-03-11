import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '요금제 안내',
  description:
    'MarketShare 요금제를 비교하고 나에게 맞는 플랜을 선택하세요. 무료 플랜부터 Enterprise까지, 합리적인 수수료로 쇼핑몰을 운영할 수 있습니다.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
