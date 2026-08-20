import React from 'react';
import { cn } from '../utilities/cn';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onRowClick,
  className,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center bg-app-surface rounded-xl border border-app">
        <LoadingSpinner size="lg" label="Đang tải danh sách..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'Chưa có bản ghi nào'}
        description={emptyDescription || 'Danh sách hiện tại đang trống.'}
      />
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-app shadow-xs bg-app-surface', className)}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-app bg-app-surface-hover/60 text-app-muted font-semibold">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={cn('px-4 py-3.5 whitespace-nowrap', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-app">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row, index)}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                'transition-colors text-app-main',
                onRowClick ? 'cursor-pointer hover:bg-app-surface-hover' : 'hover:bg-app-surface-hover/40'
              )}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={cn('px-4 py-3.5 whitespace-nowrap', col.className)}>
                  {col.cell
                    ? col.cell(row, index)
                    : col.accessorKey
                    ? (row[col.accessorKey] as unknown as React.ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
