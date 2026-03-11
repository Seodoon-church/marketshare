'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatKRW, formatDate } from '@/lib/utils/format';
import {
  MagnifyingGlassIcon, PlusIcon, BuildingStorefrontIcon,
  UserGroupIcon, CheckCircleIcon, PauseCircleIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';
import { getMallById, createMall } from '@/lib/services/mall-service';
import { getFranchiseMalls, addChildMallToParent } from '@/lib/services/franchise-service';
import { syncSharedProductsForNewFranchisee } from '@/lib/services/shared-product-service';
import type { Mall, MallStatus } from '@/types';

type PlanType = 'free' | 'starter' | 'business' | 'enterprise';
type StatusFilter = 'all' | MallStatus;

const PLAN_COMMISSION: Record<PlanType, number> = { free: 5, starter: 3, business: 1.5, enterprise: 0.5 };

const planBadge: Record<PlanType, { label: string; variant: 'secondary' | 'info' | 'default' | 'warning' }> = {
  free: { label: 'Free', variant: 'secondary' },
  starter: { label: 'Starter', variant: 'info' },
  business: { label: 'Business', variant: 'default' },
  enterprise: { label: 'Enterprise', variant: 'warning' },
};

const statusBadgeMap: Record<MallStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' }> = {
  active: { label: '활성', variant: 'success' },
  suspended: { label: '정지', variant: 'danger' },
  pending: { label: '대기중', variant: 'warning' },
  expired: { label: '만료', variant: 'info' },
};

interface CreateForm { name: string; slug: string; ownerName: string; ownerEmail: string; plan: PlanType; }
const initialForm: CreateForm = { name: '', slug: '', ownerName: '', ownerEmail: '', plan: 'free' };

export default function FranchiseMallsPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { toast } = useToast();
  const [parentMall, setParentMall] = useState<Mall | null>(null);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateForm>(initialForm);
  const [isCreating, setIsCreating] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'mall_owner')) window.location.href = '/';
  }, [authLoading, user]);

  // Load parent mall & franchise malls
  const fetchData = async () => {
    if (!user || !user.ownedMallIds?.length) return;
    try {
      setIsLoading(true);
      setError(null);
      const mall = await getMallById(user.ownedMallIds[0]);
      if (!mall || !mall.childMallIds?.length) {
        setParentMall(mall);
        setMalls([]);
        setIsLoading(false);
        return;
      }
      setParentMall(mall);
      const children = await getFranchiseMalls(mall.id);
      setMalls(children);
    } catch (err: any) {
      setError(err.message || '가맹점 목록을 불러오는 중 오류가 발생했습니다.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== 'mall_owner') return;
    fetchData();
  }, [authLoading, user]);

  // Counts & summary
  const counts = useMemo(() => ({
    total: malls.length,
    active: malls.filter((m) => m.status === 'active').length,
    suspended: malls.filter((m) => m.status === 'suspended').length,
    pending: malls.filter((m) => m.status === 'pending').length,
    expired: malls.filter((m) => m.status === 'expired').length,
  }), [malls]);

  const summaryCards = [
    { label: '전체 가맹점', value: counts.total, icon: BuildingStorefrontIcon, gradient: 'from-violet-500 to-purple-500' },
    { label: '활성', value: counts.active, icon: CheckCircleIcon, gradient: 'from-emerald-500 to-teal-500' },
    { label: '정지', value: counts.suspended, icon: PauseCircleIcon, gradient: 'from-red-500 to-rose-500' },
    { label: '대기중', value: counts.pending, icon: ClockIcon, gradient: 'from-amber-500 to-orange-500' },
  ];

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: counts.total },
    { key: 'active', label: '활성', count: counts.active },
    { key: 'suspended', label: '정지', count: counts.suspended },
    { key: 'pending', label: '대기', count: counts.pending },
    { key: 'expired', label: '만료', count: counts.expired },
  ];

  const filteredMalls = useMemo(() => malls.filter((m) => {
    const matchesStatus = activeTab === 'all' || m.status === activeTab;
    const q = search.toLowerCase();
    const matchesSearch = !search || m.name.toLowerCase().includes(q) || (m.ownerName || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  }), [malls, activeTab, search]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev, name,
      slug: prev.slug === '' || prev.slug === nameToSlug(prev.name) ? nameToSlug(name) : prev.slug,
    }));
  };

  // Create franchisee mall
  const handleCreate = async () => {
    if (!form.name.trim()) return toast({ type: 'error', message: '몰 이름을 입력해주세요.' });
    if (!form.slug.trim()) return toast({ type: 'error', message: '몰 주소(slug)를 입력해주세요.' });
    if (!/^[a-z0-9-]+$/.test(form.slug)) return toast({ type: 'error', message: 'slug는 영문 소문자, 숫자, 하이픈만 사용 가능합니다.' });
    if (!form.ownerName.trim()) return toast({ type: 'error', message: '대표자 이름을 입력해주세요.' });
    if (!form.ownerEmail.trim()) return toast({ type: 'error', message: '대표자 이메일을 입력해주세요.' });
    if (!parentMall) return;

    setIsCreating(true);
    try {
      const newMallId = await createMall({
        name: form.name.trim(), slug: form.slug.trim(), ownerId: '', ownerName: form.ownerName.trim(),
        themeId: parentMall.themeId || 'default', themeConfig: {}, status: 'pending', level: 1,
        plan: form.plan, domain: null, subdomain: form.slug.trim(),
        businessInfo: {
          businessName: form.name.trim(), representative: form.ownerName.trim(),
          businessNumber: '', address: '', phone: '', email: form.ownerEmail.trim(),
          sellerType: 'domestic', businessCategory: 'personal',
        },
        bankInfo: null, commissionRate: PLAN_COMMISSION[form.plan], referralCommissionRate: 0,
        salesCommissionRate: PLAN_COMMISSION[form.plan], pgPaymentAuth: 'platform', pgConfig: null,
        description: '', logoUrl: null, faviconUrl: null,
        seoTitle: form.name.trim(), seoDescription: form.name.trim(), seoKeywords: [],
        isClosedMall: false, requireMemberApproval: false, hidePriceForNonMembers: false,
        pointSettings: null, productCount: 0, orderCount: 0, totalRevenue: 0,
        parentMallId: parentMall.id, childMallIds: [],
        franchiseStartDate: new Date(), franchiseEndDate: null,
      });
      await addChildMallToParent(parentMall.id, newMallId);
      await syncSharedProductsForNewFranchisee(parentMall.id, parentMall.name, newMallId);
      toast({ type: 'success', message: `"${form.name}" 가맹점이 추가되었습니다.` });
      setShowCreateModal(false);
      setForm(initialForm);
      await fetchData();
    } catch (err: any) {
      toast({ type: 'error', message: err.message || '가맹점 생성에 실패했습니다.' });
    } finally { setIsCreating(false); }
  };

  if (authLoading || !user || user.role !== 'mall_owner') {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <UserGroupIcon className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">가맹점 목록</h1>
            <p className="text-sm text-gray-500">
              {parentMall?.name ? `${parentMall.name} 본사의 가맹점을 관리합니다.` : '가맹점을 관리합니다.'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4" />
          가맹점 추가
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
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

      {/* Status Tabs */}
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
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="몰명 또는 대표자 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Loading */}
      {isLoading && <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>}

      {/* Error */}
      {error && !isLoading && (
        <Card><div className="py-12 text-center text-sm text-red-500">{error}</div></Card>
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
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">요금제</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">수수료율</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">상품수</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">매출</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">분양일</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredMalls.map((mall) => {
                  const st = statusBadgeMap[mall.status] || { label: mall.status, variant: 'info' as const };
                  const pl = planBadge[(mall.plan as PlanType)] || { label: mall.plan, variant: 'secondary' as const };
                  return (
                    <tr key={mall.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3"><span className="text-sm font-medium text-gray-900">{mall.name}</span></td>
                      <td className="px-5 py-3 text-sm text-gray-600">{mall.ownerName || '-'}</td>
                      <td className="px-5 py-3"><Badge variant={pl.variant}>{pl.label}</Badge></td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{mall.commissionRate}%</td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-right font-medium">{(mall.productCount || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{formatKRW(mall.totalRevenue || 0)}</td>
                      <td className="px-5 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(mall.franchiseStartDate instanceof Date ? mall.franchiseStartDate.toISOString() : String(mall.franchiseStartDate))}
                      </td>
                      <td className="px-5 py-3">
                        <a href={`/malls/${mall.subdomain || mall.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">관리</Button>
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {filteredMalls.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">
                      {malls.length === 0 ? '등록된 가맹점이 없습니다.' : '검색 결과가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Franchisee Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setForm(initialForm); }} title="가맹점 추가" size="lg">
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
            <p className="text-xs text-blue-800">새 가맹점을 생성하면 본사의 공유 상품이 자동으로 동기화됩니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">몰 이름 <span className="text-red-500">*</span></label>
              <Input placeholder="예: 강남점" value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">몰 주소 (slug) <span className="text-red-500">*</span></label>
              <Input placeholder="gangnam-store" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
              <p className="mt-1 text-xs text-gray-400">{form.slug ? `${form.slug}.marketshare.kr` : 'slug.marketshare.kr'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">대표자 이름 <span className="text-red-500">*</span></label>
              <Input placeholder="홍길동" value={form.ownerName} onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">대표자 이메일 <span className="text-red-500">*</span></label>
              <Input placeholder="owner@example.com" value={form.ownerEmail} onChange={(e) => setForm((prev) => ({ ...prev, ownerEmail: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">요금제</label>
            <select value={form.plan} onChange={(e) => setForm((prev) => ({ ...prev, plan: e.target.value as PlanType }))} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="free">Free (수수료 5%)</option>
              <option value="starter">Starter (수수료 3%)</option>
              <option value="business">Business (수수료 1.5%)</option>
            </select>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-600"><span className="font-medium">수수료율:</span> {PLAN_COMMISSION[form.plan]}%</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); setForm(initialForm); }}>취소</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <><LoadingSpinner size="sm" /> 생성 중...</> : '가맹점 생성'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').replace(/[가-힣\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
