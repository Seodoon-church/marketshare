'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getNotificationSettings,
  updateNotificationSettings,
  getDefaultNotificationSettings,
} from '@/lib/services/notification-service';
import type { NotificationSettings, NotificationTemplateKey } from '@/types';

const NOTIFICATION_TYPES: { key: NotificationTemplateKey; label: string }[] = [
  { key: 'order_confirm', label: '주문 접수' },
  { key: 'payment_complete', label: '결제 완료' },
  { key: 'shipping', label: '배송 시작' },
  { key: 'delivery', label: '배송 완료' },
  { key: 'cancellation', label: '주문 취소' },
  { key: 'point_earned', label: '포인트 적립' },
  { key: 'grade_upgraded', label: '등급 승급' },
];

export default function MallAdminNotificationSettings() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [alimtalkEnabled, setAlimtalkEnabled] = useState(false);

  const [provider, setProvider] = useState<'nhncloud' | 'aligo' | 'coolsms'>('nhncloud');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [senderNumber, setSenderNumber] = useState('');

  const [templates, setTemplates] = useState<
    Record<NotificationTemplateKey, { sms: boolean; alimtalk: boolean; email: boolean }>
  >({
    order_confirm: { sms: false, alimtalk: false, email: false },
    payment_complete: { sms: false, alimtalk: false, email: false },
    shipping: { sms: false, alimtalk: false, email: false },
    delivery: { sms: false, alimtalk: false, email: false },
    cancellation: { sms: false, alimtalk: false, email: false },
    point_earned: { sms: false, alimtalk: false, email: false },
    grade_upgraded: { sms: false, alimtalk: false, email: false },
  });

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load settings
  useEffect(() => {
    if (!mallId) return;

    async function loadSettings() {
      try {
        setLoading(true);
        const settings = await getNotificationSettings(mallId!);

        if (settings) {
          setSmsEnabled(settings.smsEnabled);
          setEmailEnabled(settings.emailEnabled);
          setAlimtalkEnabled(settings.alimtalkEnabled);
          setProvider(settings.provider);
          setApiKey(settings.apiKey);
          setApiSecret(settings.apiSecret);
          setSenderNumber(settings.senderNumber);
          setTemplates(settings.templates);
        } else {
          // Use defaults
          const defaults = getDefaultNotificationSettings(mallId!);
          setSmsEnabled(defaults.smsEnabled);
          setEmailEnabled(defaults.emailEnabled);
          setAlimtalkEnabled(defaults.alimtalkEnabled);
          setProvider(defaults.provider);
          setApiKey(defaults.apiKey);
          setApiSecret(defaults.apiSecret);
          setSenderNumber(defaults.senderNumber);
          setTemplates(defaults.templates);
        }
      } catch (error: any) {
        alert(error.message || '설정을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [mallId]);

  const handleSave = async () => {
    if (!mallId) return;

    setSaving(true);
    try {
      const data: Partial<NotificationSettings> = {
        smsEnabled,
        emailEnabled,
        alimtalkEnabled,
        provider,
        apiKey,
        apiSecret,
        senderNumber,
        templates,
      };

      await updateNotificationSettings(mallId, data);
      alert('알림 설정이 저장되었습니다.');
    } catch (error: any) {
      alert(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isMallOwner || !mallId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BellIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
      </div>

      {/* 알림 채널 설정 */}
      <Card>
        <CardTitle>알림 채널 설정</CardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">SMS 알림</p>
              <p className="text-xs text-gray-500">문자 메시지로 알림을 발송합니다</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smsEnabled}
              onClick={() => setSmsEnabled(!smsEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                smsEnabled ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                  smsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">이메일 알림</p>
              <p className="text-xs text-gray-500">이메일로 알림을 발송합니다</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                emailEnabled ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                  emailEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">알림톡</p>
              <p className="text-xs text-gray-500">카카오 알림톡으로 발송합니다</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={alimtalkEnabled}
              onClick={() => setAlimtalkEnabled(!alimtalkEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                alimtalkEnabled ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                  alimtalkEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* SMS 연동 설정 */}
      {smsEnabled && (
        <Card>
          <CardTitle>SMS 연동 설정</CardTitle>
          <div className="mt-4 space-y-4">
            <Select
              label="제공업체"
              value={provider}
              onChange={(v) => setProvider(v as 'nhncloud' | 'aligo' | 'coolsms')}
              options={[
                { value: 'nhncloud', label: 'NHN Cloud' },
                { value: 'aligo', label: '알리고' },
                { value: 'coolsms', label: 'CoolSMS' },
              ]}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key를 입력해주세요"
              />
              <Input
                label="API Secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="API Secret을 입력해주세요"
              />
            </div>
            <Input
              label="발신번호"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="010-0000-0000"
              hint="사전에 등록된 발신번호를 입력해주세요"
            />
          </div>
        </Card>
      )}

      {/* 알림 유형별 설정 */}
      <Card>
        <CardTitle>알림 유형별 설정</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  알림 유형
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  SMS
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  이메일
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  알림톡
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {NOTIFICATION_TYPES.map((type) => (
                <tr key={type.key} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-900">{type.label}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={templates[type.key].sms}
                      onChange={(e) =>
                        setTemplates((prev) => ({
                          ...prev,
                          [type.key]: { ...prev[type.key], sms: e.target.checked },
                        }))
                      }
                      disabled={!smsEnabled}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={templates[type.key].email}
                      onChange={(e) =>
                        setTemplates((prev) => ({
                          ...prev,
                          [type.key]: { ...prev[type.key], email: e.target.checked },
                        }))
                      }
                      disabled={!emailEnabled}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={templates[type.key].alimtalk}
                      onChange={(e) =>
                        setTemplates((prev) => ({
                          ...prev,
                          [type.key]: { ...prev[type.key], alimtalk: e.target.checked },
                        }))
                      }
                      disabled={!alimtalkEnabled}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  );
}
