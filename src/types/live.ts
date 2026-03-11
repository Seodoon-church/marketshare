import type { Timestamp } from 'firebase/firestore';

// ============================================
// Live Session
// ============================================

export type LiveStreamPlatform =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'naver'
  | 'other';

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface LiveSession {
  id: string;
  mallId: string;
  mallName: string;
  mallSlug: string;
  hostId: string;
  hostName: string;

  title: string;
  description: string;
  thumbnailUrl: string | null;

  status: LiveSessionStatus;
  scheduledAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;

  // 외부 스트리밍 임베드
  streamPlatform: LiveStreamPlatform;
  streamUrl: string;
  vodUrl: string | null;

  // 상품
  productIds: string[];
  featuredProductId: string | null;

  // 통계
  viewerCount: number;
  peakViewerCount: number;
  totalOrders: number;
  totalRevenue: number;
  chatMessageCount: number;

  // MCN 매출 구분 (정산용)
  ownProductRevenue?: number;         // 셀럽 자기상품 매출
  parentProductRevenue?: number;      // 본사상품 매출

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Live Chat Message
// ============================================

export type LiveMessageType = 'chat' | 'system' | 'purchase';

export interface LiveMessage {
  id: string;
  userId: string;
  userName: string;
  userProfileUrl: string | null;
  userRole: 'customer' | 'mall_owner' | 'platform_admin';
  message: string;
  type: LiveMessageType;
  createdAt: Date;
}

// ============================================
// Service Input Types
// ============================================

export interface CreateLiveSessionInput {
  mallId: string;
  mallName: string;
  mallSlug: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  scheduledAt: Date;
  streamPlatform: LiveStreamPlatform;
  streamUrl?: string;
  productIds: string[];
}

export interface UpdateLiveSessionInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
  scheduledAt?: Date;
  streamPlatform?: LiveStreamPlatform;
  streamUrl?: string;
  vodUrl?: string | null;
  productIds?: string[];
  featuredProductId?: string | null;
  status?: LiveSessionStatus;
}
