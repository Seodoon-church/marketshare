import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Skeleton (base)                                                   */
/* ------------------------------------------------------------------ */

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | '2xl';
}

export function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
    '2xl': 'rounded-2xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        roundedMap[rounded],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonText                                                      */
/* ------------------------------------------------------------------ */

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3'];

  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', widths[i % widths.length])}
          rounded="md"
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonCard                                                      */
/* ------------------------------------------------------------------ */

export interface SkeletonCardProps {
  className?: string;
  hasImage?: boolean;
}

export function SkeletonCard({
  className,
  hasImage = true,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm',
        className
      )}
      aria-hidden="true"
    >
      {hasImage && (
        <Skeleton className="mb-4 h-40 w-full" rounded="lg" />
      )}
      <Skeleton className="mb-3 h-5 w-3/4" rounded="md" />
      <SkeletonText lines={2} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonTable                                                     */
/* ------------------------------------------------------------------ */

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('w-full', className)} aria-hidden="true">
      {/* Header */}
      <div className="flex gap-4 border-b border-gray-200 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" rounded="md" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="flex gap-4 border-b border-gray-100 px-4 py-3"
        >
          {Array.from({ length: columns }).map((_, ci) => (
            <Skeleton key={ci} className="h-4 flex-1" rounded="md" />
          ))}
        </div>
      ))}
    </div>
  );
}
