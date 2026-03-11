'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { createCoupon, generateCouponCode } from '@/lib/services/coupon-service';
import type { CouponType, CouponScope } from '@/types';
import {
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function CreateCouponPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const mallId = user?.ownedMallIds?.[0];

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage' as CouponType,
    discountValue: '',
    maxDiscountAmount: '',
    minPurchaseAmount: '',
    scope: 'all' as CouponScope,
    scopeTargetIds: [] as string[],
    usageLimitPerUser: '',
    totalUsageLimit: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const [targetIdInput, setTargetIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateCode = () => {
    const code = generateCouponCode();
    setFormData({ ...formData, code });
  };

  const handleAddTargetId = () => {
    if (!targetIdInput.trim()) return;
    if (formData.scopeTargetIds.includes(targetIdInput.trim())) {
      toast({ type: 'warning', message: '이미 추가된 ID입니다.' });
      return;
    }
    setFormData({
      ...formData,
      scopeTargetIds: [...formData.scopeTargetIds, targetIdInput.trim()],
    });
    setTargetIdInput('');
  };

  const handleRemoveTargetId = (id: string) => {
    setFormData({
      ...formData,
      scopeTargetIds: formData.scopeTargetIds.filter((tid) => tid !== id),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mallId) {
      toast({ type: 'error', message: '몰 정보를 찾을 수 없습니다.' });
      return;
    }

    if (!formData.name.trim()) {
      toast({ type: 'warning', message: '쿠폰명을 입력해주세요.' });
      return;
    }

    if (!formData.code.trim()) {
      toast({ type: 'warning', message: '쿠폰 코드를 입력해주세요.' });
      return;
    }

    const discountValue = parseFloat(formData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      toast({ type: 'warning', message: '올바른 할인값을 입력해주세요.' });
      return;
    }

    if (formData.type === 'percentage' && discountValue > 100) {
      toast({ type: 'warning', message: '할인율은 100% 이하여야 합니다.' });
      return;
    }

    if ((formData.scope === 'category' || formData.scope === 'product') && formData.scopeTargetIds.length === 0) {
      toast({ type: 'warning', message: '적용 대상을 추가해주세요.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const couponData = {
        mallId,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        discountValue,
        maxDiscountAmount:
          formData.type === 'percentage' && formData.maxDiscountAmount
            ? parseInt(formData.maxDiscountAmount)
            : null,
        minPurchaseAmount: parseInt(formData.minPurchaseAmount) || 0,
        scope: formData.scope,
        scopeTargetIds: formData.scopeTargetIds,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : null,
        totalUsageLimit: formData.totalUsageLimit ? parseInt(formData.totalUsageLimit) : null,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isActive: true,
        createdBy: user?.id || '',
      };

      await createCoupon(couponData);
      toast({ type: 'success', message: '쿠폰이 생성되었습니다.' });
      router.push('/mall-admin/coupons');
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '쿠폰 생성에 실패했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'percentage', label: '정률할인 (%)' },
    { value: 'fixed', label: '정액할인 (원)' },
    { value: 'free_shipping', label: '무료배송' },
  ];

  const scopeOptions = [
    { value: 'all', label: '전체상품' },
    { value: 'category', label: '특정 카테고리' },
    { value: 'product', label: '특정 상품' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4" />
          뒤로
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">쿠폰 생성</h1>
          <p className="mt-1 text-sm text-gray-500">새로운 할인 쿠폰을 생성하세요.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardTitle className="mb-5">쿠폰 정보</CardTitle>

          <div className="space-y-4">
            {/* Coupon Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                쿠폰명 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="예: 신규가입 10% 할인 쿠폰"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Coupon Code */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                쿠폰 코드 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="MS-ABCD-1234"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
                <Button type="button" variant="outline" onClick={handleGenerateCode}>
                  <SparklesIcon className="h-4 w-4" />
                  자동생성
                </Button>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                할인 유형 <span className="text-red-500">*</span>
              </label>
              <Select
                options={typeOptions}
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value as CouponType })}
              />
            </div>

            {/* Discount Value */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  할인값 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder={formData.type === 'percentage' ? '10' : '5000'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  min="0"
                  step={formData.type === 'percentage' ? '0.1' : '1'}
                  required
                  disabled={formData.type === 'free_shipping'}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.type === 'percentage'
                    ? '할인율 (%)'
                    : formData.type === 'fixed'
                    ? '할인 금액 (원)'
                    : '무료배송은 할인값 불필요'}
                </p>
              </div>

              {formData.type === 'percentage' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    최대 할인금액 (선택)
                  </label>
                  <Input
                    type="number"
                    placeholder="제한 없음"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    min="0"
                  />
                </div>
              )}
            </div>

            {/* Min Purchase Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                최소 구매금액
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.minPurchaseAmount}
                onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                min="0"
              />
              <p className="mt-1 text-xs text-gray-500">0원이면 제한 없음</p>
            </div>

            {/* Scope */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                적용 범위
              </label>
              <Select
                options={scopeOptions}
                value={formData.scope}
                onChange={(value) => setFormData({ ...formData, scope: value as CouponScope, scopeTargetIds: [] })}
              />
            </div>

            {/* Scope Target IDs */}
            {(formData.scope === 'category' || formData.scope === 'product') && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  대상 {formData.scope === 'category' ? '카테고리' : '상품'} ID
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="ID를 입력하고 추가 버튼을 클릭"
                    value={targetIdInput}
                    onChange={(e) => setTargetIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTargetId())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTargetId}>
                    추가
                  </Button>
                </div>
                {formData.scopeTargetIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.scopeTargetIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {id}
                        <button
                          type="button"
                          onClick={() => handleRemoveTargetId(id)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Usage Limits */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  인당 사용제한
                </label>
                <Input
                  type="number"
                  placeholder="무제한"
                  value={formData.usageLimitPerUser}
                  onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                  min="1"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  총 사용제한
                </label>
                <Input
                  type="number"
                  placeholder="무제한"
                  value={formData.totalUsageLimit}
                  onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                  min="1"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  시작일 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  종료일 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              쿠폰 생성
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
