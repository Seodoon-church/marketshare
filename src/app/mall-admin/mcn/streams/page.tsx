'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Tabs } from '@/components/ui/Tabs';
import {
  VideoCameraIcon,
  EyeIcon,
  ShoppingCartIcon,
  ClockIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { formatKRW, formatDateTime } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallById } from '@/lib/services/mall-service';
import { getChildMallLiveSessions } from '@/lib/services/live-service';
import { LiveBadge } from '@/components/live/LiveBadge';
import type { LiveSession, LiveSessionStatus } from '@/types/live';
import type { Mall } from '@/types';

type TabFilter = 'all' | LiveSessionStatus;

const STATUS_BADGE_MAP: Record<LiveSessionStatus, { label: string; variant: 'danger' | 'info' | 'secondary' | 'warning' }> = {
  live: { label: '방송중', variant: 'danger' },
  scheduled: { label: '예정', variant: 'info' },
  ended: { label: '종료', variant: 'secondary' },
  cancelled: { label: '취소', variant: 'warning' },
};

export default function MCNStreamsPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [mall, setMall] = useState<Mall | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/';
    }
  }, [authLoading, isMallOwner]);

  // Fetch mall and MCN sessions
  useEffect(() => {
    if (!mallId) return;

    async function fetchData() {
      setDataLoading(true);
      try {
        const mallData = await getMallById(mallId!);
        setMall(mallData);

        if (mallData?.isMCN && mallData.childMallIds?.length > 0) {
          const childSessions = await getChildMallLiveSessions(mallData.childMallIds);
          setSessions(childSessions);
        }
      } catch (error) {
        console.error('MCN 방송 목록 로딩 실패:', error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [mallId]);

  // Counts by status
  const statusCounts = useMemo(() => {
    const counts = { all: sessions.length, live: 0, scheduled: 0, ended: 0, cancelled: 0 };
    for (const s of sessions) {
      if (s.status in counts) {
        counts[s.status as keyof typeof counts]++;
      }
    }
    return counts;
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    if (activeTab === 'all') return sessions;
    return sessions.filter((s) => s.status === activeTab);
  }, [sessions, activeTab]);

  // Tab items
  const tabItems = [
    { label: '전체', value: 'all', count: statusCounts.all },
    { label: '방송중', value: 'live', count: statusCounts.live },
    { label: '예정', value: 'scheduled', count: statusCounts.scheduled },
    { label: '종료', value: 'ended', count: statusCounts.ended },
  ];

  // Show loading while auth is resolving
  if (authLoading || (!isMallOwner && !authLoading)) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (dataLoading) {
    return <FullPageLoader message="방송 목록을 불러오는 중..." />;
  }

  // MCN mode check
  if (!mall?.isMCN) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <VideoCameraIcon className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">MCN 모드가 아닙니다</h2>
        <p className="mt-2 text-sm text-gray-500">
          이 몰은 MCN 본사 모드가 활성화되어 있지 않습니다.
        </p>
        <Button href="/mall-admin" variant="outline" className="mt-6">
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">셀럽 방송 현황</h1>
          <p className="mt-1 text-sm text-gray-500">소속 셀럽들의 라이브 방송을 관리합니다.</p>
        </div>
        <Button href="/mall-admin/mcn" variant="outline" size="md">
          MCN 대시보드
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={(v) => setActiveTab(v as TabFilter)}
        variant="pill"
      />

      {/* Sessions List */}
      <Card padding="none">
        {/* Table Header */}
        <div className="hidden items-center gap-4 border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 md:flex">
          <div className="w-8" />
          <div className="min-w-0 flex-1">셀럽 (몰)</div>
          <div className="w-48">방송 제목</div>
          <div className="w-20 text-center">상태</div>
          <div className="w-24 text-right">시청자</div>
          <div className="w-24 text-right">매출</div>
          <div className="w-36 text-right">시작시간</div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <VideoCameraIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">
                {activeTab === 'all'
                  ? '등록된 방송이 없습니다.'
                  : `${tabItems.find((t) => t.value === activeTab)?.label ?? ''} 방송이 없습니다.`}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <a
                key={session.id}
                href={`/mall-admin/live/${session.id}`}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-gray-50/50 md:flex-row md:items-center md:gap-4"
              >
                {/* Live indicator */}
                <div className="w-8 flex-shrink-0">
                  {session.status === 'live' ? (
                    <LiveBadge size="sm" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center">
                      {session.status === 'scheduled' ? (
                        <ClockIcon className="h-4 w-4 text-blue-500" />
                      ) : (
                        <VideoCameraIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Celebrity / Mall Name */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{session.mallName}</p>
                  <p className="text-xs text-gray-500 truncate">{session.hostName}</p>
                </div>

                {/* Title */}
                <div className="w-48 flex-shrink-0">
                  <p className="text-sm text-gray-700 truncate">{session.title}</p>
                </div>

                {/* Status */}
                <div className="w-20 flex-shrink-0 text-center">
                  <Badge variant={STATUS_BADGE_MAP[session.status]?.variant ?? 'secondary'}>
                    {STATUS_BADGE_MAP[session.status]?.label ?? session.status}
                  </Badge>
                </div>

                {/* Viewers */}
                <div className="w-24 flex-shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                    <EyeIcon className="h-3.5 w-3.5" />
                    <span>
                      {session.status === 'live'
                        ? `${session.viewerCount.toLocaleString()}명`
                        : `${session.peakViewerCount.toLocaleString()}명`}
                    </span>
                  </div>
                  {session.status !== 'live' && session.peakViewerCount > 0 && (
                    <p className="text-xs text-gray-400">최대</p>
                  )}
                </div>

                {/* Revenue */}
                <div className="w-24 flex-shrink-0 text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatKRW(session.totalRevenue)}
                  </span>
                  {session.totalOrders > 0 && (
                    <p className="text-xs text-gray-400">{session.totalOrders}건</p>
                  )}
                </div>

                {/* Start Time */}
                <div className="w-36 flex-shrink-0 text-right text-sm text-gray-500">
                  {session.status === 'scheduled'
                    ? formatDateTime(session.scheduledAt)
                    : session.startedAt
                      ? formatDateTime(session.startedAt)
                      : formatDateTime(session.scheduledAt)}
                </div>
              </a>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
