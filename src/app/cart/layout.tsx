import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '장바구니',
  description:
    '장바구니에 담긴 상품을 확인하고 주문을 진행하세요. 50,000원 이상 구매 시 무료배송 혜택이 적용됩니다.',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
