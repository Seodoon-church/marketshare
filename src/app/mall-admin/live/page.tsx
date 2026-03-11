'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLiveSessions } from '@/lib/hooks/useLiveSessions';
import type { LiveSessionStatus } from '@/types/live';
import {
  VideoCameraIcon,
  PlusIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';

const statusConfig: Record<
  LiveSessionStatus,
  { label: string; variant: 'success' | 'danger' | 'secondary' | 'warning' }
> = {
  scheduled: { label: '예정', variant: 'warning' },
  live: { label: '라이브', variant: 'danger' },
  ended: { label: '종료', variant: 'secondary' },
  cancelled: { label: '취소', variant: 'secondary' },
};

const platformLabels: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  naver: 'Naver',
  other: '기타',
};

export default function MallAdminLivePage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | LiveSessionStatus>('all');

  const mallId = user?.ownedMallIds?.[0] || null;
  const { sessions, isLoading: sessionsLoading } = useLiveSessions(mallId);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Filter sessions
  const liveSessions = sessions.filter((s) => s.status === 'live');
  const scheduledSessions = sessions.filter((s) => s.status === 'scheduled');
  const endedSessions = sessions.filter((s) => s.status === 'ended');

  const filteredSessions =
    activeTab === 'all'
      ? sessions
      : sessions.filter((s) => s.status === activeTab);

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
        <h1 className="text-2xl font-bold text-gray-900">라이브 관리</h1>
        <Button href="/mall-admin/live/create">
          <PlusIcon className="h-4 w-4" />새 라이브
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            예정 ({scheduledSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'ended'
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            종료 ({endedSessions.length})
          </button>
        </div>
      </Card>

      {/* Live Sessions - Always show at top if any */}
      {liveSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">진행 중인 라이브</h2>
          </div>
          {liveSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* Sessions List */}
      {sessionsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="h-24 w-full animate-pulse rounded bg-gray-100" />
            </Card>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<VideoCameraIcon className="h-12 w-12" />}
          title="라이브 세션이 없습니다"
          description="새 라이브를 생성하여 고객과 실시간으로 소통하세요."
          action={{
            label: '새 라이브 생성',
            href: '/mall-admin/live/create',
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions
            .filter((s) => s.status !== 'live')
            .map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: any }) {
  const config = statusConfig[session.status as LiveSessionStatus];
  const isLive = session.status === 'live';

  return (
    <a href={`/mall-admin/live/${session.id}`} className="block">
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${
        isLive ? 'border-2 border-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {session.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{session.description}</p>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <VideoCameraIcon className="h-4 w-4" />
              <span>{platformLabels[session.streamPlatform] || session.streamPlatform}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {new Date(session.scheduledAt).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {session.productIds.length > 0 && (
              <div className="flex items-center gap-1.5">
                <ShoppingBagIcon className="h-4 w-4" />
                <span>{session.productIds.length}개 상품</span>
              </div>
            )}
          </div>

          {/* Stats (if live or ended) */}
          {(isLive || session.status === 'ended') && (
            <div className="flex flex-wrap items-center gap-6 border-t border-gray-100 pt-3 text-sm">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {isLive ? session.viewerCount : session.peakViewerCount}
                </span>
                <span className="text-gray-500">
                  {isLive ? '시청 중' : '최대 시청자'}
                </span>
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
                <span className="font-medium text-gray-900">
                  {session.totalOrders}
                </span>
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
          )}
        </div>
      </div>
    </Card>
    </a>
  );
}
