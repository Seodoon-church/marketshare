'use client';

import { LiveBadge } from './LiveBadge';
import type { LiveStreamPlatform } from '@/types/live';

interface LiveVideoPlayerProps {
  platform: LiveStreamPlatform;
  url: string;
  isLive?: boolean;
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

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/live/ID
  const liveMatch = url.match(/\/live\/([^?]+)/);
  if (liveMatch) return liveMatch[1];

  return null;
}

export function LiveVideoPlayer({
  platform,
  url,
  isLive = false,
  className = '',
}: LiveVideoPlayerProps) {
  if (!url) {
    return (
      <div className={`relative w-full bg-gray-900 rounded-xl overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
          방송 준비 중...
        </div>
      </div>
    );
  }

  if (platform === 'youtube') {
    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      return (
        <div className={`relative w-full bg-gray-900 rounded-xl overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
            유효하지 않은 YouTube URL입니다
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full bg-black rounded-xl overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
        {isLive && (
          <div className="absolute top-4 left-4 z-10">
            <LiveBadge size="md" />
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // For other platforms that don't support iframe embedding
  return (
    <div className={`relative w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
      {isLive && (
        <div className="absolute top-4 left-4 z-10">
          <LiveBadge size="md" />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-2xl font-bold text-gray-700">{PLATFORM_LABELS[platform]}</div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          새 탭에서 시청하기
        </a>
      </div>
    </div>
  );
}
