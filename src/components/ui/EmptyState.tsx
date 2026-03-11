import { ReactElement } from 'react';

import { cn } from '@/lib/utils/cn';
import { InboxIcon } from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon?: ReactElement;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const iconElement = icon ?? (
    <InboxIcon className="h-12 w-12 text-gray-300" />
  );

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-4">{iconElement}</div>

      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-gray-500">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
