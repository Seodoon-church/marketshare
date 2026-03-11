'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatKRW } from '@/lib/utils/format';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { processPaymentWithServerData } from '@/lib/payment/payment-service';
import { getMallById } from '@/lib/services/mall-service';
import { getPlatformSettings } from '@/lib/services/settings-service';
import { getUserPointBalance, getMallPointSettings } from '@/lib/services/point-service';
import { validateCoupon, calculateCouponDiscount } from '@/lib/services/coupon-service';
import { calculateShippingFee } from '@/lib/services/shipping-service';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import type { PaymentMethod as PaymentMethodType, PGProvider, Coupon } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckIcon,
  GiftIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

type CheckoutPaymentMethod = 'card' | 'kakaopay' | 'naverpay' | 'bank_transfer' | 'virtual_account' | 'phone';

const paymentMethods = [
  { id: 'card' as const, label: '신용카드' },
  { id: 'kakaopay' as const, label: '카카오페이' },
  { id: 'naverpay' as const, label: '네이버페이' },
  { id: 'bank_transfer' as const, label: '계좌이체' },
  { id: 'phone' as const, label: '핸드폰결제' },
];

const deliveryMemos = [
  '배송 메모를 선택해주세요',
  '부재시 문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '직접 입력',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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
  const [selectedPayment, setSelectedPayment] = useState<CheckoutPaymentMethod>('card');

  // 동의
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreePurchase, setAgreePurchase] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 주문 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 포인트
  const [pointBalance, setPointBalance] = useState(0);
  const [pointInput, setPointInput] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointEnabled, setPointEnabled] = useState(false);
  const [minPointUsage, setMinPointUsage] = useState(100);

  // 쿠폰
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);
  const [isCouponValidating, setIsCouponValidating] = useState(false);

  // 배송비 (동적 계산)
  const [calculatedShippingFee, setCalculatedShippingFee] = useState<number | null>(null);

  // 장바구니
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);

  const subtotal = getSubtotal();
  const discountAmount = items.reduce((sum, item) => {
    if (item.salePrice !== null) {
      return sum + (item.price - item.salePrice) * item.quantity;
    }
    return sum;
  }, 0);
  const effectiveSubtotal = subtotal; // after sale price discounts
  const shippingFee = calculatedShippingFee ?? (effectiveSubtotal >= 50000 ? 0 : 3000);
  const freeShippingByCoupon = appliedCoupon?.type === 'free_shipping';
  const finalShippingFee = freeShippingByCoupon ? 0 : shippingFee;
  const total = effectiveSubtotal + finalShippingFee - couponDiscountAmount - pointsToUse;

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  // Auto-fill orderer info from user profile
  useEffect(() => {
    if (user) {
      setOrdererName(user.name || '');
      setOrdererEmail(user.email || '');
      setOrdererPhone(user.phone || '');
    }
  }, [user]);

  // 포인트 잔액 & 설정 로드
  useEffect(() => {
    if (!user || items.length === 0) return;
    const mallId = items[0].mallId;
    (async () => {
      try {
        const [balance, settings] = await Promise.all([
          getUserPointBalance(user.id, mallId),
          getMallPointSettings(mallId),
        ]);
        setPointBalance(balance);
        setPointEnabled(settings.enabled);
        setMinPointUsage(settings.minUsageAmount);
      } catch {
        // 포인트 조회 실패해도 결제는 가능
      }
    })();
  }, [user, items]);

  // 우편번호 변경 시 배송비 재계산
  useEffect(() => {
    if (!zipcode || items.length === 0) {
      setCalculatedShippingFee(null);
      return;
    }
    const mallId = items[0].mallId;
    (async () => {
      try {
        const fee = await calculateShippingFee(zipcode, mallId, effectiveSubtotal);
        setCalculatedShippingFee(fee);
      } catch {
        setCalculatedShippingFee(null);
      }
    })();
  }, [zipcode, items, effectiveSubtotal]);

  // 포인트 적용
  const handleApplyPoints = () => {
    const amount = parseInt(pointInput) || 0;
    if (amount <= 0) {
      toast({ type: 'warning', message: '사용할 포인트를 입력해주세요.' });
      return;
    }
    if (amount > pointBalance) {
      toast({ type: 'warning', message: '보유 포인트를 초과할 수 없습니다.' });
      return;
    }
    if (amount < minPointUsage) {
      toast({ type: 'warning', message: `최소 ${minPointUsage.toLocaleString()}P 이상 사용 가능합니다.` });
      return;
    }
    const maxUsable = effectiveSubtotal + finalShippingFee - couponDiscountAmount;
    if (amount > maxUsable) {
      toast({ type: 'warning', message: '결제 금액을 초과하여 사용할 수 없습니다.' });
      return;
    }
    setPointsToUse(amount);
    toast({ type: 'success', message: `${amount.toLocaleString()}P가 적용되었습니다.` });
  };

  const handleCancelPoints = () => {
    setPointsToUse(0);
    setPointInput('');
  };

  const handleUseAllPoints = () => {
    const maxUsable = effectiveSubtotal + finalShippingFee - couponDiscountAmount;
    const useAmount = Math.min(pointBalance, maxUsable);
    if (useAmount < minPointUsage) {
      toast({ type: 'warning', message: `최소 ${minPointUsage.toLocaleString()}P 이상 사용 가능합니다.` });
      return;
    }
    setPointInput(useAmount.toString());
    setPointsToUse(useAmount);
    toast({ type: 'success', message: `${useAmount.toLocaleString()}P가 적용되었습니다.` });
  };

  // 쿠폰 적용
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ type: 'warning', message: '쿠폰 코드를 입력해주세요.' });
      return;
    }
    if (!user || items.length === 0) return;

    const mallId = items[0].mallId;
    setIsCouponValidating(true);

    try {
      const result = await validateCoupon(couponCode.trim().toUpperCase(), user.id, mallId, effectiveSubtotal);
      if (!result.valid || !result.coupon) {
        toast({ type: 'error', message: result.reason || '사용할 수 없는 쿠폰입니다.' });
        return;
      }

      const discount = calculateCouponDiscount(result.coupon, effectiveSubtotal);
      setAppliedCoupon(result.coupon);
      setCouponDiscountAmount(discount);

      if (result.coupon.type === 'free_shipping') {
        toast({ type: 'success', message: '무료배송 쿠폰이 적용되었습니다.' });
      } else {
        toast({ type: 'success', message: `쿠폰 할인 ${formatKRW(discount)}이 적용되었습니다.` });
      }
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '쿠폰 적용에 실패했습니다.' });
    } finally {
      setIsCouponValidating(false);
    }
  };

  const handleCancelCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
    setCouponCode('');
  };

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

  const loadDaumPostcode = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).daum?.Postcode) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('주소검색 서비스를 불러올 수 없습니다.'));
      document.head.appendChild(script);
    });
  };

  const handleAddressSearch = async () => {
    try {
      await loadDaumPostcode();
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          setZipcode(data.zonecode);
          setAddress(data.roadAddress || data.jibunAddress);
        },
      }).open();
    } catch {
      toast({ type: 'error', message: '주소검색 서비스를 불러올 수 없습니다.' });
    }
  };

  const handlePayment = async () => {
    if (!user) return;

    if (!agreePurchase || !agreePrivacy) {
      toast({ type: 'warning', message: '필수 약관에 동의해주세요.' });
      return;
    }

    if (!recipientName || !recipientPhone || !address) {
      toast({ type: 'warning', message: '배송지 정보를 입력해주세요.' });
      return;
    }

    if (items.length === 0) {
      toast({ type: 'warning', message: '주문할 상품이 없습니다.' });
      return;
    }

    // 클라이언트 사전 검증 (서버에서도 재검증됨)
    if (total <= 0) {
      toast({ type: 'error', message: '결제 금액이 0원 이하입니다.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const mallId = items[0].mallId;

      // Step 1: 서버에서 주문 생성 + 재고 확인 + 금액 계산 (Cloud Function)
      const processCheckout = httpsCallable<any, {
        orderId: string;
        merchantUid: string;
        totalAmount: number;
        breakdown: { subtotal: number; shippingFee: number; couponDiscount: number; pointsUsed: number };
      }>(functions, 'processCheckout');

      const checkoutResult = await processCheckout({
        mallId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          options: item.options || {},
        })),
        shippingAddress: {
          name: recipientName,
          phone: recipientPhone,
          zipcode,
          address,
          addressDetail,
          memo: deliveryMemo === '직접 입력' ? customMemo : deliveryMemo,
        },
        paymentMethod: selectedPayment,
        couponCode: appliedCoupon?.code || null,
        pointsToUse: pointsToUse,
        ordererInfo: {
          name: ordererName,
          email: ordererEmail,
          phone: ordererPhone,
        },
      });

      const { orderId, merchantUid, totalAmount } = checkoutResult.data;

      // Step 2: PG 설정 결정
      let pgProvider: PGProvider = 'inicis';

      const mall = await getMallById(mallId);
      if (
        mall?.pgConfig?.pgPaymentAuth === 'individual' &&
        mall.pgConfig.configs &&
        mall.pgConfig.defaultProvider
      ) {
        const mallPgConfig = mall.pgConfig.configs[mall.pgConfig.defaultProvider];
        if (mallPgConfig?.enabled) {
          pgProvider = mall.pgConfig.defaultProvider;
        }
      }

      if (pgProvider === 'inicis') {
        const platformSettings = await getPlatformSettings();
        if (platformSettings) {
          const defaultPG = platformSettings.defaultPGProvider as PGProvider;
          const platformPgConfig = platformSettings.pgConfigs?.[defaultPG];
          if (platformPgConfig?.enabled) {
            pgProvider = defaultPG;
          }
        }
      }

      // Step 3: 서버가 계산한 금액으로 PortOne 결제 (merchantUid도 서버 발급)
      const orderName = items.length > 1
        ? `${items[0].name} 외 ${items.length - 1}건`
        : items[0].name;

      const { payment, verified } = await processPaymentWithServerData({
        merchantUid,
        totalAmount,
        orderName,
        buyerEmail: ordererEmail,
        buyerName: ordererName,
        buyerTel: recipientPhone,
        buyerAddr: `${address} ${addressDetail}`,
        buyerPostcode: zipcode,
        paymentMethod: selectedPayment as PaymentMethodType,
        pgProvider,
      });

      // Step 4: 결과 처리 (포인트/쿠폰은 웹훅에서 서버가 처리)
      if (payment.success && verified) {
        const clearCart = useCartStore.getState().clearCart;
        clearCart();
        toast({ type: 'success', message: '결제가 완료되었습니다!' });
        router.push('/mypage/orders');
        return;
      } else {
        toast({
          type: 'error',
          message: payment.error_msg || '결제에 실패했습니다. 다시 시도해주세요.',
        });
        // 결제 실패한 주문은 30분 후 자동 만료 (expireUnpaidOrders CF)
      }
    } catch (error: any) {
      const message = error?.message || '주문 처리 중 오류가 발생했습니다.';
      toast({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentIcon = (method: CheckoutPaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCardIcon className="h-5 w-5" />;
      case 'kakaopay':
        return (
          <span className="inline-flex h-5 items-center rounded bg-[#FEE500] px-1.5 text-[10px] font-bold text-[#191919]">
            pay
          </span>
        );
      case 'naverpay':
        return (
          <span className="inline-flex h-5 items-center rounded bg-[#03C75A] px-1.5 text-[10px] font-bold text-white">
            pay
          </span>
        );
      case 'bank_transfer':
        return <BanknotesIcon className="h-5 w-5" />;
      case 'phone':
        return <DevicePhoneMobileIcon className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50/30">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900">주문/결제</h1>
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
                        readOnly
                        required
                      />
                      <Button
                        variant="outline"
                        className="shrink-0"
                        onClick={handleAddressSearch}
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
                    readOnly
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
                <CardTitle className="mb-5">
                  주문 상품 ({items.length}건)
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

              {/* 쿠폰 */}
              <Card>
                <CardTitle className="mb-5 flex items-center gap-2">
                  <TicketIcon className="h-5 w-5 text-primary" />
                  쿠폰 할인
                </CardTitle>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appliedCoupon.name}</p>
                      <p className="text-xs text-primary">
                        {appliedCoupon.type === 'free_shipping'
                          ? '무료배송'
                          : appliedCoupon.type === 'percentage'
                          ? `${appliedCoupon.discountValue}% 할인 (${formatKRW(couponDiscountAmount)})`
                          : `${formatKRW(couponDiscountAmount)} 할인`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCancelCoupon}>
                      취소
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="쿠폰 코드를 입력하세요"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    />
                    <Button
                      variant="outline"
                      className="shrink-0"
                      onClick={handleApplyCoupon}
                      disabled={isCouponValidating}
                    >
                      {isCouponValidating ? '확인중...' : '적용'}
                    </Button>
                  </div>
                )}
              </Card>

              {/* 포인트 */}
              {pointEnabled && (
                <Card>
                  <CardTitle className="mb-5 flex items-center gap-2">
                    <GiftIcon className="h-5 w-5 text-primary" />
                    포인트 사용
                  </CardTitle>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">보유 포인트</span>
                    <span className="font-semibold text-primary">{pointBalance.toLocaleString()}P</span>
                  </div>
                  {pointsToUse > 0 ? (
                    <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pointsToUse.toLocaleString()}P 사용
                        </p>
                        <p className="text-xs text-primary">-{formatKRW(pointsToUse)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCancelPoints}>
                        취소
                      </Button>
                    </div>
                  ) : pointBalance > 0 ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="사용할 포인트"
                        value={pointInput}
                        onChange={(e) => setPointInput(e.target.value)}
                        min="0"
                        max={pointBalance}
                      />
                      <Button variant="outline" className="shrink-0" onClick={handleUseAllPoints}>
                        전액
                      </Button>
                      <Button variant="outline" className="shrink-0" onClick={handleApplyPoints}>
                        적용
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">사용 가능한 포인트가 없습니다.</p>
                  )}
                </Card>
              )}

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
                  <CardTitle className="mb-5">결제 금액</CardTitle>

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
                        {freeShippingByCoupon ? (
                          <span className="text-primary">무료 (쿠폰)</span>
                        ) : finalShippingFee === 0 ? '무료' : formatKRW(finalShippingFee)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">상품할인</span>
                        <span className="text-red-500">-{formatKRW(discountAmount)}</span>
                      </div>
                    )}
                    {couponDiscountAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">쿠폰할인</span>
                        <span className="text-red-500">-{formatKRW(couponDiscountAmount)}</span>
                      </div>
                    )}
                    {pointsToUse > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">포인트 사용</span>
                        <span className="text-red-500">-{formatKRW(pointsToUse)}</span>
                      </div>
                    )}
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
                      disabled={!agreePurchase || !agreePrivacy || items.length === 0 || isSubmitting}
                      onClick={handlePayment}
                    >
                      {isSubmitting ? (
                        <><LoadingSpinner size="sm" color="text-white" /> 결제 처리 중...</>
                      ) : (
                        `${formatKRW(total)} 결제하기`
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
