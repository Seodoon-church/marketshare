'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getMallGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  initializeDefaultGrades,
  getDefaultGrades,
} from '@/lib/services/grade-service';
import { formatKRW } from '@/lib/utils/format';
import type { MemberGrade } from '@/types';
import {
  TrophyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function MallAdminGradesPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const [grades, setGrades] = useState<MemberGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MemberGrade>>({});
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/';
    }
  }, [authLoading, isMallOwner]);

  // Fetch grades
  const fetchGrades = async () => {
    if (!mallId) return;

    setIsLoading(true);
    try {
      const result = await getMallGrades(mallId);
      setGrades(result);
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '등급 목록을 불러올 수 없습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [mallId, toast]);

  const handleInitializeDefault = async () => {
    if (!mallId) return;

    if (grades.length > 0) {
      const confirmed = window.confirm(
        '기존 등급이 모두 삭제되고 기본 등급으로 초기화됩니다. 계속하시겠습니까?'
      );
      if (!confirmed) return;
    }

    setIsInitializing(true);
    try {
      await initializeDefaultGrades(mallId);
      toast({ type: 'success', message: '기본 등급이 초기화되었습니다.' });
      await fetchGrades();
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '초기화에 실패했습니다.' });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleEdit = (grade: MemberGrade) => {
    setEditingId(grade.id);
    setEditForm(grade);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId || !mallId) return;

    // Validation
    if (!editForm.name?.trim()) {
      toast({ type: 'warning', message: '등급명을 입력해주세요.' });
      return;
    }

    if (editForm.minPurchaseAmount === undefined || editForm.minPurchaseAmount < 0) {
      toast({ type: 'warning', message: '승급 기준 금액을 입력해주세요.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateGrade(mallId, editingId, editForm);
      toast({ type: 'success', message: '등급이 수정되었습니다.' });
      await fetchGrades();
      setEditingId(null);
      setEditForm({});
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal || !mallId) return;

    setIsDeleting(true);
    try {
      await deleteGrade(mallId, deleteModal.id);
      toast({ type: 'success', message: '등급이 삭제되었습니다.' });
      setDeleteModal(null);
      await fetchGrades();
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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원등급 관리</h1>
          <p className="mt-1 text-sm text-gray-500">회원등급과 혜택을 설정하세요.</p>
        </div>
        {grades.length === 0 && (
          <Button onClick={handleInitializeDefault} isLoading={isInitializing}>
            <SparklesIcon className="h-4 w-4" />
            기본 등급 초기화
          </Button>
        )}
      </div>

      {/* Empty State */}
      {grades.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TrophyIcon className="h-12 w-12" />}
            title="등록된 회원등급이 없습니다"
            description="기본 등급을 초기화하거나 새 등급을 생성하세요."
            action={{
              label: '기본 등급 초기화',
              onClick: handleInitializeDefault,
            }}
          />
        </Card>
      ) : (
        <>
          {/* Info Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <TrophyIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">회원등급 안내</h3>
                <p className="mt-1 text-sm text-blue-700">
                  회원들은 설정된 평가기간 동안의 구매금액에 따라 자동으로 등급이 승급됩니다.
                  각 등급별 혜택을 차별화하여 구매를 유도할 수 있습니다.
                </p>
              </div>
            </div>
          </Card>

          {/* Grades Table */}
          <Card padding="none">
            <div className="p-5 flex items-center justify-between">
              <CardTitle>등급 목록</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInitializeDefault}
                isLoading={isInitializing}
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                기본값으로 초기화
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      등급
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                      승급기준
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      평가기간
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      추가 적립률
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      추가 할인률
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                      무료배송 기준
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      상태
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grades.map((grade) => {
                    const isEditing = editingId === grade.id;

                    return (
                      <tr key={grade.id} className="hover:bg-gray-50/50">
                        {/* Grade Name & Color */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editForm.color || grade.color}
                                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                className="h-6 w-6 rounded border-0"
                              />
                              <Input
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-24"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: grade.color }}
                              />
                              <span className="text-sm font-semibold text-gray-900">
                                {grade.name}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Min Purchase Amount */}
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.minPurchaseAmount ?? grade.minPurchaseAmount}
                              onChange={(e) =>
                                setEditForm({ ...editForm, minPurchaseAmount: parseInt(e.target.value) || 0 })
                              }
                              className="w-32 text-right"
                              min="0"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {formatKRW(grade.minPurchaseAmount)}
                            </span>
                          )}
                        </td>

                        {/* Evaluation Period */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.evaluationPeriodDays ?? grade.evaluationPeriodDays}
                              onChange={(e) =>
                                setEditForm({ ...editForm, evaluationPeriodDays: parseInt(e.target.value) || 90 })
                              }
                              className="w-20 text-center"
                              min="1"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">{grade.evaluationPeriodDays}일</span>
                          )}
                        </td>

                        {/* Extra Point Rate */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.benefits?.extraPointRate ?? grade.benefits.extraPointRate}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  benefits: {
                                    ...(editForm.benefits || grade.benefits),
                                    extraPointRate: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-20 text-center"
                              min="0"
                              step="0.1"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              +{grade.benefits.extraPointRate}%
                            </span>
                          )}
                        </td>

                        {/* Extra Discount Rate */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.benefits?.extraDiscountRate ?? grade.benefits.extraDiscountRate}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  benefits: {
                                    ...(editForm.benefits || grade.benefits),
                                    extraDiscountRate: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-20 text-center"
                              min="0"
                              step="0.1"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              +{grade.benefits.extraDiscountRate}%
                            </span>
                          )}
                        </td>

                        {/* Free Shipping Threshold */}
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.benefits?.freeShippingThreshold ?? grade.benefits.freeShippingThreshold}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  benefits: {
                                    ...(editForm.benefits || grade.benefits),
                                    freeShippingThreshold: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-32 text-right"
                              min="0"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {grade.benefits.freeShippingThreshold === 0
                                ? '무조건'
                                : formatKRW(grade.benefits.freeShippingThreshold)}
                            </span>
                          )}
                        </td>

                        {/* Active Status */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <button
                              onClick={() =>
                                setEditForm({ ...editForm, isActive: !editForm.isActive })
                              }
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                (editForm.isActive ?? grade.isActive) ? 'bg-primary' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  (editForm.isActive ?? grade.isActive) ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          ) : (
                            <Badge variant={grade.isActive ? 'success' : 'default'}>
                              {grade.isActive ? '활성' : '비활성'}
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                                title="저장"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                                title="취소"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(grade)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
                                title="편집"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({ id: grade.id, name: grade.name })}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                title="삭제"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="등급 삭제"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              정말로 <span className="font-semibold text-gray-900">{deleteModal.name}</span> 등급을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-red-600">
              이 등급을 사용 중인 회원이 있을 수 있습니다. 삭제 시 해당 회원들의 등급 정보가 초기화됩니다.
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
