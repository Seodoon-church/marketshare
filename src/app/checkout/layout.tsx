import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '주문/결제',
  description:
    '배송지 정보를 입력하고 결제를 완료하세요. 신용카드, 카카오페이, 네이버페이, 계좌이체 등 다양한 결제 수단을 지원합니다.',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
