import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description:
    'MarketShare 계정에 로그인하세요. 이메일 또는 카카오, 네이버, Google 간편 로그인으로 빠르게 접속할 수 있습니다.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
