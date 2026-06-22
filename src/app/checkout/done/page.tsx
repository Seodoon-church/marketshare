'use client';

import { EdHeading } from '@/components/redesign/EdHeading';
import { EdButton } from '@/components/redesign/EdButton';
import { EdDirectoryRow } from '@/components/redesign/EdDirectoryRow';
import { IconCheck } from '@/components/redesign/icons';

export default function OrderDonePage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-start pt-[120px] md:pt-[160px] px-[18px] md:px-10">
      <div className="max-w-[420px] w-full text-center">
        {/* Check icon */}
        <div className="mx-auto w-[64px] h-[64px] border-[2px] border-jade flex items-center justify-center">
          <IconCheck size={32} className="text-jade" />
        </div>

        <EdHeading level={2} className="mt-6 text-[26px]">주문이 완료되었습니다</EdHeading>
        <p className="text-[14px] text-[#6E6253] mt-3">결제가 정상적으로 처리되었어요.</p>

        {/* Order details */}
        <div className="mt-8 text-left">
          <EdDirectoryRow label="주문번호" value="ORD-240620-001" />
          <EdDirectoryRow label="결제금액" value="₩83,800" />
          <EdDirectoryRow label="결제수단" value="카카오페이" />
          <EdDirectoryRow label="배송예정" value="06.22 (수)" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <EdButton variant="outline" size="lg" href="/mypage" className="flex-1">주문 내역</EdButton>
          <EdButton variant="ink" size="lg" href="/shop" className="flex-1">쇼핑 계속하기</EdButton>
        </div>
      </div>
    </div>
  );
}
