'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import {
  BuildingOffice2Icon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

// ---- FAQ 데이터 ----
const faqItems = [
  {
    question: '주문 후 배송까지 얼마나 걸리나요?',
    answer: '결제 확인 후 평일 기준 1~2일 이내 출고되며, 출고 후 1~2일 이내 수령 가능합니다. 도서/산간 지역은 추가 1~2일 소요될 수 있습니다. 주말 및 공휴일에는 출고가 진행되지 않으며, 연휴 기간에는 별도 공지를 통해 안내드립니다.',
  },
  {
    question: '교환/반품은 어떻게 신청하나요?',
    answer: '상품 수령 후 7일 이내에 마이페이지 > 주문내역에서 교환/반품 신청이 가능합니다. 단, 상품 사용 또는 훼손이 없는 경우에만 가능하며, 고객 변심에 의한 반품 시 반품 배송비가 부과됩니다. 상품 불량의 경우 배송비는 판매자가 부담합니다.',
  },
  {
    question: '결제 수단은 어떤 것이 있나요?',
    answer: '신용카드, 체크카드, 카카오페이, 네이버페이, 무통장입금(가상계좌), 휴대폰 결제 등 다양한 결제 수단을 지원합니다. 무통장입금의 경우 주문 후 24시간 이내에 입금해주셔야 합니다.',
  },
  {
    question: '주문을 취소하고 싶어요.',
    answer: '배송 준비 전(결제 완료 상태)에는 마이페이지에서 직접 취소가 가능합니다. 이미 배송 준비가 시작된 경우에는 고객센터로 연락해 주시기 바랍니다. 취소 후 환불은 결제 수단에 따라 1~5영업일 소요될 수 있습니다.',
  },
  {
    question: '적립금은 어떻게 사용하나요?',
    answer: '적립금은 상품 구매 시 결제 화면에서 사용 가능합니다. 최소 1,000원 이상 보유 시 사용 가능하며, 상품 결제 금액의 최대 10%까지 사용할 수 있습니다. 적립금은 발급일로부터 1년간 유효합니다.',
  },
];

export default function MallCustomerClient({ mallSlug }: { mallSlug: string }) {
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  if (mallLoading) return <FullPageLoader message="고객센터 정보를 불러오는 중..." />;
  if (!mall) return <div className="flex min-h-[400px] items-center justify-center text-gray-500">쇼핑몰을 찾을 수 없습니다.</div>;

  const bi = mall.businessInfo;

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">고객센터</h1>
          <p className="mt-1 text-sm text-gray-500">
            궁금한 사항이 있으시면 언제든 문의해주세요
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ===== 좌측: 사업자 정보 + 운영시간 ===== */}
          <div className="space-y-6">
            {/* 사업자 정보 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6">
                <BuildingOffice2Icon className="h-5 w-5 text-primary" />
                사업자 정보
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">상호</p>
                    <p className="text-sm text-gray-800">{bi.businessName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">대표자</p>
                    <p className="text-sm text-gray-800">{bi.representative}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <BuildingOffice2Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">사업자등록번호</p>
                    <p className="text-sm text-gray-800">{bi.businessNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">주소</p>
                    <p className="text-sm text-gray-800">{bi.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <PhoneIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">전화</p>
                    <p className="text-sm text-gray-800">{bi.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">이메일</p>
                    <p className="text-sm text-gray-800">{bi.email}</p>
                  </div>
                </div>
                {bi.onlineBusinessNumber && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <BuildingOffice2Icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">통신판매업신고</p>
                      <p className="text-sm text-gray-800">{bi.onlineBusinessNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 운영시간 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6">
                <ClockIcon className="h-5 w-5 text-primary" />
                운영시간
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">평일</span>
                  <span className="text-sm text-gray-800">09:00 ~ 18:00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">점심시간</span>
                  <span className="text-sm text-gray-800">12:00 ~ 13:00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">토요일</span>
                  <span className="text-sm text-gray-800">09:00 ~ 13:00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">일요일/공휴일</span>
                  <span className="text-sm text-red-500 font-medium">휴무</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                전화 상담이 어려운 경우 아래 문의 양식을 이용해주세요.
                접수된 문의는 영업일 기준 1~2일 이내에 답변드립니다.
              </p>
            </div>
          </div>

          {/* ===== 우측: 1:1 문의 폼 ===== */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
                1:1 문의
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="이름을 입력해주세요"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                  />
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="답변 받으실 이메일을 입력해주세요"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                  />
                </div>

                {/* 문의 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    문의 유형 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                  >
                    <option value="">문의 유형을 선택해주세요</option>
                    <option value="상품문의">상품문의</option>
                    <option value="배송문의">배송문의</option>
                    <option value="교환/반품">교환/반품</option>
                    <option value="결제/환불">결제/환불</option>
                    <option value="기타문의">기타문의</option>
                  </select>
                </div>

                {/* 문의 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    문의 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="문의 내용을 상세히 입력해주세요"
                    rows={6}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
                  />
                </div>

                <Button variant="default" size="lg" fullWidth type="submit" className="rounded-xl">
                  <PaperAirplaneIcon className="h-4 w-4" />
                  문의 접수하기
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* ===== 자주 묻는 질문 (FAQ) ===== */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <QuestionMarkCircleIcon className="h-6 w-6 text-primary" />
            자주 묻는 질문
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      Q
                    </span>
                    <span className="text-sm font-medium text-gray-800">{faq.question}</span>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-gray-50 bg-gray-50/50 px-6 py-5">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600">
                        A
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
