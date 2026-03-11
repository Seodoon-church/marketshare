'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getAllMallBanners,
  createMallBanner,
  updateMallBanner,
  deleteMallBanner,
} from '@/lib/services/mall-service';
import type { Banner } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Timestamp } from 'firebase/firestore';

type BannerPosition = 'main_top' | 'main_middle' | 'sidebar' | 'popup';

const POSITION_LABELS: Record<BannerPosition, string> = {
  main_top: '메인 상단',
  main_middle: '메인 중단',
  sidebar: '사이드바',
  popup: '팝업',
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export default function MallAdminBanners() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const mallId = user?.ownedMallIds?.[0];

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; bannerId: string | null }>({
    open: false,
    bannerId: null,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    mobileImageUrl: '',
    linkUrl: '',
    position: 'main_top' as BannerPosition,
    startDate: '',
    endDate: '',
    isActive: true,
    order: 0,
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load banners
  useEffect(() => {
    if (!mallId) return;
    loadBanners();
  }, [mallId]);

  async function loadBanners() {
    if (!mallId) return;
    setLoading(true);
    try {
      const data = await getAllMallBanners(mallId);
      setBanners(data);
    } catch (error) {
      console.error('배너 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      mobileImageUrl: '',
      linkUrl: '',
      position: 'main_top',
      startDate: '',
      endDate: '',
      isActive: true,
      order: banners.length,
    });
  };

  const openAddModal = () => {
    setEditingBanner(null);
    resetForm();
    setFormData(prev => ({ ...prev, order: banners.length }));
    setShowFormModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      mobileImageUrl: banner.mobileImageUrl || '',
      linkUrl: banner.linkUrl,
      position: banner.position,
      startDate: toDateInputValue(banner.startDate),
      endDate: toDateInputValue(banner.endDate),
      isActive: banner.isActive,
      order: banner.order,
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!mallId) return;
    if (!formData.title.trim()) {
      alert('배너 제목을 입력하세요.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      alert('이미지 URL을 입력하세요.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('시작일과 종료일을 입력하세요.');
      return;
    }

    setSubmitting(true);
    try {
      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle,
        imageUrl: formData.imageUrl,
        mobileImageUrl: formData.mobileImageUrl || formData.imageUrl,
        linkUrl: formData.linkUrl,
        position: formData.position,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate + 'T23:59:59')),
        isActive: formData.isActive,
        order: formData.order,
      };

      if (editingBanner) {
        await updateMallBanner(mallId, editingBanner.id, bannerData as any);
        alert('배너가 수정되었습니다.');
      } else {
        await createMallBanner(mallId, bannerData as any);
        alert('배너가 추가되었습니다.');
      }

      await loadBanners();
      setShowFormModal(false);
    } catch (error: any) {
      alert(error.message || '배너 저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!mallId || !deleteConfirm.bannerId) return;

    setSubmitting(true);
    try {
      await deleteMallBanner(mallId, deleteConfirm.bannerId);
      await loadBanners();
      setDeleteConfirm({ open: false, bannerId: null });
      alert('배너가 삭제되었습니다.');
    } catch (error: any) {
      alert(error.message || '배너 삭제 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    if (!mallId) return;
    setSubmitting(true);
    try {
      await updateMallBanner(mallId, banner.id, { isActive: !banner.isActive } as any);
      await loadBanners();
    } catch (error: any) {
      alert(error.message || '배너 상태 변경 실패');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isMallOwner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">배너 관리</h1>
          <p className="mt-1 text-sm text-gray-500">쇼핑몰 배너를 관리합니다.</p>
        </div>
        <Button onClick={openAddModal}>
          <PlusIcon className="h-4 w-4" />
          배너 추가
        </Button>
      </div>

      {/* Banner List */}
      {loading ? (
        <Card padding="none">
          <div className="space-y-4 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-16 w-24 animate-pulse rounded bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : banners.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PhotoIcon className="h-12 w-12" />}
            title="배너가 없습니다"
            description="새 배너를 추가하여 쇼핑몰을 꾸며보세요."
            action={{ label: '배너 추가', onClick: openAddModal }}
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">이미지</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">제목</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">위치</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">기간</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">순서</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="h-12 w-20 overflow-hidden rounded-lg bg-gray-100">
                        {banner.imageUrl ? (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PhotoIcon className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{banner.title}</p>
                      {banner.subtitle && (
                        <p className="text-xs text-gray-500">{banner.subtitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="info">{POSITION_LABELS[banner.position]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleActive(banner)} disabled={submitting}>
                        <Badge variant={banner.isActive ? 'success' : 'secondary'}>
                          {banner.isActive ? '활성' : '비활성'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-xs text-gray-500">
                        {formatDate(banner.startDate)} ~ {formatDate(banner.endDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-600">{banner.order}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(banner)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                          disabled={submitting}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, bannerId: banner.id })}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
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

      {/* Add/Edit Modal */}
      {showFormModal && (
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={editingBanner ? '배너 수정' : '배너 추가'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="제목"
                placeholder="배너 제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                label="부제목"
                placeholder="배너 부제목 (선택)"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>

            <Input
              label="이미지 URL"
              placeholder="https://example.com/banner.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />

            {formData.imageUrl && (
              <div className="rounded-lg border border-gray-200 p-2">
                <p className="mb-1 text-xs text-gray-500">미리보기</p>
                <img
                  src={formData.imageUrl}
                  alt="미리보기"
                  className="h-32 w-full rounded-lg object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <Input
              label="모바일 이미지 URL (선택)"
              placeholder="https://example.com/banner-mobile.jpg"
              value={formData.mobileImageUrl}
              onChange={(e) => setFormData({ ...formData, mobileImageUrl: e.target.value })}
              hint="미입력 시 데스크톱 이미지를 사용합니다."
            />

            <Input
              label="링크 URL"
              placeholder="https://example.com/event"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">위치</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as BannerPosition })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="main_top">메인 상단</option>
                  <option value="main_middle">메인 중단</option>
                  <option value="sidebar">사이드바</option>
                  <option value="popup">팝업</option>
                </select>
              </div>
              <Input
                label="표시 순서"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="시작일"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="종료일"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-medium text-gray-700">활성화</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowFormModal(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={submitting} isLoading={submitting}>
                {editingBanner ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, bannerId: null })}
        title="배너 삭제"
        message="이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={submitting}
      />
    </div>
  );
}
