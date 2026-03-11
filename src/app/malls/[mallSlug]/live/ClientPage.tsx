'use client';

import React from 'react';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useLiveSessions, useActiveLiveSession, useMCNLiveSessions } from '@/lib/hooks/useLiveSessions';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LiveBadge } from '@/components/live/LiveBadge';
import { DemoLiveListPage } from '@/components/live/DemoLiveListPage';
import type { LiveSession } from '@/types/live';
import {
  VideoCameraIcon,
  CalendarIcon,
  UserGroupIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

export default function MallLiveClientPage({
  mallSlug: paramSlug,
}: {
  mallSlug: string;
}) {
  const mallSlug = useMallSlug(paramSlug);

  // Demo mode detection
  const isDemo = mallSlug === 'demo-store' || mallSlug === 'demo';

  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const { sessions, isLoading: sessionsLoading } = useLiveSessions(
    mall?.id || null, undefined, mall?.parentMallId ?? undefined
  );
  const { session: activeSession } = useActiveLiveSession(mall?.id || null, mall?.parentMallId ?? undefined);

  // MCN 모드: 모든 셀럽(자식몰) 라이브 조회
  const isMCN = !!(mall?.isMCN && mall?.childMallIds?.length);
  const { sessions: mcnSessions, isLoading: mcnSessionsLoading } = useMCNLiveSessions(
    isMCN ? mall.childMallIds : null
  );

  const isLoading = mallLoading || sessionsLoading || (isMCN && mcnSessionsLoading);

  // MCN 모드일 때 MCN 세션 사용, 아니면 일반 세션 사용
  const effectiveSessions = isMCN ? mcnSessions : sessions;

  // MCN 모드에서 활성 세션 목록 (여러 셀럽 동시 방송 가능)
  const mcnActiveSessions = React.useMemo(() => {
    if (!isMCN || !mcnSessions) return [];
    return mcnSessions.filter((s) => s.status === 'live');
  }, [isMCN, mcnSessions]);

  // Categorize sessions
  const scheduledSessions = React.useMemo(() => {
    if (!effectiveSessions) return [];
    return effectiveSessions
      .filter((s) => s.status === 'scheduled')
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime()
      );
  }, [effectiveSessions]);

  const endedSessions = React.useMemo(() => {
    if (!effectiveSessions) return [];
    return effectiveSessions
      .filter((s) => s.status === 'ended')
      .sort(
        (a, b) =>
          new Date(b.endedAt || 0).getTime() -
          new Date(a.endedAt || 0).getTime()
      );
  }, [effectiveSessions]);

  const handleSessionClick = (sessionId: string, sessionMallSlug?: string) => {
    const targetSlug = sessionMallSlug || mallSlug;
    window.location.href = `/malls/${targetSlug}/live/${sessionId}`;
  };

  // Show demo page for demo stores
  if (isDemo) {
    return <DemoLiveListPage mallSlug={mallSlug} />;
  }

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!mall) {
    return (
      <EmptyState
        icon={<VideoCameraIcon className="h-12 w-12" />}
        title="몰을 찾을 수 없습니다"
        description="요청하신 몰이 존재하지 않습니다."
      />
    );
  }

  const hasAnySessions =
    activeSession || mcnActiveSessions.length > 0 || scheduledSessions.length > 0 || endedSessions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <VideoCameraIcon className="h-12 w-12" />
              <h1 className="text-4xl sm:text-5xl font-bold">라이브 쇼핑</h1>
            </div>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              실시간 방송으로 만나는 특별한 쇼핑 경험
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!hasAnySessions ? (
          <EmptyState
            icon={<VideoCameraIcon className="h-12 w-12" />}
            title="예정된 라이브 방송이 없습니다"
            description="곧 새로운 라이브 방송이 시작될 예정입니다. 조금만 기다려주세요!"
          />
        ) : (
          <div className="space-y-12">
            {/* Active Live Sessions - MCN: multiple celebrity streams */}
            {isMCN && mcnActiveSessions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <LiveBadge />
                  <h2 className="text-2xl font-bold text-gray-900">
                    지금 라이브 중
                  </h2>
                  <span className="text-sm text-gray-500">{mcnActiveSessions.length}개 방송</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mcnActiveSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      mallSlug={mallSlug}
                      currentMallId={mall?.id}
                      isMCN
                      onClick={() => handleSessionClick(session.id, session.mallSlug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Active Live Session - Non-MCN: single featured stream */}
            {!isMCN && activeSession && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <LiveBadge />
                  <h2 className="text-2xl font-bold text-gray-900">
                    지금 라이브 중
                  </h2>
                </div>

                <div
                  onClick={() => handleSessionClick(activeSession.id)}
                  className="group relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-2xl"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircleIcon className="h-24 w-24 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <LiveBadge size="lg" />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{activeSession.viewerCount.toLocaleString()}명 시청 중</span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {activeSession.mallId !== mall?.id && <span className="mr-2 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">본사 라이브</span>}
                      {activeSession.title}
                    </h3>
                    {activeSession.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {activeSession.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="px-3 py-1 bg-gray-100 rounded-full font-medium">
                          {activeSession.streamPlatform === 'youtube'
                            ? 'YouTube'
                            : activeSession.streamPlatform === 'instagram'
                            ? 'Instagram'
                            : activeSession.streamPlatform === 'other'
                            ? '기타'
                            : activeSession.streamPlatform}
                        </span>
                        <span>상품 {activeSession.productIds.length}개</span>
                      </div>
                      <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                        지금 시청하기
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Scheduled Sessions */}
            {scheduledSessions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <CalendarIcon className="h-6 w-6 text-gray-700" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    예정된 방송
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scheduledSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      mallSlug={mallSlug}
                      currentMallId={mall?.id}
                      isMCN={isMCN}
                      onClick={() => handleSessionClick(session.id, isMCN ? session.mallSlug : undefined)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ended Sessions (VOD) */}
            {endedSessions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <PlayCircleIcon className="h-6 w-6 text-gray-700" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    다시보기
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endedSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      mallSlug={mallSlug}
                      currentMallId={mall?.id}
                      isMCN={isMCN}
                      onClick={() => handleSessionClick(session.id, isMCN ? session.mallSlug : undefined)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Session Card Component
function SessionCard({
  session,
  mallSlug,
  currentMallId,
  isMCN,
  onClick,
}: {
  session: LiveSession;
  mallSlug: string;
  currentMallId?: string;
  isMCN?: boolean;
  onClick: () => void;
}) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'scheduled':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            예정
          </span>
        );
      case 'live':
        return <LiveBadge />;
      case 'ended':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            종료
          </span>
        );
    }
  };

  const getGradient = () => {
    const gradients = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-teal-400',
      'from-orange-400 to-red-400',
      'from-indigo-400 to-purple-400',
    ];
    const hash = session.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all hover:scale-[1.03] hover:shadow-xl"
    >
      <div className={`relative aspect-video bg-gradient-to-br ${getGradient()}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <VideoCameraIcon className="h-16 w-16 text-white opacity-60" />
        </div>
        <div className="absolute top-3 left-3">{getStatusBadge()}</div>
        {session.status === 'live' && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <UserGroupIcon className="h-3.5 w-3.5" />
            <span>{session.viewerCount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {(isMCN || (currentMallId && session.mallId !== currentMallId)) && session.mallName && (
          <p className="text-xs font-semibold text-purple-600 mb-1 truncate">{session.mallName}</p>
        )}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {!isMCN && currentMallId && session.mallId !== currentMallId && <span className="mr-1.5 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">본사</span>}
          {session.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {session.status === 'scheduled'
              ? formatDate(session.scheduledAt)
              : session.status === 'ended' && session.endedAt
              ? formatDate(session.endedAt)
              : '방송 중'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
            {session.streamPlatform === 'youtube'
              ? 'YouTube'
              : session.streamPlatform === 'instagram'
              ? 'Instagram'
              : session.streamPlatform === 'other'
              ? '기타'
              : session.streamPlatform}
          </span>
          <span className="text-gray-500">
            상품 {session.productIds.length}개
          </span>
        </div>
      </div>
    </div>
  );
}
