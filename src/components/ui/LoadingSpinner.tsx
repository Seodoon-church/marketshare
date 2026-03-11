import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Variants                                                          */
/* ------------------------------------------------------------------ */

const spinnerVariants = cva('animate-spin rounded-full border-2 border-current border-t-transparent', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-10 w-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface LoadingSpinnerProps
  extends VariantProps<typeof spinnerVariants> {
  color?: string;
  className?: string;
}

export interface FullPageLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  LoadingSpinner                                                    */
/* ------------------------------------------------------------------ */

export function LoadingSpinner({
  size,
  color = 'text-primary',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="로딩 중"
      className={cn('inline-flex', color, className)}
    >
      <div className={cn(spinnerVariants({ size }))} />
      <span className="sr-only">로딩 중...</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FullPageLoader                                                    */
/* ------------------------------------------------------------------ */

export function FullPageLoader({
  message,
  size = 'lg',
  className,
}: FullPageLoaderProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] w-full flex-col items-center justify-center gap-4',
        className
      )}
    >
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}
