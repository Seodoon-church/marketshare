'use client';

import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMallBySlug } from '@/lib/hooks/useMall';
import { useMallSlug, useMallSubParam } from '@/lib/hooks/useMallSlug';
import { getPostById, getComments, incrementViewCount } from '@/lib/services/board-service';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BoardPost } from '@/types';
import type { Comment } from '@/lib/services/board-service';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EyeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

// ---- 날짜 포맷 ----
function formatDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function MallBoardPostClient({
  mallSlug: paramSlug,
  postId: paramPostId,
}: {
  mallSlug: string;
  postId: string;
}) {
  const mallSlug = useMallSlug(paramSlug);
  const postId = useMallSubParam(paramPostId);
  const { data: mall, isLoading: mallLoading } = useMallBySlug(mallSlug);
  const basePath = `/malls/${mallSlug}`;

  const [commentText, setCommentText] = useState('');
  const [post, setPost] = useState<BoardPost | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // 게시물 로드
  useEffect(() => {
    if (!mall?.id || !postId) return;

    let cancelled = false;

    const loadPost = async () => {
      setPostLoading(true);
      try {
        const data = await getPostById(mall.id, postId);
        if (!cancelled) {
          setPost(data);
          // 조회수 증가
          if (data) incrementViewCount(mall.id, postId).catch(() => {});
        }
      } catch {
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setPostLoading(false);
      }
    };

    loadPost();

    return () => { cancelled = true; };
  }, [mall?.id, postId]);

  // 댓글 로드
  useEffect(() => {
    if (!mall?.id || !postId) return;

    let cancelled = false;

    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const data = await getComments(mall.id, postId);
        if (!cancelled) setComments(data);
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    };

    loadComments();

    return () => { cancelled = true; };
  }, [mall?.id, postId]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    alert('댓글이 등록되었습니다.');
    setCommentText('');
  };

  if (mallLoading || postLoading) {
    return <FullPageLoader message="게시글을 불러오는 중..." />;
  }

  if (!post) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">게시물을 찾을 수 없습니다.</p>
        <Button href={`${basePath}/board`} variant="outline" size="md" className="rounded-xl">
          <ArrowLeftIcon className="h-4 w-4" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const boardTypeLabel = post.boardId === 'notice' ? '공지사항'
    : post.boardId === 'faq' ? 'FAQ'
    : post.boardId === 'qna' ? '상품문의'
    : post.boardId === 'reviews' ? '이용후기'
    : '게시판';

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <a href={`${basePath}/board`} className="hover:text-primary transition-colors">
              게시판
            </a>
            <span className="text-gray-300">/</span>
            <span>{boardTypeLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{boardTypeLabel}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-8">
        {/* ===== 게시물 상세 ===== */}
        <article className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {/* 게시물 헤더 */}
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {post.isPinned && <Badge variant="danger">공지</Badge>}
              <Badge variant="info">{boardTypeLabel}</Badge>
            </div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{post.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <UserCircleIcon className="h-4 w-4" />
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <EyeIcon className="h-4 w-4" />
                <span>조회 {post.viewCount}</span>
              </div>
            </div>
          </div>

          {/* 게시물 본문 */}
          <div className="px-6 py-8 sm:px-8">
            <div className="prose prose-gray max-w-none text-sm leading-relaxed text-gray-700 whitespace-pre-line">
              {post.content}
            </div>
          </div>
        </article>

        {/* ===== 댓글 섹션 ===== */}
        <section className="mt-6 rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 sm:px-8">
            <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              댓글 ({comments.length})
            </h3>
          </div>

          {/* 댓글 목록 */}
          {commentsLoading ? (
            <div className="space-y-3 px-6 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7" rounded="full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {comments.map((comment) => (
                <div key={comment.id} className="px-6 py-4 sm:px-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {comment.authorName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="ml-9 text-sm text-gray-600 leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              댓글이 없습니다.
            </div>
          )}

          {/* 댓글 작성 */}
          <div className="border-t border-gray-100 px-6 py-5 sm:px-8">
            <form onSubmit={handleCommentSubmit}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력해주세요"
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white"
              />
              <div className="mt-3 flex justify-end">
                <Button variant="default" size="sm" type="submit">
                  댓글 등록
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* 목록으로 */}
        <div className="mt-6 flex justify-center">
          <Button href={`${basePath}/board`} variant="outline" size="md" className="rounded-xl">
            <ArrowLeftIcon className="h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
