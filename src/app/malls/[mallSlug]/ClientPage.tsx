'use client';

import { useState } from 'react';
import { EdHeader } from '@/components/redesign/EdHeader';
import { EdFooter } from '@/components/redesign/EdFooter';
import { EdBottomTabBar } from '@/components/redesign/EdBottomTabBar';
import { EdHeading } from '@/components/redesign/EdHeading';
import { EdChip } from '@/components/redesign/EdChip';
import { EdButton } from '@/components/redesign/EdButton';
import { IconChevronLeft, IconLive } from '@/components/redesign/icons';

const storeProducts = [
  { id: 'dp5', name: 'DP5 세럼 50ml', off: '-38%', price: '18,900', img: '/images/redesign/dp5.png' },
  { id: 'dp6', name: '수분크림 80ml', off: '-15%', price: '32,000', img: '/images/redesign/dp6.png' },
  { id: 'dp1', name: '멀티비타민 60정', off: '-25%', price: '24,500', img: '/images/redesign/dp1.png' },
  { id: 'dp9', name: '약산성 샴푸 500ml', off: '-30%', price: '16,900', img: '/images/redesign/dp9.png' },
  { id: 'dp3', name: '프로바이오틱스 30포', off: '-20%', price: '28,900', img: '/images/redesign/dp3.png' },
  { id: 'dp12', name: '섬유유연제 1L', off: '-22%', price: '12,900', img: '/images/redesign/dp12.png' },
];

const storeTabs = ['전체', '베스트', '신상', '세일'];

interface Props {
  mallSlug: string;
}

export default function ClientPage({ mallSlug }: Props) {
  const [activeTab, setActiveTab] = useState('전체');

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop Header */}
      <div className="hidden md:block"><EdHeader /></div>

      {/* Cover Photo */}
      <div className="relative h-[230px] bg-cream overflow-hidden">
        <img src="/images/redesign/store-cover.png" alt="점포 전경" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent pointer-events-none" />
        {/* Awning accent */}
        <div className="absolute top-0 left-0 right-0 h-[6px]" style={{ background: 'repeating-linear-gradient(90deg,#9C7C46 0 22px,#F6F3EC 22px 44px)' }} />
        <a href="/" className="absolute top-[50px] left-4 w-[38px] h-[38px] bg-paper/92 flex items-center justify-center md:hidden">
          <IconChevronLeft size={19} className="text-ink" />
        </a>
        <div className="absolute bottom-[14px] left-[18px] font-mono text-[11px] tracking-[.06em] text-paper border border-paper/70 py-1 px-[9px]">
          A-204 · 6F 뷰티
        </div>
      </div>

      {/* Mall Identity */}
      <div className="bg-paper px-[18px] md:max-w-[1280px] md:mx-auto md:px-10 pt-[18px]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <EdHeading level={2} className="text-[26px]">데이지 뷰티</EdHeading>
              <span className="font-mono text-[9.5px] font-semibold text-jade border border-[#BFD6C9] py-[2px] px-1.5 tracking-[.03em]">영업중</span>
            </div>
            <p className="text-[12.5px] text-[#8A7C68] mt-[7px]">뷰티·코스메틱 · 분양 2년차 · 비즈니스 플랜</p>
          </div>
          <EdButton variant="ink" size="sm" className="text-[12px] tracking-[.04em]">+ 팔로우</EdButton>
        </div>

        {/* Stats */}
        <div className="flex mt-4 border-t-[1.5px] border-ink border-b-[1.5px] border-b-ink">
          <div className="flex-1 py-3 border-r border-[#E3DACA]">
            <div className="font-mono text-[16px] font-semibold text-ink">3.2천</div>
            <div className="text-[10.5px] text-[#8A7C68] mt-[3px]">팔로워</div>
          </div>
          <div className="flex-1 py-3 pl-[14px] border-r border-[#E3DACA]">
            <div className="font-mono text-[16px] font-semibold text-ink">128</div>
            <div className="text-[10.5px] text-[#8A7C68] mt-[3px]">상품</div>
          </div>
          <div className="flex-1 py-3 pl-[14px]">
            <div className="font-mono text-[16px] font-semibold text-ink">4.9</div>
            <div className="text-[10.5px] text-[#8A7C68] mt-[3px]">후기 1.4천</div>
          </div>
        </div>
      </div>

      {/* Live Banner */}
      <a href="/live" className="mx-[18px] md:mx-auto md:max-w-[1200px] mt-4 flex items-center gap-[13px] p-[14px_16px] bg-ink">
        <IconLive size={22} className="text-sale-red" />
        <div className="flex-1">
          <div className="text-[13px] font-bold text-paper">지금 라이브 방송 중</div>
          <div className="text-[11.5px] text-[#A89B86] mt-[3px]">신상 세럼 런칭 특가 · 1,247명 시청</div>
        </div>
        <span className="font-mono text-[12px] text-sale-red">입장 →</span>
      </a>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-5 scrollbar-none">
        {storeTabs.map((tab) => (
          <EdChip key={tab} selected={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </EdChip>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px_13px] md:gap-6 px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-4 pb-24 md:pb-16">
        {storeProducts.map((p) => (
          <a key={p.id} href={`/products/${p.id}`} className="block group">
            <div className="relative w-full aspect-square bg-cream overflow-hidden">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="absolute left-0 top-0 font-mono text-[12px] font-bold text-white bg-sale-red py-1 px-[9px]">{p.off}</span>
            </div>
            <div className="text-[13.5px] text-[#2A2520] font-semibold leading-[1.4] mt-[9px] line-clamp-2">{p.name}</div>
            <div className="font-mono text-[17px] font-semibold text-ink mt-[5px]">{p.price}</div>
          </a>
        ))}
      </div>

      <div className="hidden md:block"><EdFooter /></div>
      <EdBottomTabBar activeTab="shop" />
    </div>
  );
}
