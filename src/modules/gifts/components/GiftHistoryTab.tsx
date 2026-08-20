import React from 'react';
import type { ClassRoom, GiftRedemptionStatus } from '../../../core/database/types';
import type { DetailedRedemptionRecord } from '../../../core/repositories/gift-redemption.repository';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { Badge } from '../../../shared/components/Badge';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import {
  History,
  Search,
  RotateCcw,
  Eye,
  Calendar,
} from 'lucide-react';

export interface GiftHistoryTabProps {
  historyRecords: DetailedRedemptionRecord[];
  loading: boolean;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  statusFilter: GiftRedemptionStatus | 'ALL';
  onSelectStatus: (status: GiftRedemptionStatus | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDetail: (record: DetailedRedemptionRecord) => void;
  onOpenCancel: (record: DetailedRedemptionRecord) => void;
}

export const GiftHistoryTab: React.FC<GiftHistoryTabProps> = ({
  historyRecords,
  loading,
  classes,
  selectedClassId,
  onSelectClass,
  statusFilter,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  onOpenDetail,
  onOpenCancel,
}) => {
  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Tìm tên học sinh hoặc tên quà..."
            leftIcon={<Search className="w-4 h-4 text-app-muted" />}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <Select
            value={selectedClassId}
            onChange={(e) => onSelectClass(e.target.value)}
            options={[
              { value: '', label: 'Tất cả các lớp' },
              ...classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => onSelectStatus(e.target.value as GiftRedemptionStatus | 'ALL')}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'COMPLETED', label: 'Đã hoàn tất (Thành công)' },
              { value: 'CANCELLED', label: 'Đã hủy (Đã hoàn điểm)' },
            ]}
          />
        </div>
      </Card>

      {/* History Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-app-surface-hover rounded-2xl border border-app" />
          ))}
        </div>
      ) : historyRecords.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <History className="w-10 h-10 text-app-muted mx-auto" />
          <p className="text-sm font-semibold text-app-main">Không tìm thấy lịch sử đổi quà nào</p>
          <p className="text-xs text-app-muted">Chưa có giao dịch đổi quà nào phù hợp với bộ lọc hiện tại.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {historyRecords.map((record) => {
            const { redemption, items, studentName, studentCode, className, studentAvatarKey } = record;
            const isCancelled = redemption.status === 'CANCELLED';

            return (
              <Card
                key={redemption.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-app-primary/40 ${
                  isCancelled ? 'bg-app-surface/60 opacity-80' : ''
                }`}
              >
                {/* Left: Student Avatar + Info + Items summary */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <StudentAvatar
                    avatarKey={studentAvatarKey}
                    name={studentName || 'Học sinh'}
                    size="md"
                    className="shrink-0"
                  />

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-app-main">{studentName}</span>
                      {studentCode && <span className="text-xs text-app-muted">({studentCode})</span>}
                      {className && <Badge variant="neutral" className="text-[10px] py-0.5 px-2">{className}</Badge>}
                      <Badge
                        variant={isCancelled ? 'danger' : 'success'}
                        className="text-[10px] py-0.5 px-2 font-semibold"
                      >
                        {isCancelled ? 'Đã hủy' : 'Hoàn tất'}
                      </Badge>
                    </div>

                    <div className="text-xs text-app-muted flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateVietnamese(redemption.redeemedAt)}
                      </span>
                      <span>•</span>
                      <span className="text-app-main font-medium">
                        {items.map((i) => `${i.giftNameSnapshot} (x${i.quantity})`).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Points + Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-app/60">
                  <div className="text-right">
                    <div className="text-xs text-app-muted">Tổng điểm</div>
                    <div className={`font-extrabold text-base ${isCancelled ? 'line-through text-app-muted' : 'text-app-primary'}`}>
                      {redemption.totalPoints}đ
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      leftIcon={<Eye className="w-3.5 h-3.5 text-app-muted" />}
                      onClick={() => onOpenDetail(record)}
                    >
                      Chi tiết
                    </Button>

                    {!isCancelled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => onOpenCancel(record)}
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
