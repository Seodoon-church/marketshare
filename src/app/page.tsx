import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SmartCTALink } from '@/components/common/SmartCTALink';
import { AnimateOnScroll } from '@/components/common/AnimateOnScroll';
import { PRICING_PLANS } from '@/lib/data/pricing';
import { formatKRW } from '@/lib/utils/format';
import { HeroStats, FAQSection } from './HomeClientSections';
import {
  RocketLaunchIcon,
  CubeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  PlayCircleIcon,
  SignalIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'MarketShare',
  url: 'https://marketshare.kr',
  description: '쇼핑몰 개설부터 라이브 방송까지. YouTube 연동 라이브커머스와 분양몰 네트워크를 결합한 차세대 전자상거래 플랫폼.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://marketshare.kr/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const testimonials = [
  {
    name: '김*영',
    role: '패션몰 운영자',
    content: '호스팅비 걱정 없이 무료로 시작했는데, 2달 만에 월 매출 300만원을 넘겼습니다. 상품이 메인 마켓에 자동 노출되니까 유입이 꾸준해요.',
    rating: 5,
  },
  {
    name: '이*호',
    role: '건강식품 셀러',
    content: '다른 플랫폼은 입점비가 수백만원인데, 여기는 수수료만 내면 돼서 초기 비용 부담이 없어요. 정산도 빠르고 관리가 편리합니다.',
    rating: 5,
  },
  {
    name: '박*진',
    role: '뷰티 브랜드 대표',
    content: '라이브 방송하면서 바로 판매할 수 있어서 전환율이 3배 올랐어요. 유튜브 URL만 넣으면 되니까 기술적으로도 어렵지 않고요.',
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        {/* ============================================ */}
        {/*  Hero Section                                */}
        {/* ============================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark min-h-[600px] md:min-h-[700px] flex items-center">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }} />
          </div>

          {/* Floating Decorative Shapes */}
          <div className="pointer-events-none absolute top-20 right-[10%] h-72 w-72 rounded-full bg-primary/20 blur-[100px] animate-float-slow" />
          <div className="pointer-events-none absolute bottom-20 left-[5%] h-56 w-56 rounded-full bg-cyan-500/15 blur-[80px] animate-float" />
          <div className="pointer-events-none absolute top-1/2 right-[30%] h-40 w-40 rounded-full bg-violet-500/10 blur-[60px] animate-float-slow" style={{ animationDelay: '3s' }} />

          {/* Decorative Rings */}
          <div className="absolute -right-20 top-1/4 hidden lg:block">
            <div className="h-80 w-80 rounded-full border border-white/[0.06] animate-spin-slow" />
            <div className="absolute inset-8 rounded-full border border-white/[0.04] animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '20s' }} />
          </div>

          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4 py-20 md:py-32 w-full">
            <div className="max-w-3xl">
              {/* Badge */}
              <AnimateOnScroll variant="fadeOnly" duration={400}>
                <div className="mb-6 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm border border-white/[0.08]">
                    <SparklesIcon className="h-4 w-4 text-amber-400" />
                    분양몰 + 라이브커머스 플랫폼
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-sm text-red-300 backdrop-blur-sm border border-red-500/30">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    LIVE 커머스
                  </div>
                </div>
              </AnimateOnScroll>

              {/* Title */}
              <AnimateOnScroll variant="slideUp" delay={100} duration={700}>
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl md:leading-[1.1]">
                  쇼핑몰 개설부터
                  <br />
                  <span className="bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                    라이브 방송
                  </span>
                  까지
                </h1>
              </AnimateOnScroll>

              {/* Description */}
              <AnimateOnScroll variant="fadeIn" delay={300}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300/90 md:text-xl">
                  무료 쇼핑몰 개설 + 라이브 커머스를 하나의 플랫폼에서.
                  YouTube 연동 라이브 방송으로 실시간 판매하고, 분양몰 네트워크로 매출을 극대화하세요.
                </p>
              </AnimateOnScroll>

              {/* CTA Buttons */}
              <AnimateOnScroll variant="fadeIn" delay={450}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <SmartCTALink
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-gray-900 shadow-lg shadow-white/10 transition-all hover:bg-gray-50 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5"
                  >
                    <BuildingStorefrontIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    무료로 분양몰 개설
                  </SmartCTALink>
                  <a
                    href="/malls/demo-store"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/[0.12] hover:border-white/30"
                  >
                    <SparklesIcon className="h-5 w-5 text-amber-400" />
                    데모 체험하기
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </AnimateOnScroll>

              {/* Animated Stats */}
              <AnimateOnScroll variant="fadeIn" delay={600}>
                <HeroStats />
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  Trust Bar                                   */}
        {/* ============================================ */}
        <section className="border-b border-gray-100 bg-white py-8">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-gray-400">
              <span className="font-medium">신뢰할 수 있는 결제</span>
              <div className="flex items-center gap-6 text-gray-300">
                {['KG이니시스', '카카오페이', '네이버페이', 'KCP', 'LG U+'].map((pg) => (
                  <span key={pg} className="whitespace-nowrap font-medium text-gray-500/80 text-xs tracking-wide uppercase">
                    {pg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  Features Section                            */}
        {/* ============================================ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="fadeIn" className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                왜 <span className="text-primary">MarketShare</span>인가요?
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                분양몰 운영에 필요한 모든 기능을 제공합니다
              </p>
            </AnimateOnScroll>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: RocketLaunchIcon,
                  title: '5초만에 쇼핑몰 개설',
                  desc: '2차 도메인으로 즉시 쇼핑몰을 생성합니다. 복잡한 설정 없이 바로 판매를 시작하세요.',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: CubeIcon,
                  title: '상품 자동 연동',
                  desc: '본사 상품이 분양몰에 실시간 자동 적용됩니다. 분양몰별 가격 차등 설정도 가능합니다.',
                  color: 'from-violet-500 to-purple-500',
                },
                {
                  icon: ChartBarIcon,
                  title: '다층 수익 구조',
                  desc: '추천수수료, 판매수수료, 접속수수료로 다양한 수익 채널을 운영할 수 있습니다.',
                  color: 'from-amber-500 to-orange-500',
                },
                {
                  icon: CurrencyDollarIcon,
                  title: '한국 PG사 완벽 지원',
                  desc: 'KG이니시스, 카카오페이, 네이버페이, KCP, LG 결제 시스템을 모두 지원합니다.',
                  color: 'from-emerald-500 to-teal-500',
                },
                {
                  icon: VideoCameraIcon,
                  title: '라이브 커머스',
                  desc: 'YouTube 연동 라이브 방송으로 실시간 판매. 채팅, 상품 추천, 즉석 구매까지 원스톱으로.',
                  color: 'from-red-500 to-pink-500',
                },
                {
                  icon: UserGroupIcon,
                  title: '분양 네트워크',
                  desc: '본사 라이브 방송을 가맹점에서 동시 노출. 네트워크 효과로 판매력을 극대화합니다.',
                  color: 'from-sky-500 to-blue-500',
                },
              ].map((feature, idx) => (
                <AnimateOnScroll key={feature.title} variant="fadeIn" delay={idx * 100}>
                  <div className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1.5">
                    <div className={`inline-flex rounded-xl bg-gradient-to-br ${feature.color} p-3 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {feature.desc}
                    </p>
                    <div className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  Live Commerce Showcase                      */}
        {/* ============================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 py-20 md:py-28">
          {/* Background effects */}
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-500/10 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-pink-500/10 blur-[100px]" />

          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="fadeIn" className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-sm text-red-300 backdrop-blur-sm border border-red-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                라이브 커머스
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                방송하면서 <span className="text-red-400">바로 판매</span>하세요
              </h2>
              <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                YouTube 라이브 방송을 내 쇼핑몰에 임베드하고, 실시간 채팅과 상품 추천으로 구매 전환율을 높이세요.
              </p>
            </AnimateOnScroll>

            <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
              {/* Left: Visual mockup */}
              <AnimateOnScroll variant="slideUp" delay={100}>
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  {/* Video player mockup */}
                  <div className="relative aspect-video rounded-xl bg-gradient-to-br from-red-500/30 via-pink-500/20 to-purple-500/30 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
                    <PlayCircleIcon className="h-20 w-20 text-white/60" />
                    {/* LIVE badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      LIVE
                    </div>
                    {/* Viewer count */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                      <UserGroupIcon className="h-3.5 w-3.5" />
                      1,247명 시청 중
                    </div>
                  </div>
                  {/* Chat mockup bar */}
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-3">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-pink-400">김*영</span>
                        <span className="text-xs text-gray-400">이 제품 색상 추가 있나요?</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-400">판매자</span>
                        <span className="text-xs text-gray-400">네! 베이지, 네이비 3가지 색상 준비되어 있습니다</span>
                      </div>
                    </div>
                  </div>
                  {/* Product bar */}
                  <div className="mt-2 flex items-center gap-3 rounded-lg bg-white/[0.06] px-4 py-3">
                    <ShoppingBagIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-300">방송 중 특가</span>
                      <p className="text-sm font-semibold text-white">프리미엄 오가닉 세트 <span className="text-red-400">39,900원</span></p>
                    </div>
                    <div className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white">
                      구매하기
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* Right: Feature list */}
              <AnimateOnScroll variant="slideUp" delay={200}>
                <div className="space-y-6 lg:pl-8">
                  {[
                    {
                      icon: SignalIcon,
                      title: 'YouTube 라이브 연동',
                      desc: '유튜브에서 방송 시작 → URL만 입력하면 내 쇼핑몰에서 바로 시청 가능. 별도 스트리밍 서버 필요 없음.',
                      color: 'from-red-500 to-pink-500',
                    },
                    {
                      icon: ChatBubbleLeftRightIcon,
                      title: '실시간 채팅',
                      desc: '시청자와 실시간 소통. 질문에 즉시 답변하고 상품을 추천하세요. 구매 알림도 자동 표시.',
                      color: 'from-purple-500 to-violet-500',
                    },
                    {
                      icon: ShoppingBagIcon,
                      title: '즉석 구매 전환',
                      desc: '방송 중 상품 하이라이트 → 원클릭 장바구니 담기 → 기존 결제 플로우 연결. 이탈 없는 쇼핑 경험.',
                      color: 'from-emerald-500 to-teal-500',
                    },
                    {
                      icon: UserGroupIcon,
                      title: '가맹점 동시 방송',
                      desc: '본사 라이브를 모든 가맹점 쇼핑몰에서 동시 노출. 네트워크 전체에서 판매력 극대화.',
                      color: 'from-amber-500 to-orange-500',
                    },
                  ].map((item, idx) => (
                    <div key={item.title} className="flex gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  Live Demo Section                           */}
        {/* ============================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 md:py-28">
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }} />
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="fadeIn" className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm border border-white/[0.08]">
                <StarIcon className="h-4 w-4 text-amber-400" />
                실제 동작하는 라이브 데모
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                직접 체험해보세요
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                쇼핑몰부터 라이브 방송까지, 가입 없이 바로 체험할 수 있습니다
              </p>
            </AnimateOnScroll>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {/* 사용자 체험 */}
              <AnimateOnScroll variant="slideUp" delay={100}>
                <a
                  href="/malls/demo-store"
                  className="group relative block rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 h-full"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <BuildingStorefrontIcon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">쇼핑몰 체험</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    고객 입장에서 쇼핑몰을 둘러보세요.
                    상품 검색, 장바구니, 주문까지 체험합니다.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 transition-colors group-hover:text-emerald-300">
                    데모 쇼핑몰 방문
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              </AnimateOnScroll>

              {/* 라이브 커머스 체험 */}
              <AnimateOnScroll variant="slideUp" delay={200}>
                <a
                  href="/malls/demo-store/live"
                  className="group relative block rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-8 backdrop-blur-sm transition-all duration-300 hover:bg-red-500/[0.12] hover:border-red-500/30 hover:-translate-y-1 h-full"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <VideoCameraIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="mt-5 flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">라이브 커머스</h3>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    실시간 방송 + 채팅 + 즉석 구매.
                    YouTube 연동 라이브 쇼핑을 체험하세요.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-red-400 transition-colors group-hover:text-red-300">
                    라이브 체험하기
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              </AnimateOnScroll>

              {/* 관리자 체험 */}
              <AnimateOnScroll variant="slideUp" delay={300}>
                <a
                  href="/mall-admin"
                  className="group relative block rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 h-full"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <ChartBarIcon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">관리자 체험</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    상품 관리, 주문 처리, 라이브 방송 관리까지
                    운영자 패널을 체험하세요.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 transition-colors group-hover:text-violet-300">
                    관리자 패널 보기
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  How It Works                                */}
        {/* ============================================ */}
        <section className="bg-gray-50/80 py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="fadeIn" className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                이렇게 시작하세요
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                4단계로 쇼핑몰 개설부터 라이브 방송까지
              </p>
            </AnimateOnScroll>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-4">
              {[
                {
                  step: '01',
                  title: '분양 신청',
                  desc: '업종을 선택하고 간단한 정보를 입력하세요.',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  step: '02',
                  title: '쇼핑몰 세팅',
                  desc: '로고, 배너, 상품을 등록하고 꾸미세요.',
                  color: 'from-violet-500 to-purple-500',
                },
                {
                  step: '03',
                  title: '판매 시작',
                  desc: '상품이 메인 마켓에 자동 노출됩니다.',
                  color: 'from-emerald-500 to-teal-500',
                },
                {
                  step: '04',
                  title: '라이브 방송',
                  desc: 'YouTube URL 입력으로 라이브 판매를 시작하세요.',
                  color: 'from-red-500 to-pink-500',
                },
              ].map((item, idx) => (
                <AnimateOnScroll key={item.step} variant="slideUp" delay={idx * 150}>
                  <div className="relative text-center">
                    {/* Connector Line (desktop only) */}
                    {idx < 3 && (
                      <div className="absolute left-[60%] top-8 hidden h-px w-[80%] bg-gradient-to-r from-gray-200 to-transparent md:block" />
                    )}
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                      <span className="text-2xl font-bold text-white">{item.step}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500 max-w-xs mx-auto">
                      {item.desc}
                    </p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  Testimonials                                */}
        {/* ============================================ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="fadeIn" className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                셀러들의 이야기
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                MarketShare와 함께 성장하고 있는 파트너들의 후기
              </p>
            </AnimateOnScroll>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t, idx) => (
                <AnimateOnScroll key={idx} variant="fadeIn" delay={idx * 120}>
                  <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
                    {/* Quote mark */}
                    <div className="absolute -top-3 left-6 text-4xl font-serif text-primary/20 leading-none">&ldquo;</div>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <StarSolidIcon key={i} className="h-4 w-4 text-amber-400" />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-sm leading-relaxed text-gray-600">
                      {t.content}
                    </p>

                    {/* Author */}
                    <div className="mt-5 flex items-center gap-3 pt-4 border-t border-gray-50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  Pricing Section                             */}
        {/* ============================================ */}
        <section className="bg-gray-50/80 py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="fadeIn" className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                합리적인 요금제
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                비즈니스 규모에 맞는 요금제를 선택하세요
              </p>
            </AnimateOnScroll>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PRICING_PLANS.map((plan, idx) => (
                <AnimateOnScroll key={plan.id} variant="fadeIn" delay={idx * 100}>
                  <div
                    className={`relative rounded-2xl border p-6 transition-all duration-300 h-full ${
                      plan.isPopular
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02] hover:shadow-xl hover:shadow-primary/15'
                        : 'border-gray-200 bg-white hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white shadow-sm">
                        인기
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-xs text-gray-400">{plan.nameEn}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.monthlyPrice === 0 ? '무료' : formatKRW(plan.monthlyPrice)}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-sm text-gray-400">/월</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-primary font-medium">
                      판매수수료 {plan.salesCommission}%
                    </p>
                    <ul className="mt-5 space-y-2">
                      {plan.features.slice(0, 5).map((f) => (
                        <li key={f.label} className="flex items-start gap-2 text-sm">
                          {f.included ? (
                            <CheckCircleIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/pricing"
                      className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                        plan.isPopular
                          ? 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      자세히 보기
                    </a>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/*  FAQ Section                                 */}
        {/* ============================================ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="fadeIn" className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                자주 묻는 질문
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                궁금한 점이 있으신가요?
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll variant="fadeIn" delay={200} className="mt-12 max-w-3xl mx-auto">
              <FAQSection />
            </AnimateOnScroll>
          </div>
        </section>

        {/* ============================================ */}
        {/*  CTA Section                                 */}
        {/* ============================================ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <AnimateOnScroll variant="scaleUp">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-gray-900 p-8 md:p-16">
                {/* Decorative */}
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/[0.05] blur-xl" />
                <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/[0.03] blur-2xl" />

                <div className="relative mx-auto max-w-2xl text-center">
                  <h2 className="text-3xl font-bold text-white md:text-4xl">
                    지금 바로 시작하세요
                  </h2>
                  <p className="mt-4 text-lg text-blue-100/90">
                    쇼핑몰 개설 + 라이브 커머스 + 분양 네트워크.
                    MarketShare와 함께 성공적인 온라인 비즈니스를 시작하세요.
                  </p>

                  <div className="mt-6 flex flex-col items-center gap-3">
                    {[
                      '무제한 분양몰 개설',
                      'YouTube 라이브 커머스',
                      '실시간 채팅 + 즉석 구매',
                      '본사-가맹점 동시 방송',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-blue-100">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <SmartCTALink
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl hover:-translate-y-0.5"
                    >
                      분양몰 개설 신청
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </SmartCTALink>
                    <a
                      href="/malls"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                    >
                      입점몰 둘러보기
                    </a>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
