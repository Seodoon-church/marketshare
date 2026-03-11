'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | string;
  render?: (value: unknown, row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowKey?: keyof T | ((row: T, index: number) => string | number);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = '데이터가 없습니다.',
  className,
  rowKey,
}: TableProps<T>) {
  const getKey = (row: T, index: number): string | number => {
    if (!rowKey) return index;
    if (typeof rowKey === 'function') return rowKey(row, index);
    return String(row[rowKey] ?? index);
  };

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] text-sm">
        {/* Head */}
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col, ci) => (
              <th
                key={ci}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500',
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-gray-100">
                {columns.map((_, ci) => (
                  <td key={ci} className="px-4 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr
                key={getKey(row, ri)}
                onClick={() => onRowClick?.(row, ri)}
                className={cn(
                  'border-b border-gray-100 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50'
                )}
              >
                {columns.map((col, ci) => {
                  const raw = getNestedValue(row, col.accessor as string);
                  return (
                    <td
                      key={ci}
                      className={cn('px-4 py-3 text-gray-700', col.className)}
                    >
                      {col.render ? col.render(raw, row, ri) : (raw as ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
