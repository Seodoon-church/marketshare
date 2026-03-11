'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserCoupons, getCouponByCode, downloadCoupon } from '@/lib/services/coupon-service';
import { formatKRW, formatDate } from '@/lib/utils/format';
import type { UserCoupon, CouponType } from '@/types';
import {
  TicketIcon,
  TagIcon,
  TruckIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

export default function CouponsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [couponCode, setCouponCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/mypage/coupons');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch coupons
  useEffect(() => {
    if (!user?.id) return;

    async function fetchCoupons() {
      setIsLoading(true);
      try {
        const result = await getUserCoupons(user!.id, mallId);
        setCoupons(result);
      } catch (error: any) {
        toast({ type: 'error', message: error.message || '쿠폰 목록을 불러올 수 없습니다.' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCoupons();
  }, [user?.id, mallId, toast]);

  const handleRegisterCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ type: 'warning', message: '쿠폰 코드를 입력해주세요.' });
      return;
    }

    setIsRegistering(true);
    try {
      // Validate coupon code
      const coupon = await getCouponByCode(couponCode.trim());
      if (!coupon) {
        toast({ type: 'error', message: '존재하지 않는 쿠폰 코드입니다.' });
        return;
      }

      // Download coupon
      await downloadCoupon(user!.id, coupon.id);
      toast({ type: 'success', message: '쿠폰이 등록되었습니다.' });
      setCouponCode('');

      // Refresh coupons
      const result = await getUserCoupons(user!.id, mallId);
      setCoupons(result);
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '쿠폰 등록에 실패했습니다.' });
    } finally {
      setIsRegistering(false);
    }
  };

  // Show loading while auth is resolving
  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const now = new Date();
  const availableCoupons = coupons.filter((c) => !c.usedAt && c.coupon && c.coupon.endDate >= now && c.coupon.isActive);
  const usedCoupons = coupons.filter((c) => c.usedAt);
  const expiredCoupons = coupons.filter((c) => !c.usedAt && c.coupon && (c.coupon.endDate < now || !c.coupon.isActive));

  const displayCoupons = activeTab === 'available' ? availableCoupons : activeTab === 'used' ? usedCoupons : expiredCoupons;

  const tabs = [
    { value: 'available', label: `사용가능 (${availableCoupons.length})` },
    { value: 'used', label: `사용완료 (${usedCoupons.length})` },
    { value: 'expired', label: `만료 (${expiredCoupons.length})` },
  ];

  const getCouponIcon = (type: CouponType) => {
    switch (type) {
      case 'percentage':
        return <TagIcon className="h-6 w-6" />;
      case 'fixed':
        return <TicketIcon className="h-6 w-6" />;
      case 'free_shipping':
        return <TruckIcon className="h-6 w-6" />;
      default:
        return <TicketIcon className="h-6 w-6" />;
    }
  };

  const getCouponValue = (coupon: UserCoupon['coupon']) => {
    if (!coupon) return '';
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.discountValue}%`;
      case 'fixed':
        return formatKRW(coupon.discountValue);
      case 'free_shipping':
        return '무료배송';
      default:
        return '';
    }
  };

  const getCouponColor = (type: CouponType) => {
    switch (type) {
      case 'percentage':
        return 'from-violet-500 to-purple-500';
      case 'fixed':
        return 'from-emerald-500 to-teal-500';
      case 'free_shipping':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">쿠폰함</h1>
        <p className="mt-1 text-sm text-gray-500">보유한 쿠폰을 확인하고 사용하세요.</p>
      </div>

      {/* Coupon Registration */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="쿠폰 코드를 입력하세요 (예: MS-ABCD-1234)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleRegisterCoupon()}
            />
          </div>
          <Button onClick={handleRegisterCoupon} isLoading={isRegistering}>
            <PlusCircleIcon className="h-4 w-4" />
            쿠폰 등록
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Coupons List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : displayCoupons.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TicketIcon className="h-12 w-12" />}
            title={
              activeTab === 'available'
                ? '사용 가능한 쿠폰이 없습니다'
                : activeTab === 'used'
                ? '사용한 쿠폰이 없습니다'
                : '만료된 쿠폰이 없습니다'
            }
            description="상단에서 쿠폰 코드를 입력하여 등록할 수 있습니다."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {displayCoupons.map((userCoupon) => {
            const coupon = userCoupon.coupon;
            if (!coupon) return null;

            const isExpired = activeTab === 'expired';
            const isUsed = activeTab === 'used';

            return (
              <Card
                key={userCoupon.couponId}
                className={`overflow-hidden ${isExpired || isUsed ? 'opacity-60' : ''}`}
              >
                <div className="flex gap-4">
                  {/* Left: Discount Value */}
                  <div
                    className={`flex w-24 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br ${getCouponColor(coupon.type)} text-white shadow-md`}
                  >
                    {getCouponIcon(coupon.type)}
                    <p className="mt-2 text-xl font-bold">{getCouponValue(coupon)}</p>
                  </div>

                  {/* Right: Coupon Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{coupon.name}</h3>
                      {isUsed && <Badge variant="default">사용완료</Badge>}
                      {isExpired && <Badge variant="default">만료</Badge>}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      {coupon.minPurchaseAmount > 0 && (
                        <p>최소 주문금액: {formatKRW(coupon.minPurchaseAmount)}</p>
                      )}
                      {coupon.maxDiscountAmount !== null && coupon.type === 'percentage' && (
                        <p>최대 할인: {formatKRW(coupon.maxDiscountAmount)}</p>
                      )}
                      <p>
                        {coupon.scope === 'all' ? '전체상품' : coupon.scope === 'category' ? '특정 카테고리' : '특정 상품'} 적용
                      </p>
                      <p className="flex items-center gap-1 text-gray-500">
                        <span>만료일: {formatDate(coupon.endDate)}</span>
                        {!isUsed && !isExpired && coupon.endDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 && (
                          <Badge variant="warning" className="text-xs">곧 만료</Badge>
                        )}
                      </p>
                    </div>
                    {!isUsed && !isExpired && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          href="/products"
                        >
                          사용하기
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
