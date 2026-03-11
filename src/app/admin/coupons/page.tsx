'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { TagIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getCoupons,
  createCoupon,
  deleteCoupon,
  generateCouponCode,
} from '@/lib/services/coupon-service';
import type { Coupon, CouponType, CouponScope } from '@/types';

export default function AdminCoupons() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [couponName, setCouponName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<CouponType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [scope, setScope] = useState<CouponScope>('all');
  const [totalUsageLimit, setTotalUsageLimit] = useState('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  // Load coupons
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    async function loadData() {
      try {
        setLoading(true);
        const couponsData = await getCoupons({ mallId: null }); // Platform coupons only
        setCoupons(couponsData);
      } catch (error: any) {
        alert(error.message || '쿠폰 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, isAdmin]);

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  const handleGenerateCode = () => {
    setCouponCode(generateCouponCode('PLATFORM'));
  };

  const handleCreateCoupon = async () => {
    if (!couponName || !couponCode || !discountValue || !startDate || !endDate) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      await createCoupon({
        name: couponName,
        code: couponCode,
        type: couponType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : 0,
        mallId: null, // Platform coupon
        scope,
        scopeTargetIds: [],
        usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : null,
        totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        createdBy: user?.id || 'admin',
      });

      alert('쿠폰이 생성되었습니다.');
      setShowCreateModal(false);

      // Reset form
      setCouponName('');
      setCouponCode('');
      setCouponType('percentage');
      setDiscountValue('');
      setMaxDiscountAmount('');
      setMinPurchaseAmount('');
      setScope('all');
      setTotalUsageLimit('');
      setUsageLimitPerUser('');
      setStartDate('');
      setEndDate('');

      // Reload coupons
      const updatedCoupons = await getCoupons({ mallId: null });
      setCoupons(updatedCoupons);
    } catch (error: any) {
      alert(error.message || '쿠폰 생성 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('쿠폰을 삭제하시겠습니까?')) return;

    try {
      await deleteCoupon(couponId);
      alert('쿠폰이 삭제되었습니다.');

      // Reload coupons
      const updatedCoupons = await getCoupons({ mallId: null });
      setCoupons(updatedCoupons);
    } catch (error: any) {
      alert(error.message || '쿠폰 삭제 중 오류가 발생했습니다.');
    }
  };

  const getCouponTypeLabel = (type: CouponType) => {
    switch (type) {
      case 'percentage':
        return '정률';
      case 'fixed':
        return '정액';
      case 'free_shipping':
        return '무료배송';
      default:
        return type;
    }
  };

  const getCouponScopeLabel = (scope: CouponScope) => {
    switch (scope) {
      case 'all':
        return '전체';
      case 'category':
        return '카테고리';
      case 'product':
        return '상품';
      default:
        return scope;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TagIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">플랫폼 쿠폰 관리</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4" />
          쿠폰 생성
        </Button>
      </div>

      {/* Coupons Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  쿠폰명
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">코드</th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  유형
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  할인
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  사용/제한
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  기간
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  상태
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                    등록된 플랫폼 쿠폰이 없습니다.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {coupon.name}
                    </td>
                    <td className="px-5 py-3">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-700">
                        {coupon.code}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant="default">{getCouponTypeLabel(coupon.type)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-900">
                      {coupon.type === 'percentage'
                        ? `${coupon.discountValue}%`
                        : coupon.type === 'fixed'
                        ? formatKRW(coupon.discountValue)
                        : '무료배송'}
                      {coupon.type === 'percentage' && coupon.maxDiscountAmount && (
                        <div className="text-xs text-gray-400">
                          최대 {formatKRW(coupon.maxDiscountAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600">
                      {coupon.usageCount}/{coupon.totalUsageLimit || '∞'}
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-gray-600">
                      {coupon.startDate.toLocaleDateString('ko-KR')} ~<br />
                      {coupon.endDate.toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {coupon.isActive ? (
                        <Badge variant="success">활성</Badge>
                      ) : (
                        <Badge variant="default">비활성</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Coupon Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="플랫폼 쿠폰 생성"
      >
        <div className="space-y-4">
          <Input
            label="쿠폰명"
            value={couponName}
            onChange={(e) => setCouponName(e.target.value)}
            placeholder="쿠폰 이름을 입력해주세요"
          />

          <div className="flex gap-2">
            <Input
              label="쿠폰 코드"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="PLATFORM-XXXX-XXXX"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleGenerateCode} className="mt-auto">
              자동생성
            </Button>
          </div>

          <Select
            label="할인 유형"
            value={couponType}
            onChange={(v) => setCouponType(v as CouponType)}
            options={[
              { value: 'percentage', label: '정률 할인 (%)' },
              { value: 'fixed', label: '정액 할인 (원)' },
              { value: 'free_shipping', label: '무료배송' },
            ]}
          />

          {couponType !== 'free_shipping' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={couponType === 'percentage' ? '할인율 (%)' : '할인금액 (원)'}
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={couponType === 'percentage' ? '10' : '5000'}
              />
              {couponType === 'percentage' && (
                <Input
                  label="최대 할인금액 (원)"
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="10000"
                />
              )}
            </div>
          )}

          <Input
            label="최소 구매금액 (원)"
            type="number"
            value={minPurchaseAmount}
            onChange={(e) => setMinPurchaseAmount(e.target.value)}
            placeholder="0"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="사용자당 사용 횟수"
              type="number"
              value={usageLimitPerUser}
              onChange={(e) => setUsageLimitPerUser(e.target.value)}
              placeholder="무제한"
            />
            <Input
              label="총 발급 수량"
              type="number"
              value={totalUsageLimit}
              onChange={(e) => setTotalUsageLimit(e.target.value)}
              placeholder="무제한"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              취소
            </Button>
            <Button onClick={handleCreateCoupon} disabled={saving}>
              {saving ? '생성 중...' : '쿠폰 생성'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
