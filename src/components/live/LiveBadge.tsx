'use client';

interface LiveBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveBadge({ className = '', size = 'md' }: LiveBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} bg-red-600 text-white font-bold rounded ${className}`}
    >
      <span className={`${dotSizeClasses[size]} bg-white rounded-full animate-pulse`} />
      LIVE
    </div>
  );
}

export default LiveBadge;
