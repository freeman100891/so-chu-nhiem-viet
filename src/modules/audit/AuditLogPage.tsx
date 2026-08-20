import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/components/Card';
import { Select } from '../../shared/components/Select';
import { Input } from '../../shared/components/Input';
import { Badge } from '../../shared/components/Badge';
import { Table, type Column } from '../../shared/components/Table';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { db } from '../../core/database/db';
import { formatDateVietnamese } from '../../shared/utilities/date';
import type { AuditLog, AuditAction } from '../../core/database/types';
import { Search, ShieldCheck } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await db.auditLogs.reverse().sortBy('timestamp');
      setLogs(list);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchSearch =
      !searchQuery ||
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchAction && matchSearch;
  });

  const getActionBadgeVariant = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'danger';
      case 'RESTORE':
      case 'RESTORE_DB':
        return 'warning';
      case 'BACKUP':
        return 'neutral';
      default:
        return 'primary';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      header: 'Thời gian',
      cell: (row) => (
        <span className="text-xs font-mono text-app-muted">
          {formatDateVietnamese(row.timestamp.substring(0, 10))} {row.timestamp.substring(11, 19)}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      cell: (row) => <Badge variant={getActionBadgeVariant(row.action)}>{row.action}</Badge>,
    },
    {
      header: 'Đối tượng',
      cell: (row) => <span className="font-bold text-app-main">{row.entityName}</span>,
    },
    {
      header: 'Chi tiết thay đổi (oldValue ➔ newValue)',
      cell: (row) => <span className="text-xs text-app-main whitespace-pre-wrap">{row.details || 'Không có chi tiết'}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Nhật Ký Kiểm Soát Hệ Thống (Audit Log)"
        description="Theo dõi minh bạch toàn bộ các hành động tạo, sửa, xóa, khôi phục và sao lưu trong cơ sở dữ liệu"
        badgeText={`${filteredLogs.length} nhật ký`}
      />

      <Card title="Nhật Ký Thay Đổi Dữ Liệu" action={<ShieldCheck className="w-5 h-5 text-app-primary" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Lọc theo Hành động"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả các hành động' },
                { value: 'CREATE', label: 'CREATE (Tạo mới)' },
                { value: 'UPDATE', label: 'UPDATE (Chỉnh sửa)' },
                { value: 'DELETE', label: 'DELETE (Xóa)' },
                { value: 'RESTORE', label: 'RESTORE (Khôi phục)' },
                { value: 'BACKUP', label: 'BACKUP (Sao lưu)' },
              ]}
            />
            <Input
              label="Tìm kiếm nhật ký"
              placeholder="Tìm theo đối tượng, chi tiết..."
              leftIcon={<Search className="w-4 h-4 text-app-muted" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <LoadingSkeleton type="table" count={5} />
          ) : (
            <Table
              columns={columns}
              data={filteredLogs}
              keyExtractor={(row) => row.id}
              emptyTitle="Chưa có nhật ký kiểm soát"
              emptyDescription="Hệ thống chưa ghi nhận nhật ký thao tác nào."
            />
          )}
        </div>
      </Card>
    </div>
  );
};
