'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { PencilIcon, TrashIcon, PlusIcon, TruckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatKRW } from '@/lib/utils/format';
import {
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  initializeDefaultZones,
  getShippingTemplates,
  createShippingTemplate,
  updateShippingTemplate,
  deleteShippingTemplate,
} from '@/lib/services/shipping-service';
import type { ShippingZone, ShippingTemplate } from '@/types';

export default function MallAdminShippingPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const mallId = user?.ownedMallIds?.[0];

  const [activeTab, setActiveTab] = useState('zones');
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [templates, setTemplates] = useState<ShippingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for zones
  const [formData, setFormData] = useState({
    name: '',
    regions: '',
    baseFee: 0,
    freeShippingThreshold: 0,
  });

  // Template states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShippingTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<{
    name: string;
    isDefault: boolean;
    zones: Record<string, { fee: number; freeThreshold: number }>;
  }>({
    name: '',
    isDefault: false,
    zones: {},
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; templateId: string | null }>({
    open: false,
    templateId: null,
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/';
    }
  }, [authLoading, isMallOwner]);

  // Fetch zones and templates
  useEffect(() => {
    if (!mallId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [zonesData, templatesData] = await Promise.all([
          getShippingZones(mallId!),
          getShippingTemplates(mallId!),
        ]);
        setZones(zonesData);
        setTemplates(templatesData);
      } catch (error) {
        console.error('배송 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [mallId]);

  const handleInitializeDefaultZones = async () => {
    if (!mallId) return;
    if (!confirm('기본 배송존(서울/경기, 지방, 제주/도서산간)을 생성하시겠습니까?')) return;

    setSubmitting(true);
    try {
      await initializeDefaultZones(mallId);
      const updatedZones = await getShippingZones(mallId);
      setZones(updatedZones);
      alert('기본 배송존이 생성되었습니다.');
    } catch (error: any) {
      alert(error.message || '배송존 초기화 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddZone = async () => {
    if (!mallId) return;
    if (!formData.name.trim()) {
      alert('배송존 이름을 입력하세요.');
      return;
    }
    if (!formData.regions.trim()) {
      alert('지역 코드를 입력하세요 (쉼표로 구분).');
      return;
    }

    setSubmitting(true);
    try {
      const regionsArray = formData.regions.split(',').map((r) => r.trim());
      await createShippingZone(mallId, {
        mallId: mallId,
        name: formData.name,
        regions: regionsArray,
        baseFee: formData.baseFee,
        freeShippingThreshold: formData.freeShippingThreshold,
        order: zones.length,
        isActive: true,
      });

      const updatedZones = await getShippingZones(mallId);
      setZones(updatedZones);
      setFormData({ name: '', regions: '', baseFee: 0, freeShippingThreshold: 0 });
      setShowAddForm(false);
      alert('배송존이 추가되었습니다.');
    } catch (error: any) {
      alert(error.message || '배송존 추가 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateZone = async (zoneId: string, updates: Partial<ShippingZone>) => {
    if (!mallId) return;

    setSubmitting(true);
    try {
      await updateShippingZone(mallId, zoneId, updates);
      const updatedZones = await getShippingZones(mallId);
      setZones(updatedZones);
      setEditingZoneId(null);
      alert('배송존이 수정되었습니다.');
    } catch (error: any) {
      alert(error.message || '배송존 수정 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!mallId) return;
    if (!confirm('이 배송존을 삭제하시겠습니까?')) return;

    setSubmitting(true);
    try {
      await deleteShippingZone(mallId, zoneId);
      const updatedZones = await getShippingZones(mallId);
      setZones(updatedZones);
      alert('배송존이 삭제되었습니다.');
    } catch (error: any) {
      alert(error.message || '배송존 삭제 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleZoneActive = async (zoneId: string, currentStatus: boolean) => {
    handleUpdateZone(zoneId, { isActive: !currentStatus });
  };

  // Template handlers
  const openAddTemplate = () => {
    setEditingTemplate(null);
    const initialZones: Record<string, { fee: number; freeThreshold: number }> = {};
    for (const zone of zones) {
      initialZones[zone.id] = { fee: zone.baseFee, freeThreshold: zone.freeShippingThreshold };
    }
    setTemplateForm({
      name: '',
      isDefault: false,
      zones: initialZones,
    });
    setShowTemplateModal(true);
  };

  const openEditTemplate = (template: ShippingTemplate) => {
    setEditingTemplate(template);
    const templateZones: Record<string, { fee: number; freeThreshold: number }> = {};
    for (const zone of zones) {
      templateZones[zone.id] = template.zones[zone.id] || { fee: zone.baseFee, freeThreshold: zone.freeShippingThreshold };
    }
    setTemplateForm({
      name: template.name,
      isDefault: template.isDefault,
      zones: templateZones,
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!mallId) return;
    if (!templateForm.name.trim()) {
      alert('템플릿 이름을 입력하세요.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTemplate) {
        await updateShippingTemplate(mallId, editingTemplate.id, {
          name: templateForm.name,
          isDefault: templateForm.isDefault,
          zones: templateForm.zones,
        });
        alert('배송 템플릿이 수정되었습니다.');
      } else {
        await createShippingTemplate(mallId, {
          mallId,
          name: templateForm.name,
          isDefault: templateForm.isDefault,
          zones: templateForm.zones,
        });
        alert('배송 템플릿이 추가되었습니다.');
      }
      const updatedTemplates = await getShippingTemplates(mallId);
      setTemplates(updatedTemplates);
      setShowTemplateModal(false);
    } catch (error: any) {
      alert(error.message || '배송 템플릿 저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!mallId || !deleteConfirm.templateId) return;

    setSubmitting(true);
    try {
      await deleteShippingTemplate(mallId, deleteConfirm.templateId);
      const updatedTemplates = await getShippingTemplates(mallId);
      setTemplates(updatedTemplates);
      setDeleteConfirm({ open: false, templateId: null });
      alert('배송 템플릿이 삭제되었습니다.');
    } catch (error: any) {
      alert(error.message || '배송 템플릿 삭제 실패');
    } finally {
      setSubmitting(false);
    }
  };

  // Get zone name by ID
  const getZoneName = (zoneId: string): string => {
    const zone = zones.find(z => z.id === zoneId);
    return zone?.name || zoneId;
  };

  // Summarize zone fees for table display
  const getZoneFeesSummary = (template: ShippingTemplate): string => {
    const entries = Object.entries(template.zones);
    if (entries.length === 0) return '-';
    return entries
      .slice(0, 3)
      .map(([zoneId, config]) => `${getZoneName(zoneId)}: ${formatKRW(config.fee)}`)
      .join(', ') + (entries.length > 3 ? ` 외 ${entries.length - 3}개` : '');
  };

  if (authLoading || loading) {
    return <FullPageLoader message="배송 관리 로딩 중..." />;
  }

  if (!user || !isMallOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">배송 관리</h1>
          <p className="mt-1 text-sm text-gray-500">배송존과 배송 템플릿을 관리합니다.</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: '배송존 관리', value: 'zones', count: zones.length },
          { label: '배송 템플릿', value: 'templates', count: templates.length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleInitializeDefaultZones}
              disabled={submitting}
            >
              기본 배송존 초기화
            </Button>
            {!showAddForm ? (
              <Button size="md" onClick={() => setShowAddForm(true)}>
                <PlusIcon className="h-4 w-4" />
                배송존 추가
              </Button>
            ) : (
              <Button size="md" variant="secondary" onClick={() => setShowAddForm(false)}>
                <XMarkIcon className="h-4 w-4" />
                취소
              </Button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <Card>
              <CardTitle>새 배송존 추가</CardTitle>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="존 이름"
                  placeholder="예: 서울/경기"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="지역 코드 (쉼표로 구분)"
                  placeholder="예: 0,1,2,3,4,5,6"
                  value={formData.regions}
                  onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                  hint="우편번호 앞 2자리 (0=서울, 1=경기 등)"
                />
                <Input
                  label="기본 배송비"
                  type="number"
                  placeholder="3000"
                  value={formData.baseFee}
                  onChange={(e) => setFormData({ ...formData, baseFee: Number(e.target.value) })}
                />
                <Input
                  label="무료배송 기준금액"
                  type="number"
                  placeholder="50000"
                  value={formData.freeShippingThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })
                  }
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  취소
                </Button>
                <Button onClick={handleAddZone} disabled={submitting} isLoading={submitting}>
                  추가
                </Button>
              </div>
            </Card>
          )}

          {/* Zones List */}
          {zones.length === 0 ? (
            <EmptyState
              icon={<TruckIcon className="h-12 w-12" />}
              title="배송존이 없습니다"
              description="기본 배송존을 초기화하거나 새 배송존을 추가하세요."
            />
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">존 이름</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">지역 코드</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">기본배송비</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">무료배송기준</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">활성</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => (
                      <tr key={zone.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-gray-900">{zone.name}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-500">
                            {zone.regions.join(', ')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-900">{formatKRW(zone.baseFee)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-900">
                            {formatKRW(zone.freeShippingThreshold)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => toggleZoneActive(zone.id, zone.isActive)}
                            disabled={submitting}
                          >
                            <Badge variant={zone.isActive ? 'success' : 'secondary'}>
                              {zone.isActive ? '활성' : '비활성'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                              disabled={submitting}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button size="md" onClick={openAddTemplate} disabled={zones.length === 0}>
              <PlusIcon className="h-4 w-4" />
              템플릿 추가
            </Button>
            {zones.length === 0 && (
              <p className="text-sm text-amber-600">배송존을 먼저 추가해야 템플릿을 생성할 수 있습니다.</p>
            )}
          </div>

          {/* Template List */}
          {templates.length === 0 ? (
            <EmptyState
              icon={<TruckIcon className="h-12 w-12" />}
              title="배송 템플릿이 없습니다"
              description="배송 템플릿을 추가하여 상품별 배송비를 관리하세요."
            />
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">템플릿 이름</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">배송존별 요금</th>
                      <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">기본 템플릿</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-gray-900">{template.name}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-500">{getZoneFeesSummary(template)}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {template.isDefault ? (
                            <Badge variant="success">기본</Badge>
                          ) : (
                            <Badge variant="secondary">-</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditTemplate(template)}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                              disabled={submitting}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ open: true, templateId: template.id })}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                              disabled={submitting}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Template Add/Edit Modal */}
      {showTemplateModal && (
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title={editingTemplate ? '배송 템플릿 수정' : '배송 템플릿 추가'}
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="템플릿 이름"
              placeholder="예: 기본 배송, 무료 배송"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            />

            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">배송존별 요금 설정</p>
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div key={zone.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-sm font-medium text-gray-900">{zone.name}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="배송비"
                        type="number"
                        value={templateForm.zones[zone.id]?.fee ?? 0}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            zones: {
                              ...templateForm.zones,
                              [zone.id]: {
                                ...templateForm.zones[zone.id],
                                fee: Number(e.target.value),
                              },
                            },
                          })
                        }
                      />
                      <Input
                        label="무료배송 기준금액"
                        type="number"
                        value={templateForm.zones[zone.id]?.freeThreshold ?? 0}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            zones: {
                              ...templateForm.zones,
                              [zone.id]: {
                                ...templateForm.zones[zone.id],
                                freeThreshold: Number(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={templateForm.isDefault}
                onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-medium text-gray-700">기본 템플릿으로 설정</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                취소
              </Button>
              <Button onClick={handleSaveTemplate} disabled={submitting} isLoading={submitting}>
                {editingTemplate ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={handleDeleteTemplate}
        onCancel={() => setDeleteConfirm({ open: false, templateId: null })}
        title="배송 템플릿 삭제"
        message="이 배송 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={submitting}
      />
    </div>
  );
}
