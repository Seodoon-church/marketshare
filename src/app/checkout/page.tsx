'use client';

import { useState } from 'react';
import { EdHeading } from '@/components/redesign/EdHeading';
import { EdLabel } from '@/components/redesign/EdLabel';
import { EdButton } from '@/components/redesign/EdButton';
import { IconChevronLeft } from '@/components/redesign/icons';

const cartItems = [
  { id: 'dp5', name: 'DP5 세럼 50ml', q: 1, total: '₩18,900', img: '/images/redesign/dp5.png' },
  { id: 'dp1', name: '멀티비타민 60정', q: 2, total: '₩49,000', img: '/images/redesign/dp1.png' },
  { id: 'dp9', name: '약산성 샴푸 500ml', q: 1, total: '₩16,900', img: '/images/redesign/dp9.png' },
];

const payments = [
  { id: 'kakao', name: '카카오페이', extra: '1,000원 즉시할인', extraColor: 'text-jade' },
  { id: 'card', name: '신용·체크카드', extra: '', extraColor: '' },
  { id: 'bank', name: '무통장 입금', extra: '', extraColor: '' },
];

export default function CheckoutPage() {
  const [selectedPay, setSelectedPay] = useState('kakao');

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-paper px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-[50px] md:pt-6">
        <div className="flex items-center gap-3 pb-3 border-b-[1.5px] border-ink">
          <a href="/cart" className="w-9 h-9 border border-ink flex items-center justify-center">
            <IconChevronLeft size={18} className="text-ink" />
          </a>
          <EdHeading level={2} className="text-[24px]">주문·결제</EdHeading>
        </div>
      </div>

      <div className="px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-2 pb-32 md:pb-16 md:grid md:grid-cols-[1.2fr_0.8fr] md:gap-12">
        <div>
          {/* 배송지 */}
          <div className="flex items-start justify-between py-[18px] border-b border-[#E3DACA]">
            <div>
              <EdLabel className="text-brass">배송지</EdLabel>
              <div className="text-[14px] font-bold text-ink mt-[7px]">김분양 · 010-1234-5678</div>
              <div className="text-[12.5px] text-[#6E6253] mt-1 leading-[1.5]">서울 성동구 성수일로 12길 34<br />마켓셰어타워 204호</div>
            </div>
            <button className="border border-ink font-mono text-[11px] text-ink py-1.5 px-[11px] bg-transparent cursor-pointer">변경</button>
          </div>

          {/* 주문 상품 */}
          <div className="py-[18px]">
            <EdLabel className="text-brass">주문 상품 {cartItems.length}점</EdLabel>
            <div className="mt-3">
              {cartItems.map((c) => (
                <div key={c.id} className="flex gap-3 items-center py-[9px]">
                  <div className="w-[50px] h-[50px] bg-cream overflow-hidden flex-none">
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-[#2A2520] font-semibold truncate">{c.name}</div>
                    <div className="font-mono text-[10px] text-[#A89B86] mt-[3px]">수량 {c.q}</div>
                  </div>
                  <span className="font-mono text-[13.5px] font-semibold text-ink">{c.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 결제 수단 */}
          <div className="pt-[18px] border-t border-[#E3DACA]">
            <EdLabel className="text-brass">결제 수단</EdLabel>
            <div className="mt-3 border-[1.5px] border-ink">
              {payments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPay(p.id)}
                  className={`w-full flex items-center gap-[11px] p-[14px] border-b border-[#E3DACA] last:border-b-0 cursor-pointer ${selectedPay === p.id ? 'bg-[#EFEADF]' : 'bg-transparent'}`}
                >
                  <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center ${selectedPay === p.id ? 'border-brass' : 'border-[#C9BBA3]'}`}>
                    {selectedPay === p.id && <div className="w-[9px] h-[9px] rounded-full bg-brass" />}
                  </div>
                  <span className={`text-[13.5px] ${selectedPay === p.id ? 'font-bold text-ink' : 'text-[#6E6253]'}`}>{p.name}</span>
                  {p.extra && <span className={`ml-auto font-mono text-[10.5px] ${p.extraColor}`}>{p.extra}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary sidebar (desktop) */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="mt-5 md:mt-0 border-t-[1.5px] border-ink pt-4">
            <div className="flex justify-between py-[7px]">
              <span className="text-[13px] text-[#6E6253]">상품 금액</span>
              <span className="font-mono text-[13.5px] text-ink">₩128,700</span>
            </div>
            <div className="flex justify-between py-[7px]">
              <span className="text-[13px] text-[#6E6253]">상품 할인</span>
              <span className="font-mono text-[13.5px] text-sale-red">-₩43,900</span>
            </div>
            <div className="flex justify-between py-[7px]">
              <span className="text-[13px] text-[#6E6253]">카카오페이 할인</span>
              <span className="font-mono text-[13.5px] text-sale-red">-₩1,000</span>
            </div>
            <div className="flex justify-between py-[7px]">
              <span className="text-[13px] text-[#6E6253]">배송비</span>
              <span className="font-mono text-[13.5px] text-jade">무료</span>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block mt-6">
            <EdButton variant="ink" size="lg" href="/checkout/done" fullWidth className="gap-[10px] bg-sale-red border-sale-red">
              <span className="font-mono text-[16px] font-semibold">₩83,800</span>
              <span>결제하기</span>
            </EdButton>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 z-[55] px-4 pt-[14px] pb-[26px] bg-paper/96 backdrop-blur-[12px] border-t-[1.5px] border-ink">
        <EdButton variant="ink" size="lg" href="/checkout/done" fullWidth className="gap-[10px] bg-sale-red border-sale-red">
          <span className="font-mono text-[16px] font-semibold">₩83,800</span>
          <span>결제하기</span>
        </EdButton>
      </div>
    </div>
  );
}
