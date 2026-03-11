'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils/format';
import {
  getFranchiseApplications,
  updateApplicationStatus,
  approveFranchiseApplication,
  rejectFranchiseApplication,
} from '@/lib/services/franchise-service';
import type { FranchiseApplication as FranchiseAppType } from '@/types';
import type { FranchiseApplicationStatus } from '@/types';
import {
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const statusConfig: Record<
  FranchiseApplicationStatus,
  { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' }
> = {
  pending: { label: '심사대기', variant: 'warning' },
  reviewing: { label: '심사중', variant: 'info' },
  approved: { label: '승인', variant: 'default' },
  rejected: { label: '거절', variant: 'danger' },
};

const filterTabs: { key: FranchiseApplicationStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '심사대기' },
  { key: 'reviewing', label: '심사중' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
];

export default function AdminFranchisePage() {
  const [activeFilter, setActiveFilter] = useState<FranchiseApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applications, setApplications] = useState<FranchiseAppType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getFranchiseApplications();
      setApplications(data);
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '데이터를 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    const matchesFilter = activeFilter === 'all' || app.status === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      app.applicantName.includes(searchQuery) ||
      app.desiredMallName.includes(searchQuery) ||
      app.applicantPhone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const getCount = (status: FranchiseApplicationStatus | 'all') => {
    if (status === 'all') return applications.length;
    return applications.filter((app) => app.status === status).length;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStartReview = async (appId: string) => {
    try {
      await updateApplicationStatus(appId, 'reviewing');
      toast({ type: 'success', message: '심사가 시작되었습니다.' });
      await fetchApplications();
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '상태 변경 중 오류가 발생했습니다.' });
    }
  };

  const handleApprove = async (appId: string) => {
    const notes = prompt('승인 메모 (선택사항):') || '';
    try {
      await approveFranchiseApplication(appId, notes);
      toast({ type: 'success', message: '신청이 승인되었습니다.' });
      await fetchApplications();
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '승인 처리 중 오류가 발생했습니다.' });
    }
  };

  const handleReject = async (appId: string) => {
    const reason = prompt('거절 사유를 입력해주세요:');
    if (!reason) return;
    try {
      await rejectFranchiseApplication(appId, reason);
      toast({ type: 'success', message: '신청이 거절되었습니다.' });
      await fetchApplications();
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '거절 처리 중 오류가 발생했습니다.' });
    }
  };

  // Compute summary cards from real data
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayCount = applications.filter(
    (app) => app.createdAt >= todayStart
  ).length;

  const pendingCount = applications.filter(
    (app) => app.status === 'pending'
  ).length;

  const reviewingCount = applications.filter(
    (app) => app.status === 'reviewing'
  ).length;

  const monthlyApprovedCount = applications.filter(
    (app) => app.status === 'approved' && app.createdAt >= monthStart
  ).length;

  const summaryCards = [
    {
      label: '오늘 신청',
      value: todayCount,
      icon: ClockIcon,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: '심사대기',
      value: pendingCount,
      icon: DocumentCheckIcon,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      label: '심사중',
      value: reviewingCount,
      icon: UserGroupIcon,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      label: '이번달 승인',
      value: monthlyApprovedCount,
      icon: CheckCircleIcon,
      gradient: 'from-violet-500 to-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">분양 신청 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          분양몰 개설 신청을 검토하고 승인 또는 거절합니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
              >
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                    activeFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {getCount(tab.key)}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="신청자, 몰명, 연락처 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500">신청자</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">연락처</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">희망몰명</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">희망테마</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">신청일</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const status = statusConfig[app.status];
                const isExpanded = expandedId === app.id;
                return (
                  <>
                    <tr
                      key={app.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(app.id)}
                    >
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {app.applicantName}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {app.applicantPhone}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {app.desiredMallName}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600">{app.desiredTheme}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {app.status === 'pending' && (
                            <Button variant="default" size="sm" onClick={() => handleStartReview(app.id)}>
                              심사 시작
                            </Button>
                          )}
                          {app.status === 'reviewing' && (
                            <div className="flex gap-1">
                              <Button variant="success" size="sm" onClick={() => handleApprove(app.id)}>
                                승인
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleReject(app.id)}>
                                거절
                              </Button>
                            </div>
                          )}
                          {(app.status === 'approved' || app.status === 'rejected') && (
                            <span className="text-xs text-gray-400">처리완료</span>
                          )}
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${app.id}-detail`} className="border-b border-gray-50">
                        <td colSpan={7} className="bg-gray-50/70 px-5 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <UserGroupIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">
                              상세 정보
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                              <p className="text-[10px] text-gray-400">상호명</p>
                              <p className="text-xs font-medium text-gray-700">
                                {app.businessName || '-'}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                              <p className="text-[10px] text-gray-400">사업자번호</p>
                              <p className="text-xs font-medium text-gray-700">
                                {app.businessNumber || '-'}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                              <p className="text-[10px] text-gray-400">업종</p>
                              <p className="text-xs font-medium text-gray-700">
                                {app.industry || '-'}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                              <p className="text-[10px] text-gray-400">이메일</p>
                              <p className="text-xs font-medium text-gray-700">
                                {app.applicantEmail || '-'}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                              <p className="text-[10px] text-gray-400">희망 서브도메인</p>
                              <p className="text-xs font-medium text-gray-700">
                                {app.desiredSubdomain || '-'}
                              </p>
                            </div>
                            <div className="col-span-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 sm:col-span-3 lg:col-span-3">
                              <p className="text-[10px] text-gray-400">메시지</p>
                              <p className="text-xs font-medium text-gray-700">
                                {app.message || '-'}
                              </p>
                            </div>
                          </div>
                          {app.adminNotes && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                              <p className="text-[10px] text-amber-600">관리자 메모</p>
                              <p className="text-xs font-medium text-amber-800">
                                {app.adminNotes}
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm text-gray-400">해당 조건의 신청 내역이 없습니다.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
