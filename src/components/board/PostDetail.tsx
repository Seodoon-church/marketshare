'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/board/StarRating';
import { formatDateTime } from '@/lib/utils/format';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import type { BoardPost } from '@/types';

// ============================================
// PostDetail - 게시글 상세 컴포넌트
// ============================================

interface PostDetailProps {
  post: BoardPost;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PostDetail({
  post,
  onBack,
  onEdit,
  onDelete,
}: PostDetailProps) {
  // DOMPurify로 HTML 콘텐츠 안전하게 렌더링
  const sanitizedContent = useMemo(() => {
    if (typeof window === 'undefined') return post.content;
    return DOMPurify.sanitize(post.content, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'strong', 'em', 'u', 's', 'del',
        'a', 'img',
        'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
    });
  }, [post.content]);

  // 이미지 첨부파일 필터링
  const imageAttachments = post.attachments.filter((att) =>
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name)
  );

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeftIcon className="h-4 w-4" />
        목록으로
      </Button>

      {/* 게시글 헤더 */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          {/* 제목 영역 */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {post.isPinned && (
              <Badge variant="info">공지</Badge>
            )}
            {post.isSecret && (
              <Badge variant="secondary">비밀글</Badge>
            )}
            <h1 className="text-xl font-bold text-gray-900">
              {post.title}
            </h1>
          </div>

          {/* 별점 (리뷰인 경우) */}
          {post.rating !== null && (
            <div className="mb-3">
              <StarRating rating={post.rating} size="md" readonly />
            </div>
          )}

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-4 w-4" />
              {post.authorName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              {formatDateTime(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <EyeIcon className="h-4 w-4" />
              조회 {post.viewCount}
            </span>
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="px-6 py-6">
          <div
            className={cn(
              'prose prose-sm max-w-none',
              'prose-headings:text-gray-900 prose-p:text-gray-700',
              'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
              'prose-img:rounded-lg prose-img:shadow-sm'
            )}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>

        {/* 첨부 이미지 */}
        {imageAttachments.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              첨부 이미지
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imageAttachments.map((att, index) => (
                <a
                  key={index}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-xl border border-gray-100 transition-all hover:shadow-md"
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 첨부파일 목록 (이미지 외) */}
        {post.attachments.filter((att) => !imageAttachments.includes(att)).length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              첨부파일
            </h3>
            <ul className="space-y-1">
              {post.attachments
                .filter((att) => !imageAttachments.includes(att))
                .map((att, index) => (
                  <li key={index}>
                    <a
                      href={att.url}
                      download={att.name}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      {att.name}
                      <span className="text-xs text-gray-400">
                        ({(att.size / 1024).toFixed(1)}KB)
                      </span>
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* 수정/삭제 버튼 */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <PencilIcon className="h-4 w-4" />
                수정
              </Button>
            )}
            {onDelete && (
              <Button variant="danger" size="sm" onClick={onDelete}>
                <TrashIcon className="h-4 w-4" />
                삭제
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
