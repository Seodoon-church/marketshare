'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { StarRating } from '@/components/board/StarRating';
import { formatDate } from '@/lib/utils/format';
import { HandThumbUpIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid } from '@heroicons/react/24/solid';

// ============================================
// ReviewCard - 리뷰 카드 컴포넌트
// ============================================

interface ReviewCardProps {
  review: {
    id: string;
    author: string;
    rating: number;
    content: string;
    images?: string[];
    date: Date;
    productName?: string;
    helpfulCount?: number;
  };
  onHelpful?: (reviewId: string) => void;
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount ?? 0);

  const handleHelpfulClick = () => {
    if (isHelpful) return;
    setIsHelpful(true);
    setHelpfulCount((prev) => prev + 1);
    onHelpful?.(review.id);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* 헤더: 작성자, 별점, 날짜 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 작성자 아바타 */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
            {review.author.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {review.author}
              </span>
              <StarRating rating={review.rating} size="sm" readonly />
            </div>
            <p className="text-xs text-gray-400">{formatDate(review.date)}</p>
          </div>
        </div>
      </div>

      {/* 상품명 */}
      {review.productName && (
        <p className="mb-2 text-xs text-gray-500">
          구매 상품: <span className="font-medium text-gray-700">{review.productName}</span>
        </p>
      )}

      {/* 리뷰 내용 */}
      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {review.content}
      </p>

      {/* 리뷰 이미지 (가로 스크롤) */}
      {review.images && review.images.length > 0 && (
        <div className="mb-4 -mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1 pb-2">
            {review.images.map((imageUrl, index) => (
              <a
                key={index}
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0 overflow-hidden rounded-xl border border-gray-100"
              >
                <img
                  src={imageUrl}
                  alt={`리뷰 이미지 ${index + 1}`}
                  className="h-24 w-24 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 도움이 돼요 버튼 */}
      <div className="border-t border-gray-100 pt-3">
        <button
          onClick={handleHelpfulClick}
          disabled={isHelpful}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
            isHelpful
              ? 'bg-primary/10 text-primary'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {isHelpful ? (
            <HandThumbUpSolid className="h-3.5 w-3.5" />
          ) : (
            <HandThumbUpIcon className="h-3.5 w-3.5" />
          )}
          도움이 돼요
          {helpfulCount > 0 && (
            <span className="ml-0.5">{helpfulCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
