'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getMallPointSettings,
  updateMallPointSettings,
  adminGrantPoints,
  adminDeductPoints,
  getUserPointBalance,
  getUserPointHistory,
} from '@/lib/services/point-service';
import { formatKRW, formatDateTime } from '@/lib/utils/format';
import { collection, query, where, getDocs, limit as fbLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { PointSettings, PointTransaction } from '@/types';
import {
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function MallAdminPointsPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<PointSettings>({
    enabled: false,
    earningRate: 1,
    minOrderAmount: 10000,
    maxEarningPerOrder: null,
    expirationDays: 365,
    allowPartialUse: true,
    minUsageAmount: 100,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User management
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [pointAction, setPointAction] = useState<'grant' | 'deduct'>('grant');
  const [pointAmount, setPointAmount] = useState('');
  const [pointReason, setPointReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<PointTransaction[]>([]);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/';
    }
  }, [authLoading, isMallOwner]);

  // Fetch settings
  useEffect(() => {
    if (!mallId) return;

    async function fetchSettings() {
      setIsLoading(true);
      try {
        const mallSettings = await getMallPointSettings(mallId!);
        setSettings(mallSettings);
      } catch (error: any) {
        toast({ type: 'error', message: error.message || '설정을 불러올 수 없습니다.' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [mallId, toast]);

  const handleSaveSettings = async () => {
    if (!mallId) return;

    setIsSaving(true);
    try {
      await updateMallPointSettings(mallId, settings);
      toast({ type: 'success', message: '포인트 설정이 저장되었습니다.' });
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast({ type: 'warning', message: '회원 이메일을 입력해주세요.' });
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchEmail.trim()), fbLimit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({ type: 'warning', message: '해당 이메일의 회원을 찾을 수 없습니다.' });
        setSelectedUserId('');
        setSelectedUserEmail('');
        setUserBalance(0);
        setRecentTransactions([]);
        return;
      }

      const userDoc = snapshot.docs[0];
      const foundUserId = userDoc.id;
      const userData = userDoc.data();

      setSelectedUserId(foundUserId);
      setSelectedUserEmail(userData.email || searchEmail);

      const balance = await getUserPointBalance(foundUserId, mallId!);
      setUserBalance(balance);

      const history = await getUserPointHistory(foundUserId, {
        mallId,
        limit: 20,
      });
      setRecentTransactions(history.transactions);
      toast({ type: 'success', message: `${userData.name || userData.email} 회원을 찾았습니다.` });
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '회원 검색 중 오류가 발생했습니다.' });
    }
  };

  const handleProcessPoints = async () => {
    if (!selectedUserId) {
      toast({ type: 'warning', message: '회원을 먼저 검색해주세요.' });
      return;
    }

    const amount = parseInt(pointAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ type: 'warning', message: '올바른 포인트 금액을 입력해주세요.' });
      return;
    }

    if (!pointReason.trim()) {
      toast({ type: 'warning', message: '사유를 입력해주세요.' });
      return;
    }

    setIsProcessing(true);
    try {
      if (pointAction === 'grant') {
        await adminGrantPoints(selectedUserId, mallId!, amount, pointReason, user!.id);
        toast({ type: 'success', message: `${formatKRW(amount)}이 지급되었습니다.` });
      } else {
        await adminDeductPoints(selectedUserId, mallId!, amount, pointReason, user!.id);
        toast({ type: 'success', message: `${formatKRW(amount)}이 차감되었습니다.` });
      }

      // Refresh balance and history
      const balance = await getUserPointBalance(selectedUserId, mallId!);
      setUserBalance(balance);

      const history = await getUserPointHistory(selectedUserId, {
        mallId,
        limit: 20,
      });
      setRecentTransactions(history.transactions);

      // Reset form
      setPointAmount('');
      setPointReason('');
    } catch (error: any) {
      toast({ type: 'error', message: error.message });
    } finally {
      setIsProcessing(false);
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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const tableColumns = [
    {
      accessor: 'createdAt',
      header: '날짜',
    },
    {
      accessor: 'type',
      header: '구분',
      render: (value: unknown, row: any) => (
        <Badge variant={row.amount >= 0 ? 'success' : 'danger'}>
          {row.type === 'admin_granted' ? '지급' : row.type === 'admin_deducted' ? '차감' : row.type}
        </Badge>
      ),
    },
    {
      accessor: 'description',
      header: '내용',
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
      render: (value: unknown) => formatKRW(value as number),
    },
  ];

  const tableData = recentTransactions.map((tx) => ({
    id: tx.id,
    createdAt: formatDateTime(tx.createdAt),
    type: tx.type,
    description: tx.description,
    amount: tx.amount,
    balance: tx.balance,
  }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">포인트 관리</h1>
        <p className="mt-1 text-sm text-gray-500">포인트 정책을 설정하고 회원 포인트를 관리하세요.</p>
      </div>

      {/* Point Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CurrencyDollarIcon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>포인트 설정</CardTitle>
        </div>

        <div className="space-y-4">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">포인트 활성화</label>
              <p className="text-xs text-gray-500 mt-0.5">포인트 적립 및 사용 기능을 활성화합니다</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                적립률 (%)
              </label>
              <Input
                type="number"
                value={settings.earningRate}
                onChange={(e) => setSettings({ ...settings, earningRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                최소 주문금액
              </label>
              <Input
                type="number"
                value={settings.minOrderAmount}
                onChange={(e) => setSettings({ ...settings, minOrderAmount: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                주문당 최대 적립 (선택)
              </label>
              <Input
                type="number"
                value={settings.maxEarningPerOrder || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxEarningPerOrder: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="제한 없음"
                min="0"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                만료일수
              </label>
              <Input
                type="number"
                value={settings.expirationDays}
                onChange={(e) => setSettings({ ...settings, expirationDays: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                최소 사용금액
              </label>
              <Input
                type="number"
                value={settings.minUsageAmount}
                onChange={(e) => setSettings({ ...settings, minUsageAmount: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <label className="text-sm font-medium text-gray-700">부분 사용 허용</label>
                <p className="text-xs text-gray-500 mt-0.5">포인트를 일부만 사용할 수 있도록 허용합니다</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allowPartialUse: !settings.allowPartialUse })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.allowPartialUse ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.allowPartialUse ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveSettings} isLoading={isSaving}>
              <CheckCircleIcon className="h-4 w-4" />
              설정 저장
            </Button>
          </div>
        </div>
      </Card>

      {/* User Point Management */}
      <Card>
        <CardTitle className="mb-5">회원 포인트 관리</CardTitle>

        <div className="space-y-4">
          {/* Search User */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">회원 검색</label>
            <div className="flex gap-2">
              <Input
                placeholder="회원 이메일 입력"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
              />
              <Button onClick={handleSearchUser}>
                <MagnifyingGlassIcon className="h-4 w-4" />
                검색
              </Button>
            </div>
          </div>

          {/* User Info */}
          {selectedUserId && (
            <>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">검색된 회원</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedUserEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">보유 포인트</p>
                    <p className="mt-1 text-xl font-bold text-primary">{formatKRW(userBalance)}</p>
                  </div>
                </div>
              </div>

              {/* Point Action */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">작업</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPointAction('grant')}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        pointAction === 'grant'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      지급
                    </button>
                    <button
                      onClick={() => setPointAction('deduct')}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        pointAction === 'deduct'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      차감
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">금액</label>
                  <Input
                    type="number"
                    placeholder="포인트 금액"
                    value={pointAmount}
                    onChange={(e) => setPointAmount(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">사유</label>
                  <Input
                    placeholder="지급/차감 사유 입력"
                    value={pointReason}
                    onChange={(e) => setPointReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant={pointAction === 'grant' ? 'default' : 'danger'}
                  onClick={handleProcessPoints}
                  isLoading={isProcessing}
                >
                  {pointAction === 'grant' ? '포인트 지급' : '포인트 차감'}
                </Button>
              </div>

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">최근 내역</h3>
                  <div className="rounded-lg border border-gray-200">
                    <Table columns={tableColumns} data={tableData} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
