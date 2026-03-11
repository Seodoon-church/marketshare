'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { getCoupons, deleteCoupon } from '@/lib/services/coupon-service';
import { formatKRW, formatDate } from '@/lib/utils/format';
import type { Coupon } from '@/types';
import {
  TicketIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function MallAdminCouponsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/';
    }
  }, [authLoading, isMallOwner]);

  // Fetch coupons
  useEffect(() => {
    if (!mallId) return;

    async function fetchCoupons() {
      setIsLoading(true);
      try {
        const result = await getCoupons({ mallId, limit: 100 });
        setCoupons(result);
      } catch (error: any) {
        toast({ type: 'error', message: error.message || '쿠폰 목록을 불러올 수 없습니다.' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCoupons();
  }, [mallId, toast]);

  const handleDelete = async () => {
    if (!deleteModal) return;

    setIsDeleting(true);
    try {
      await deleteCoupon(deleteModal.id);
      toast({ type: 'success', message: '쿠폰이 삭제되었습니다.' });
      setDeleteModal(null);

      // Refresh list
      const result = await getCoupons({ mallId, limit: 100 });
      setCoupons(result);
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '삭제에 실패했습니다.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading while auth is resolving
  if (authLoading || (!isMallOwner && !authLoading)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const now = new Date();
  const activeCoupons = coupons.filter((c) => c.isActive && c.endDate >= now);
  const usedCoupons = coupons.reduce((sum, c) => sum + c.usageCount, 0);
  const totalDiscount = coupons.reduce((sum, c) => {
    // This is a rough estimate - in real app, you'd track actual discount amounts
    return sum + c.usageCount * (c.type === 'fixed' ? c.discountValue : 5000);
  }, 0);

  const getCouponStatus = (coupon: Coupon): 'active' | 'expired' | 'exhausted' => {
    if (!coupon.isActive) return 'expired';
    if (coupon.endDate < now) return 'expired';
    if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) return 'exhausted';
    return 'active';
  };

  const statusBadgeVariants: Record<string, 'success' | 'default' | 'danger'> = {
    active: 'success',
    expired: 'default',
    exhausted: 'danger',
  };

  const statusLabels: Record<string, string> = {
    active: '활성',
    expired: '만료',
    exhausted: '소진',
  };

  const typeLabels: Record<string, string> = {
    percentage: '정률할인',
    fixed: '정액할인',
    free_shipping: '무료배송',
  };

  const tableColumns = [
    {
      accessor: 'name',
      header: '쿠폰명',
      render: (value: unknown, row: any) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.minPurchaseAmount > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              최소 {formatKRW(row.minPurchaseAmount)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessor: 'code',
      header: '코드',
      render: (value: unknown) => (
        <span className="font-mono text-sm text-gray-600">{value as string}</span>
      ),
    },
    {
      accessor: 'type',
      header: '유형',
      render: (value: unknown) => (
        <span className="text-sm text-gray-600">{typeLabels[value as string]}</span>
      ),
    },
    {
      accessor: 'discount',
      header: '할인',
      className: 'text-right',
      render: (value: unknown) => (
        <span className="font-semibold text-primary">{value as string}</span>
      ),
    },
    {
      accessor: 'usageCount',
      header: '사용/제한',
      className: 'text-center',
      render: (value: unknown, row: any) => (
        <span className="text-sm text-gray-600">
          {row.usageCount} / {row.totalUsageLimit ?? '무제한'}
        </span>
      ),
    },
    {
      accessor: 'startDate',
      header: '기간',
      render: (value: unknown, row: any) => (
        <div className="text-xs text-gray-600">
          <p>{formatDate(row.startDate)}</p>
          <p className="mt-0.5">~ {formatDate(row.endDate)}</p>
        </div>
      ),
    },
    {
      accessor: 'status',
      header: '상태',
      className: 'text-center',
      render: (value: unknown) => (
        <Badge variant={statusBadgeVariants[value as string]}>
          {statusLabels[value as string]}
        </Badge>
      ),
    },
    {
      accessor: 'id',
      header: '관리',
      className: 'text-center',
      render: (value: unknown, row: any) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => { window.location.href = `/mall-admin/coupons/create?edit=${row.id}`; }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
            title="편집"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ id: row.id, name: row.name })}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title="삭제"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const tableData = coupons.map((coupon) => {
    const status = getCouponStatus(coupon);
    const discountText =
      coupon.type === 'percentage'
        ? `${coupon.discountValue}%`
        : coupon.type === 'fixed'
        ? formatKRW(coupon.discountValue)
        : '무료배송';

    return {
      id: coupon.id,
      name: coupon.name,
      code: coupon.code,
      type: coupon.type,
      discount: discountText,
      usageCount: coupon.usageCount,
      totalUsageLimit: coupon.totalUsageLimit,
      minPurchaseAmount: coupon.minPurchaseAmount,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      status,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">쿠폰 관리</h1>
          <p className="mt-1 text-sm text-gray-500">할인 쿠폰을 생성하고 관리하세요.</p>
        </div>
        <Button href="/mall-admin/coupons/create">
          <PlusIcon className="h-4 w-4" />
          쿠폰 생성
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <div>
            <p className="text-sm text-emerald-700 font-medium">활성 쿠폰</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">{activeCoupons.length}개</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <div>
            <p className="text-sm text-blue-700 font-medium">사용된 쿠폰</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">{usedCoupons}회</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <div>
            <p className="text-sm text-violet-700 font-medium">총 할인금액</p>
            <p className="mt-2 text-3xl font-bold text-violet-900">{formatKRW(totalDiscount)}</p>
          </div>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card padding="none">
        <div className="p-5">
          <CardTitle>전체 쿠폰</CardTitle>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={<TicketIcon className="h-12 w-12" />}
            title="등록된 쿠폰이 없습니다"
            description="새 쿠폰을 생성하여 고객에게 할인 혜택을 제공하세요."
            action={{
              label: '쿠폰 생성',
              href: '/mall-admin/coupons/create',
            }}
          />
        ) : (
          <Table columns={tableColumns} data={tableData} />
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="쿠폰 삭제"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              정말로 <span className="font-semibold text-gray-900">{deleteModal.name}</span> 쿠폰을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-red-600">
              삭제된 쿠폰은 복구할 수 없으며, 이미 다운로드한 사용자도 사용할 수 없게 됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModal(null)}>
                취소
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
