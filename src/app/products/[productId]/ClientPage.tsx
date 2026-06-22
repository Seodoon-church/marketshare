'use client';

import { useState } from 'react';
import { EdHeader } from '@/components/redesign/EdHeader';
import { EdFooter } from '@/components/redesign/EdFooter';
import { EdBottomTabBar } from '@/components/redesign/EdBottomTabBar';
import { EdHeading } from '@/components/redesign/EdHeading';
import { EdButton } from '@/components/redesign/EdButton';
import { IconChevronLeft, IconHeart, IconCart, IconStar, IconMinus, IconPlus } from '@/components/redesign/icons';

const product = {
  id: 'dp5',
  name: '히알루론산 수분 세럼 50ml',
  mall: '데이지 뷰티',
  unit: 'A-204',
  off: '-38%',
  price: 18900,
  originalPrice: 49900,
  rating: '4.9',
  reviews: '247',
  sales: '1,892',
  img: '/images/redesign/dp5.png',
};

const related = [
  { id: 'dp6', name: '수분크림 80ml', price: '32,000', img: '/images/redesign/dp6.png' },
  { id: 'dp1', name: '멀티비타민 60정', price: '24,500', img: '/images/redesign/dp1.png' },
  { id: 'dp9', name: '약산성 샴푸 500ml', price: '16,900', img: '/images/redesign/dp9.png' },
];

interface Props {
  productId: string;
}

export default function ClientPage({ productId }: Props) {
  const [qty, setQty] = useState(1);
  const total = product.price * qty;
  const totalFormatted = total.toLocaleString('ko-KR');

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Header */}
      <div className="hidden md:block"><EdHeader /></div>

      {/* Mobile back header */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-40 pt-[50px] px-4 pb-[10px] flex items-center justify-between">
        <a href="/" className="w-[38px] h-[38px] bg-paper/92 flex items-center justify-center">
          <IconChevronLeft size={19} className="text-ink" />
        </a>
        <div className="flex gap-[7px]">
          <button className="w-[38px] h-[38px] bg-paper/92 flex items-center justify-center border-none cursor-pointer">
            <IconHeart size={18} className="text-ink" />
          </button>
          <a href="/cart" className="w-[38px] h-[38px] bg-paper/92 flex items-center justify-center">
            <IconCart size={18} className="text-ink" />
          </a>
        </div>
      </div>

      {/* Desktop 2-column layout */}
      <div className="md:max-w-[1280px] md:mx-auto md:px-10 md:pt-10 md:grid md:grid-cols-2 md:gap-12">
        {/* Hero Image */}
        <div className="relative w-full aspect-square bg-cream overflow-hidden">
          <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
          <span className="absolute left-0 bottom-0 font-mono text-[13px] font-bold text-white bg-sale-red py-[5px] px-[11px]">
            {product.off} SALE
          </span>
        </div>

        {/* Product Info */}
        <div className="px-5 md:px-0 pt-[18px]">
          {/* Mall row */}
          <a href="/malls/daisy-beauty" className="flex items-center gap-[9px] py-3 border-b border-[#E3DACA]">
            <span className="font-mono text-[11px] font-semibold text-brass border border-[#E3DACA] py-[3px] px-[7px]">{product.unit}</span>
            <span className="font-serif text-[15px] font-bold text-ink">{product.mall}</span>
            <span className="text-[11.5px] text-[#A89B86]">입점 점포</span>
            <span className="ml-auto font-mono text-[11.5px] font-semibold text-brass">점포 방문 →</span>
          </a>

          <h1 className="font-serif text-[23px] font-bold text-ink leading-[1.4] mt-4">{product.name}</h1>

          <div className="flex items-center gap-1.5 mt-[11px]">
            <IconStar size={14} className="text-brass" />
            <span className="font-mono text-[13px] font-semibold text-ink">{product.rating}</span>
            <span className="text-[12px] text-[#8A7C68]">후기 {product.reviews} · 누적판매 {product.sales}</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-[9px] mt-[18px] pb-[18px] border-b-[1.5px] border-ink">
            <span className="font-mono text-[22px] font-bold text-sale-red">{product.off}</span>
            <span className="font-mono text-[30px] font-semibold text-ink tracking-tight">{product.price.toLocaleString('ko-KR')}</span>
            <span className="font-mono text-[14px] text-[#A89B86] line-through">{product.originalPrice.toLocaleString('ko-KR')}</span>
          </div>

          {/* Delivery ledger */}
          <div className="mt-1">
            {[
              { label: '배송', value: '무료배송 · 내일(수) 도착 예정' },
              { label: '적립', value: <>구매 시 <b className="text-jade">최대 1,495P</b> 적립 (점포 등급별)</> },
              { label: '혜택', value: '라이브 방송가 추가 5% · 카카오페이 1천원' },
            ].map((row) => (
              <div key={String(row.label)} className="flex gap-3 py-[14px] border-b border-[#E3DACA]">
                <span className="font-mono text-[11px] text-brass w-12 tracking-[.04em]">{row.label}</span>
                <span className="text-[12.5px] text-[#3A3024] font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Desktop Buy Area */}
          <div className="hidden md:block mt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-ink">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-[38px] h-[50px] border-none bg-transparent text-ink cursor-pointer flex items-center justify-center">
                  <IconMinus size={16} />
                </button>
                <span className="w-8 text-center font-mono text-[15px] font-semibold text-ink">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-[38px] h-[50px] border-none bg-transparent text-ink cursor-pointer flex items-center justify-center">
                  <IconPlus size={16} />
                </button>
              </div>
              <EdButton variant="outline" size="lg" className="flex-1">장바구니</EdButton>
              <EdButton variant="ink" size="lg" className="flex-[1.4]">₩{totalFormatted} 구매</EdButton>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="px-5 md:px-10 md:max-w-[1280px] md:mx-auto">
        <EdHeading level={3} className="mt-7">이 점포의 다른 상품</EdHeading>
        <div className="flex gap-3 overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0 pt-[15px] pb-4 scrollbar-none md:grid md:grid-cols-4 md:gap-6">
          {related.map((r) => (
            <a key={r.id} href={`/products/${r.id}`} className="flex-none w-[122px] md:w-auto md:flex-auto">
              <div className="relative w-[122px] md:w-full h-[122px] md:h-auto md:aspect-square bg-cream overflow-hidden">
                <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-[12px] text-[#3A3024] font-semibold leading-snug mt-2 line-clamp-2">{r.name}</div>
              <div className="font-mono text-[13.5px] font-semibold text-ink mt-1">{r.price}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Mobile Buy Bar */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 z-[55] px-4 pt-3 pb-[26px] bg-white/96 backdrop-blur-[12px] border-t-[1.5px] border-ink">
        <div className="flex items-center gap-[11px]">
          <div className="flex items-center border border-ink">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-[38px] h-[50px] border-none bg-transparent text-[20px] text-ink cursor-pointer">−</button>
            <span className="w-8 text-center font-mono text-[15px] font-semibold text-ink">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-[38px] h-[50px] border-none bg-transparent text-[20px] text-ink cursor-pointer">+</button>
          </div>
          <a href="/cart" className="flex-1 h-[54px] border border-ink flex items-center justify-center text-ink text-[14.5px] font-bold">장바구니</a>
          <button className="flex-[1.4] h-[54px] border-none bg-ink text-paper text-[14.5px] font-bold cursor-pointer">₩{totalFormatted} 구매</button>
        </div>
      </div>

      <div className="hidden md:block mt-16"><EdFooter /></div>
    </div>
  );
}
