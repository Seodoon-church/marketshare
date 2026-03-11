'use client';

import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/board/StarRating';
import { formatDate } from '@/lib/utils/format';
import { EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { BoardPost, BoardType } from '@/types';

// ============================================
// PostList - 게시글 목록 컴포넌트
// ============================================

interface PostListProps {
  posts: BoardPost[];
  boardType: BoardType;
  onPostClick?: (postId: string) => void;
  isLoading?: boolean;
}

export function PostList({
  posts,
  boardType,
  onPostClick,
  isLoading = false,
}: PostListProps) {
  // 공지 게시글을 상단으로 정렬
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  if (isLoading) {
    return <PostListSkeleton />;
  }

  if (sortedPosts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-400">등록된 게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: 테이블 레이아웃 */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 w-16">
                  번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500">
                  제목
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 w-24">
                  작성자
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 w-28">
                  날짜
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 w-20">
                  조회수
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map((post, index) => (
                <tr
                  key={post.id}
                  onClick={() => onPostClick?.(post.id)}
                  className={cn(
                    'border-b border-gray-100 transition-colors',
                    onPostClick && 'cursor-pointer hover:bg-gray-50',
                    post.isPinned && 'bg-blue-50/30'
                  )}
                >
                  {/* 번호 */}
                  <td className="px-4 py-3 text-center text-gray-500">
                    {post.isPinned ? (
                      <Badge variant="info">공지</Badge>
                    ) : (
                      index + 1
                    )}
                  </td>

                  {/* 제목 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.isPinned && (
                        <span className="font-semibold text-blue-600">[공지]</span>
                      )}
                      <span
                        className={cn(
                          'text-gray-700',
                          post.isPinned && 'font-semibold'
                        )}
                      >
                        {post.title}
                      </span>
                      {post.isSecret && (
                        <LockClosedIcon className="h-4 w-4 text-gray-400" />
                      )}
                      {/* Q&A 답변 상태 */}
                      {boardType === 'qna' && (
                        <QnAStatusBadge post={post} />
                      )}
                      {/* 리뷰 별점 */}
                      {boardType === 'review' && post.rating !== null && (
                        <StarRating rating={post.rating} size="sm" readonly />
                      )}
                    </div>
                  </td>

                  {/* 작성자 */}
                  <td className="px-4 py-3 text-center text-gray-600">
                    {post.authorName}
                  </td>

                  {/* 날짜 */}
                  <td className="px-4 py-3 text-center text-gray-500">
                    {formatDate(post.createdAt)}
                  </td>

                  {/* 조회수 */}
                  <td className="px-4 py-3 text-center text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <EyeIcon className="h-3.5 w-3.5" />
                      {post.viewCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: 카드 레이아웃 */}
      <div className="flex flex-col gap-3 md:hidden">
        {sortedPosts.map((post, index) => (
          <div
            key={post.id}
            onClick={() => onPostClick?.(post.id)}
            className={cn(
              'rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all',
              onPostClick && 'cursor-pointer active:scale-[0.99]',
              post.isPinned && 'border-blue-200 bg-blue-50/30'
            )}
          >
            {/* 상단: 공지 배지, 제목 */}
            <div className="mb-2 flex items-start gap-2">
              {post.isPinned && (
                <Badge variant="info" className="mt-0.5 flex-shrink-0">공지</Badge>
              )}
              <h3
                className={cn(
                  'text-sm text-gray-900 line-clamp-2',
                  post.isPinned && 'font-semibold'
                )}
              >
                {post.isPinned && <span className="text-blue-600">[공지] </span>}
                {post.title}
              </h3>
              {post.isSecret && (
                <LockClosedIcon className="h-4 w-4 flex-shrink-0 text-gray-400 mt-0.5" />
              )}
            </div>

            {/* Q&A 답변 상태 배지 */}
            {boardType === 'qna' && (
              <div className="mb-2">
                <QnAStatusBadge post={post} />
              </div>
            )}

            {/* 리뷰 별점 */}
            {boardType === 'review' && post.rating !== null && (
              <div className="mb-2">
                <StarRating rating={post.rating} size="sm" readonly />
              </div>
            )}

            {/* 하단: 작성자, 날짜, 조회수 */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{post.authorName}</span>
              <div className="flex items-center gap-3">
                <span>{formatDate(post.createdAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <EyeIcon className="h-3 w-3" />
                  {post.viewCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---- Q&A 상태 배지 ----

function QnAStatusBadge({ post }: { post: BoardPost }) {
  // status가 'published'이고 내용에 답변이 있으면 답변완료로 판단
  // 간단하게 status 기반으로 구분 (실제로는 답변 여부 필드를 추가할 수 있음)
  const isAnswered = post.status === 'published' && post.viewCount > 0;

  return isAnswered ? (
    <Badge variant="success">답변완료</Badge>
  ) : (
    <Badge variant="warning">답변대기</Badge>
  );
}

// ---- 스켈레톤 ----

function PostListSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Desktop 스켈레톤 */}
      <div className="hidden md:block">
        <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3">
          <div className="flex gap-4">
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-gray-100 px-4 py-3">
            <div className="flex gap-4">
              <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile 스켈레톤 */}
      <div className="flex flex-col gap-3 p-4 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="flex justify-between">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
