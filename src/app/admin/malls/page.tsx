'use client';

import { useState, useEffect, useMemo } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatKRW, formatDate } from '@/lib/utils/format';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { getMalls, updateMall, createMall } from '@/lib/services/mall-service';
import { getUsers } from '@/lib/services/user-service';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Mall, MallStatus, PlanId, User } from '@/types';

type PlanType = PlanId;

const PLAN_COMMISSION: Record<PlanType, number> = {
  free: 5,
  starter: 3,
  business: 1.5,
  enterprise: 0.5,
};

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free (5%)',
  starter: 'Starter (3%)',
  business: 'Business (1.5%)',
  enterprise: 'Enterprise (0.5%)',
};

const planConfig: Record<PlanType, { label: string; variant: 'secondary' | 'info' | 'default' | 'warning' }> = {
  free: { label: 'Free', variant: 'secondary' },
  starter: { label: 'Starter', variant: 'info' },
  business: { label: 'Business', variant: 'default' },
  enterprise: { label: 'Enterprise', variant: 'warning' },
};

const statusBadgeMap: Record<MallStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  active: { label: '운영중', variant: 'success' },
  suspended: { label: '일시중지', variant: 'warning' },
  pending: { label: '대기중', variant: 'info' },
  expired: { label: '만료', variant: 'danger' },
};

const planFilterOptions: { key: PlanType | 'all'; label: string }[] = [
  { key: 'all', label: '전체 요금제' },
  { key: 'free', label: 'Free' },
  { key: 'starter', label: 'Starter' },
  { key: 'business', label: 'Business' },
  { key: 'enterprise', label: 'Enterprise' },
];

type StatusFilter = 'all' | MallStatus;

interface CreateMallForm {
  name: string;
  slug: string;
  ownerId: string;
  plan: PlanType;
  description: string;
  status: MallStatus;
}

const initialMallForm: CreateMallForm = {
  name: '',
  slug: '',
  ownerId: '',
  plan: 'enterprise',
  description: '',
  status: 'active',
};

export default function AdminMallsPage() {
  const { user: authUser, isLoading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [malls, setMalls] = useState<Mall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create mall modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mallForm, setMallForm] = useState<CreateMallForm>(initialMallForm);
  const [isCreatingMall, setIsCreatingMall] = useState(false);
  const [mallOwners, setMallOwners] = useState<User[]>([]);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  // Admin guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  const fetchMalls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getMalls();
      setMalls(result);
    } catch (err: any) {
      setError(err.message || '몰 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    fetchMalls();
  }, [authLoading, isAdmin]);

  // Load mall_owner users when modal opens
  useEffect(() => {
    if (!showCreateModal) return;
    async function loadOwners() {
      setIsLoadingOwners(true);
      try {
        const result = await getUsers({ limit: 50, role: 'mall_owner' });
        setMallOwners(result.users);
      } catch {
        // fallback: empty list, user can enter ID manually
      } finally {
        setIsLoadingOwners(false);
      }
    }
    loadOwners();
  }, [showCreateModal]);

  // Compute status tab counts from real data
  const statusTabs = useMemo(() => {
    const allCount = malls.length;
    const activeCount = malls.filter((m) => m.status === 'active').length;
    const suspendedCount = malls.filter((m) => m.status === 'suspended').length;
    const pendingCount = malls.filter((m) => m.status === 'pending').length;
    const expiredCount = malls.filter((m) => m.status === 'expired').length;

    return [
      { key: 'all' as StatusFilter, label: '전체', count: allCount },
      { key: 'active' as StatusFilter, label: '운영중', count: activeCount },
      { key: 'suspended' as StatusFilter, label: '일시중지', count: suspendedCount },
      { key: 'pending' as StatusFilter, label: '대기중', count: pendingCount },
      { key: 'expired' as StatusFilter, label: '만료', count: expiredCount },
    ];
  }, [malls]);

  const handlePlanChange = async (mallId: string, newPlan: PlanType) => {
    setChangingPlanId(mallId);
    try {
      await updateMall(mallId, {
        plan: newPlan,
        commissionRate: PLAN_COMMISSION[newPlan],
        salesCommissionRate: PLAN_COMMISSION[newPlan],
      } as Partial<Mall>);
      setMalls((prev) =>
        prev.map((m) =>
          m.id === mallId
            ? { ...m, plan: newPlan, commissionRate: PLAN_COMMISSION[newPlan] }
            : m
        )
      );
    } catch (err: any) {
      toast({ type: 'error', message: err.message || '플랜 변경 실패' });
    } finally {
      setChangingPlanId(null);
    }
  };

  const handleCreateMall = async () => {
    if (!mallForm.name.trim()) {
      toast({ type: 'error', message: '몰 이름을 입력해주세요.' });
      return;
    }
    if (!mallForm.slug.trim()) {
      toast({ type: 'error', message: '몰 주소(slug)를 입력해주세요.' });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(mallForm.slug)) {
      toast({ type: 'error', message: 'slug는 영문 소문자, 숫자, 하이픈만 사용 가능합니다.' });
      return;
    }
    if (!mallForm.ownerId) {
      toast({ type: 'error', message: '몰 운영자를 선택해주세요.' });
      return;
    }

    setIsCreatingMall(true);
    try {
      const selectedOwner = mallOwners.find(u => u.id === mallForm.ownerId);
      await createMall({
        name: mallForm.name.trim(),
        slug: mallForm.slug.trim(),
        ownerId: mallForm.ownerId,
        ownerName: selectedOwner?.name || '',
        themeId: 'default',
        themeConfig: {},
        status: mallForm.status,
        level: 1,
        plan: mallForm.plan,
        domain: null,
        subdomain: mallForm.slug.trim(),
        businessInfo: {
          businessName: mallForm.name.trim(),
          representative: selectedOwner?.name || '',
          businessNumber: '',
          address: '',
          phone: selectedOwner?.phone || '',
          email: selectedOwner?.email || '',
          sellerType: 'domestic',
          businessCategory: 'personal',
        },
        bankInfo: null,
        commissionRate: PLAN_COMMISSION[mallForm.plan],
        referralCommissionRate: 0,
        salesCommissionRate: PLAN_COMMISSION[mallForm.plan],
        pgPaymentAuth: 'platform',
        pgConfig: null,
        description: mallForm.description.trim(),
        logoUrl: null,
        faviconUrl: null,
        seoTitle: mallForm.name.trim(),
        seoDescription: mallForm.description.trim() || mallForm.name.trim(),
        seoKeywords: [],
        isClosedMall: false,
        requireMemberApproval: false,
        hidePriceForNonMembers: false,
        pointSettings: null,
        productCount: 0,
        orderCount: 0,
        totalRevenue: 0,
        parentMallId: null,
        childMallIds: [],
        franchiseStartDate: new Date(),
        franchiseEndDate: null,
      });

      toast({ type: 'success', message: `"${mallForm.name}" 몰이 생성되었습니다.` });
      setShowCreateModal(false);
      setMallForm(initialMallForm);
      await fetchMalls();
    } catch (err: any) {
      toast({ type: 'error', message: err.message || '몰 생성에 실패했습니다.' });
    } finally {
      setIsCreatingMall(false);
    }
  };

  // Auto-generate slug from name (Korean → transliterate, else lowercase)
  const handleNameChange = (name: string) => {
    setMallForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === nameToSlug(prev.name)
        ? nameToSlug(name)
        : prev.slug,
    }));
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredMalls = malls.filter((mall) => {
    const matchesStatus = activeTab === 'all' || mall.status === activeTab;
    const matchesPlan = planFilter === 'all' || mall.plan === planFilter;
    const matchesSearch =
      search === '' ||
      mall.name.includes(search) ||
      (mall.ownerName || '').includes(search) ||
      (mall.subdomain + '.marketshare.kr').includes(search);
    return matchesStatus && matchesPlan && matchesSearch;
  });

  const filteredOwners = mallOwners.filter((u) =>
    ownerSearch === '' ||
    u.name.includes(ownerSearch) ||
    u.email.includes(ownerSearch)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <BuildingStorefrontIcon className="h-5 w-5 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">분양몰 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4" />
            몰 직접 생성
          </Button>
          <Button href="/create-mall">
            <PlusIcon className="h-4 w-4" />
            분양 신청
          </Button>
        </div>
      </div>

      {/* Stats Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Plan Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="몰명, 대표자, 도메인 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {planFilterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setPlanFilter(option.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                planFilter === option.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <div className="py-12 text-center text-sm text-red-500">{error}</div>
        </Card>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">몰명</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">대표자</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">도메인</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">요금제</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">수수료</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">상품수</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">매출</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">생성일</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredMalls.map((mall) => {
                  const statusBadge = statusBadgeMap[mall.status] || { label: mall.status, variant: 'secondary' as const };
                  const plan = planConfig[mall.plan as PlanType] || { label: mall.plan, variant: 'secondary' as const };
                  return (
                    <tr
                      key={mall.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-gray-900">{mall.name}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{mall.ownerName || 'N/A'}</td>
                      <td className="px-5 py-3">
                        <a
                          href={`/malls/${mall.subdomain || mall.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary font-mono hover:underline"
                        >
                          {mall.subdomain + '.marketshare.kr'}
                        </a>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={mall.plan}
                          onChange={(e) => handlePlanChange(mall.id, e.target.value as PlanType)}
                          disabled={changingPlanId === mall.id}
                          className={`rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                            changingPlanId === mall.id ? 'opacity-50' : ''
                          } ${
                            mall.plan === 'enterprise' ? 'text-amber-700 bg-amber-50' :
                            mall.plan === 'business' ? 'text-primary bg-primary/5' :
                            mall.plan === 'starter' ? 'text-blue-700 bg-blue-50' :
                            'text-gray-700 bg-gray-50'
                          }`}
                        >
                          <option value="free">Free (5%)</option>
                          <option value="starter">Starter (3%)</option>
                          <option value="business">Business (1.5%)</option>
                          <option value="enterprise">Enterprise (0.5%)</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">
                        {mall.commissionRate}%
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-right font-medium">
                        {(mall.productCount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatKRW(mall.totalRevenue || 0)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(
                          mall.createdAt instanceof Date
                            ? mall.createdAt.toISOString()
                            : String(mall.createdAt)
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Button variant="outline" size="sm" onClick={() => alert('분양몰 상세 페이지는 준비 중입니다.')}>
                          관리
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredMalls.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">
                      {malls.length === 0 ? '등록된 분양몰이 없습니다.' : '검색 결과가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Mall Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setMallForm(initialMallForm);
          setOwnerSearch('');
        }}
        title="분양몰 직접 생성"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
            <p className="text-xs text-blue-800">
              분양 신청 절차 없이 관리자가 직접 몰을 생성하여 운영자에게 배정합니다.
              엔터프라이즈 고객이나 특별 계약 건에 사용합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Mall Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                몰 이름 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="예: 건강한생활"
                value={mallForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                몰 주소 (slug) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <Input
                  placeholder="healthy-life"
                  value={mallForm.slug}
                  onChange={(e) => setMallForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {mallForm.slug ? `${mallForm.slug}.marketshare.kr` : 'slug.marketshare.kr'}
              </p>
            </div>
          </div>

          {/* Owner Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              운영자 선택 <span className="text-red-500">*</span>
            </label>
            {isLoadingOwners ? (
              <div className="flex items-center gap-2 py-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">운영자 목록 로딩 중...</span>
              </div>
            ) : (
              <>
                <Input
                  placeholder="이름 또는 이메일로 검색..."
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                  {filteredOwners.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-gray-400">
                      {mallOwners.length === 0
                        ? '등록된 몰운영자가 없습니다. 먼저 회원관리에서 몰운영자를 등록해주세요.'
                        : '검색 결과가 없습니다.'}
                    </div>
                  ) : (
                    filteredOwners.map((owner) => (
                      <button
                        key={owner.id}
                        onClick={() => setMallForm((prev) => ({ ...prev, ownerId: owner.id }))}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          mallForm.ownerId === owner.id
                            ? 'bg-primary/5 border-l-2 border-primary'
                            : 'hover:bg-gray-50 border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                          {owner.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{owner.name}</p>
                          <p className="text-xs text-gray-500 truncate">{owner.email}</p>
                        </div>
                        {mallForm.ownerId === owner.id && (
                          <span className="text-xs font-medium text-primary">선택됨</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Plan */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                요금제
              </label>
              <select
                value={mallForm.plan}
                onChange={(e) => setMallForm((prev) => ({ ...prev, plan: e.target.value as PlanType }))}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {Object.entries(PLAN_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                초기 상태
              </label>
              <select
                value={mallForm.status}
                onChange={(e) => setMallForm((prev) => ({ ...prev, status: e.target.value as MallStatus }))}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="active">운영중 (즉시 활성화)</option>
                <option value="pending">대기중 (설정 후 활성화)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              설명
            </label>
            <textarea
              placeholder="몰 설명 (선택사항)"
              value={mallForm.description}
              onChange={(e) => setMallForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Commission Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-600">
              <span className="font-medium">수수료율:</span> {PLAN_COMMISSION[mallForm.plan]}% (
              {PLAN_LABELS[mallForm.plan]})
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setMallForm(initialMallForm);
                setOwnerSearch('');
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreateMall} disabled={isCreatingMall}>
              {isCreatingMall ? (
                <>
                  <LoadingSpinner size="sm" />
                  생성 중...
                </>
              ) : (
                '몰 생성'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Simple Korean-safe slug helper */
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/[가-힣\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
