'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { BellIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getNotificationTemplates,
  updateNotificationTemplate,
  getDefaultTemplates,
} from '@/lib/services/notification-service';
import type { NotificationTemplateData, NotificationType } from '@/types';

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  sms: 'SMS',
  email: '이메일',
  alimtalk: '알림톡',
};

export default function AdminNotifications() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplateData[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateData | null>(null);

  // Edit form states
  const [editContent, setEditContent] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  // Load templates
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    async function loadData() {
      try {
        setLoading(true);
        // Get platform default templates (mallId == null)
        const templatesData = await getNotificationTemplates();
        const platformTemplates = templatesData.filter((t) => t.mallId === null);

        // If no templates exist, use defaults
        if (platformTemplates.length === 0) {
          const defaults = getDefaultTemplates();
          setTemplates(defaults);
        } else {
          setTemplates(platformTemplates);
        }
      } catch (error: any) {
        alert(error.message || '템플릿을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, isAdmin]);

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isAdmin) {
    return null;
  }

  const handleEditTemplate = (template: NotificationTemplateData) => {
    setEditingTemplate(template);
    setEditContent(template.content);
    setEditSubject(template.subject);
    setEditIsActive(template.isActive);
    setShowEditModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      await updateNotificationTemplate(editingTemplate.id, {
        content: editContent,
        subject: editSubject,
        isActive: editIsActive,
      });

      alert('템플릿이 업데이트되었습니다.');
      setShowEditModal(false);

      // Reload templates
      const templatesData = await getNotificationTemplates();
      const platformTemplates = templatesData.filter((t) => t.mallId === null);
      setTemplates(platformTemplates);
    } catch (error: any) {
      alert(error.message || '템플릿 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BellIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">알림 관리</h1>
      </div>

      <Card>
        <CardTitle>기본 알림 템플릿</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          플랫폼 전체에 적용되는 기본 알림 템플릿을 관리합니다. 각 몰에서 커스터마이징 가능합니다.
        </p>
      </Card>

      {/* Templates Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  템플릿명
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  유형
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  변수
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  내용
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  활성
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    등록된 템플릿이 없습니다.
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {template.name}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant="default">
                        {NOTIFICATION_TYPE_LABELS[template.type]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <code
                            key={variable}
                            className="rounded bg-blue-50 px-2 py-0.5 text-xs font-mono text-blue-700"
                          >
                            {`{{${variable}}}`}
                          </code>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-md truncate">
                      {template.content}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {template.isActive ? (
                        <Badge variant="success">활성</Badge>
                      ) : (
                        <Badge variant="default">비활성</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        편집
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Template Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`템플릿 편집: ${editingTemplate?.name}`}
      >
        {editingTemplate && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">제목</label>
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                내용
                <span className="ml-2 text-xs font-normal text-gray-400">
                  사용 가능한 변수를 클릭하여 추가하세요
                </span>
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                사용 가능한 변수
              </label>
              <div className="flex flex-wrap gap-2">
                {editingTemplate.variables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => {
                      const placeholder = `{{${variable}}}`;
                      setEditContent((prev) => prev + placeholder);
                    }}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-mono text-blue-700 hover:bg-blue-100"
                  >
                    {`{{${variable}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                템플릿 활성화
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                취소
              </Button>
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
