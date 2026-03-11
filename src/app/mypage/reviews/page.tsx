'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/format';
import {
  ChatBubbleLeftEllipsisIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon as StarOutlineIcon,
  FaceFrownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface ReviewItem {
  id: number;
  productName: string;
  mallName: string;
  gradient: string;
  rating: number;
  content: string;
  date: string;
}

const initialReviews: ReviewItem[] = [
  {
    id: 1,
    productName: '프리미엄 캐시미어 머플러',
    mallName: '럭셔리몰',
    gradient: 'from-rose-400 to-pink-500',
    rating: 5,
    content: '촉감이 정말 부드럽고 따뜻해요. 색상도 사진과 동일하고 포장도 꼼꼼하게 해주셔서 만족합니다. 선물용으로도 딱 좋을 것 같아요!',
    date: '2026-02-28',
  },
  {
    id: 2,
    productName: '무선 충전 LED 무드등',
    mallName: '라이프스타일샵',
    gradient: 'from-amber-400 to-orange-500',
    rating: 4,
    content: '디자인이 예쁘고 무선 충전도 잘 됩니다. 밝기 조절이 3단계인데 5단계였으면 더 좋았을 것 같아요.',
    date: '2026-02-15',
  },
  {
    id: 3,
    productName: '핸드메이드 가죽 카드지갑',
    mallName: '공방마켓',
    gradient: 'from-emerald-400 to-teal-500',
    rating: 5,
    content: '가죽 질감이 고급스럽고 수작업의 정성이 느껴져요. 카드 수납 공간도 넉넉하고 매일 사용하기 좋습니다.',
    date: '2026-01-20',
  },
  {
    id: 4,
    productName: '유기농 그래놀라 선물세트',
    mallName: '건강한식탁',
    gradient: 'from-violet-400 to-indigo-500',
    rating: 3,
    content: '맛은 괜찮은데 양이 생각보다 적어요. 가격 대비 조금 아쉽지만 건강한 재료를 사용해서 좋습니다.',
    date: '2026-01-05',
  },
  {
    id: 5,
    productName: '리넨 블렌드 와이드 팬츠',
    mallName: '데일리룩',
    gradient: 'from-stone-400 to-neutral-500',
    rating: 4,
    content: '여름에 시원하게 입기 좋아요. 핏도 예쁘고 소재가 가벼워서 활동하기 편합니다. 다른 색상도 구매할 예정이에요.',
    date: '2025-12-18',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rating ? (
          <StarSolidIcon key={star} className="h-4 w-4 text-amber-400" />
        ) : (
          <StarOutlineIcon key={star} className="h-4 w-4 text-gray-300" />
        )
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);

  const removeReview = (id: number) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">리뷰 관리</h1>
          <p className="mt-1 text-sm text-gray-500">작성한 리뷰를 관리하세요.</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FaceFrownIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mt-4 text-base font-medium text-gray-900">작성한 리뷰가 없습니다</p>
          <p className="mt-1 text-sm text-gray-500">구매하신 상품에 리뷰를 남겨보세요.</p>
          <Button href="/mypage" variant="default" className="mt-6">
              주문내역 보기
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">리뷰 관리</h1>
          <p className="mt-1 text-sm text-gray-500">작성한 리뷰를 관리하세요.</p>
        </div>
        <Badge variant="secondary">{reviews.length}개 리뷰</Badge>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <div className="flex gap-4">
              {/* Product Thumbnail */}
              <div className="shrink-0">
                <div
                  className={`h-20 w-20 rounded-xl bg-gradient-to-br ${review.gradient} sm:h-24 sm:w-24`}
                />
              </div>

              {/* Review Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{review.mallName}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
                      {review.productName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatDate(review.date)}
                  </span>
                </div>

                {/* Star Rating */}
                <div className="mt-2">
                  <StarRating rating={review.rating} />
                </div>

                {/* Review Text Preview */}
                <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-2">
                  {review.content}
                </p>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm">
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeReview(review.id)}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
