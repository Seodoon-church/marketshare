import { cn } from '@/lib/utils/cn';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: ReactNode;
  color?: 'blue' | 'emerald' | 'purple' | 'orange' | 'red';
  className?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    changeBg: 'bg-blue-50',
    changeText: 'text-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    changeBg: 'bg-emerald-50',
    changeText: 'text-emerald-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    changeBg: 'bg-purple-50',
    changeText: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    changeBg: 'bg-orange-50',
    changeText: 'text-orange-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    changeBg: 'bg-red-50',
    changeText: 'text-red-600',
  },
};

export function StatsCard({
  title,
  value,
  change,
  changeType,
  icon,
  color = 'blue',
  className,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>

        {icon && (
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl',
              colors.bg,
              colors.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && changeType && (
        <div className="mt-3 flex items-center gap-1.5">
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              changeType === 'increase'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            )}
          >
            {changeType === 'increase' ? (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
            )}
            {Math.abs(change)}%
          </div>
          <span className="text-xs text-gray-400">전월 대비</span>
        </div>
      )}
    </div>
  );
}
