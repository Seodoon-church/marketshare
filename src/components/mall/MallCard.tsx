import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ShoppingBagIcon,
  StarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface MallCardProps {
  mall: {
    name: string;
    slug: string;
    description: string;
    themeColor?: string;
    productCount: number;
    reviewCount: number;
    category?: string;
    logoUrl?: string | null;
  };
  className?: string;
}

export function MallCard({ mall, className }: MallCardProps) {
  const themeColor = mall.themeColor || '#3B82F6';

  return (
    <Card hover padding="none" className={cn('overflow-hidden', className)}>
      {/* Theme Color Accent Bar */}
      <div className="h-1.5" style={{ backgroundColor: themeColor }} />

      <div className="p-5">
        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${themeColor}15` }}
          >
            {mall.logoUrl ? (
              <img
                src={mall.logoUrl}
                alt={mall.name}
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <span
                className="text-lg font-bold"
                style={{ color: themeColor }}
              >
                {mall.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {mall.name}
            </h3>
            {mall.category && (
              <span
                className="mt-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${themeColor}10`,
                  color: themeColor,
                }}
              >
                {mall.category}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-gray-500 line-clamp-2">
          {mall.description}
        </p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
            <span>상품 {mall.productCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <StarIcon className="h-4 w-4 text-gray-400" />
            <span>리뷰 {mall.reviewCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Visit Button */}
        <Button href={`/malls/${mall.slug}`} variant="outline" fullWidth size="md" className="mt-4">
          방문하기
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
