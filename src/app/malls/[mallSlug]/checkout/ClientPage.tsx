'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatKRW } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart-store';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type PaymentMethod = 'credit-card' | 'kakao-pay' | 'naver-pay' | 'bank-transfer' | 'phone';

const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: 'credit-card', label: '신용카드' },
  { id: 'kakao-pay', label: '카카오페이' },
  { id: 'naver-pay', label: '네이버페이' },
  { id: 'bank-transfer', label: '무통장입금' },
  { id: 'phone', label: '핸드폰결제' },
];

const deliveryMemos = [
  '배송 메모를 선택해주세요',
  '부재시 문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '직접 입력',
];

export default function MallCheckoutClient({ mallSlug: paramSlug }: { mallSlug: string }) {
  const mallSlug = useMallSlug(paramSlug);
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);

  // 주문자 정보
  const [ordererName, setOrdererName] = useState('');
  const [ordererEmail, setOrdererEmail] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');

  // 배송지 정보
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [deliveryMemo, setDeliveryMemo] = useState(deliveryMemos[0]);
  const [customMemo, setCustomMemo] = useState('');

  // 결제 수단
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('credit-card');

  // 동의
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreePurchase, setAgreePurchase] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 장바구니 (해당 몰 상품만 필터)
  const items = useCartStore((s) => s.items.filter((item) => mall && item.mallId === mall.id));

  const subtotal = items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.quantity, 0);
  const shippingFee = subtotal >= 50000 ? 0 : subtotal > 0 ? 3000 : 0;
  const total = subtotal + shippingFee;
  const discountAmount = items.reduce((sum, item) => {
    if (item.salePrice !== null) {
      return sum + (item.price - item.salePrice) * item.quantity;
    }
    return sum;
  }, 0);

  if (mallLoading) return <FullPageLoader message="주문서를 불러오는 중..." />;
  if (!mall) return <div className="flex min-h-[400px] items-center justify-center text-gray-500">쇼핑몰을 찾을 수 없습니다.</div>;

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreePurchase(checked);
    setAgreePrivacy(checked);
  };

  const handleIndividualAgree = (
    setter: (v: boolean) => void,
    value: boolean,
    otherValue: boolean
  ) => {
    setter(value);
    if (value && otherValue) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  };

  const renderPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'credit-card':
        return <CreditCardIcon className="h-5 w-5" />;
      case 'kakao-pay':
        return (
          <span className="inline-flex h-5 items-center rounded bg-[#FEE500] px-1.5 text-[10px] font-bold text-[#191919]">
            pay
          </span>
        );
      case 'naver-pay':
        return (
          <span className="inline-flex h-5 items-center rounded bg-[#03C75A] px-1.5 text-[10px] font-bold text-white">
            pay
          </span>
        );
      case 'bank-transfer':
        return <BanknotesIcon className="h-5 w-5" />;
      case 'phone':
        return <DevicePhoneMobileIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Page Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900">주문/결제</h1>
          <p className="mt-1 text-sm text-gray-500">{mall.name} 주문서</p>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Column */}
          <div className="flex-1 space-y-6 lg:max-w-[66.666%]">
            {/* 주문자 정보 */}
            <Card>
              <CardTitle className="mb-5 flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5 text-primary" />
                주문자 정보
              </CardTitle>
              <div className="space-y-4">
                <Input
                  label="이름"
                  placeholder="주문자 이름을 입력해주세요"
                  value={ordererName}
                  onChange={(e) => setOrdererName(e.target.value)}
                  required
                />
                <Input
                  label="이메일"
                  type="email"
                  placeholder="example@email.com"
                  value={ordererEmail}
                  onChange={(e) => setOrdererEmail(e.target.value)}
                  required
                  hint="주문 확인 메일이 발송됩니다"
                />
                <Input
                  label="연락처"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={ordererPhone}
                  onChange={(e) => setOrdererPhone(e.target.value)}
                  required
                />
              </div>
            </Card>

            {/* 배송지 정보 */}
            <Card>
              <CardTitle className="mb-5 flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-primary" />
                배송지 정보
              </CardTitle>
              <div className="space-y-4">
                <Input
                  label="수령인"
                  placeholder="수령인 이름을 입력해주세요"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
                <Input
                  label="연락처"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  required
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    우편번호
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="우편번호"
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                      required
                    />
                    <Button
                      variant="outline"
                      className="shrink-0"
                      onClick={() => {
                        /* 주소검색 API 연동 */
                      }}
                    >
                      주소검색
                    </Button>
                  </div>
                </div>
                <Input
                  label="주소"
                  placeholder="기본 주소를 입력해주세요"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <Input
                  label="상세주소"
                  placeholder="상세 주소를 입력해주세요 (동/호수 등)"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    배송 메모
                  </label>
                  <div className="relative">
                    <select
                      value={deliveryMemo}
                      onChange={(e) => setDeliveryMemo(e.target.value)}
                      className="flex h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {deliveryMemos.map((memo) => (
                        <option key={memo} value={memo}>
                          {memo}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {deliveryMemo === '직접 입력' && (
                  <Input
                    placeholder="배송 메모를 입력해주세요"
                    value={customMemo}
                    onChange={(e) => setCustomMemo(e.target.value)}
                  />
                )}
              </div>
            </Card>

            {/* 주문 상품 */}
            <Card>
              <CardTitle className="mb-5 flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5 text-primary" />
                주문 상품 ({items.length}건)
                <Badge variant="default" className="ml-auto">{mall.name}</Badge>
              </CardTitle>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ShoppingBagIcon className="mb-3 h-12 w-12" />
                  <p className="text-sm">주문할 상품이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <div key={`${item.productId}-${idx}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      {/* Image Placeholder */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ShoppingBagIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-xs text-gray-400">{item.mallName}</p>
                          <p className="mt-0.5 text-sm font-medium text-gray-900 line-clamp-2">
                            {item.name}
                          </p>
                          {item.options && Object.keys(item.options).length > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              {Object.entries(item.options)
                                .map(([key, val]) => `${key}: ${val}`)
                                .join(' / ')}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">수량 {item.quantity}개</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatKRW((item.salePrice ?? item.price) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 결제 수단 */}
            <Card>
              <CardTitle className="mb-5 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-primary" />
                결제 수단
              </CardTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                      selectedPayment === method.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={() => setSelectedPayment(method.id)}
                      className="sr-only"
                    />
                    {selectedPayment === method.id && (
                      <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <span className="text-gray-600">{renderPaymentIcon(method.id)}</span>
                    <span
                      className={`text-xs font-medium ${
                        selectedPayment === method.id ? 'text-primary' : 'text-gray-600'
                      }`}
                    >
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - 결제 금액 */}
          <div className="lg:w-[33.333%]">
            <div className="sticky top-6">
              <Card>
                <CardTitle className="mb-5 flex items-center justify-between">
                  <span>결제 금액</span>
                  <Badge variant="default">{mall.name}</Badge>
                </CardTitle>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">상품금액</span>
                    <span className="text-gray-900">
                      {formatKRW(subtotal + discountAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">배송비</span>
                    <span className="text-gray-900">
                      {shippingFee === 0 ? '무료' : formatKRW(shippingFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">할인금액</span>
                    <span className="text-red-500">
                      {discountAmount > 0
                        ? `-${formatKRW(discountAmount)}`
                        : formatKRW(0)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      총 결제금액
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatKRW(total)}
                    </span>
                  </div>
                </div>

                {/* Agreements */}
                <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={agreeAll}
                      onChange={(e) => handleAgreeAll(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary accent-primary"
                    />
                    <span className="text-sm font-semibold text-gray-900">
                      전체 동의
                    </span>
                  </label>
                  <div className="ml-1 space-y-2 border-t border-gray-50 pt-3">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={agreePurchase}
                        onChange={(e) =>
                          handleIndividualAgree(
                            setAgreePurchase,
                            e.target.checked,
                            agreePrivacy
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                      />
                      <span className="text-sm text-gray-600">
                        <span className="text-red-500">(필수)</span> 구매조건 확인 및 결제 진행 동의
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={agreePrivacy}
                        onChange={(e) =>
                          handleIndividualAgree(
                            setAgreePrivacy,
                            e.target.checked,
                            agreePurchase
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                      />
                      <span className="text-sm text-gray-600">
                        <span className="text-red-500">(필수)</span> 개인정보 수집 및 이용 동의
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <Button
                    size="xl"
                    fullWidth
                    disabled={!agreePurchase || !agreePrivacy || items.length === 0}
                  >
                    {formatKRW(total)} 결제하기
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
