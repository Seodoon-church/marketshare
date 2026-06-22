'use client';

import { EdHeading } from '@/components/redesign/EdHeading';
import { EdButton } from '@/components/redesign/EdButton';
import { IconChevronLeft } from '@/components/redesign/icons';

const cartItems = [
  { id: 'dp5', name: 'DP5 세럼 50ml', mall: '데이지 뷰티', unit: 'A-204', q: 1, lineTotal: '₩18,900', img: '/images/redesign/dp5.png' },
  { id: 'dp1', name: '멀티비타민 60정', mall: '더헬스랩', unit: 'B-117', q: 2, lineTotal: '₩49,000', img: '/images/redesign/dp1.png' },
  { id: 'dp9', name: '약산성 샴푸 500ml', mall: '모던리빙', unit: 'C-301', q: 1, lineTotal: '₩16,900', img: '/images/redesign/dp9.png' },
];

export default function CartPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-paper px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-[50px] md:pt-6">
        <div className="flex items-center gap-3 pb-3 border-b-[1.5px] border-ink">
          <a href="/" className="w-9 h-9 border border-ink flex items-center justify-center">
            <IconChevronLeft size={18} className="text-ink" />
          </a>
          <EdHeading level={2} className="text-[24px]">장바구니</EdHeading>
          <span className="ml-auto font-mono text-[12px] text-brass">{cartItems.length}점</span>
        </div>
      </div>

      <div className="px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-[2px]">
        {cartItems.map((c) => (
          <div key={c.id} className="flex gap-[14px] py-[17px] border-b border-[#E3DACA]">
            <a href={`/products/${c.id}`} className="w-[84px] h-[84px] bg-cream overflow-hidden flex-none">
              <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
            </a>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] text-brass tracking-[.04em]">{c.unit} · {c.mall}</div>
              <div className="text-[13.5px] text-[#2A2520] font-semibold leading-[1.4] mt-1 line-clamp-2">{c.name}</div>
              <div className="flex items-baseline justify-between mt-[9px]">
                <span className="font-mono text-[11px] text-[#8A7C68]">수량 {c.q}</span>
                <span className="font-mono text-[16px] font-semibold text-ink">{c.lineTotal}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="mt-5 border-t-[1.5px] border-ink pt-4 pb-32 md:pb-16">
          <div className="flex justify-between py-[7px]">
            <span className="text-[13px] text-[#6E6253]">상품 금액</span>
            <span className="font-mono text-[13.5px] text-ink">₩128,700</span>
          </div>
          <div className="flex justify-between py-[7px]">
            <span className="text-[13px] text-[#6E6253]">상품 할인</span>
            <span className="font-mono text-[13.5px] text-sale-red">-₩43,900</span>
          </div>
          <div className="flex justify-between py-[7px]">
            <span className="text-[13px] text-[#6E6253]">배송비</span>
            <span className="font-mono text-[13.5px] text-jade">무료</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed left-0 right-0 bottom-0 z-[55] px-4 pt-[14px] pb-[26px] bg-paper/96 backdrop-blur-[12px] border-t-[1.5px] border-ink">
        <EdButton variant="ink" size="lg" href="/checkout" fullWidth className="gap-[10px]">
          <span className="font-mono text-[16px] font-semibold">₩84,800</span>
          <span>결제하기</span>
        </EdButton>
      </div>
    </div>
  );
}
