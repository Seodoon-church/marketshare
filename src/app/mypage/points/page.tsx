'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserPointBalance, getUserPointHistory, getExpiringSoonPoints } from '@/lib/services/point-service';
import { formatKRW, formatDate, formatDateTime } from '@/lib/utils/format';
import type { PointTransaction, PointTransactionType } from '@/types';
import {
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 20;

const transactionTypeLabels: Record<PointTransactionType, string> = {
  earned: '적립',
  used: '사용',
  expired: '만료',
  admin_granted: '관리자 지급',
  admin_deducted: '관리자 차감',
};

const transactionTypeBadgeVariants: Record<PointTransactionType, 'success' | 'info' | 'default' | 'danger'> = {
  earned: 'success',
  used: 'info',
  expired: 'default',
  admin_granted: 'success',
  admin_deducted: 'danger',
};

export default function PointsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [balance, setBalance] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/mypage/points');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch data
  useEffect(() => {
    if (!user?.id || !mallId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch balance and expiring points
        const [currentBalance, expiringPoints] = await Promise.all([
          getUserPointBalance(user!.id, mallId),
          getExpiringSoonPoints(user!.id, mallId!, 30),
        ]);

        setBalance(currentBalance);
        setExpiringSoon(expiringPoints);

        // Fetch transactions
        const typeFilter = activeTab === 'all' ? undefined : activeTab as PointTransactionType;
        const result = await getUserPointHistory(user!.id, {
          mallId,
          type: typeFilter,
          limit: PAGE_SIZE,
        });

        setTransactions(result.transactions);
        setTotalPages(Math.ceil(result.transactions.length / PAGE_SIZE));
      } catch (error: any) {
        toast({ type: 'error', message: error.message || '포인트 내역을 불러올 수 없습니다.' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user?.id, mallId, activeTab, toast]);

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

  const tabs = [
    { value: 'all', label: '전체' },
    { value: 'earned', label: '적립' },
    { value: 'used', label: '사용' },
    { value: 'expired', label: '만료' },
  ];

  const tableColumns = [
    {
      accessor: 'createdAt',
      header: '날짜',
    },
    {
      accessor: 'type',
      header: '구분',
      render: (value: unknown) => (
        <Badge variant={transactionTypeBadgeVariants[value as PointTransactionType]}>
          {transactionTypeLabels[value as PointTransactionType]}
        </Badge>
      ),
    },
    {
      accessor: 'description',
      header: '내용',
      render: (value: unknown, row: any) => (
        <div>
          <p className="text-sm text-gray-900">{row.description}</p>
          {row.expiresAt && (
            <p className="text-xs text-gray-500 mt-0.5">
              만료일: {formatDate(row.expiresAt)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessor: 'amount',
      header: '금액',
      className: 'text-right',
      render: (value: unknown, row: any) => (
        <span className={row.amount >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
          {row.amount >= 0 ? '+' : ''}{formatKRW(row.amount)}
        </span>
      ),
    },
    {
      accessor: 'balance',
      header: '잔액',
      className: 'text-right',
      render: (value: unknown) => (
        <span className="text-gray-900 font-medium">{formatKRW(value as number)}</span>
      ),
    },
  ];

  const tableData = transactions
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    .map((tx) => ({
      id: tx.id,
      createdAt: formatDateTime(tx.createdAt),
      type: tx.type,
      description: tx.description,
      expiresAt: tx.expiresAt,
      amount: tx.amount,
      balance: tx.balance,
    }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">포인트 내역</h1>
        <p className="mt-1 text-sm text-gray-500">적립 및 사용 내역을 확인하세요.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">총 보유 포인트</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatKRW(balance)}</p>
              <p className="mt-1 text-xs text-gray-500">사용 가능한 포인트입니다</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CurrencyDollarIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                곧 만료될 포인트
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-900">{formatKRW(expiringSoon)}</p>
              <p className="mt-1 text-xs text-amber-600">30일 이내 만료 예정</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <ClockIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card padding="none">
        <div className="border-b border-gray-100 px-5 pt-5">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<CurrencyDollarIcon className="h-12 w-12" />}
            title="포인트 내역이 없습니다"
            description="아직 포인트를 적립하거나 사용한 내역이 없습니다."
          />
        ) : (
          <>
            <Table columns={tableColumns} data={tableData} />
            {totalPages > 1 && (
              <div className="border-t border-gray-100 p-5">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
