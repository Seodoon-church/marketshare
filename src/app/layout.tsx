import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';

export const metadata: Metadata = {
  title: {
    default: 'MarketShare - 분양몰 특화 전자상거래 플랫폼',
    template: '%s | MarketShare',
  },
  description:
    '나만의 쇼핑몰을 5초만에 개설하세요. 분양몰 상품이 메인 마켓에 자동 게시되는 차세대 전자상거래 플랫폼.',
  keywords: ['쇼핑몰 분양', '전자상거래', '마켓플레이스', '온라인 쇼핑몰', '분양몰'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'MarketShare',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
