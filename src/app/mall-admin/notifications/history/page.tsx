'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { MiniStat } from '@/components/ui/Charts';
import { useToast } from '@/components/ui/Toast';
import {
  BellIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getNotificationHistory,
  createNotificationRecord,
} from '@/lib/services/notification-service';
import type {
  NotificationHistory,
  NotificationType,
  NotificationStatus,
} from '@/types';

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  sms: 'SMS',
  email: '이메일',
  alimtalk: '알림톡',
};

const TEMPLATE_KEY_LABELS: Record<string, string> = {
  order_confirm: '주문 접수',
  payment_complete: '결제 완료',
  shipping: '배송 시작',
  delivery: '배송 완료',
  cancellation: '주문 취소',
  point_earned: '포인트 적립',
  grade_upgraded: '등급 승급',
  manual: '수동 발송',
};

const PAGE_SIZE = 20;

export default function MallAdminNotificationHistory() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allHistory, setAllHistory] = useState<NotificationHistory[]>([]);

  const [filterType, setFilterType] = useState<NotificationType | ''>('');
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | ''>('');

  // Manual send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendForm, setSendForm] = useState({
    recipientType: 'all',
    channel: 'sms' as NotificationType,
    title: '',
    content: '',
  });

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load history
  const loadHistory = useCallback(async () => {
    if (!mallId) return;

    try {
      setLoading(true);
      const result = await getNotificationHistory({
        mallId: mallId,
        type: filterType || undefined,
        status: filterStatus || undefined,
        limit: 500,
      });
      setAllHistory(result.history);
      setHasMore(result.hasMore);
      setCurrentPage(1);
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '알림 내역을 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  }, [mallId, filterType, filterStatus, toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Paginate allHistory locally
  useEffect(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    setHistory(allHistory.slice(start, end));
  }, [allHistory, currentPage]);

  // Stats calculations
  const totalCount = allHistory.length;
  const sentCount = allHistory.filter((h) => h.status === 'sent').length;
  const failedCount = allHistory.filter((h) => h.status === 'failed').length;
  const successRate = totalCount > 0 ? ((sentCount / totalCount) * 100).toFixed(1) : '0';

  const totalPages = Math.max(1, Math.ceil(allHistory.length / PAGE_SIZE));

  // Manual send handler
  const handleManualSend = async () => {
    if (!mallId) return;
    if (!sendForm.title.trim() || !sendForm.content.trim()) {
      toast({ type: 'warning', message: '제목과 내용을 입력해주세요.' });
      return;
    }

    try {
      setSendLoading(true);

      const recipientLabel =
        sendForm.recipientType === 'all'
          ? '전체 회원'
          : sendForm.recipientType === 'vip'
            ? 'VIP 회원'
            : '특정 등급';

      await createNotificationRecord({
        type: sendForm.channel,
        templateKey: 'order_confirm',
        userId: user!.id,
        recipient: recipientLabel,
        mallId: mallId,
        orderId: null,
        status: 'sent',
        message: `[${sendForm.title}] ${sendForm.content}`,
        errorMessage: null,
        sentAt: new Date(),
      });

      toast({ type: 'success', message: '알림이 성공적으로 발송되었습니다.' });
      setShowSendModal(false);
      setSendForm({ recipientType: 'all', channel: 'sms', title: '', content: '' });

      // Reload data
      await loadHistory();
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '알림 발송 중 오류가 발생했습니다.' });
    } finally {
      setSendLoading(false);
    }
  };

  if (authLoading || loading) {
    return <FullPageLoader message="불러오는 중..." />;
  }

  if (!isMallOwner || !mallId) {
    return null;
  }

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success">발송</Badge>;
      case 'failed':
        return <Badge variant="danger">실패</Badge>;
      case 'pending':
        return <Badge variant="warning">대기</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BellIcon className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">알림 발송 내역</h1>
        </div>
        <Button onClick={() => setShowSendModal(true)}>
          <PaperAirplaneIcon className="h-4 w-4" />
          수동 알림 발송
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat
          label="총 발송"
          value={totalCount}
          icon={<EnvelopeIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="성공"
          value={sentCount}
          icon={<CheckCircleIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="실패"
          value={failedCount}
          icon={<XCircleIcon className="h-5 w-5" />}
        />
        <MiniStat
          label="성공률"
          value={`${successRate}%`}
          icon={<ChartBarIcon className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 flex-1">
            <Select
              label="유형"
              value={filterType}
              onChange={(v) => setFilterType(v as NotificationType | '')}
              options={[
                { value: '', label: '전체' },
                { value: 'sms', label: 'SMS' },
                { value: 'email', label: '이메일' },
                { value: 'alimtalk', label: '알림톡' },
              ]}
            />
            <Select
              label="상태"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as NotificationStatus | '')}
              options={[
                { value: '', label: '전체' },
                { value: 'sent', label: '발송' },
                { value: 'failed', label: '실패' },
                { value: 'pending', label: '대기' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* History Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  날짜
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  유형
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  수신자
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  템플릿
                </th>
                <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">
                  메시지
                </th>
                <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    발송 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {item.createdAt.toLocaleDateString('ko-KR')}
                      <br />
                      <span className="text-xs text-gray-400">
                        {item.createdAt.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="default">
                        {NOTIFICATION_TYPE_LABELS[item.type]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900">{item.recipient}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {TEMPLATE_KEY_LABELS[item.templateKey] || item.templateKey}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {item.message}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {allHistory.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          총 {allHistory.length}건의 알림 발송 내역 (페이지 {currentPage}/{totalPages})
        </div>
      )}

      {/* Manual Send Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="수동 알림 발송"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="수신 대상"
            value={sendForm.recipientType}
            onChange={(v) => setSendForm((prev) => ({ ...prev, recipientType: v }))}
            options={[
              { value: 'all', label: '전체 회원' },
              { value: 'vip', label: 'VIP 회원' },
              { value: 'grade', label: '특정 등급' },
            ]}
          />
          <Select
            label="발송 채널"
            value={sendForm.channel}
            onChange={(v) =>
              setSendForm((prev) => ({ ...prev, channel: v as NotificationType }))
            }
            options={[
              { value: 'sms', label: 'SMS' },
              { value: 'email', label: '이메일' },
              { value: 'alimtalk', label: '앱 푸시 (알림톡)' },
            ]}
          />
          <div>
            <label
              htmlFor="send-title"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              제목
            </label>
            <input
              id="send-title"
              type="text"
              value={sendForm.title}
              onChange={(e) =>
                setSendForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="알림 제목을 입력하세요"
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label
              htmlFor="send-content"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              내용
            </label>
            <textarea
              id="send-content"
              value={sendForm.content}
              onChange={(e) =>
                setSendForm((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="알림 내용을 입력하세요"
              rows={4}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowSendModal(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleManualSend}
              isLoading={sendLoading}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              발송하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
