'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { BuildingStorefrontIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatKRW } from '@/lib/utils/format';
import {
  getSuppliers,
  getSupplierApplications,
  approveSupplierApplication,
  rejectSupplierApplication,
  updateSupplier,
} from '@/lib/services/supplier-service';
import { getMalls } from '@/lib/services/mall-service';
import type { Supplier, SupplierApplication, Mall } from '@/types';

export default function AdminSuppliersPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Approval modal state
  const [approvingAppId, setApprovingAppId] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState(3);
  const [selectedMalls, setSelectedMalls] = useState<string[]>([]);

  // Reject modal state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [suppliersData, appsData, mallsData] = await Promise.all([
          getSuppliers(),
          getSupplierApplications({ status: 'pending' }),
          getMalls(),
        ]);
        setSuppliers(suppliersData);
        setApplications(appsData.applications);
        setMalls(mallsData);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isAdmin]);

  const handleApprove = async () => {
    if (!approvingAppId || !user) return;
    if (selectedMalls.length === 0) {
      alert('최소 1개 이상의 몰을 선택하세요.');
      return;
    }

    setSubmitting(true);
    try {
      await approveSupplierApplication(approvingAppId, user.id, commissionRate, selectedMalls);

      // Refresh data
      const [suppliersData, appsData] = await Promise.all([
        getSuppliers(),
        getSupplierApplications({ status: 'pending' }),
      ]);
      setSuppliers(suppliersData);
      setApplications(appsData.applications);

      setApprovingAppId(null);
      setCommissionRate(3);
      setSelectedMalls([]);
      alert('공급사가 승인되었습니다.');
    } catch (error: any) {
      alert(error.message || '승인 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingAppId || !user) return;
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력하세요.');
      return;
    }

    setSubmitting(true);
    try {
      await rejectSupplierApplication(rejectingAppId, user.id, rejectReason);

      // Refresh applications
      const appsData = await getSupplierApplications({ status: 'pending' });
      setApplications(appsData.applications);

      setRejectingAppId(null);
      setRejectReason('');
      alert('입점 신청이 거절되었습니다.');
    } catch (error: any) {
      alert(error.message || '거절 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMallSelection = (mallId: string) => {
    if (selectedMalls.includes(mallId)) {
      setSelectedMalls(selectedMalls.filter((id) => id !== mallId));
    } else {
      setSelectedMalls([...selectedMalls, mallId]);
    }
  };

  if (authLoading || loading) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">공급사 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          공급사 목록과 입점 신청을 관리합니다.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: '공급사 목록', value: 'suppliers', count: suppliers.length },
          { label: '입점 신청', value: 'applications', count: applications.length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <>
          {suppliers.length === 0 ? (
            <EmptyState
              icon={<BuildingStorefrontIcon className="h-12 w-12" />}
              title="등록된 공급사가 없습니다"
              description="입점 신청을 승인하면 여기에 표시됩니다."
            />
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">업체명</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">대표자</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">이메일</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">수수료율</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">상품수</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-gray-900">{supplier.name}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{supplier.contactName}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{supplier.email}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-900">
                          {supplier.commissionRate}%
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-gray-900">
                          {supplier.productCount}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            variant={
                              supplier.approvalStatus === 'approved'
                                ? 'success'
                                : supplier.approvalStatus === 'suspended'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {supplier.approvalStatus === 'approved'
                              ? '활성'
                              : supplier.approvalStatus === 'suspended'
                              ? '정지'
                              : '대기'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => alert('공급사 상세 관리 페이지는 준비 중입니다.')}>
                            관리
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <EmptyState
              icon={<BuildingStorefrontIcon className="h-12 w-12" />}
              title="대기 중인 신청이 없습니다"
              description="새로운 입점 신청이 오면 여기에 표시됩니다."
            />
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">신청자</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">업체명</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">이메일</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">카테고리</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">신청일</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-gray-900">{app.applicantName}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{app.businessName}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{app.applicantEmail}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {app.productCategories.slice(0, 2).map((cat) => (
                              <Badge key={cat} variant="secondary">
                                {cat}
                              </Badge>
                            ))}
                            {app.productCategories.length > 2 && (
                              <Badge variant="secondary">+{app.productCategories.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400">
                          {app.createdAt instanceof Date
                            ? app.createdAt.toLocaleDateString('ko-KR')
                            : new Date(app.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => setApprovingAppId(app.id)}
                            >
                              <CheckIcon className="h-3 w-3" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setRejectingAppId(app.id)}
                            >
                              <XMarkIcon className="h-3 w-3" />
                              거절
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Approval Modal */}
      {approvingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full">
            <CardTitle>공급사 승인</CardTitle>
            <div className="mt-4 space-y-4">
              <Input
                label="수수료율 (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  입점 몰 선택 (중복 선택 가능)
                </label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {malls.map((mall) => (
                    <label
                      key={mall.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded p-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMalls.includes(mall.id)}
                        onChange={() => toggleMallSelection(mall.id)}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="text-sm text-gray-900">{mall.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setApprovingAppId(null);
                  setCommissionRate(3);
                  setSelectedMalls([]);
                }}
              >
                취소
              </Button>
              <Button
                fullWidth
                onClick={handleApprove}
                disabled={submitting}
                isLoading={submitting}
              >
                승인
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full">
            <CardTitle>입점 신청 거절</CardTitle>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">거절 사유</label>
              <textarea
                placeholder="거절 사유를 입력하세요."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setRejectingAppId(null);
                  setRejectReason('');
                }}
              >
                취소
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleReject}
                disabled={submitting}
                isLoading={submitting}
              >
                거절
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
