'use client';

import { EdHeading } from '@/components/redesign/EdHeading';
import { EdLabel } from '@/components/redesign/EdLabel';
import { EdButton } from '@/components/redesign/EdButton';
import { EdBottomTabBar } from '@/components/redesign/EdBottomTabBar';

const orders = [
  { id: '1', name: 'DP5 세럼 50ml', no: 'ORD-240620-001', t: '06.20 14:23', amt: '₩18,900', st: '배송중', stColor: 'text-jade', img: '/images/redesign/dp5.png' },
  { id: '2', name: '멀티비타민 60정', no: 'ORD-240618-042', t: '06.18 09:11', amt: '₩49,000', st: '배송완료', stColor: 'text-[#8A7C68]', img: '/images/redesign/dp1.png' },
  { id: '3', name: '약산성 샴푸 500ml', no: 'ORD-240615-019', t: '06.15 18:45', amt: '₩16,900', st: '주문확인', stColor: 'text-brass', img: '/images/redesign/dp9.png' },
];

const bars = [
  { day: '월', h: '30%', bg: '#E7DCC9' },
  { day: '화', h: '50%', bg: '#E7DCC9' },
  { day: '수', h: '40%', bg: '#E7DCC9' },
  { day: '목', h: '65%', bg: '#E7DCC9' },
  { day: '금', h: '90%', bg: '#9C7C46' },
  { day: '토', h: '75%', bg: '#1A1815' },
  { day: '일', h: '45%', bg: '#E7DCC9' },
];

export default function MyPage() {
  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Owner header */}
      <div className="bg-ink px-[18px] pt-[50px] md:pt-6 pb-[22px]">
        <div className="md:max-w-[1280px] md:mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[11px]">
              <div className="w-[42px] h-[42px] bg-brass flex items-center justify-center font-serif text-[21px] font-bold text-white">데</div>
              <div>
                <div className="flex items-center gap-[7px]">
                  <span className="font-serif text-[17px] font-bold text-paper">데이지 뷰티</span>
                  <span className="font-mono text-[9.5px] font-semibold text-ink bg-brass py-[2px] px-1.5">A-204</span>
                </div>
                <div className="font-mono text-[10.5px] text-[#A89B86] mt-1 tracking-[.04em]">관리자 · 비즈니스 플랜</div>
              </div>
            </div>
            <EdButton variant="ghost" size="sm" href="/malls/daisy-beauty" className="text-cream border-[#4A4239] text-[11px]">점포 보기</EdButton>
          </div>

          {/* Today settlement */}
          <a href="/mypage/settlement" className="block mt-[18px] border border-[#3A3024] p-[17px]">
            <div className="flex items-center justify-between border-b border-[#3A3024] pb-[11px]">
              <span className="font-mono text-[11px] text-[#A89B86] tracking-[.04em]">오늘 매출 · 06.20</span>
              <span className="font-mono text-[11px] text-[#7FB99C]">▲ 18.4%</span>
            </div>
            <div className="font-mono text-[30px] font-semibold text-paper mt-[13px] tracking-tight">₩1,284,600</div>
            <div className="text-[11.5px] text-[#8A7C68] mt-[5px]">정산 예정 <span className="font-mono text-[#A89B86]">₩2,418,500</span> · 06.25 입금</div>
          </a>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-0 mx-[18px] md:mx-auto md:max-w-[1280px] mt-[18px] border-[1.5px] border-ink">
        <div className="p-[15px_16px] border-r border-[#E3DACA]">
          <div className="font-mono text-[10.5px] text-brass tracking-[.04em]">오늘 주문</div>
          <div className="font-mono text-[24px] font-semibold text-ink mt-[5px]">37<span className="text-[12px] text-[#A89B86]">건</span></div>
          <div className="text-[10.5px] text-jade font-semibold mt-[3px]">신규 12 · 배송 8</div>
        </div>
        <div className="p-[15px_16px]">
          <div className="font-mono text-[10.5px] text-brass tracking-[.04em]">방문자</div>
          <div className="font-mono text-[24px] font-semibold text-ink mt-[5px]">2,140<span className="text-[12px] text-[#A89B86]">명</span></div>
          <div className="text-[10.5px] text-jade font-semibold mt-[3px]">전환율 1.7%</div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="mx-[18px] md:mx-auto md:max-w-[1280px] mt-[14px] border border-[#E3DACA] p-[18px]">
        <div className="flex items-center justify-between">
          <span className="font-serif text-[16px] font-bold text-ink">주간 매출</span>
          <div className="flex border border-ink">
            <span className="font-mono text-[10.5px] font-medium text-paper bg-ink py-1 px-[10px]">주</span>
            <span className="font-mono text-[10.5px] font-medium text-[#8A7C68] py-1 px-[10px]">월</span>
          </div>
        </div>
        <div className="flex items-end gap-[9px] h-[118px] mt-[18px]">
          {bars.map((b) => (
            <div key={b.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full" style={{ height: b.h, background: b.bg }} />
              <span className={`font-mono text-[10px] ${b.bg === '#1A1815' ? 'text-ink font-bold' : 'text-[#8A7C68]'}`}>{b.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-0 mx-[18px] md:mx-auto md:max-w-[1280px] mt-[14px] border border-[#E3DACA]">
        {[
          { label: '상품등록', href: '/mall-admin/products', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1815" strokeWidth="1.6"><rect x="4" y="7" width="16" height="13" /><path d="M4 7l2-3h12l2 3M9 11h6" /></svg> },
          { label: '라이브', href: '/live', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C53A22" strokeWidth="1.6"><circle cx="12" cy="12" r="2.2" /><path d="M8.4 8.4a5 5 0 0 0 0 7.2" /><path d="M15.6 8.4a5 5 0 0 1 0 7.2" /></svg> },
          { label: '쿠폰', href: '/mall-admin/coupons', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1815" strokeWidth="1.6"><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z" /><path d="M13 6v14" strokeDasharray="2 2" /></svg> },
          { label: '정산', href: '/mypage/settlement', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1815" strokeWidth="1.6"><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10a2.5 2 0 0 1 5 0c0 1.3-1 1.6-2.5 2s-2.5.7-2.5 2a2.5 2 0 0 0 5 0" /></svg> },
        ].map((action) => (
          <a key={action.label} href={action.href} className="p-[15px_6px] text-center border-r border-[#E3DACA] last:border-r-0">
            <div className="flex justify-center">{action.icon}</div>
            <div className="text-[11px] font-semibold text-[#3A3024] mt-2">{action.label}</div>
          </a>
        ))}
      </div>

      {/* Recent orders */}
      <div className="px-[18px] md:px-10 md:max-w-[1280px] md:mx-auto pt-[26px]">
        <div className="flex items-baseline justify-between">
          <EdHeading level={3} className="text-[18px]">최근 주문</EdHeading>
          <span className="font-mono text-[11px] text-[#8A7C68]">전체 →</span>
        </div>
        <div className="mt-[13px] border-t-[1.5px] border-ink">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center gap-[13px] py-[13px] border-b border-[#E3DACA]">
              <div className="w-[44px] h-[44px] bg-cream overflow-hidden flex-none">
                <img src={o.img} alt={o.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-ink truncate">{o.name}</div>
                <div className="font-mono text-[10px] text-[#A89B86] mt-[3px]">{o.no} · {o.t}</div>
              </div>
              <div className="text-right flex-none">
                <div className="font-mono text-[13.5px] font-semibold text-ink">{o.amt}</div>
                <span className={`inline-block mt-1 font-mono text-[9.5px] font-semibold ${o.stColor} border border-current py-[1px] px-1.5`}>{o.st}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EdBottomTabBar activeTab="mine" />
    </div>
  );
}
