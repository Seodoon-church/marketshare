'use client';

export function EdFooter() {
  return (
    <footer className="bg-ink text-cream">
      <div className="max-w-[1280px] mx-auto px-[18px] md:px-10 py-12 md:py-16">
        {/* Desktop: 3 columns */}
        <div className="md:grid md:grid-cols-3 md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-[10px] mb-4">
              <div className="w-[26px] h-[26px] border-[1.5px] border-cream rounded-full flex items-center justify-center">
                <div className="w-[10px] h-[10px] bg-jade rounded-full" />
              </div>
              <span className="font-serif text-[21px] font-bold text-cream">마켓셰어</span>
            </div>
            <p className="text-sm text-[#A89B86] leading-relaxed max-w-[280px]">
              상가를 분양받듯, 온라인 점포 한 칸을 분양받으세요. 본사 상품·결제·정산이 갖춰진 내 가게.
            </p>
          </div>

          {/* Links */}
          <div className="mt-8 md:mt-0 grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-mono text-[11px] tracking-[.14em] text-[#8A7C68] mb-4">서비스</h4>
              <ul className="space-y-2.5 text-sm text-[#C9BBA3]">
                <li><a href="/shop" className="hover:text-cream transition-colors">상가 둘러보기</a></li>
                <li><a href="/franchise" className="hover:text-cream transition-colors">분양 안내</a></li>
                <li><a href="/pricing" className="hover:text-cream transition-colors">요금제</a></li>
                <li><a href="/support" className="hover:text-cream transition-colors">고객지원</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-[11px] tracking-[.14em] text-[#8A7C68] mb-4">정보</h4>
              <ul className="space-y-2.5 text-sm text-[#C9BBA3]">
                <li><a href="/terms" className="hover:text-cream transition-colors">이용약관</a></li>
                <li><a href="/privacy" className="hover:text-cream transition-colors">개인정보처리방침</a></li>
                <li><a href="/about" className="hover:text-cream transition-colors">회사 소개</a></li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 md:mt-0">
            <h4 className="font-mono text-[11px] tracking-[.14em] text-[#8A7C68] mb-4">연락처</h4>
            <div className="space-y-2 text-sm text-[#C9BBA3]">
              <p>고객센터: 1588-0000</p>
              <p>이메일: help@marketshare.kr</p>
              <p>평일 09:00 - 18:00</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-8 border-t border-[rgba(255,255,255,.1)]">
          <p className="font-mono text-[11px] text-[#6B6560]">
            © 2026 MarketShare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
