'use client';

import { EdBadge } from '@/components/redesign/EdBadge';
import { IconChevronLeft } from '@/components/redesign/icons';

const chats = [
  { who: '뷰티러버', c: '#E8C89A', txt: '세럼 텍스쳐 어때요?' },
  { who: '건강맨', c: '#7FB99C', txt: '성분 좋아보여요 👍' },
  { who: '데이지단골', c: '#E8A0C0', txt: '저도 하나 구매할게요!' },
  { who: '리빙퀸', c: '#9CB8E8', txt: '포장 예쁘네요~' },
  { who: '쇼핑왕', c: '#D4C490', txt: '지금 구매하면 언제 배송되나요?' },
];

export default function LivePage() {
  return (
    <div className="relative h-screen bg-[#140d07] overflow-hidden">
      {/* Video background */}
      <img src="/images/redesign/live-stage.png" alt="라이브 방송" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(20,13,7,.34) 0%, transparent 26%, transparent 52%, rgba(20,13,7,.82) 100%)' }} />

      {/* Top bar */}
      <div className="absolute top-[50px] left-4 right-4 flex items-center gap-[10px] z-10">
        <a href="/" className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <IconChevronLeft size={18} className="text-white" />
        </a>
        <div className="flex items-center gap-2 py-[5px] pr-[5px] pl-[6px] rounded-full bg-black/40 backdrop-blur-sm">
          <div className="w-[30px] h-[30px] rounded-full bg-brass flex items-center justify-center font-serif text-[15px] font-bold text-white">데</div>
          <div>
            <div className="text-[12.5px] font-bold text-white leading-none">데이지 뷰티</div>
            <div className="font-mono text-[9.5px] text-[#d8c3a0] mt-[3px]">A-204</div>
          </div>
          <button className="ml-1 py-[5px] px-[11px] bg-brass text-white border-none font-mono text-[10.5px] font-semibold cursor-pointer">팔로우</button>
        </div>
        <div className="ml-auto flex gap-1.5">
          <span className="inline-flex items-center gap-[5px] py-1.5 px-[10px] bg-sale-red text-white font-mono text-[11px] font-semibold tracking-[.04em]">
            <span className="relative flex w-[6px] h-[6px]">
              <span className="absolute inset-0 rounded-full bg-white animate-ping" />
              <span className="relative w-[6px] h-[6px] rounded-full bg-white" />
            </span>LIVE
          </span>
          <span className="inline-flex items-center gap-1 py-1.5 px-[10px] bg-black/45 text-white font-mono text-[11px] font-medium backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7" /></svg>1,247
          </span>
        </div>
      </div>

      {/* Pinned product */}
      <div className="absolute left-4 right-4 bottom-[188px] z-10 flex items-center gap-3 p-[10px] bg-[rgba(20,13,7,.66)] border border-white/14 backdrop-blur-[12px]">
        <div className="w-[54px] h-[54px] bg-[#2a2018] overflow-hidden flex-none">
          <img src="/images/redesign/dp5.png" alt="세럼" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <EdBadge variant="live" className="text-[9.5px]">방송특가</EdBadge>
            <span className="font-mono text-[11px] text-[#cbb89a] line-through">49,900</span>
          </div>
          <div className="text-[13px] font-semibold text-white mt-[5px] truncate">히알루론산 수분 세럼 50ml</div>
          <div className="font-mono text-[18px] font-semibold text-white mt-[2px]">₩28,400 <span className="text-[11px] text-[#E0A24A]">라방 5%↓</span></div>
        </div>
        <button className="flex-none h-[46px] px-[17px] bg-sale-red text-white border-none font-mono text-[13px] font-semibold cursor-pointer">구매</button>
      </div>

      {/* Chat messages */}
      <div className="absolute left-0 right-[78px] bottom-24 z-10 px-4 flex flex-col gap-[7px] max-h-[170px] overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(transparent,#000 30%)' }}>
        {chats.map((m, i) => (
          <div key={i} className="flex items-baseline gap-1.5">
            <span className="text-[11.5px] font-extrabold" style={{ color: m.c }}>{m.who}</span>
            <span className="text-[12.5px] text-white/92 bg-black/32 py-1 px-[9px] rounded-[11px] backdrop-blur-sm">{m.txt}</span>
          </div>
        ))}
      </div>

      {/* Side actions */}
      <div className="absolute right-[14px] bottom-[200px] z-10 flex flex-col gap-[15px] items-center">
        {[
          { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><path d="M20.8 8.6a5 5 0 0 0-8.8-3.3A5 5 0 1 0 4 11l8 9 8.8-9.4z" /></svg>, label: '8.2천' },
          { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><rect x="3" y="8" width="18" height="13" /><path d="M3 8l2-4h14l2 4M12 8v13" /></svg>, label: '쿠폰' },
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>, label: '공유' },
        ].map((action, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-[46px] h-[46px] rounded-full bg-black/42 backdrop-blur-sm flex items-center justify-center">{action.icon}</div>
            <span className="font-mono text-[10px] text-white">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="absolute left-4 right-4 bottom-[38px] z-10 flex items-center gap-[9px]">
        <div className="flex-1 h-[46px] rounded-full bg-white/12 border border-white/20 flex items-center px-[18px] backdrop-blur-[6px]">
          <span className="text-[13px] text-white/60">응원 댓글 보내기…</span>
        </div>
        <div className="w-[46px] h-[46px] rounded-full bg-white/16 flex items-center justify-center backdrop-blur-[6px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><path d="M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0" /></svg>
        </div>
      </div>
    </div>
  );
}
