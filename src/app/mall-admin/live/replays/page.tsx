'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLiveSessions } from '@/lib/hooks/useLiveSessions';
import { updateLiveSession } from '@/lib/services/live-service';
import type { LiveSession } from '@/types/live';
import {
  PlayCircleIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';

export default function LiveReplaysPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const mallId = user?.ownedMallIds?.[0] || null;
  const { sessions, isLoading: sessionsLoading } = useLiveSessions(mallId, 'ended');

  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [vodUrlInput, setVodUrlInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  const handleOpenModal = (session: LiveSession) => {
    setSelectedSession(session);
    setVodUrlInput(session.vodUrl || '');
  };

  const handleSaveVodUrl = async () => {
    if (!selectedSession) return;

    if (!vodUrlInput.trim()) {
      toast({ type: 'error', message: 'VOD URL을 입력해주세요.' });
      return;
    }

    setSaving(true);
    try {
      await updateLiveSession(selectedSession.id, { vodUrl: vodUrlInput.trim() });
      toast({ type: 'success', message: 'VOD URL이 저장되었습니다.' });
      setSelectedSession(null);
      // Re-fetch is automatic via hook
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || 'VOD URL 저장 중 오류가 발생했습니다.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDuration = (session: LiveSession) => {
    if (!session.startedAt || !session.endedAt) return '-';

    const start = new Date(session.startedAt).getTime();
    const end = new Date(session.endedAt).getTime();
    const diff = end - start;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  // Auth loading state
  if (authLoading || !isMallOwner) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <Card>
          <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">다시보기</h1>
          <p className="mt-1 text-sm text-gray-500">
            종료된 라이브 방송의 다시보기를 관리합니다.
          </p>
        </div>
        <Button href="/mall-admin/live" variant="outline">
          라이브 관리
        </Button>
      </div>

      {/* Sessions List */}
      {sessionsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="h-32 w-full animate-pulse rounded bg-gray-100" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<PlayCircleIcon className="h-12 w-12" />}
          title="종료된 라이브가 없습니다"
          description="라이브 방송을 종료하면 여기에서 다시보기를 관리할 수 있습니다."
          action={{
            label: '라이브 관리',
            href: '/mall-admin/live',
          }}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onManageVod={() => handleOpenModal(session)}
              getDuration={getDuration}
            />
          ))}
        </div>
      )}

      {/* VOD URL Modal */}
      <Modal
        isOpen={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
        title="VOD URL 관리"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">
              {selectedSession?.title}
            </p>
            <p className="text-xs text-gray-500">
              {selectedSession &&
                new Date(selectedSession.scheduledAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              VOD URL
            </label>
            <Input
              value={vodUrlInput}
              onChange={(e) => setVodUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              YouTube, Naver TV 등의 다시보기 URL을 입력하세요.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setSelectedSession(null)}
              disabled={saving}
            >
              취소
            </Button>
            <Button fullWidth onClick={handleSaveVodUrl} isLoading={saving}>
              저장
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface SessionCardProps {
  session: LiveSession;
  onManageVod: () => void;
  getDuration: (session: LiveSession) => string;
}

function SessionCard({ session, onManageVod, getDuration }: SessionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{session.description}</p>
            </div>
            {session.vodUrl ? (
              <Badge variant="success">VOD 등록됨</Badge>
            ) : (
              <Badge variant="secondary">VOD 미등록</Badge>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {new Date(session.scheduledAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              <span>{getDuration(session)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 border-t border-gray-100 pt-3 text-sm">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">
                {session.peakViewerCount}
              </span>
              <span className="text-gray-500">최대 시청자</span>
            </div>
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">
                {session.chatMessageCount}
              </span>
              <span className="text-gray-500">채팅</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">{session.totalOrders}</span>
              <span className="text-gray-500">주문</span>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">
                {formatKRW(session.totalRevenue)}
              </span>
              <span className="text-gray-500">매출</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={onManageVod}>
              <LinkIcon className="h-4 w-4" />
              VOD URL {session.vodUrl ? '수정' : '등록'}
            </Button>
            {session.vodUrl && (
              <a
                href={session.vodUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <PlayCircleIcon className="h-4 w-4" />
                다시보기
              </a>
            )}
            <button
              onClick={() => {
                window.location.href = `/mall-admin/live/${session.id}`;
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              상세보기
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
