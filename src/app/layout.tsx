import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ChatWidget } from '@/components/chat/ChatWidget';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://marketshare.kr'),
  title: {
    default: 'MarketShare - 분양몰 특화 전자상거래 플랫폼',
    template: '%s | MarketShare',
  },
  description:
    '나만의 쇼핑몰을 5초만에 개설하세요. 분양몰 상품이 메인 마켓에 자동 게시되는 차세대 전자상거래 플랫폼.',
  keywords: ['쇼핑몰 분양', '전자상거래', '마켓플레이스', '온라인 쇼핑몰', '분양몰', '프랜차이즈'],
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-icon.svg',
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'MarketShare',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketShare - 분양몰 특화 전자상거래 플랫폼',
    description: '나만의 쇼핑몰을 5초만에 개설하세요.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
            <ChatWidget />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
