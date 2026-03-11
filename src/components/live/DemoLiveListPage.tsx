'use client';

import React from 'react';
import { LiveBadge } from './LiveBadge';
import {
  VideoCameraIcon,
  CalendarIcon,
  UserGroupIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

interface DemoSession {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'scheduled' | 'ended';
  viewerCount: number;
  scheduledAt: string;
  endedAt?: string;
  platform: string;
  productCount: number;
  gradient: string;
}

const DEMO_SESSIONS: DemoSession[] = [
  {
    id: 'demo-live',
    title: '[LIVE] 봄맞이 뷰티 특가전 - 프리미엄 스킨케어 세트',
    description:
      '인기 스킨케어 브랜드의 봄 한정 세트를 라이브 특가로 만나보세요!',
    status: 'live',
    viewerCount: 1247,
    scheduledAt: new Date().toISOString(),
    platform: 'YouTube',
    productCount: 5,
    gradient: 'from-red-500 via-pink-500 to-purple-500',
  },
  {
    id: 'demo-scheduled-1',
    title: '여름 신상 패션 프리뷰 - 시즌 오프 최대 70%',
    description: '올여름 트렌드 아이템을 미리 만나보세요. 라이브 한정 할인!',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    viewerCount: 0,
    platform: 'YouTube',
    productCount: 8,
    gradient: 'from-blue-400 to-cyan-400',
  },
  {
    id: 'demo-ended-1',
    title: '건강기능식품 BEST 10 - 전문가 추천 영양제',
    description: '영양 전문가와 함께하는 건강기능식품 리뷰 & 특가',
    status: 'ended',
    viewerCount: 3521,
    scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    platform: 'YouTube',
    productCount: 10,
    gradient: 'from-green-400 to-teal-400',
  },
  {
    id: 'demo-ended-2',
    title: '홈리빙 인테리어 특집 - 봄 분위기 전환',
    description: '감성 인테리어 소품과 리빙 아이템 특별 할인 방송',
    status: 'ended',
    viewerCount: 2180,
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'YouTube',
    productCount: 6,
    gradient: 'from-orange-400 to-red-400',
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DemoLiveListPage({ mallSlug }: { mallSlug: string }) {
  const activeSession = DEMO_SESSIONS.find((s) => s.status === 'live');
  const scheduledSessions = DEMO_SESSIONS.filter(
    (s) => s.status === 'scheduled'
  );
  const endedSessions = DEMO_SESSIONS.filter((s) => s.status === 'ended');

  const handleClick = (sessionId: string) => {
    window.location.href = `/malls/${mallSlug}/live/${sessionId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <VideoCameraIcon className="h-12 w-12" />
              <h1 className="text-4xl sm:text-5xl font-bold">
                라이브 쇼핑
              </h1>
            </div>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              실시간 방송으로 만나는 특별한 쇼핑 경험
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              데모 체험 모드
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-12">
          {/* Active Live */}
          {activeSession && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <LiveBadge />
                <h2 className="text-2xl font-bold text-gray-900">
                  지금 라이브 중
                </h2>
              </div>

              <div
                onClick={() => handleClick(activeSession.id)}
                className="group relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <div
                  className={`relative aspect-video bg-gradient-to-br ${activeSession.gradient}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircleIcon className="h-24 w-24 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <LiveBadge size="lg" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>
                      {activeSession.viewerCount.toLocaleString()}명 시청 중
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {activeSession.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {activeSession.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="px-3 py-1 bg-gray-100 rounded-full font-medium">
                        {activeSession.platform}
                      </span>
                      <span>상품 {activeSession.productCount}개</span>
                    </div>
                    <div className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                      지금 시청하기
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Scheduled */}
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
                  <DemoSessionCard
                    key={session.id}
                    session={session}
                    onClick={() => handleClick(session.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Ended (VOD) */}
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
                  <DemoSessionCard
                    key={session.id}
                    session={session}
                    onClick={() => handleClick(session.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoSessionCard({
  session,
  onClick,
}: {
  session: DemoSession;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all hover:scale-[1.03] hover:shadow-xl"
    >
      <div
        className={`relative aspect-video bg-gradient-to-br ${session.gradient}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <VideoCameraIcon className="h-16 w-16 text-white opacity-60" />
        </div>
        <div className="absolute top-3 left-3">
          {session.status === 'live' ? (
            <LiveBadge />
          ) : session.status === 'scheduled' ? (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              예정
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              종료
            </span>
          )}
        </div>
        {session.status === 'live' && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <UserGroupIcon className="h-3.5 w-3.5" />
            <span>{session.viewerCount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {session.title}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {session.status === 'scheduled'
              ? formatDate(session.scheduledAt)
              : session.endedAt
              ? formatDate(session.endedAt)
              : '방송 중'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
            {session.platform}
          </span>
          <span className="text-gray-500">
            상품 {session.productCount}개
          </span>
        </div>
      </div>
    </div>
  );
}
