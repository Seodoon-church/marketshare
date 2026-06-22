'use client';

import { EdHeader } from '@/components/redesign/EdHeader';
import { EdFooter } from '@/components/redesign/EdFooter';
import { EdBottomTabBar } from '@/components/redesign/EdBottomTabBar';
import { EdHeading } from '@/components/redesign/EdHeading';
import { EdLabel } from '@/components/redesign/EdLabel';
import { EdButton } from '@/components/redesign/EdButton';
import { EdMarquee } from '@/components/redesign/EdMarquee';
import { EdBadge } from '@/components/redesign/EdBadge';
import { IconStar } from '@/components/redesign/icons';

/* ─── static demo data ─── */
const deals = [
  { id: 'dp5', name: 'DP5 세럼 50ml', mall: '데이지 뷰티', unit: 'A-204', off: '-38%', price: '18,900', img: '/images/redesign/dp5.png' },
  { id: 'dp1', name: '멀티비타민 60정', mall: '더헬스랩', unit: 'B-117', off: '-25%', price: '24,500', img: '/images/redesign/dp1.png' },
  { id: 'dp9', name: '약산성 샴푸 500ml', mall: '모던리빙', unit: 'C-301', off: '-30%', price: '16,900', img: '/images/redesign/dp9.png' },
  { id: 'dp15', name: '수제 허브티 세트', mall: '그래놀라하우스', unit: 'A-118', off: '-20%', price: '22,000', img: '/images/redesign/dp15.png' },
];

const goods = [
  { id: 'dp5', name: 'DP5 세럼 50ml', mall: '데이지 뷰티', unit: 'A-204', off: '-38%', price: '18,900', rating: '4.9', reviews: '247', img: '/images/redesign/dp5.png' },
  { id: 'dp1', name: '멀티비타민 60정', mall: '더헬스랩', unit: 'B-117', off: '-25%', price: '24,500', rating: '4.8', reviews: '189', img: '/images/redesign/dp1.png' },
  { id: 'dp9', name: '약산성 샴푸 500ml', mall: '모던리빙', unit: 'C-301', off: '-30%', price: '16,900', rating: '4.7', reviews: '312', img: '/images/redesign/dp9.png' },
  { id: 'dp12', name: '섬유유연제 1L', mall: '모던리빙', unit: 'C-301', off: '-22%', price: '12,900', rating: '4.6', reviews: '156', img: '/images/redesign/dp12.png' },
  { id: 'dp6', name: '수분크림 80ml', mall: '데이지 뷰티', unit: 'A-204', off: '-15%', price: '32,000', rating: '4.9', reviews: '421', img: '/images/redesign/dp6.png' },
  { id: 'dp16', name: '콜드브루 원두 200g', mall: '그래놀라하우스', unit: 'A-118', off: '-18%', price: '15,800', rating: '4.8', reviews: '98', img: '/images/redesign/dp16.png' },
];

const floors = [
  { fl: '6F', cat: '뷰티·코스메틱', qty: '12', highlight: false },
  { fl: '5F', cat: '헬스·웰니스', qty: '04', highlight: true },
  { fl: '4F', cat: '패션·잡화', qty: '27', highlight: false },
  { fl: '3F', cat: '생활·리빙', qty: '09', highlight: false },
  { fl: '2F', cat: '식품·음료', qty: '31', highlight: false },
  { fl: '1F', cat: '라이브 스튜디오', qty: 'LIVE', highlight: true },
];

const ranks = [
  { no: '01', name: '데이지 뷰티', unit: 'A-204', cat: '뷰티·코스메틱 · 분양 2년차', vol: '₩4.2M', arrow: '▲ 12%', arrowUp: true, img: '/images/redesign/ms-r1.png' },
  { no: '02', name: '더헬스랩', unit: 'B-117', cat: '건강기능식품 · 분양 1년차', vol: '₩3.8M', arrow: '▲ 8%', arrowUp: true, img: '/images/redesign/ms-r2.png' },
  { no: '03', name: '모던리빙', unit: 'C-301', cat: '생활용품 · 분양 3년차', vol: '₩2.9M', arrow: '▲ 5%', arrowUp: true, img: '/images/redesign/ms-r3.png' },
  { no: '04', name: '그래놀라하우스', unit: 'A-118', cat: '식품·음료 · 분양 1년차', vol: '₩2.1M', arrow: '▼ 3%', arrowUp: false, img: '/images/redesign/ms-r4.png' },
];

const units = [
  { name: '데이지 뷰티', unit: 'A-204호', cat: '뷰티·화장품', rating: '4.9', follower: '3.2천', status: '운영중', statusType: 'active' as const },
  { name: '더헬스랩', unit: 'B-117호', cat: '건강기능식품', rating: '4.8', follower: '1.8천', status: '마감임박', statusType: 'closing' as const },
  { name: '모던리빙', unit: 'C-301호', cat: '생활용품', rating: '4.7', follower: '2.4천', status: '운영중', statusType: 'active' as const },
  { name: '그래놀라하우스', unit: 'A-118호', cat: '식품·음료', rating: '4.9', follower: '5.1천', status: '분양중', statusType: 'leasing' as const },
];

const steps = [
  { no: '01', t: '신청서 작성', d: '기본 정보와 사업 카테고리를 입력합니다. 3분이면 충분합니다.' },
  { no: '02', t: '심사 & 승인', d: '평균 이틀 내에 승인되며, 본사 상품이 자동으로 입고됩니다.' },
  { no: '03', t: '점포 꾸미기', d: '테마, 배너, 카테고리를 설정하고 나만의 상품을 등록하세요.' },
  { no: '04', t: '판매 & 정산', d: '판매·추천·접속 세 갈래 수수료가 매월 자동 정산됩니다.' },
];

const pgs = ['이니시스', '카카오페이', '네이버페이', 'KCP', 'LG U+', '토스페이', '이니시스', '카카오페이', '네이버페이', 'KCP', 'LG U+', '토스페이'];

const statusStyles = {
  active: 'text-ink border-[#C9BBA3]',
  closing: 'text-brass border-brass',
  leasing: 'text-[#9A6B12] border-[#D9B86A]',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <EdHeader />

      {/* ─── MOBILE ─── */}
      <div className="md:hidden pb-24">
        {/* Hero Cover */}
        <section className="px-[18px] pt-7">
          <EdLabel className="text-brass">FOR LEASE — 분양 모집중</EdLabel>
          <h1 className="font-serif text-[43px] leading-[1.14] tracking-tight font-bold text-ink mt-4">
            비어 있는 한 칸을,<br />당신의 <span className="text-brass border-b-2 border-brass pb-[1px]">상호</span>로.
          </h1>
          <p className="mt-5 text-[14.5px] leading-[1.75] text-[#6E6253] max-w-[300px]">
            상가를 분양받듯, 온라인 점포 한 칸을 분양받으세요. 본사 상품·결제·정산이 갖춰진 내 가게가 오늘 문을 엽니다.
          </p>

          {/* Stats */}
          <div className="flex mt-[26px] border-t border-ink border-b border-b-ink">
            <div className="flex-1 py-[13px] border-r border-[#E3DACA]">
              <div className="font-mono text-[18px] font-semibold text-ink">8,420</div>
              <div className="text-[10.5px] text-[#8A7C68] mt-1">입주 점포</div>
            </div>
            <div className="flex-1 py-[13px] pl-[14px] border-r border-[#E3DACA]">
              <div className="font-mono text-[18px] font-semibold text-brass">1,204</div>
              <div className="text-[10.5px] text-[#8A7C68] mt-1">분양 가능</div>
            </div>
            <div className="flex-1 py-[13px] pl-[14px]">
              <div className="font-mono text-[18px] font-semibold text-ink">0원</div>
              <div className="text-[10.5px] text-[#8A7C68] mt-1">개설 비용</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-[9px] mt-[18px]">
            <EdButton variant="brass" size="lg" href="/franchise" className="flex-1">분양 신청서 작성</EdButton>
            <EdButton variant="outline" size="lg" href="/shop">상가 둘러보기</EdButton>
          </div>
        </section>

        {/* 오늘의 특가 */}
        <section className="pt-[30px]">
          <div className="flex items-baseline justify-between px-[18px]">
            <EdHeading level={2} className="text-[22px]">오늘의 입점 특가</EdHeading>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-sale-red tracking-[.04em]">
              <span className="w-[5px] h-[5px] rounded-full bg-sale-red" />오늘 24시 마감
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-[18px] pt-[14px] pb-1 scrollbar-none">
            {deals.map((d) => (
              <a key={d.id} href={`/products/${d.id}`} className="flex-none w-[148px]">
                <div className="relative w-[148px] h-[148px] bg-cream overflow-hidden">
                  <img src={d.img} alt={d.name} className="w-full h-full object-cover" />
                  <span className="absolute top-0 left-0 font-mono text-[12px] font-bold text-white bg-sale-red py-1 px-2">{d.off}</span>
                </div>
                <div className="font-mono text-[10px] text-brass mt-[9px] tracking-[.04em]">{d.unit} · {d.mall}</div>
                <div className="text-[12.5px] text-[#3A3024] font-semibold leading-snug mt-1 line-clamp-2">{d.name}</div>
                <div className="flex items-baseline gap-[5px] mt-[5px]">
                  <span className="font-mono text-[11px] font-bold text-sale-red">{d.off}</span>
                  <span className="font-mono text-[15px] font-semibold text-ink">{d.price}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Featured Plate */}
        <section className="px-[18px] pt-[34px]">
          <div className="flex items-center gap-[10px] mb-[13px]">
            <EdLabel uppercase={false} className="text-[10px] tracking-[.16em] text-[#8A7C68]">금주의 매물 — FEATURED</EdLabel>
            <div className="flex-1 h-px bg-[#E3DACA]" />
          </div>
          <a href="/malls/daisy-beauty" className="block border border-ink bg-[#FCFAF5]">
            <div className="relative aspect-[4/5] bg-[#EAD9C5] overflow-hidden border-b border-ink">
              <img src="/images/redesign/store-featured.png" alt="데이지 뷰티" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none" />
              <div className="absolute top-[13px] left-[13px] font-mono text-[11px] tracking-[.06em] text-ink bg-paper border border-ink py-1 px-2">A-204 · 본점</div>
              <div className="absolute top-[13px] right-[13px] w-[58px] h-[58px] border-[1.5px] border-brass rounded-full flex items-center justify-center -rotate-[9deg]">
                <div className="absolute inset-[4px] border border-[rgba(224,81,42,.5)] rounded-full" />
                <span className="font-mono text-[11px] font-semibold text-brass tracking-[.04em]">운영중</span>
              </div>
              <div className="absolute bottom-[11px] left-[13px] font-mono text-[9px] tracking-[.2em] text-ink/45">— 점포 전경</div>
            </div>
            <div className="py-[15px] px-4 flex items-end justify-between">
              <div>
                <div className="font-serif text-[22px] font-bold text-ink">데이지 뷰티</div>
                <div className="text-[12px] text-[#8A7C68] mt-[5px]">뷰티·코스메틱 · 분양 2년차 · ★ 4.9</div>
              </div>
              <span className="font-mono text-[12px] font-semibold text-brass">점포 보기 →</span>
            </div>
          </a>
        </section>

        {/* 상가 인기 상품 */}
        <section className="px-[18px] pt-9">
          <div className="flex items-baseline justify-between">
            <EdHeading level={2} className="text-[24px]">상가 인기 상품</EdHeading>
            <a href="/shop" className="font-mono text-[11px] font-semibold text-[#8A7C68] tracking-[.06em]">전체 →</a>
          </div>
          <div className="font-mono text-[10.5px] text-brass tracking-[.1em] mt-[7px]">8,420개 점포 · 실시간 베스트</div>
          <div className="grid grid-cols-2 gap-[14px_13px] mt-4">
            {goods.map((g) => (
              <a key={g.id} href={`/products/${g.id}`} className="block">
                <div className="relative w-full aspect-square bg-cream overflow-hidden">
                  <img src={g.img} alt={g.name} className="w-full h-full object-cover" />
                  <span className="absolute top-0 left-0 font-mono text-[12px] font-bold text-white bg-sale-red py-1 px-[9px]">{g.off}</span>
                  <span className="absolute bottom-[9px] right-[9px] w-[34px] h-[34px] bg-white/92 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1815" strokeWidth="1.8"><path d="M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0" /></svg>
                  </span>
                </div>
                <div className="font-mono text-[10px] text-brass mt-[10px] tracking-[.04em]">{g.unit} · {g.mall}</div>
                <div className="text-[13.5px] text-[#2A2520] font-semibold leading-[1.4] mt-1 line-clamp-2">{g.name}</div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="font-mono text-[12px] font-bold text-sale-red">{g.off}</span>
                  <span className="font-mono text-[17px] font-semibold text-ink tracking-tight">{g.price}</span>
                </div>
                <div className="flex items-center gap-1 mt-[5px]">
                  <IconStar size={12} className="text-brass" />
                  <span className="text-[11.5px] font-bold text-[#6E6253]">{g.rating}</span>
                  <span className="text-[11px] text-[#A89B86]">({g.reviews})</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 층별 안내 */}
        <section className="px-[18px] pt-9">
          <div className="flex items-baseline justify-between">
            <EdHeading level={2} className="text-[24px]">층별 안내</EdHeading>
            <span className="font-mono text-[10px] tracking-[.12em] text-[#8A7C68]">DIRECTORY / 잔여</span>
          </div>
          <div className="mt-[14px] border-t border-ink">
            {floors.map((f) => (
              <a key={f.fl} href={f.fl === '1F' ? '/live' : '/shop'} className="flex items-center gap-3 py-[14px] border-b border-[#E3DACA]">
                <span className="w-[34px] font-mono text-[15px] font-semibold text-ink">{f.fl}</span>
                <span className="text-[14.5px] font-semibold text-[#3A3024]">{f.cat}</span>
                <div className="flex-1 border-b border-dotted border-[#C9BBA3] -translate-y-[3px] mx-1" />
                <span className="font-mono text-[11px] text-[#8A7C68]">잔여</span>
                <span className={`w-[44px] text-right font-mono text-[15px] font-bold ${f.highlight ? 'text-brass' : 'text-[#e7dcc9]'}`}>{f.qty}</span>
              </a>
            ))}
          </div>
        </section>

        {/* 실시간 인기 점포 */}
        <section className="px-[18px] pt-9">
          <div className="flex items-baseline justify-between">
            <EdHeading level={2} className="text-[24px]">실시간 인기 점포</EdHeading>
            <span className="font-mono text-[10px] tracking-[.12em] text-brass">금일 거래액순</span>
          </div>
          <div className="mt-[15px] flex flex-col gap-3">
            {ranks.map((r) => (
              <a key={r.no} href="/malls/store" className="flex items-center gap-[13px]">
                <span className="w-5 font-mono text-[18px] font-bold text-ink flex-none">{r.no}</span>
                <div className="w-14 h-14 bg-cream overflow-hidden flex-none">
                  <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-[16px] font-bold text-ink">{r.name}</span>
                    <span className="font-mono text-[9.5px] text-brass border border-[#E3DACA] py-[1px] px-[5px]">{r.unit}</span>
                  </div>
                  <div className="text-[11.5px] text-[#8A7C68] mt-1">{r.cat}</div>
                </div>
                <div className="text-right flex-none">
                  <div className="font-mono text-[14px] font-semibold text-ink">{r.vol}</div>
                  <div className={`font-mono text-[10px] mt-[3px] ${r.arrowUp ? 'text-jade' : 'text-sale-red'}`}>{r.arrow} 거래액</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 새로 문 연 점포 */}
        <section className="px-[18px] pt-9">
          <div className="flex items-baseline justify-between">
            <EdHeading level={2} className="text-[24px]">새로 문 연 점포</EdHeading>
            <a href="/shop" className="font-mono text-[11px] font-semibold text-[#8A7C68] tracking-[.06em]">전체 →</a>
          </div>
          <div className="mt-[14px] border-t border-ink">
            {units.map((u) => (
              <a key={u.unit} href="/malls/store" className="flex items-center gap-[13px] py-[15px] border-b border-[#E3DACA]">
                <span className="w-[58px] font-mono text-[12px] font-semibold text-brass flex-none">{u.unit}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[17px] font-bold text-ink leading-[1.2]">{u.name}</div>
                  <div className="text-[11.5px] text-[#8A7C68] mt-1">{u.cat} · ★ {u.rating} · 팔로워 {u.follower}</div>
                </div>
                <span className={`flex-none font-mono text-[10px] font-semibold border py-[3px] px-2 tracking-[.03em] ${statusStyles[u.statusType]}`}>{u.status}</span>
              </a>
            ))}
          </div>
        </section>

        {/* 분양 절차 */}
        <section className="px-[18px] pt-[38px]">
          <EdLabel className="text-[#8A7C68]">분양 절차 — PROCEDURE</EdLabel>
          <EdHeading level={2} className="text-[24px] mt-2 mb-1.5">신청부터 라이브까지, 네 단계</EdHeading>
          <div className="mt-3 border-t border-ink">
            {steps.map((s) => (
              <div key={s.no} className="flex gap-4 py-4 border-b border-[#E3DACA]">
                <span className="font-mono text-[14px] font-semibold text-brass pt-0.5">{s.no}</span>
                <div className="flex-1">
                  <div className="font-serif text-[17px] font-bold text-ink">{s.t}</div>
                  <div className="text-[13px] text-[#6E6253] mt-[5px] leading-relaxed">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 수익 구조 */}
        <section className="px-[18px] pt-[38px]">
          <EdLabel className="text-[#8A7C68]">정산 — REVENUE</EdLabel>
          <EdHeading level={2} className="text-[24px] mt-2 mb-1">세 갈래로 들어오는 수익</EdHeading>
          <p className="text-[13.5px] text-[#6E6253] mb-4">내 판매 · 추천 · 접속 수수료가 함께 쌓입니다.</p>
          <div className="bg-ink p-[22px_20px]">
            <div className="flex items-center justify-between border-b border-[#3A3024] pb-3">
              <span className="text-[12.5px] text-[#A99C88]">이번 달 정산 예정</span>
              <span className="font-mono text-[10px] text-[#86B9A4] tracking-[.08em]">06.25 입금</span>
            </div>
            <div className="font-mono text-[30px] font-semibold text-paper mt-[14px] tracking-tight">₩2,418,500</div>
            <div className="flex mt-4 border-t border-[#3A3024]">
              <div className="flex-1 pt-3 border-r border-[#3A3024]">
                <div className="text-[10.5px] text-[#8A7C68]">판매</div>
                <div className="font-mono text-[14px] text-[#E7DCC9] mt-[3px]">1.92M</div>
              </div>
              <div className="flex-1 pt-3 pl-[14px] border-r border-[#3A3024]">
                <div className="text-[10.5px] text-[#8A7C68]">추천</div>
                <div className="font-mono text-[14px] text-[#E7DCC9] mt-[3px]">340K</div>
              </div>
              <div className="flex-1 pt-3 pl-[14px]">
                <div className="text-[10.5px] text-[#8A7C68]">접속</div>
                <div className="font-mono text-[14px] text-[#E7DCC9] mt-[3px]">158K</div>
              </div>
            </div>
          </div>
          <div className="flex border border-ink border-t-0">
            <div className="flex-1 p-[14px_16px] border-r border-[#E3DACA]">
              <div className="font-mono text-[19px] font-semibold text-ink">5→0.5%</div>
              <div className="text-[11.5px] text-[#8A7C68] mt-1">플랜별 판매수수료</div>
            </div>
            <div className="flex-1 p-[14px_16px]">
              <div className="font-mono text-[19px] font-semibold text-ink">월 2회</div>
              <div className="text-[11.5px] text-[#8A7C68] mt-1">자동 정산 사이클</div>
            </div>
          </div>
        </section>

        {/* LIVE strip */}
        <a href="/live" className="block mx-[18px] mt-[38px] bg-ink p-[22px_20px]">
          <span className="inline-flex items-center gap-[7px] font-mono text-[10px] tracking-[.1em] text-brass">
            <span className="relative flex w-[6px] h-[6px]">
              <span className="absolute inset-0 rounded-full bg-brass animate-ping" />
              <span className="relative w-[6px] h-[6px] rounded-full bg-brass" />
            </span>
            ON AIR — 1F 라이브 스튜디오
          </span>
          <h3 className="font-serif text-[22px] font-bold text-paper mt-[14px]">방송하며, 그 자리에서 판매</h3>
          <p className="text-[13px] text-[#A99C88] leading-relaxed mt-[9px]">
            유튜브 URL 한 줄이면 내 점포가 곧 생방송 매대가 됩니다. 지금 <span className="font-mono text-paper">1,247</span>명 시청 중.
          </p>
          <div className="flex items-center justify-between mt-4 pt-[14px] border-t border-[#3A3024]">
            <span className="text-[12.5px] text-[#A99C88]">생방송 매대 입장</span>
            <span className="font-mono text-[12px] text-brass">입장 →</span>
          </div>
        </a>

        {/* 요금제 */}
        <section className="px-[18px] pt-[38px]">
          <EdLabel className="text-[#8A7C68]">분양가 — PLANS</EdLabel>
          <EdHeading level={2} className="text-[24px] mt-2 mb-4">합리적인 분양 조건</EdHeading>
          <div className="border border-ink">
            <div className="flex items-center justify-between p-4 border-b border-[#E3DACA]">
              <div>
                <div className="font-serif text-[17px] font-bold text-ink">무료</div>
                <div className="text-[11.5px] text-[#8A7C68] mt-[3px]">판매수수료 5% · 상품 30칸</div>
              </div>
              <div className="font-mono text-[18px] font-semibold text-ink">0원</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-ink">
              <div>
                <div className="font-serif text-[17px] font-bold text-paper">
                  비즈니스{' '}
                  <EdBadge variant="default" className="bg-brass text-ink border-0 text-[9px] align-middle ml-1">인기</EdBadge>
                </div>
                <div className="text-[11.5px] text-[#A99C88] mt-[5px]">판매수수료 1.5% · 무제한 · 라이브</div>
              </div>
              <div className="font-mono text-[18px] font-semibold text-paper">39,900<span className="text-[11px] text-[#8A7C68]">/월</span></div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-[18px] mt-[38px] border border-ink bg-brass p-[30px_22px]">
          <EdLabel uppercase={false} className="text-[10px] tracking-[.16em] text-[#5C4A28]">분양 안내소 — 09:00–18:00</EdLabel>
          <h2 className="font-serif text-[26px] font-bold text-white leading-[1.25] mt-3">
            오늘, 한 칸을<br />당신의 이름으로.
          </h2>
          <p className="text-[13px] text-[#EFE7D6] mt-3 mb-[18px]">개설비 0원 · 평균 이틀 승인 · 본사 상품 자동 입고</p>
          <EdButton variant="ink" size="lg" href="/franchise" fullWidth>분양 신청서 작성하기</EdButton>
        </section>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="hidden md:block">
        {/* Hero 2-column */}
        <section className="max-w-[1280px] mx-auto px-10 pt-16 grid grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <div>
            <EdLabel className="text-brass">FOR LEASE — 분양 모집중</EdLabel>
            <h1 className="font-serif text-[64px] leading-[1.12] tracking-tight font-bold text-ink mt-[22px]">
              비어 있는 한 칸을,<br />당신의 <span className="border-b-[3px] border-brass pb-[2px]">상호</span>로.
            </h1>
            <p className="mt-[26px] text-[17px] leading-[1.75] text-[#6E6253] max-w-[460px]">
              상가를 분양받듯, 온라인 점포 한 칸을 분양받으세요. 본사 상품·결제·정산이 갖춰진 내 가게가 오늘 문을 엽니다.
            </p>
            <div className="flex gap-3 mt-[34px]">
              <EdButton variant="brass" size="lg" href="/franchise">분양 신청서 작성</EdButton>
              <EdButton variant="outline" size="lg" href="/shop">상가 둘러보기</EdButton>
            </div>
            <div className="flex mt-[44px] border-t-[1.5px] border-ink border-b-[1.5px] border-b-ink">
              <div className="flex-1 py-[18px] border-r border-[#E3DACA]">
                <div className="font-mono text-[24px] font-semibold text-ink">8,420</div>
                <div className="text-[12px] text-[#8A7C68] mt-[5px]">입주 점포</div>
              </div>
              <div className="flex-1 py-[18px] pl-5 border-r border-[#E3DACA]">
                <div className="font-mono text-[24px] font-semibold text-brass">1,204</div>
                <div className="text-[12px] text-[#8A7C68] mt-[5px]">분양 가능</div>
              </div>
              <div className="flex-1 py-[18px] pl-5">
                <div className="font-mono text-[24px] font-semibold text-ink">0원</div>
                <div className="text-[12px] text-[#8A7C68] mt-[5px]">개설 비용</div>
              </div>
            </div>
          </div>
          <div className="relative border-[1.5px] border-ink">
            <div className="aspect-[4/5] overflow-hidden">
              <img src="/images/redesign/store-featured.png" alt="데이지 뷰티" className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500" />
            </div>
            <div className="absolute top-4 left-4 font-mono text-[12px] text-ink bg-paper border border-ink py-[5px] px-[10px]">A-204 · 데이지 뷰티</div>
            <div className="absolute bottom-0 left-0 right-0 p-[18px] bg-gradient-to-t from-ink/78 to-transparent flex items-end justify-between">
              <div>
                <div className="font-serif text-[22px] font-bold text-white">데이지 뷰티</div>
                <div className="text-[12.5px] text-cream mt-1">뷰티·코스메틱 · ★ 4.9</div>
              </div>
              <span className="font-mono text-[12px] text-[#E8C89A]">점포 보기 →</span>
            </div>
          </div>
        </section>

        {/* PG Marquee */}
        <EdMarquee items={pgs} className="mt-16" />

        {/* Directory + Products 2-column */}
        <section className="max-w-[1280px] mx-auto px-10 pt-[72px] grid grid-cols-[0.8fr_1.2fr] gap-14">
          <div>
            <div className="flex items-baseline justify-between">
              <EdHeading level={2}>층별 안내</EdHeading>
              <span className="font-mono text-[10px] tracking-[.12em] text-[#8A7C68]">DIRECTORY</span>
            </div>
            <div className="mt-4 border-t-[1.5px] border-ink">
              {floors.map((f) => (
                <a key={f.fl} href={f.fl === '1F' ? '/live' : '/shop'} className="flex items-center gap-3 py-[14px] border-b border-[#E3DACA] hover:bg-cream/40 transition-colors">
                  <span className="w-[34px] font-mono text-[15px] font-semibold text-ink">{f.fl}</span>
                  <span className="text-[14.5px] font-semibold text-[#3A3024]">{f.cat}</span>
                  <div className="flex-1 border-b border-dotted border-[#C9BBA3] -translate-y-[3px] mx-1" />
                  <span className="font-mono text-[11px] text-[#8A7C68]">잔여</span>
                  <span className={`w-[44px] text-right font-mono text-[15px] font-bold ${f.highlight ? 'text-brass' : 'text-[#e7dcc9]'}`}>{f.qty}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <EdHeading level={2}>상가 인기 상품</EdHeading>
              <a href="/shop" className="font-mono text-[11px] font-semibold text-[#8A7C68] tracking-[.06em]">전체 →</a>
            </div>
            <div className="grid grid-cols-3 gap-5 mt-4">
              {goods.slice(0, 6).map((g) => (
                <a key={g.id} href={`/products/${g.id}`} className="block group">
                  <div className="relative w-full aspect-square bg-cream overflow-hidden">
                    <img src={g.img} alt={g.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    <span className="absolute top-0 left-0 font-mono text-[12px] font-bold text-white bg-sale-red py-1 px-[9px]">{g.off}</span>
                  </div>
                  <div className="font-mono text-[10px] text-brass mt-[10px] tracking-[.04em]">{g.unit} · {g.mall}</div>
                  <div className="text-[13.5px] text-[#2A2520] font-semibold leading-[1.4] mt-1 line-clamp-2">{g.name}</div>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="font-mono text-[12px] font-bold text-sale-red">{g.off}</span>
                    <span className="font-mono text-[17px] font-semibold text-ink tracking-tight">{g.price}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Ink Revenue Band */}
        <section className="mt-[72px] bg-ink">
          <div className="max-w-[1280px] mx-auto px-10 py-16 grid grid-cols-3 gap-12">
            <div>
              <div className="font-mono text-[42px] font-semibold text-paper tracking-tight">₩24.8B</div>
              <div className="text-[14px] text-[#A99C88] mt-2">누적 거래액</div>
            </div>
            <div>
              <div className="font-mono text-[42px] font-semibold text-paper tracking-tight">8,420</div>
              <div className="text-[14px] text-[#A99C88] mt-2">입주 점포</div>
            </div>
            <div>
              <div className="font-mono text-[42px] font-semibold text-brass tracking-tight">98.4%</div>
              <div className="text-[14px] text-[#A99C88] mt-2">정산 완료율</div>
            </div>
          </div>
        </section>

        {/* 3-column Pricing */}
        <section className="max-w-[1280px] mx-auto px-10 pt-[72px]">
          <div className="text-center">
            <EdLabel className="text-[#8A7C68]">분양가 — PLANS</EdLabel>
            <EdHeading level={2} className="mt-2">합리적인 분양 조건</EdHeading>
          </div>
          <div className="grid grid-cols-3 gap-0 mt-10 border border-ink">
            {/* Free */}
            <div className="p-8 border-r border-[#E3DACA]">
              <div className="font-serif text-[20px] font-bold text-ink">무료</div>
              <div className="font-mono text-[32px] font-semibold text-ink mt-4">0원</div>
              <div className="text-[13px] text-[#8A7C68] mt-1">시작 비용 없음</div>
              <div className="mt-6 space-y-3 text-[13.5px] text-[#3A3024]">
                <div>판매수수료 5%</div>
                <div>상품 30칸</div>
                <div>기본 테마 1종</div>
              </div>
              <EdButton variant="outline" size="md" href="/franchise" fullWidth className="mt-8">시작하기</EdButton>
            </div>
            {/* Business */}
            <div className="p-8 bg-ink text-paper">
              <div className="flex items-center gap-2">
                <span className="font-serif text-[20px] font-bold">비즈니스</span>
                <EdBadge variant="default" className="bg-brass text-ink border-0">인기</EdBadge>
              </div>
              <div className="font-mono text-[32px] font-semibold mt-4">39,900<span className="text-[14px] text-[#8A7C68]">/월</span></div>
              <div className="text-[13px] text-[#A99C88] mt-1">가장 많이 선택</div>
              <div className="mt-6 space-y-3 text-[13.5px] text-[#E7DCC9]">
                <div>판매수수료 1.5%</div>
                <div>무제한 상품</div>
                <div>라이브 커머스</div>
                <div>프리미엄 테마 5종</div>
              </div>
              <EdButton variant="brass" size="md" href="/franchise" fullWidth className="mt-8">분양 신청</EdButton>
            </div>
            {/* Enterprise */}
            <div className="p-8 border-l border-[#E3DACA]">
              <div className="font-serif text-[20px] font-bold text-ink">엔터프라이즈</div>
              <div className="font-mono text-[32px] font-semibold text-ink mt-4">별도 문의</div>
              <div className="text-[13px] text-[#8A7C68] mt-1">대량 분양 · 커스텀</div>
              <div className="mt-6 space-y-3 text-[13.5px] text-[#3A3024]">
                <div>판매수수료 0.5%</div>
                <div>전용 서버</div>
                <div>전담 매니저</div>
                <div>커스텀 개발</div>
              </div>
              <EdButton variant="outline" size="md" href="/franchise" fullWidth className="mt-8">문의하기</EdButton>
            </div>
          </div>
        </section>

        {/* Brass CTA */}
        <section className="max-w-[1280px] mx-auto px-10 mt-[72px] mb-[72px]">
          <div className="border border-ink bg-brass p-16 text-center">
            <EdLabel uppercase={false} className="text-[#5C4A28]">분양 안내소 — 09:00–18:00</EdLabel>
            <h2 className="font-serif text-[42px] font-bold text-white leading-[1.2] mt-4">
              오늘, 한 칸을 당신의 이름으로.
            </h2>
            <p className="text-[15px] text-[#EFE7D6] mt-4 mb-8">개설비 0원 · 평균 이틀 승인 · 본사 상품 자동 입고</p>
            <EdButton variant="ink" size="lg" href="/franchise">분양 신청서 작성하기</EdButton>
          </div>
        </section>

        <EdFooter />
      </div>

      <EdBottomTabBar activeTab="home" />
    </div>
  );
}
