
import { cn } from '@/lib/utils/cn';
import {
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="경로" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isHome = index === 0 && item.href === '/';

          return (
            <li key={index} className="flex items-center gap-1">
              {/* Separator */}
              {index > 0 && (
                <ChevronRightIcon
                  className="h-3.5 w-3.5 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  className="font-medium text-gray-900"
                  aria-current="page"
                >
                  {isHome ? (
                    <HomeIcon className="h-4 w-4" aria-label="홈" />
                  ) : (
                    item.label
                  )}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="text-gray-500 transition-colors hover:text-gray-700"
                >
                  {isHome ? (
                    <HomeIcon className="h-4 w-4" aria-label="홈" />
                  ) : (
                    item.label
                  )}
                </a>
              ) : (
                <span className="text-gray-500">
                  {isHome ? (
                    <HomeIcon className="h-4 w-4" aria-label="홈" />
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
