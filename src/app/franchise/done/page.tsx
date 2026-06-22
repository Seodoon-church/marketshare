'use client';

import { EdHeading } from '@/components/redesign/EdHeading';
import { EdButton } from '@/components/redesign/EdButton';
import { EdDirectoryRow } from '@/components/redesign/EdDirectoryRow';

export default function FranchiseDonePage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-start pt-[120px] md:pt-[160px] px-[18px] md:px-10">
      <div className="max-w-[420px] w-full text-center">
        {/* Key icon */}
        <div className="mx-auto w-[64px] h-[64px] border-[2px] border-brass flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9C7C46" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="15" r="5" />
            <path d="M11.6 11.4L21 2" />
            <path d="M21 2l-3 0 0 3" />
            <path d="M16.5 6.5L18 8" />
          </svg>
        </div>

        <EdHeading level={2} className="mt-6 text-[26px]">분양이 완료되었습니다</EdHeading>
        <p className="text-[14px] text-[#6E6253] mt-3">내 점포가 성공적으로 개설되었어요.</p>

        {/* Mall details */}
        <div className="mt-8 text-left">
          <EdDirectoryRow label="점포명" value="데이지 뷰티" />
          <EdDirectoryRow label="점포 주소" value="daisy-beauty.marketshare.kr" />
          <EdDirectoryRow label="플랜" value="비즈니스" />
          <EdDirectoryRow label="업종" value="뷰티·화장품" />
          <EdDirectoryRow label="호실 번호" value="A-204" />
        </div>

        {/* Info box */}
        <div className="flex gap-[9px] mt-[18px] p-[14px_15px] border border-[#E3DACA] text-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9C7C46" strokeWidth="1.7" className="flex-none mt-[1px]"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>
          <span className="text-[11.5px] text-[#6E6253] leading-relaxed">
            상품 등록 후 <b className="text-ink">24시간 이내</b> 승인 검토가 진행됩니다. 관리자 페이지에서 점포를 꾸미고 상품을 등록해 보세요.
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <EdButton variant="outline" size="lg" href="/" className="flex-1">홈으로</EdButton>
          <EdButton variant="brass" size="lg" href="/mall-admin" className="flex-1">관리자 페이지</EdButton>
        </div>
      </div>
    </div>
  );
}
