'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { useMallBySlug } from '@/lib/hooks/useMall';
import { useMallSlug } from '@/lib/hooks/useMallSlug';
import { getPosts } from '@/lib/services/board-service';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BoardPost, BoardType } from '@/types';
import {
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EyeIcon,
  LockClosedIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

// ---- 게시판 타입 ----
type BoardTabId = 'notice' | 'faq' | 'qna' | 'review';

const boardTabs = [
  { id: 'notice' as BoardTabId, label: '공지사항', icon: MegaphoneIcon, boardId: 'notice' },
  { id: 'faq' as BoardTabId, label: 'FAQ', icon: QuestionMarkCircleIcon, boardId: 'faq' },
  { id: 'qna' as BoardTabId, label: '상품문의', icon: ChatBubbleLeftRightIcon, boardId: 'qna' },
  { id: 'review' as BoardTabId, label: '이용후기', icon: StarIcon, boardId: 'reviews' },
];

// ---- 날짜 포맷 ----
function formatDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function MallBoardClient({ mallSlug: paramSlug }: { mallSlug: string }) {
  const mallSlug = useMallSlug(paramSlug);
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const basePath = `/malls/${mallSlug}`;

  const [activeTab, setActiveTab] = useState<BoardTabId>('notice');
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [postCounts, setPostCounts] = useState<Record<BoardTabId, number>>({
    notice: 0,
    faq: 0,
    qna: 0,
    review: 0,
  });
  const [postsLoading, setPostsLoading] = useState(true);

  // 게시글 로드
  const loadPosts = useCallback(async (tabId: BoardTabId, mallId: string) => {
    setPostsLoading(true);
    try {
      const tab = boardTabs.find((t) => t.id === tabId)!;
      const result = await getPosts(mallId, tab.boardId, { limit: 20 });
      setPosts(result.posts);
      setPostCounts((prev) => ({ ...prev, [tabId]: result.total }));
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // 초기 로드 및 탭 변경 시 로드
  useEffect(() => {
    if (!mall?.id) return;
    loadPosts(activeTab, mall.id);
  }, [activeTab, mall?.id, loadPosts]);

  // 모든 탭의 카운트를 초기에 한 번 로드
  useEffect(() => {
    if (!mall?.id) return;

    let cancelled = false;

    const loadAllCounts = async () => {
      const counts: Record<string, number> = {};
      for (const tab of boardTabs) {
        try {
          const result = await getPosts(mall.id, tab.boardId, { limit: 1 });
          if (cancelled) return;
          counts[tab.id] = result.total;
        } catch {
          counts[tab.id] = 0;
        }
      }
      if (!cancelled) {
        setPostCounts(counts as Record<BoardTabId, number>);
      }
    };

    loadAllCounts();

    return () => {
      cancelled = true;
    };
  }, [mall?.id]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">게시판</h1>
          <p className="mt-1 text-sm text-gray-500">
            {mall?.name ? `${mall.name} 소식과 고객 문의를 확인하세요` : '불러오는 중...'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
        {/* ===== 탭 네비게이션 ===== */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {boardTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className={`text-xs ${activeTab === tab.id ? 'text-white/70' : 'text-gray-400'}`}>
                  ({postCounts[tab.id]})
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== 게시물 목록 ===== */}
        <div className="mt-6 rounded-2xl bg-white shadow-sm overflow-hidden">
          {/* 테이블 헤더 (데스크탑) */}
          <div className="hidden border-b border-gray-100 bg-gray-50/50 px-6 py-3 sm:flex">
            <span className="flex-1 text-xs font-medium text-gray-500">제목</span>
            <span className="w-20 text-center text-xs font-medium text-gray-500">작성자</span>
            <span className="w-24 text-center text-xs font-medium text-gray-500">작성일</span>
            <span className="w-16 text-center text-xs font-medium text-gray-500">조회</span>
          </div>

          {/* 로딩 */}
          {postsLoading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {posts.map((post) => (
                <a
                  key={post.id}
                  href={`${basePath}/board/${post.id}`}
                  className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-center sm:gap-0"
                >
                  {/* 제목 */}
                  <div className="flex flex-1 items-center gap-2">
                    {post.isPinned && (
                      <Badge variant="danger" className="flex-shrink-0">공지</Badge>
                    )}
                    {post.isSecret && (
                      <LockClosedIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-800 line-clamp-1 group-hover:text-primary">
                      {post.title}
                    </span>
                    {post.status === 'published' && activeTab === 'qna' && (
                      <Badge variant="success" className="flex-shrink-0">
                        답변완료
                      </Badge>
                    )}
                    {post.rating !== null && post.rating !== undefined && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500 flex-shrink-0">
                        <StarIcon className="h-3 w-3 fill-current" />
                        {post.rating}
                      </span>
                    )}
                  </div>

                  {/* 메타 */}
                  <div className="flex items-center gap-4 sm:gap-0">
                    <span className="text-xs text-gray-400 sm:w-20 sm:text-center">{post.authorName}</span>
                    <span className="text-xs text-gray-400 sm:w-24 sm:text-center">{formatDate(post.createdAt)}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 sm:w-16 sm:justify-center">
                      <EyeIcon className="h-3 w-3 sm:hidden" />
                      {post.viewCount}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            /* 비어있음 */
            <div className="flex flex-col items-center justify-center py-16">
              <InboxIcon className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">게시글이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
