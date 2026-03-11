'use client';

import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/board/StarRating';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

// ============================================
// ReviewSummary - 리뷰 요약 컴포넌트
// ============================================

interface ReviewSummaryProps {
  averageRating: number;
  totalCount: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  onWriteReview?: () => void;
}

export function ReviewSummary({
  averageRating,
  totalCount,
  distribution,
  onWriteReview,
}: ReviewSummaryProps) {
  // 최대 분포값 계산 (바 차트 비율 계산용)
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* 왼쪽: 평균 별점 */}
        <div className="flex flex-col items-center sm:min-w-[140px]">
          <span className="text-5xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <div className="mt-2">
            <StarRating rating={averageRating} size="md" readonly />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            총 {totalCount.toLocaleString()}개 리뷰
          </p>
        </div>

        {/* 오른쪽: 별점 분포 바 차트 */}
        <div className="flex-1 space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = distribution[star];
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const barWidth = totalCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                {/* 별점 라벨 */}
                <span className="w-8 text-right text-sm font-medium text-gray-600">
                  {star}점
                </span>

                {/* 바 차트 */}
                <div className="flex-1">
                  <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        star >= 4
                          ? 'bg-amber-400'
                          : star === 3
                            ? 'bg-amber-300'
                            : 'bg-gray-300'
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* 개수 및 퍼센트 */}
                <span className="w-16 text-right text-xs text-gray-500">
                  {count}개 ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 리뷰 작성 버튼 */}
      {onWriteReview && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <Button onClick={onWriteReview} fullWidth>
            <PencilSquareIcon className="h-4 w-4" />
            리뷰 작성
          </Button>
        </div>
      )}
    </div>
  );
}
