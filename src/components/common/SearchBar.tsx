'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  defaultValue?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: {
    wrapper: 'h-9',
    input: 'text-sm px-3',
    icon: 'h-4 w-4',
    iconWrapper: 'left-2.5',
    inputPadding: 'pl-8',
    clearButton: 'right-2',
  },
  md: {
    wrapper: 'h-10',
    input: 'text-sm px-3',
    icon: 'h-5 w-5',
    iconWrapper: 'left-3',
    inputPadding: 'pl-10',
    clearButton: 'right-3',
  },
  lg: {
    wrapper: 'h-12',
    input: 'text-base px-4',
    icon: 'h-5 w-5',
    iconWrapper: 'left-4',
    inputPadding: 'pl-12',
    clearButton: 'right-4',
  },
};

export function SearchBar({
  placeholder = '검색어를 입력하세요',
  onSearch,
  defaultValue = '',
  size = 'md',
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const styles = sizeStyles[size];

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(value.trim());
    },
    [value, onSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onSearch(value.trim());
      }
    },
    [value, onSearch]
  );

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className={cn('relative', styles.wrapper)}>
        {/* Search Icon */}
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400',
            styles.iconWrapper
          )}
        >
          <MagnifyingGlassIcon className={styles.icon} />
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'h-full w-full rounded-lg border border-gray-300 bg-white pr-9 text-gray-900',
            'placeholder:text-gray-400',
            'transition-colors duration-200',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            styles.input,
            styles.inputPadding
          )}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600',
              styles.clearButton
            )}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
