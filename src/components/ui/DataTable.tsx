'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Table, type TableColumn } from './Table';
import { Pagination } from './Pagination';
import { Select, type SelectOption } from './Select';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface DataTableFilter {
  key: string;
  label: string;
  options: SelectOption[];
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchAccessors?: (keyof T | string)[];
  filters?: DataTableFilter[];
  pagination?: {
    pageSize: number;
    siblingsCount?: number;
  };
  onRowClick?: (row: T, index: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
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

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = '검색...',
  searchAccessors,
  filters,
  pagination,
  onRowClick,
  isLoading = false,
  emptyMessage,
  selectable = false,
  onSelectionChange,
  className,
  rowKey,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );

  /* ---- Filter + Search logic ---- */
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const accessors =
        searchAccessors || columns.map((c) => c.accessor as string);

      result = result.filter((row) =>
        accessors.some((accessor) => {
          const value = getNestedValue(row, accessor as string);
          return value != null && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    for (const [key, value] of Object.entries(filterValues)) {
      if (!value) continue;
      result = result.filter((row) => {
        const rowVal = getNestedValue(row, key);
        return String(rowVal) === value;
      });
    }

    return result;
  }, [data, searchQuery, filterValues, columns, searchAccessors]);

  /* ---- Pagination logic ---- */
  const pageSize = pagination?.pageSize ?? filteredData.length;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  // Reset page when filters change
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safeCurrentPage, pageSize, pagination]);

  /* ---- Selection logic ---- */
  const handleSelectAll = useCallback(() => {
    if (selectedIndices.size === paginatedData.length) {
      setSelectedIndices(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(paginatedData.map((_, i) => i));
      setSelectedIndices(all);
      onSelectionChange?.(paginatedData);
    }
  }, [paginatedData, selectedIndices, onSelectionChange]);

  const handleSelectRow = useCallback(
    (index: number) => {
      setSelectedIndices((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        const selected = paginatedData.filter((_, i) => next.has(i));
        onSelectionChange?.(selected);
        return next;
      });
    },
    [paginatedData, onSelectionChange]
  );

  /* ---- Build columns with selection ---- */
  const effectiveColumns = useMemo(() => {
    if (!selectable) return columns;

    const checkboxCol: TableColumn<T> = {
      header: '',
      accessor: '__select__',
      headerClassName: 'w-10',
      className: 'w-10',
      render: (_value, _row, index) => (
        <input
          type="checkbox"
          checked={selectedIndices.has(index)}
          onChange={(e) => {
            e.stopPropagation();
            handleSelectRow(index);
          }}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
          aria-label="행 선택"
        />
      ),
    };

    return [checkboxCol, ...columns];
  }, [columns, selectable, selectedIndices, handleSelectRow]);

  /* ---- Handle page change ---- */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedIndices(new Set());
  }, []);

  /* ---- Handle filter change ---- */
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
      setSelectedIndices(new Set());
    },
    []
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Toolbar */}
      {(searchable || (filters && filters.length > 0)) && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          {searchable && (
            <div className="relative w-full max-w-xs">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className={cn(
                  'flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm',
                  'placeholder:text-gray-400',
                  'transition-colors duration-200',
                  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                )}
              />
            </div>
          )}

          {filters?.map((filter) => (
            <div key={filter.key} className="w-full max-w-[180px]">
              <Select
                options={filter.options}
                value={filterValues[filter.key] || ''}
                onChange={(val) => handleFilterChange(filter.key, val)}
                placeholder={filter.label}
              />
            </div>
          ))}

          {selectable && selectedIndices.size > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {selectedIndices.size}개 선택됨
            </span>
          )}
        </div>
      )}

      {/* Select all checkbox in header */}
      {selectable && (
        <div className="mb-2 flex items-center gap-2 px-4">
          <input
            type="checkbox"
            checked={
              paginatedData.length > 0 &&
              selectedIndices.size === paginatedData.length
            }
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            aria-label="전체 선택"
          />
          <span className="text-xs text-gray-500">전체 선택</span>
        </div>
      )}

      {/* Table */}
      <Table
        columns={effectiveColumns}
        data={paginatedData}
        onRowClick={onRowClick}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        rowKey={rowKey}
      />

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            siblingsCount={pagination.siblingsCount}
          />
        </div>
      )}
    </div>
  );
}
