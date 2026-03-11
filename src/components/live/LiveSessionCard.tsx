'use client';

import Link from 'next/link';
import { LiveBadge } from './LiveBadge';
import type { LiveSession, LiveStreamPlatform } from '@/types/live';

interface LiveSessionCardProps {
  session: LiveSession;
  showMallName?: boolean;
  className?: string;
}

const PLATFORM_LABELS: Record<LiveStreamPlatform, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  naver: '네이버',
  other: '기타',
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function formatDuration(startedAt: Date, endedAt: Date): string {
  const durationMs = endedAt.getTime() - startedAt.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

export function LiveSessionCard({ session, showMallName = false, className = '' }: LiveSessionCardProps) {
  const linkHref = `/malls/${session.mallSlug}/live/${session.id}`;

  return (
    <Link
      href={linkHref}
      className={`block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition ${className}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300">
        {session.thumbnailUrl ? (
          <img
            src={session.thumbnailUrl}
            alt={session.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-bold text-gray-400">{session.title.charAt(0)}</div>
          </div>
        )}

        {/* Live badge overlay */}
        {session.status === 'live' && (
          <div className="absolute top-3 left-3">
            <LiveBadge size="md" />
          </div>
        )}

        {/* Status badge for non-live */}
        {session.status === 'scheduled' && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-gray-900 bg-opacity-80 text-white text-sm font-medium rounded">
            예정
          </div>
        )}

        {session.status === 'ended' && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-gray-600 bg-opacity-80 text-white text-sm font-medium rounded">
            종료
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2">
          {session.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
            {PLATFORM_LABELS[session.streamPlatform]}
          </span>
          {showMallName && session.mallSlug && (
            <span className="text-gray-500">• {session.mallSlug}</span>
          )}
        </div>

        {/* Stats based on status */}
        {session.status === 'live' && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-medium">{session.viewerCount.toLocaleString()}명 시청 중</span>
            </div>
          </div>
        )}

        {session.status === 'ended' && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div>
              {session.startedAt && session.endedAt && (
                <span>방송 시간: {formatDuration(session.startedAt, session.endedAt)}</span>
              )}
            </div>
            <div>
              <span>최대 {session.peakViewerCount.toLocaleString()}명</span>
            </div>
          </div>
        )}

        {session.status === 'scheduled' && (
          <div className="text-sm text-gray-600">
            <span>시작 예정: {formatDate(session.scheduledAt)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
