import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '입점몰 둘러보기',
  description:
    '다양한 입점몰을 둘러보고 나에게 맞는 쇼핑몰을 찾아보세요. 패션, 식품, 뷰티, 리빙 등 업종별 전문 쇼핑몰이 모여 있습니다.',
};

export default function MallsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
