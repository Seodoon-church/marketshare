import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Variants                                                          */
/* ------------------------------------------------------------------ */

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium flex-shrink-0 overflow-hidden',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string | null;
  name?: string;
  className?: string;
  alt?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    // For Korean/CJK names, take first char; otherwise first 2
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-pink-500',
  'bg-fuchsia-500',
  'bg-purple-500',
  'bg-violet-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-sky-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-green-500',
  'bg-lime-600',
  'bg-amber-500',
  'bg-orange-500',
  'bg-red-500',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getColorFromName(name: string): string {
  const idx = hashString(name) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Avatar({ src, name, size, className, alt }: AvatarProps) {
  if (src) {
    return (
      <span className={cn(avatarVariants({ size }), className)}>
        <img
          src={src}
          alt={alt || name || '사용자 아바타'}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  const initials = name ? getInitials(name) : '?';
  const bg = name ? getColorFromName(name) : 'bg-gray-400';

  return (
    <span
      className={cn(avatarVariants({ size }), bg, 'text-white', className)}
      aria-label={name || '사용자 아바타'}
      role="img"
    >
      {initials}
    </span>
  );
}
