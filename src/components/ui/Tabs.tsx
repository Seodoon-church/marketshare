'use client';

import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface TabItem {
  label: string;
  value: string;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Variants                                                          */
/* ------------------------------------------------------------------ */

const tabVariants = cva(
  'inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 whitespace-nowrap',
  {
    variants: {
      variant: {
        underline:
          'border-b-2 px-1 pb-2.5 pt-1',
        pill:
          'rounded-lg px-3 py-1.5',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'underline',
        active: true,
        class: 'border-primary text-primary',
      },
      {
        variant: 'underline',
        active: false,
        class:
          'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
      },
      {
        variant: 'pill',
        active: true,
        class: 'bg-primary text-white shadow-sm',
      },
      {
        variant: 'pill',
        active: false,
        class: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      },
    ],
    defaultVariants: {
      variant: 'underline',
      active: false,
    },
  }
);

/* ------------------------------------------------------------------ */
/*  Container variants                                                */
/* ------------------------------------------------------------------ */

const containerVariants = cva('flex', {
  variants: {
    variant: {
      underline: 'gap-4 border-b border-gray-200',
      pill: 'gap-1 rounded-xl bg-gray-100 p-1',
    },
  },
  defaultVariants: {
    variant: 'underline',
  },
});

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  className,
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(containerVariants({ variant }), className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;

        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              tabVariants({ variant, active: isActive })
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium',
                  isActive
                    ? variant === 'pill'
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                    : 'bg-gray-200 text-gray-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
