'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { MiniStat } from '@/components/ui/Charts';
import {
  VideoCameraIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  SignalIcon,
  ClockIcon,
  EyeIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallById } from '@/lib/services/mall-service';
import { getChildMallLiveSessions } from '@/lib/services/live-service';
import { LiveBadge } from '@/components/live/LiveBadge';
import type { LiveSession } from '@/types/live';
import type { Mall } from '@/types';

export default function MCNDashboardPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [mall, setMall] = useState<Mall | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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
        console.error('MCN 대시보드 데이터 로딩 실패:', error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [mallId]);

  // Categorize sessions
  const liveSessions = useMemo(
    () => sessions.filter((s) => s.status === 'live'),
    [sessions]
  );

  const scheduledSessions = useMemo(
    () => sessions.filter((s) => s.status === 'scheduled').sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
    ),
    [sessions]
  );

  const endedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'ended').slice(0, 10),
    [sessions]
  );

  // Monthly revenue from ended sessions
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return sessions
      .filter((s) => s.status === 'ended' && s.endedAt && s.endedAt >= monthStart)
      .reduce((sum, s) => sum + (s.totalRevenue ?? 0), 0);
  }, [sessions]);

  // Unique celebrity count (unique mallIds)
  const celebCount = useMemo(() => {
    const mallIds = new Set(sessions.map((s) => s.mallId));
    return mall?.childMallIds?.length ?? mallIds.size;
  }, [sessions, mall]);

  // Show loading while auth is resolving
  if (authLoading || (!isMallOwner && !authLoading)) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (dataLoading) {
    return <FullPageLoader message="MCN 대시보드를 불러오는 중..." />;
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

  function formatSessionTime(date: Date): string {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }) + ' ' + date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDuration(startedAt: Date, endedAt: Date): string {
    const durationMs = endedAt.getTime() - startedAt.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MCN 대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">셀럽 라이브 방송 현황을 한눈에 확인하세요.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat
          label="방송중"
          value={`${liveSessions.length}개`}
          icon={<SignalIcon className="h-4 w-4 text-red-500" />}
        />
        <MiniStat
          label="예정된 방송"
          value={`${scheduledSessions.length}개`}
          icon={<CalendarDaysIcon className="h-4 w-4" />}
        />
        <MiniStat
          label="총 셀럽 수"
          value={`${celebCount}명`}
          icon={<UsersIcon className="h-4 w-4" />}
        />
        <MiniStat
          label="이번 달 총매출"
          value={formatKRW(monthlyRevenue)}
          icon={<CurrencyDollarIcon className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button href="/mall-admin/mcn/streams" variant="outline" size="md">
          <VideoCameraIcon className="h-4 w-4" />
          전체 방송 관리
        </Button>
      </div>

      {/* 현재 방송중 */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SignalIcon className="h-5 w-5 text-red-500" />
            <CardTitle>현재 방송중</CardTitle>
            {liveSessions.length > 0 && (
              <Badge variant="danger">{liveSessions.length}개</Badge>
            )}
          </div>
          <Button href="/mall-admin/mcn/streams" variant="ghost" size="sm">전체 보기</Button>
        </div>
        <div className="mt-4 space-y-3">
          {liveSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <VideoCameraIcon className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">현재 방송 중인 셀럽이 없습니다.</p>
            </div>
          ) : (
            liveSessions.map((session) => (
              <a
                key={session.id}
                href={`/mall-admin/live/${session.id}`}
                className="flex items-center justify-between rounded-lg bg-red-50 p-4 transition-colors hover:bg-red-100"
              >
                <div className="flex items-center gap-3">
                  <LiveBadge size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.title}</p>
                    <p className="text-xs text-gray-500">
                      {session.mallName} &middot; {session.hostName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <EyeIcon className="h-4 w-4" />
                    <span>{session.viewerCount.toLocaleString()}명</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span>{session.totalOrders}건</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatKRW(session.totalRevenue)}</span>
                </div>
              </a>
            ))
          )}
        </div>
      </Card>

      {/* 예정된 방송 */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
            <CardTitle>예정된 방송</CardTitle>
            {scheduledSessions.length > 0 && (
              <Badge variant="info">{scheduledSessions.length}개</Badge>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {scheduledSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDaysIcon className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">예정된 방송이 없습니다.</p>
            </div>
          ) : (
            scheduledSessions.slice(0, 5).map((session) => (
              <a
                key={session.id}
                href={`/mall-admin/live/${session.id}`}
                className="flex items-center justify-between rounded-lg bg-blue-50 p-4 transition-colors hover:bg-blue-100"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{session.title}</p>
                  <p className="text-xs text-gray-500">
                    {session.mallName} &middot; {session.hostName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>{formatSessionTime(session.scheduledAt)}</span>
                  </div>
                  <Badge variant="info">예정</Badge>
                </div>
              </a>
            ))
          )}
        </div>
      </Card>

      {/* 최근 종료 방송 */}
      <Card padding="none">
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-2">
            <VideoCameraIcon className="h-5 w-5 text-gray-500" />
            <CardTitle>최근 종료 방송</CardTitle>
          </div>
          <Button href="/mall-admin/mcn/streams" variant="ghost" size="sm">전체 보기</Button>
        </div>
        <div className="mt-4 divide-y divide-gray-50">
          {endedSessions.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              종료된 방송이 없습니다.
            </div>
          ) : (
            endedSessions.map((session) => (
              <a
                key={session.id}
                href={`/mall-admin/live/${session.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{session.title}</span>
                    <Badge variant="secondary">종료</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {session.mallName} &middot; {session.hostName}
                    {session.startedAt && session.endedAt && (
                      <> &middot; {formatDuration(session.startedAt, session.endedAt)}</>
                    )}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    최대 {session.peakViewerCount.toLocaleString()}명
                  </span>
                  <span className="text-gray-500">{session.totalOrders}건</span>
                  <span className="font-semibold text-gray-900">{formatKRW(session.totalRevenue)}</span>
                </div>
              </a>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
