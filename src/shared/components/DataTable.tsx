import React, { useState } from 'react';
import { Table, type Column } from './Table';
import { Input } from './Input';
import { Button } from './Button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  searchableKey?: keyof T;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchableKey,
  searchPlaceholder = 'Tìm kiếm trong bảng...',
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onRowClick,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!searchableKey || !searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter((row) => {
      const val = row[searchableKey];
      return val ? String(val).toLowerCase().includes(query) : false;
    });
  }, [data, searchableKey, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="space-y-3 w-full">
      {searchableKey && (
        <div className="flex items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-app-muted" />}
            />
          </div>
          <span className="text-xs text-app-muted shrink-0 font-medium">
            Tổng cộng: <strong className="text-app-main">{filteredData.length}</strong> bản ghi
          </span>
        </div>
      )}

      <Table
        columns={columns}
        data={paginatedData}
        keyExtractor={keyExtractor}
        isLoading={isLoading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        onRowClick={onRowClick}
      />

      {/* Pagination Footer */}
      {filteredData.length > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-app-muted">
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Sau <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
