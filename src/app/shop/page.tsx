'use client';

import { useState } from 'react';
import { EdHeader } from '@/components/redesign/EdHeader';
import { EdFooter } from '@/components/redesign/EdFooter';
import { EdBottomTabBar } from '@/components/redesign/EdBottomTabBar';
import { EdHeading } from '@/components/redesign/EdHeading';
import { EdChip } from '@/components/redesign/EdChip';
import { IconSearch, IconCart, IconLive, IconStar } from '@/components/redesign/icons';

const categories = ['전체', '뷰티', '헬스', '패션', '생활', '식품', '디지털'];

const products = [
  { id: 'dp5', name: 'DP5 세럼 50ml', mall: '데이지 뷰티', unit: 'A-204', off: '-38%', price: '18,900', rating: '4.9', reviews: '247', free: true, img: '/images/redesign/dp5.png' },
  { id: 'dp1', name: '멀티비타민 60정', mall: '더헬스랩', unit: 'B-117', off: '-25%', price: '24,500', rating: '4.8', reviews: '189', free: false, img: '/images/redesign/dp1.png' },
  { id: 'dp9', name: '약산성 샴푸 500ml', mall: '모던리빙', unit: 'C-301', off: '-30%', price: '16,900', rating: '4.7', reviews: '312', free: true, img: '/images/redesign/dp9.png' },
  { id: 'dp12', name: '섬유유연제 1L', mall: '모던리빙', unit: 'C-301', off: '-22%', price: '12,900', rating: '4.6', reviews: '156', free: false, img: '/images/redesign/dp12.png' },
  { id: 'dp6', name: '수분크림 80ml', mall: '데이지 뷰티', unit: 'A-204', off: '-15%', price: '32,000', rating: '4.9', reviews: '421', free: true, img: '/images/redesign/dp6.png' },
  { id: 'dp16', name: '콜드브루 원두 200g', mall: '그래놀라하우스', unit: 'A-118', off: '-18%', price: '15,800', rating: '4.8', reviews: '98', free: false, img: '/images/redesign/dp16.png' },
  { id: 'dp3', name: '프로바이오틱스 30포', mall: '더헬스랩', unit: 'B-117', off: '-20%', price: '28,900', rating: '4.7', reviews: '203', free: true, img: '/images/redesign/dp3.png' },
  { id: 'dp15', name: '수제 허브티 세트', mall: '그래놀라하우스', unit: 'A-118', off: '-20%', price: '22,000', rating: '4.8', reviews: '167', free: false, img: '/images/redesign/dp15.png' },
];

export default function ShopPage() {
  const [selectedCat, setSelectedCat] = useState('전체');

  return (
    <div className="min-h-screen bg-paper">
      {/* Mobile Shop Header */}
      <div className="md:hidden sticky top-0 z-40 bg-paper px-[18px] pt-[50px]">
        <div className="flex items-center justify-between pb-[10px]">
          <EdHeading level={2} className="text-[25px]">상품 매대</EdHeading>
          <div className="flex items-center gap-4">
            <a href="/search" className="flex"><IconSearch size={19} className="text-ink" /></a>
            <a href="/cart" className="flex"><IconCart size={19} className="text-ink" /></a>
            <a href="/live" className="flex"><IconLive size={19} className="text-ink" /></a>
          </div>
        </div>
        {/* Search bar */}
        <a href="/search" className="flex items-center gap-[9px] py-[11px] border-t-[1.5px] border-ink border-b border-[#E3DACA]">
          <IconSearch size={16} className="text-[#A89B86]" />
          <span className="text-[14px] text-[#A89B86]">상품·점포 검색</span>
        </a>
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto -mx-[18px] px-[18px] py-3 scrollbar-none">
          {categories.map((cat) => (
            <EdChip key={cat} selected={selectedCat === cat} onClick={() => setSelectedCat(cat)}>
              {cat}
            </EdChip>
          ))}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <EdHeader currentPath="/shop" />
      </div>

      {/* Desktop title area */}
      <div className="hidden md:block max-w-[1280px] mx-auto px-10 pt-10">
        <EdHeading level={1} className="text-[36px]">상품 매대</EdHeading>
        <div className="flex gap-2 mt-4">
          {categories.map((cat) => (
            <EdChip key={cat} selected={selectedCat === cat} onClick={() => setSelectedCat(cat)}>
              {cat}
            </EdChip>
          ))}
        </div>
      </div>

      {/* Result meta */}
      <div className="px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-[14px] flex items-baseline justify-between">
        <span className="font-mono text-[11px] text-brass tracking-[.06em]">
          <b className="text-ink">{selectedCat}</b> · 실시간 베스트
        </span>
        <span className="text-[12px] text-[#8A7C68] font-semibold">인기순 ↓</span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px_13px] md:gap-6 px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-4 pb-24 md:pb-16">
        {products.map((p) => (
          <a key={p.id} href={`/products/${p.id}`} className="block group">
            <div className="relative w-full aspect-square bg-cream overflow-hidden">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="absolute left-0 top-0 font-mono text-[12px] font-bold text-white bg-sale-red py-1 px-[9px]">{p.off}</span>
              <span className="absolute right-[9px] bottom-[9px] w-[34px] h-[34px] bg-white/92 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1815" strokeWidth="1.7"><path d="M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0" /></svg>
              </span>
            </div>
            <div className="font-mono text-[10px] text-brass mt-[10px] tracking-[.04em]">{p.unit} · {p.mall}</div>
            <div className="text-[13.5px] text-[#2A2520] font-semibold leading-[1.4] mt-1 line-clamp-2">{p.name}</div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-[12px] font-bold text-sale-red">{p.off}</span>
              <span className="font-mono text-[17px] font-semibold text-ink">{p.price}</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <IconStar size={12} className="text-brass" />
              <span className="text-[11.5px] font-bold text-[#6E6253]">{p.rating}</span>
              <span className="text-[11px] text-[#A89B86]">({p.reviews})</span>
              {p.free && (
                <span className="font-mono text-[9.5px] font-semibold text-jade border border-[#BFD6C9] py-[2px] px-1.5 ml-auto tracking-[.03em]">무료배송</span>
              )}
            </div>
          </a>
        ))}
      </div>

      <div className="hidden md:block"><EdFooter /></div>
      <EdBottomTabBar activeTab="shop" />
    </div>
  );
}
