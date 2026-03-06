import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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
} from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }} />
          </div>

          <div className="relative mx-auto max-w-[var(--content-max-width)] px-4 py-20 md:py-32">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                <SparklesIcon className="h-4 w-4 text-amber-400" />
                분양몰 특화 전자상거래 플랫폼
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl md:leading-tight">
                나만의 쇼핑몰을
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  5초만에
                </span>{' '}
                개설하세요
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                분양몰에 등록한 상품이 메인 마켓에 자동 게시됩니다.
                무제한 쇼핑몰 분양, 다층 수익 구조, 한국 결제 시스템 완벽 지원.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/franchise"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
                >
                  <BuildingStorefrontIcon className="h-5 w-5" />
                  무료로 분양몰 개설
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  상품 둘러보기
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex gap-8 md:gap-12">
                {[
                  { value: '1,000+', label: '등록 상품' },
                  { value: '50+', label: '입점 쇼핑몰' },
                  { value: '5초', label: '몰 개설 시간' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-white md:text-3xl">{stat.value}</p>
                    <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                왜 MarketShare인가요?
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                분양몰 운영에 필요한 모든 기능을 제공합니다
              </p>
            </div>

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
                  icon: GlobeAltIcon,
                  title: '18종 업종별 테마',
                  desc: '쇼핑몰, 음식점, 기업, 서비스업 등 업종에 맞는 전문 테마를 제공합니다.',
                  color: 'from-pink-500 to-rose-500',
                },
                {
                  icon: ShieldCheckIcon,
                  title: '안전한 운영',
                  desc: '본인인증, HTML보안필터, 실시간 재고관리까지. 안전한 쇼핑몰 운영을 보장합니다.',
                  color: 'from-sky-500 to-blue-500',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className={`inline-flex rounded-xl bg-gradient-to-br ${feature.color} p-3 shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-50/80 py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                이렇게 시작하세요
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                3단계로 나만의 쇼핑몰을 오픈할 수 있습니다
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: '분양 신청',
                  desc: '원하는 업종과 테마를 선택하고 간단한 정보를 입력하세요.',
                },
                {
                  step: '02',
                  title: '쇼핑몰 세팅',
                  desc: '로고, 배너, 상품을 등록하고 나만의 스타일로 꾸미세요.',
                },
                {
                  step: '03',
                  title: '판매 시작',
                  desc: '바로 판매를 시작하세요. 등록한 상품은 메인 마켓에도 자동 노출됩니다.',
                },
              ].map((item, idx) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-gray-900 p-8 md:p-16">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold text-white md:text-4xl">
                  지금 바로 시작하세요
                </h2>
                <p className="mt-4 text-lg text-blue-100">
                  무제한 분양몰 개설, 상품 자동 연동, 다층 수익 구조.
                  MarketShare와 함께 성공적인 온라인 비즈니스를 시작하세요.
                </p>

                <div className="mt-6 flex flex-col items-center gap-3">
                  {[
                    '무제한 분양몰 개설',
                    '본사 상품 자동 연동',
                    '5개 PG사 결제 지원',
                    '18종 업종별 테마',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-blue-100">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/franchise"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
                  >
                    분양몰 개설 신청
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/malls"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
                  >
                    입점몰 둘러보기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
