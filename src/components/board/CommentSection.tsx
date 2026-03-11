'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils/format';
import {
  ChatBubbleLeftIcon,
  TrashIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline';

// ============================================
// CommentSection - 댓글 영역 컴포넌트
// ============================================

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId?: string;
  createdAt: Date;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUserId?: string;
  onAddComment?: (content: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function CommentSection({
  postId,
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // 최상위 댓글과 대댓글 분류
  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  // 댓글 등록
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onAddComment?.(newComment.trim());
    setNewComment('');
  };

  // 답글 등록
  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    onAddComment?.(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyTo(null);
  };

  // 댓글 삭제
  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      onDeleteComment?.(commentId);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* 댓글 헤더 */}
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <ChatBubbleLeftIcon className="h-5 w-5" />
          댓글
          <span className="text-sm font-normal text-gray-500">
            ({comments.length})
          </span>
        </h3>
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-gray-100">
        {topLevelComments.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = getReplies(comment.id);

            return (
              <div key={comment.id}>
                {/* 최상위 댓글 */}
                <CommentItem
                  comment={comment}
                  isOwn={comment.authorId === currentUserId}
                  onReply={() => {
                    setReplyTo(replyTo === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                  onDelete={() => handleDeleteComment(comment.id)}
                />

                {/* 대댓글 목록 */}
                {replies.length > 0 && (
                  <div className="bg-gray-50/50">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isOwn={reply.authorId === currentUserId}
                        isReply
                        onDelete={() => handleDeleteComment(reply.id)}
                      />
                    ))}
                  </div>
                )}

                {/* 답글 입력 폼 */}
                {replyTo === comment.id && (
                  <div className="bg-gray-50/50 px-6 py-3 pl-14">
                    <div className="flex gap-2">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        rows={2}
                        className={cn(
                          'flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
                          'placeholder:text-gray-400',
                          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                          'resize-none'
                        )}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          등록
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyContent('');
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 새 댓글 입력 폼 */}
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={3}
            className={cn(
              'flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              'resize-none'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmitComment();
              }
            }}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="self-end"
          >
            등록
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Ctrl + Enter로 빠르게 등록할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

// ---- 개별 댓글 아이템 ----

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
  isReply?: boolean;
  onReply?: () => void;
  onDelete?: () => void;
}

function CommentItem({
  comment,
  isOwn,
  isReply = false,
  onReply,
  onDelete,
}: CommentItemProps) {
  return (
    <div className={cn('px-6 py-4', isReply && 'pl-14')}>
      {/* 답글 표시 */}
      {isReply && (
        <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
          <ArrowUturnRightIcon className="h-3 w-3" />
          답글
        </div>
      )}

      {/* 작성자, 날짜 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {comment.authorName}
          </span>
          <span className="text-xs text-gray-400">
            {formatDateTime(comment.createdAt)}
          </span>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1">
          {onReply && (
            <button
              onClick={onReply}
              className="rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              답글
            </button>
          )}
          {isOwn && onDelete && (
            <button
              onClick={onDelete}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="댓글 삭제"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 댓글 내용 */}
      <p className="whitespace-pre-wrap text-sm text-gray-700">
        {comment.content}
      </p>
    </div>
  );
}
