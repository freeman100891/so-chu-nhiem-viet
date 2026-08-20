import React, { useState, useMemo } from 'react';
import { Input } from '../../../shared/components/Input';
import { Badge } from '../../../shared/components/Badge';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { normalizeVietnameseText } from '../../../shared/utilities/normalize';
import type { StudentRosterEvaluationItem } from '../../../core/services/evaluation.service';
import { Search, AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface EvaluationRosterProps {
  roster: StudentRosterEvaluationItem[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  isLoading?: boolean;
}

export const EvaluationRoster: React.FC<EvaluationRosterProps> = ({
  roster,
  selectedStudentId,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NOT_STARTED' | 'DRAFT' | 'FINALIZED'>('ALL');

  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      // 1. Status Filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'NOT_STARTED' && item.status !== 'NOT_STARTED') return false;
        if (filterStatus === 'DRAFT' && item.status !== 'DRAFT' && item.status !== 'READY_FOR_REVIEW') return false;
        if (filterStatus === 'FINALIZED' && item.status !== 'FINALIZED') return false;
      }

      // 2. Search Filter
      if (searchQuery.trim()) {
        const norm = normalizeVietnameseText(searchQuery);
        const nameNorm = normalizeVietnameseText(item.student.fullName);
        const codeNorm = item.student.studentCode.toLowerCase();
        return nameNorm.includes(norm) || codeNorm.includes(norm);
      }

      return true;
    });
  }, [roster, filterStatus, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: roster.length,
      notStarted: roster.filter((r) => r.status === 'NOT_STARTED').length,
      draft: roster.filter((r) => r.status === 'DRAFT' || r.status === 'READY_FOR_REVIEW').length,
      finalized: roster.filter((r) => r.status === 'FINALIZED').length,
    };
  }, [roster]);

  return (
    <div className="flex flex-col h-full bg-app-surface border border-app rounded-2xl overflow-hidden shadow-sm">
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-app space-y-2.5 bg-app-surface-hover/30">
        <Input
          placeholder="Tìm tên hoặc mã học sinh..."
          leftIcon={<Search className="w-4 h-4 text-app-muted" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap',
              filterStatus === 'ALL'
                ? 'bg-app-primary text-white shadow-xs'
                : 'bg-app-surface border border-app text-app-muted hover:bg-app-surface-hover'
            )}
            onClick={() => setFilterStatus('ALL')}
          >
            Tất cả ({counts.all})
          </button>
          <button
            type="button"
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap',
              filterStatus === 'NOT_STARTED'
                ? 'bg-app-primary text-white shadow-xs'
                : 'bg-app-surface border border-app text-app-muted hover:bg-app-surface-hover'
            )}
            onClick={() => setFilterStatus('NOT_STARTED')}
          >
            Chưa nhập ({counts.notStarted})
          </button>
          <button
            type="button"
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap',
              filterStatus === 'DRAFT'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-app-surface border border-app text-app-muted hover:bg-app-surface-hover'
            )}
            onClick={() => setFilterStatus('DRAFT')}
          >
            Bản nháp ({counts.draft})
          </button>
          <button
            type="button"
            className={cn(
              'px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap',
              filterStatus === 'FINALIZED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-app-surface border border-app text-app-muted hover:bg-app-surface-hover'
            )}
            onClick={() => setFilterStatus('FINALIZED')}
          >
            Đã khóa ({counts.finalized})
          </button>
        </div>
      </div>

      {/* Roster List */}
      <div className="flex-1 overflow-y-auto divide-y divide-app/50 p-1.5 space-y-1">
        {filteredRoster.length === 0 ? (
          <div className="p-8 text-center text-xs text-app-muted space-y-1">
            <p className="font-semibold text-app-main">Không tìm thấy học sinh</p>
            <p>Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
          </div>
        ) : (
          filteredRoster.map((item, idx) => {
            const isSelected = item.student.id === selectedStudentId;

            return (
              <button
                key={item.student.id}
                type="button"
                className={cn(
                  'w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 group',
                  isSelected
                    ? 'bg-app-primary/10 border-2 border-app-primary text-app-main shadow-xs'
                    : 'hover:bg-app-surface-hover border border-transparent text-app-main'
                )}
                onClick={() => onSelectStudent(item.student.id)}
              >
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs text-app-muted font-bold w-5 shrink-0 text-center">
                    {item.rollNumber || idx + 1}
                  </span>

                  <StudentAvatar student={item.student} size="sm" shape="circle" className="shrink-0" />

                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate group-hover:text-app-primary transition-colors">
                      {item.student.fullName}
                    </p>
                    <p className="text-[10px] text-app-muted font-mono truncate">
                      {item.student.studentCode} • {item.student.gender}
                    </p>
                  </div>
                </div>

                {/* Right: Status Badge & Indicators */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {item.status === 'FINALIZED' ? (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
                      <CheckCircle className="w-3 h-3 mr-0.5 inline" /> Đã khóa
                    </Badge>
                  ) : item.status === 'DRAFT' || item.status === 'READY_FOR_REVIEW' ? (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
                      <Clock className="w-3 h-3 mr-0.5 inline" /> Nháp {item.completionPercent}%
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5">
                      Chưa nhập
                    </Badge>
                  )}

                  {/* Warning / Error Indicator */}
                  <div className="flex items-center gap-1">
                    {item.hasErrors && (
                      <span title="Có lỗi chặn" className="text-rose-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {item.hasWarnings && !item.hasErrors && (
                      <span title="Có cảnh báo sư phạm" className="text-amber-500">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
