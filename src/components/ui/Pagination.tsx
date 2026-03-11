'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingsCount?: number;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function range(start: number, end: number): number[] {
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function buildPages(
  current: number,
  total: number,
  siblings: number
): (number | 'ellipsis')[] {
  // Total slots = siblings*2 + 5 (first + last + current + 2 ellipses max)
  const totalSlots = siblings * 2 + 5;

  if (total <= totalSlots) {
    return range(1, total);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = range(1, siblings * 2 + 3);
    return [...leftRange, 'ellipsis', total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = range(total - (siblings * 2 + 2), total);
    return [1, 'ellipsis', ...rightRange];
  }

  return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', total];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingsCount = 1,
  className,
}: PaginationProps) {
  const pages = useMemo(
    () => buildPages(currentPage, totalPages, siblingsCount),
    [currentPage, totalPages, siblingsCount]
  );

  if (totalPages <= 1) return null;

  const btnBase =
    'inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav
      aria-label="페이지네이션"
      className={cn('flex items-center gap-1', className)}
    >
      {/* First */}
      <button
        className={cn(btnBase, 'text-gray-500 hover:bg-gray-100')}
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="첫 페이지"
      >
        <ChevronDoubleLeftIcon className="h-4 w-4" />
      </button>

      {/* Prev */}
      <button
        className={cn(btnBase, 'text-gray-500 hover:bg-gray-100')}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-9 min-w-[36px] items-center justify-center text-sm text-gray-400"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            className={cn(
              btnBase,
              page === currentPage
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            onClick={() => onPageChange(page)}
            aria-label={`${page} 페이지`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        className={cn(btnBase, 'text-gray-500 hover:bg-gray-100')}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>

      {/* Last */}
      <button
        className={cn(btnBase, 'text-gray-500 hover:bg-gray-100')}
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="마지막 페이지"
      >
        <ChevronDoubleRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}
