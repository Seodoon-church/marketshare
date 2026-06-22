'use client';

import { useState } from 'react';
import { EdHeading } from '@/components/redesign/EdHeading';
import { EdLabel } from '@/components/redesign/EdLabel';
import { EdButton } from '@/components/redesign/EdButton';
import { IconChevronLeft, IconCheck } from '@/components/redesign/icons';

const bizCats = ['뷰티·화장품', '건강기능식품', '패션·잡화', '생활용품', '식품·음료', '디지털·가전'];

const plans = [
  { id: 'free', name: '무료', price: '0원', sub: '즉시 개설', desc: '판매수수료 5% · 상품 30칸 · 기본 테마', pop: false },
  { id: 'biz', name: '비즈니스', price: '39,900/월', sub: '평균 2일 승인', desc: '판매수수료 1.5% · 무제한 상품 · 라이브 커머스 · 프리미엄 테마', pop: true },
  { id: 'ent', name: '엔터프라이즈', price: '별도 문의', sub: '전담 매니저', desc: '판매수수료 0.5% · 전용 서버 · 커스텀 개발', pop: false },
];

export default function FranchisePage() {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('biz');

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-paper px-4 pt-[50px] md:pt-6 pb-[10px]">
        <div className="flex items-center gap-3 md:max-w-[1280px] md:mx-auto">
          <a href="/" className="w-[38px] h-[38px] border border-ink flex items-center justify-center">
            <IconChevronLeft size={19} className="text-ink" />
          </a>
          <div>
            <EdLabel className="text-brass text-[10px] tracking-[.1em]">분양 신청서 — LEASE</EdLabel>
            <div className="font-serif text-[18px] font-bold text-ink mt-[2px]">한 칸, 내 이름으로</div>
          </div>
        </div>
        {/* Progress */}
        <div className="flex gap-[5px] mt-[15px] md:max-w-[1280px] md:mx-auto">
          <div className="flex-1 h-[3px] bg-ink" />
          <div className="flex-1 h-[3px] bg-ink" />
          <div className="flex-1 h-[3px] bg-[#D8CEBC]" />
        </div>
        <div className="font-mono text-[10.5px] text-[#8A7C68] mt-2 tracking-[.04em] md:max-w-[1280px] md:mx-auto">STEP 02 / 03 · 업종과 플랜 선택</div>
      </div>

      <div className="px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-[10px] pb-32 md:pb-16">
        {/* Business category */}
        <EdHeading level={3} className="mt-4">어떤 업종인가요?</EdHeading>
        <div className="grid grid-cols-3 gap-0 mt-[13px] border-t border-[#E3DACA] border-l border-l-[#E3DACA]">
          {bizCats.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`font-mono py-[18px] px-2 text-[13px] font-medium border-r border-[#E3DACA] border-b border-b-[#E3DACA] cursor-pointer ${
                selectedCat === cat ? 'bg-ink text-paper' : 'bg-transparent text-[#3A3024]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Mall address */}
        <EdHeading level={3} className="mt-7">내 점포 주소</EdHeading>
        <div className="mt-[13px] flex items-center border-[1.5px] border-ink">
          <input
            defaultValue="daisy-beauty"
            className="flex-1 border-none outline-none py-[15px] px-4 font-mono text-[14px] font-medium text-ink bg-transparent"
          />
          <span className="pr-4 font-mono text-[13px] text-brass">.marketshare.kr</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <IconCheck size={13} className="text-jade" />
          <span className="text-[11.5px] text-jade font-semibold">사용 가능한 주소예요</span>
        </div>

        {/* Plan selection */}
        <EdHeading level={3} className="mt-7">분양 플랜</EdHeading>
        <div className="flex flex-col gap-0 mt-[13px] border-t-[1.5px] border-ink">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`text-left relative py-4 px-[14px] border-b border-[#E3DACA] flex items-center gap-[13px] cursor-pointer ${
                selectedPlan === p.id ? 'bg-cream' : 'bg-transparent'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-[1.5px] flex-none flex items-center justify-center ${selectedPlan === p.id ? 'border-brass' : 'border-[#C9BBA3]'}`}>
                {selectedPlan === p.id && <div className="w-[10px] h-[10px] rounded-full bg-brass" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-[7px]">
                  <span className="font-serif text-[16px] font-bold text-ink">{p.name}</span>
                  {p.pop && <span className="font-mono text-[9px] font-semibold text-white bg-sale-red py-[2px] px-1.5">인기</span>}
                  <span className="text-[11px] font-semibold text-jade ml-auto">{p.sub}</span>
                </div>
                <div className="text-[12px] text-[#8A7C68] mt-[5px] leading-[1.45]">{p.desc}</div>
              </div>
              <div className="font-mono text-[14px] font-semibold text-ink flex-none">{p.price}</div>
            </button>
          ))}
        </div>

        {/* Info box */}
        <div className="flex gap-[9px] mt-[18px] p-[14px_15px] border border-[#E3DACA]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C7C46" strokeWidth="1.7" className="flex-none mt-[1px]"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>
          <span className="text-[11.5px] text-[#6E6253] leading-relaxed">
            무료 플랜은 본인 인증만으로 <b className="text-ink">즉시 개설</b>됩니다. 유료 플랜은 사업자등록증 확인 후 평균 이틀 내 승인돼요.
          </span>
        </div>
      </div>

      {/* Bottom submit */}
      <div className="fixed left-0 right-0 bottom-0 z-[55] px-4 pt-3 pb-[26px] bg-paper/96 backdrop-blur-[12px] border-t-[1.5px] border-ink">
        <EdButton variant="ink" size="lg" href="/franchise/done" fullWidth>분양 신청 완료하기</EdButton>
      </div>
    </div>
  );
}
