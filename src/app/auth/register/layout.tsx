import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입',
  description:
    'MarketShare에 가입하고 나만의 분양몰을 개설하세요. 무료 플랜으로 즉시 시작할 수 있으며, 상품이 메인 마켓에 자동 노출됩니다.',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
