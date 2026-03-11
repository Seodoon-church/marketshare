'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallById, createMall } from '@/lib/services/mall-service';
import {
  getFranchiseApplicationsForMall, updateApplicationStatus,
  approveFranchiseApplication, rejectFranchiseApplication, addChildMallToParent,
} from '@/lib/services/franchise-service';
import { syncSharedProductsForNewFranchisee } from '@/lib/services/shared-product-service';
import type { FranchiseApplication, Mall, FranchiseApplicationStatus } from '@/types';
import {
  MagnifyingGlassIcon, DocumentCheckIcon, ChevronDownIcon,
  ChevronUpIcon, ClockIcon, CheckCircleIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';

const statusCfg: Record<FranchiseApplicationStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' }> = {
  pending: { label: '심사대기', variant: 'warning' },
  reviewing: { label: '심사중', variant: 'info' },
  approved: { label: '승인', variant: 'default' },
  rejected: { label: '거절', variant: 'danger' },
};

const tabs: { key: FranchiseApplicationStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' }, { key: 'pending', label: '심사대기' },
  { key: 'reviewing', label: '심사중' }, { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
];

function DetailCell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white px-3 py-2.5 ${className ?? ''}`}>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-medium text-gray-700">{value || '-'}</p>
    </div>
  );
}

export default function MallAdminFranchiseApplicationsPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const [mall, setMall] = useState<Mall | null>(null);
  const [filter, setFilter] = useState<FranchiseApplicationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [apps, setApps] = useState<FranchiseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const { toast } = useToast();
  const mallId = user?.ownedMallIds?.[0];

  useEffect(() => { if (!authLoading && !isMallOwner) window.location.href = '/'; }, [authLoading, isMallOwner]);

  useEffect(() => {
    if (!mallId) return;
    getMallById(mallId).then(setMall).catch(() => toast({ type: 'error', message: '몰 정보를 불러오는 중 오류가 발생했습니다.' }));
  }, [mallId, toast]);

  const fetchApps = useCallback(async () => {
    if (!mallId) return;
    try { setLoading(true); setApps(await getFranchiseApplicationsForMall(mallId)); }
    catch (e: any) { toast({ type: 'error', message: e.message || '데이터를 불러오는 중 오류가 발생했습니다.' }); }
    finally { setLoading(false); }
  }, [mallId, toast]);

  useEffect(() => { if (mallId) fetchApps(); }, [mallId, fetchApps]);

  const filtered = apps.filter((a) => {
    const statusOk = filter === 'all' || a.status === filter;
    const searchOk = !search || a.applicantName.includes(search) || a.desiredMallName.includes(search) || a.applicantPhone.includes(search);
    return statusOk && searchOk;
  });

  const cnt = (s: FranchiseApplicationStatus | 'all') => s === 'all' ? apps.length : apps.filter((a) => a.status === s).length;

  const handleStartReview = async (id: string) => {
    try { setActing(id); await updateApplicationStatus(id, 'reviewing'); toast({ type: 'success', message: '심사가 시작되었습니다.' }); await fetchApps(); }
    catch (e: any) { toast({ type: 'error', message: e.message || '상태 변경 중 오류가 발생했습니다.' }); }
    finally { setActing(null); }
  };

  const handleApprove = async (app: FranchiseApplication) => {
    if (!mall || !mallId) return;
    const notes = prompt('승인 메모 (선택사항):') || '';
    try {
      setActing(app.id);
      const slug = app.desiredSubdomain || app.desiredMallName.toLowerCase().replace(/\s+/g, '-');
      const newMallId = await createMall({
        name: app.desiredMallName, slug, ownerId: '', ownerName: app.applicantName,
        themeId: app.desiredTheme || mall.themeId, themeConfig: {}, status: 'active', level: 1, plan: 'free',
        domain: null, subdomain: app.desiredSubdomain || '',
        businessInfo: { businessName: app.businessName, businessNumber: app.businessNumber, representative: app.applicantName, address: '', phone: app.applicantPhone, email: app.applicantEmail },
        bankInfo: null, commissionRate: mall.commissionRate, referralCommissionRate: 0,
        salesCommissionRate: mall.salesCommissionRate, pgPaymentAuth: 'platform', pgConfig: null,
        description: '', logoUrl: null, faviconUrl: null, seoTitle: app.desiredMallName,
        seoDescription: '', seoKeywords: [], isClosedMall: false, requireMemberApproval: false,
        hidePriceForNonMembers: false, pointSettings: null, productCount: 0, orderCount: 0,
        totalRevenue: 0, parentMallId: mallId, childMallIds: [],
        franchiseStartDate: new Date(), franchiseEndDate: null,
        franchiseSettings: { showHeadquartersProducts: true, showNetworkProducts: true, shareOwnProducts: true, hiddenProductIds: [], customCommissionRate: null },
      });
      await addChildMallToParent(mallId, newMallId);
      await syncSharedProductsForNewFranchisee(mallId, mall.name, newMallId);
      await approveFranchiseApplication(app.id, newMallId);
      if (notes) await updateApplicationStatus(app.id, 'approved', notes);
      toast({ type: 'success', message: `${app.desiredMallName} 몰이 생성되고 신청이 승인되었습니다.` });
      await fetchApps();
    } catch (e: any) { toast({ type: 'error', message: e.message || '승인 처리 중 오류가 발생했습니다.' }); }
    finally { setActing(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('거절 사유를 입력해주세요:');
    if (!reason) return;
    try { setActing(id); await rejectFranchiseApplication(id, reason); toast({ type: 'success', message: '신청이 거절되었습니다.' }); await fetchApps(); }
    catch (e: any) { toast({ type: 'error', message: e.message || '거절 처리 중 오류가 발생했습니다.' }); }
    finally { setActing(null); }
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const summary = [
    { label: '오늘 신청', value: apps.filter((a) => a.createdAt >= todayStart).length, icon: ClockIcon, grad: 'from-blue-500 to-cyan-500' },
    { label: '심사대기', value: cnt('pending'), icon: DocumentCheckIcon, grad: 'from-amber-500 to-orange-500' },
    { label: '심사중', value: cnt('reviewing'), icon: UserGroupIcon, grad: 'from-emerald-500 to-teal-500' },
    { label: '이번달 승인', value: apps.filter((a) => a.status === 'approved' && a.createdAt >= monthStart).length, icon: CheckCircleIcon, grad: 'from-violet-500 to-purple-500' },
  ];

  if (authLoading || loading) return <div className="flex min-h-[400px] items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (mall?.parentMallId) return <div className="flex min-h-[400px] items-center justify-center"><p className="text-sm text-gray-500">본사(본부) 몰에서만 분양 신청을 관리할 수 있습니다.</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">분양 신청 관리</h1>
        <p className="mt-1 text-sm text-gray-500">내 몰에 대한 분양 신청을 검토하고 승인 또는 거절합니다.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((c) => (
          <Card key={c.label}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.grad} shadow-lg`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filter === t.key ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                {t.label}
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${filter === t.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {cnt(t.key)}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="신청자, 몰명, 연락처 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['신청자', '연락처', '희망몰명', '업종', '상태', '신청일', '관리'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const st = statusCfg[app.status];
                const exp = expandedId === app.id;
                const busy = acting === app.id;
                return (
                  <Fragment key={app.id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setExpandedId(exp ? null : app.id)}>
                      <td className="px-5 py-3"><span className="text-sm font-medium text-gray-900">{app.applicantName}</span></td>
                      <td className="px-5 py-3 text-sm text-gray-600">{app.applicantPhone}</td>
                      <td className="px-5 py-3"><span className="text-sm font-medium text-gray-900">{app.desiredMallName}</span></td>
                      <td className="px-5 py-3 text-sm text-gray-600">{app.industry || '-'}</td>
                      <td className="px-5 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(app.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {app.status === 'pending' && (
                            <Button variant="default" size="sm" onClick={() => handleStartReview(app.id)} disabled={busy}>
                              {busy ? '처리중...' : '심사 시작'}
                            </Button>
                          )}
                          {app.status === 'reviewing' && (
                            <div className="flex gap-1">
                              <Button variant="success" size="sm" onClick={() => handleApprove(app)} disabled={busy}>{busy ? '처리중...' : '승인'}</Button>
                              <Button variant="danger" size="sm" onClick={() => handleReject(app.id)} disabled={busy}>거절</Button>
                            </div>
                          )}
                          {(app.status === 'approved' || app.status === 'rejected') && <span className="text-xs text-gray-400">처리완료</span>}
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            {exp ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {exp && (
                      <tr className="border-b border-gray-50">
                        <td colSpan={7} className="bg-gray-50/70 px-5 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <UserGroupIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">상세 정보</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            <DetailCell label="상호명" value={app.businessName} />
                            <DetailCell label="사업자번호" value={app.businessNumber} />
                            <DetailCell label="업종" value={app.industry} />
                            <DetailCell label="이메일" value={app.applicantEmail} />
                            <DetailCell label="희망 서브도메인" value={app.desiredSubdomain} />
                            <DetailCell label="메시지" value={app.message} className="col-span-2 sm:col-span-3 lg:col-span-3" />
                          </div>
                          {app.adminNotes && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                              <p className="text-[10px] text-amber-600">관리자 메모</p>
                              <p className="text-xs font-medium text-amber-800">{app.adminNotes}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center"><p className="text-sm text-gray-400">해당 조건의 신청 내역이 없습니다.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
