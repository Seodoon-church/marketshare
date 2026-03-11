import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '계정',
  description:
    'MarketShare 계정에 로그인하거나 새 계정을 만드세요. 카카오, 네이버, Google 간편 로그인을 지원합니다.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
