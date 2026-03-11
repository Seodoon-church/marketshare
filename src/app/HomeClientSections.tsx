'use client';

import { useCountUp } from '@/components/common/AnimateOnScroll';
import { Accordion } from '@/components/ui/Accordion';

/* ------------------------------------------------------------------ */
/*  Hero Stats with Count-Up Animation                                */
/* ------------------------------------------------------------------ */

export function HeroStats() {
  const products = useCountUp(1000, 2000);
  const malls = useCountUp(50, 1800);

  return (
    <div className="mt-12 flex gap-8 md:gap-12">
      <div ref={products.ref as React.RefObject<HTMLDivElement>}>
        <p className="text-2xl font-bold text-white md:text-3xl tabular-nums">
          {products.count.toLocaleString()}+
        </p>
        <p className="mt-1 text-sm text-gray-400">등록 상품</p>
      </div>
      <div ref={malls.ref as React.RefObject<HTMLDivElement>}>
        <p className="text-2xl font-bold text-white md:text-3xl tabular-nums">
          {malls.count}+
        </p>
        <p className="mt-1 text-sm text-gray-400">입점 쇼핑몰</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-white md:text-3xl">5초</p>
        <p className="mt-1 text-sm text-gray-400">몰 개설 시간</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Section                                                       */
/* ------------------------------------------------------------------ */

const faqItems = [
  {
    title: '분양몰 개설 비용이 있나요?',
    content: '무료 요금제로 시작하실 수 있습니다. 무료 요금제는 상품 30개까지 등록 가능하며, 판매수수료 5%만 부과됩니다. 비즈니스 규모에 따라 유료 요금제로 업그레이드하시면 더 낮은 수수료율과 추가 기능을 이용하실 수 있습니다.',
  },
  {
    title: '상품 등록은 어떻게 하나요?',
    content: '본사에서 등록한 상품이 분양몰에 자동으로 연동됩니다. 분양몰 운영자는 추가로 자체 상품을 등록할 수도 있습니다. 엑셀 대량 등록 기능도 지원하여 수백 개 상품을 한 번에 등록할 수 있습니다.',
  },
  {
    title: '정산은 어떻게 이루어지나요?',
    content: '매월 1일에 전월 판매분에 대한 정산이 자동으로 진행됩니다. 정산 내역은 관리자 페이지에서 실시간으로 확인할 수 있으며, 세금계산서도 자동 발행됩니다.',
  },
  {
    title: '결제 수단은 어떤 것이 지원되나요?',
    content: '신용카드, 실시간 계좌이체, 가상계좌, 카카오페이, 네이버페이를 지원합니다. KG이니시스, KCP, LG U+ 등 주요 PG사와 연동되어 안정적인 결제 환경을 제공합니다.',
  },
  {
    title: '커스텀 도메인을 연결할 수 있나요?',
    content: 'Starter 요금제(월 19,900원)부터 커스텀 도메인 연결이 가능합니다. 무료 요금제에서는 marketshare.kr 서브도메인이 제공됩니다.',
  },
  {
    title: '기술 지원은 어떻게 받을 수 있나요?',
    content: '평일 09:00~18:00 전화 및 채팅 상담을 제공합니다. Business 이상 요금제에서는 전담 매니저가 배정되며, Enterprise 요금제에서는 24시간 기술 지원이 가능합니다.',
  },
];

export function FAQSection() {
  return (
    <Accordion
      items={faqItems}
      allowMultiple
      className="space-y-3"
    />
  );
}
