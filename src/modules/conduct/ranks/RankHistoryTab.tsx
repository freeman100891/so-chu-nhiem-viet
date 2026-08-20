import React, { useState, useMemo } from 'react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { Badge } from '../../../shared/components/Badge';
import type { RankLevel, ClassRoom, StudentRankHistory } from '../../../core/database/types';
import { normalizeVietnameseText } from '../../../shared/utilities/normalize';
import { formatDateTimeVietnamese, getTodayDateString } from '../../../shared/utilities/date';
import {
  Search,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface EnrichedHistoryItem extends StudentRankHistory {
  studentName: string;
  studentCode: string;
  className: string;
}

export interface RankHistoryTabProps {
  historyList: EnrichedHistoryItem[];
  rankLevels: RankLevel[];
  classList: ClassRoom[];
}

export const RankHistoryTab: React.FC<RankHistoryTabProps> = ({
  historyList,
  rankLevels,
  classList,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'promotion' | 'demotion' | 'recalculated'>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter History Logic
  const filteredHistory = useMemo(() => {
    const q = normalizeVietnameseText(searchQuery);
    const today = getTodayDateString();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    return historyList.filter((item) => {
      // Search
      if (q) {
        const nameMatch = normalizeVietnameseText(item.studentName).includes(q);
        const codeMatch = item.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
        const reasonMatch = item.reason ? normalizeVietnameseText(item.reason).includes(q) : false;
        if (!nameMatch && !codeMatch && !reasonMatch) return false;
      }

      // Class Filter
      if (selectedClassFilter !== 'all') {
        const foundClass = classList.find((c) => c.id === selectedClassFilter);
        if (foundClass && item.className !== `Lớp ${foundClass.name}` && item.className !== foundClass.name) {
          return false;
        }
      }

      // Type Filter
      if (selectedTypeFilter !== 'all' && item.changeType !== selectedTypeFilter) {
        return false;
      }

      // Time Filter
      if (selectedTimeFilter === 'today') {
        if (!item.createdAt.startsWith(today)) return false;
      } else if (selectedTimeFilter === 'week') {
        if (item.createdAt < sevenDaysAgo) return false;
      } else if (selectedTimeFilter === 'month') {
        if (item.createdAt < thirtyDaysAgo) return false;
      }

      return true;
    });
  }, [historyList, searchQuery, selectedClassFilter, selectedTypeFilter, selectedTimeFilter, classList]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* FILTER & SEARCH CARD */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* SEARCH INPUT */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm theo học sinh, mã HS hoặc lý do..."
              className="pl-9 text-xs"
            />
          </div>

          {/* CLASS SELECTOR */}
          <div className="w-full md:w-48">
            <Select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'Tất cả lớp học' },
                ...classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
              ]}
              className="text-xs"
            />
          </div>

          {/* TYPE SELECTOR */}
          <div className="w-full md:w-48">
            <Select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value as 'all' | 'promotion' | 'demotion' | 'recalculated');
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'Tất cả loại thay đổi' },
                { value: 'promotion', label: '🚀 Thăng cấp' },
                { value: 'demotion', label: '🔻 Hạ cấp' },
                { value: 'recalculated', label: '⚙️ Tính lại toàn bộ' },
              ]}
              className="text-xs"
            />
          </div>

          {/* TIME SELECTOR */}
          <div className="w-full md:w-48">
            <Select
              value={selectedTimeFilter}
              onChange={(e) => {
                setSelectedTimeFilter(e.target.value as 'all' | 'today' | 'week' | 'month');
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'Tất cả thời gian' },
                { value: 'today', label: 'Hôm nay' },
                { value: 'week', label: '7 ngày qua' },
                { value: 'month', label: '30 ngày qua' },
              ]}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-semibold">
          <span>Tìm thấy <strong className="text-slate-800">{filteredHistory.length}</strong> sự kiện lịch sử</span>
          {filteredHistory.length !== historyList.length && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClassFilter('all');
                setSelectedTypeFilter('all');
                setSelectedTimeFilter('all');
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </Card>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {paginatedHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Học sinh</th>
                  <th className="py-3.5 px-4">Lớp</th>
                  <th className="py-3.5 px-4">Loại Thay Đổi</th>
                  <th className="py-3.5 px-4">Chuyển Cấp</th>
                  <th className="py-3.5 px-4">Điểm số</th>
                  <th className="py-3.5 px-4">Lý do & Nguồn ghi nhận</th>
                  <th className="py-3.5 px-4 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedHistory.map((item) => {
                  const fromRank = rankLevels.find((l) => l.level === item.fromLevel);
                  const toRank = rankLevels.find((l) => l.level === item.toLevel) || rankLevels[0]!;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* STUDENT */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {item.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800">{item.studentName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{item.studentCode}</p>
                          </div>
                        </div>
                      </td>

                      {/* CLASS */}
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {item.className}
                      </td>

                      {/* CHANGE TYPE BADGE */}
                      <td className="py-3 px-4">
                        {item.changeType === 'promotion' ? (
                          <Badge variant="success" className="text-[11px] font-extrabold flex items-center gap-1 w-fit">
                            <TrendingUp className="w-3.5 h-3.5" /> Thăng cấp
                          </Badge>
                        ) : item.changeType === 'demotion' ? (
                          <Badge variant="danger" className="text-[11px] font-extrabold flex items-center gap-1 w-fit">
                            <TrendingDown className="w-3.5 h-3.5" /> Hạ cấp
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-[11px] font-extrabold flex items-center gap-1 w-fit">
                            <RefreshCw className="w-3.5 h-3.5" /> Tính lại
                          </Badge>
                        )}
                      </td>

                      {/* LEVEL TRANSITION */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-bold">
                          {fromRank ? (
                            <span className="text-slate-500 font-normal">{fromRank.name} (Cấp {fromRank.level})</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Cấp {item.fromLevel || 1}</span>
                          )}
                          <span className="text-slate-400 font-bold">➔</span>
                          <span className="text-blue-700 font-extrabold">{toRank.name} (Cấp {toRank.level})</span>
                        </div>
                      </td>

                      {/* POINTS */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-700">{item.pointsAfter}đ</span>
                      </td>

                      {/* REASON */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {item.reason || <span className="text-slate-400 italic">Tự động tính lại</span>}
                      </td>

                      {/* TIME */}
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTimeVietnamese(item.createdAt)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">Chưa có bản ghi lịch sử phù hợp</h4>
            <p className="text-xs text-slate-400">Các sự kiện thăng/hạ cấp và tính lại điểm sẽ được tự động lưu vết tại đây.</p>
          </div>
        )}

        {/* PAGINATION */}
        {filteredHistory.length > pageSize && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Trang {currentPage} / {totalPages} (Tổng {filteredHistory.length} bản ghi)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </Button>
              <Button
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
