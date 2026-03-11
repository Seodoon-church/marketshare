'use client';

import { useState } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

// ============================================
// StarRating - 별점 컴포넌트
// ============================================

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const isInteractive = !readonly && !!onChange;

  const displayRating = hoverRating > 0 ? hoverRating : rating;

  const handleClick = (star: number) => {
    if (isInteractive) {
      onChange(star);
    }
  };

  const handleMouseEnter = (star: number) => {
    if (isInteractive) {
      setHoverRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(0);
    }
  };

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', isInteractive && 'cursor-pointer')}
      onMouseLeave={handleMouseLeave}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={`별점 ${rating}점`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= Math.floor(displayRating);
        const isHalf = !isFilled && star === Math.ceil(displayRating) && displayRating % 1 >= 0.5;

        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            disabled={!isInteractive}
            className={cn(
              'relative flex-shrink-0 transition-colors duration-150',
              isInteractive
                ? 'hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded'
                : 'cursor-default disabled:opacity-100'
            )}
            aria-label={`${star}점`}
            tabIndex={isInteractive ? 0 : -1}
          >
            {isFilled ? (
              <StarSolid className={cn(sizeMap[size], 'text-amber-400')} />
            ) : isHalf ? (
              <span className="relative">
                <StarOutline className={cn(sizeMap[size], 'text-gray-300')} />
                <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <StarSolid className={cn(sizeMap[size], 'text-amber-400')} />
                </span>
              </span>
            ) : (
              <StarOutline className={cn(sizeMap[size], 'text-gray-300')} />
            )}
          </button>
        );
      })}
    </div>
  );
}
