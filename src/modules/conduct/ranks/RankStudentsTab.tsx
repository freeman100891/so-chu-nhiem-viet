import React, { useState, useMemo } from 'react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { Modal } from '../../../shared/components/Modal';
import { Badge } from '../../../shared/components/Badge';
import { EmulationRankBadge } from '../../../shared/components/EmulationRankBadge';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import type { RankLevel, ClassRoom, StudentRankHistory } from '../../../core/database/types';
import type { StudentWithRankItem } from './RankOverviewTab';
import { normalizeVietnameseText } from '../../../shared/utilities/normalize';
import { formatDateTimeVietnamese } from '../../../shared/utilities/date';
import {
  Search,
  Zap,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  User,
  History,
} from 'lucide-react';

export interface RankStudentsTabProps {
  studentsWithRank: StudentWithRankItem[];
  rankLevels: RankLevel[];
  classList: ClassRoom[];
  studentHistoriesMap: Map<string, StudentRankHistory[]>;
  initialSelectedStudentId?: string | null;
  initialGroupFilter?: string;
  initialLevelFilter?: string;
  initialQuickFilter?: 'all' | 'near_promo' | 'recent_promo';
  onClearInitialStudent?: () => void;
}

export const RankStudentsTab: React.FC<RankStudentsTabProps> = ({
  studentsWithRank,
  rankLevels,
  classList,
  studentHistoriesMap,
  initialSelectedStudentId,
  initialGroupFilter,
  initialLevelFilter,
  initialQuickFilter,
  onClearInitialStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState(initialGroupFilter || 'all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState(initialLevelFilter || 'all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'near_promo' | 'recent_promo'>(initialQuickFilter || 'all');

  const [sortOption, setSortOption] = useState<'points_desc' | 'points_asc' | 'progress_desc' | 'name_asc' | 'promoted_desc'>('points_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Detail Modal
  const [activeStudentDetail, setActiveStudentDetail] = useState<StudentWithRankItem | null>(null);

  // Sync initial filter props
  React.useEffect(() => {
    if (initialGroupFilter) setSelectedGroupFilter(initialGroupFilter);
  }, [initialGroupFilter]);

  React.useEffect(() => {
    if (initialLevelFilter) setSelectedLevelFilter(initialLevelFilter);
  }, [initialLevelFilter]);

  React.useEffect(() => {
    if (initialQuickFilter) setQuickFilter(initialQuickFilter);
  }, [initialQuickFilter]);

  // Set initial selected student if navigated from Overview
  React.useEffect(() => {
    if (initialSelectedStudentId) {
      const found = studentsWithRank.find((s) => s.student.id === initialSelectedStudentId);
      if (found) {
        setActiveStudentDetail(found);
      }
      if (onClearInitialStudent) onClearInitialStudent();
    }
  }, [initialSelectedStudentId, studentsWithRank, onClearInitialStudent]);

  // Filtering Logic
  const filteredStudents = useMemo(() => {
    const q = normalizeVietnameseText(searchQuery);

    return studentsWithRank.filter((item) => {
      // Search
      if (q) {
        const nameMatch = item.student.normalizedName.includes(q);
        const codeMatch = item.student.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
        if (!nameMatch && !codeMatch) return false;
      }

      // Class Filter
      if (selectedClassFilter !== 'all') {
        const foundClass = classList.find((c) => c.id === selectedClassFilter);
        if (foundClass && item.className !== `Lớp ${foundClass.name}` && item.className !== foundClass.name) {
          return false;
        }
      }

      // Group Filter
      if (selectedGroupFilter !== 'all' && item.rankInfo.currentRank.group !== selectedGroupFilter) {
        return false;
      }

      // Specific Level Filter
      if (selectedLevelFilter !== 'all' && item.rankInfo.currentLevel !== parseInt(selectedLevelFilter)) {
        return false;
      }

      // Quick Filters
      if (quickFilter === 'near_promo') {
        if (item.rankInfo.isHighestRank || (item.rankInfo.progressPercent < 65 && item.rankInfo.pointsToNextRank > 20)) {
          return false;
        }
      }

      if (quickFilter === 'recent_promo') {
        if (!item.lastPromotedAt) return false;
      }

      return true;
    });
  }, [studentsWithRank, searchQuery, selectedClassFilter, selectedGroupFilter, selectedLevelFilter, quickFilter, classList]);

  // Sorting Logic
  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];

    list.sort((a, b) => {
      if (sortOption === 'points_desc') {
        return b.rankInfo.effectivePoints - a.rankInfo.effectivePoints;
      }
      if (sortOption === 'points_asc') {
        return a.rankInfo.effectivePoints - b.rankInfo.effectivePoints;
      }
      if (sortOption === 'progress_desc') {
        return b.rankInfo.progressPercent - a.rankInfo.progressPercent;
      }
      if (sortOption === 'name_asc') {
        return a.student.fullName.localeCompare(b.student.fullName, 'vi');
      }
      if (sortOption === 'promoted_desc') {
        const timeA = a.lastPromotedAt ? new Date(a.lastPromotedAt).getTime() : 0;
        const timeB = b.lastPromotedAt ? new Date(b.lastPromotedAt).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [filteredStudents, sortOption]);

  // Paginated Results
  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

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
              placeholder="Tìm theo họ tên hoặc mã học sinh..."
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

          {/* GROUP SELECTOR */}
          <div className="w-full md:w-48">
            <Select
              value={selectedGroupFilter}
              onChange={(e) => {
                setSelectedGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'Tất cả nhóm cấp' },
                { value: 'Hạ sĩ quan và Binh sĩ', label: 'Hạ sĩ quan & Binh sĩ' },
                { value: 'Cấp Úy', label: 'Cấp Úy (Cấp 6–9)' },
                { value: 'Cấp Tá', label: 'Cấp Tá (Cấp 10–13)' },
                { value: 'Cấp Tướng', label: 'Cấp Tướng (Cấp 14–17)' },
              ]}
              className="text-xs"
            />
          </div>

          {/* SPECIFIC LEVEL SELECTOR */}
          <div className="w-full md:w-44">
            <Select
              value={selectedLevelFilter}
              onChange={(e) => {
                setSelectedLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'Tất cả 17 cấp' },
                ...rankLevels.map((r) => ({ value: String(r.level), label: `Cấp ${r.level}: ${r.name}` })),
              ]}
              className="text-xs"
            />
          </div>

          {/* SORT SELECTOR */}
          <div className="w-full md:w-48">
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as 'points_desc' | 'points_asc' | 'progress_desc' | 'name_asc' | 'promoted_desc')}
              options={[
                { value: 'points_desc', label: 'Điểm cao nhất' },
                { value: 'points_asc', label: 'Điểm thấp nhất' },
                { value: 'progress_desc', label: 'Gần thăng cấp nhất' },
                { value: 'name_asc', label: 'Tên A - Z' },
                { value: 'promoted_desc', label: 'Mới thăng cấp nhất' },
              ]}
              className="text-xs"
            />
          </div>
        </div>

        {/* QUICK FILTER TAGS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Lọc nhanh:</span>
            <button
              type="button"
              onClick={() => {
                setQuickFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full font-bold border transition-all ${
                quickFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả ({studentsWithRank.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickFilter('near_promo');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full font-bold border transition-all flex items-center gap-1 ${
                quickFilter === 'near_promo'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Gần thăng cấp (≥65%)
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickFilter('recent_promo');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full font-bold border transition-all flex items-center gap-1 ${
                quickFilter === 'recent_promo'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Vừa thăng cấp
            </button>
          </div>

          <span className="text-slate-500 font-semibold text-xs">
            Hiển thị <strong className="text-slate-800">{sortedStudents.length}</strong> học sinh
          </span>
        </div>
      </Card>

      {/* STUDENT TABLE / LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {paginatedStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Học sinh</th>
                  <th className="py-3.5 px-4">Lớp</th>
                  <th className="py-3.5 px-4 text-center">Điểm Thi Đua</th>
                  <th className="py-3.5 px-4">Cấp Bậc Hiện Tại</th>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4 w-44">Tiến độ Thăng cấp</th>
                  <th className="py-3.5 px-4">Cần thêm</th>
                  <th className="py-3.5 px-4 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((item) => (
                  <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                    {/* AVATAR & NAME */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <StudentAvatar
                          student={item.student}
                          size="sm"
                          className="border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-extrabold text-slate-800">{item.student.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{item.student.studentCode}</p>
                        </div>
                      </div>
                    </td>

                    {/* CLASS */}
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {item.className}
                    </td>

                    {/* POINTS */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-extrabold text-sm text-blue-700">
                        {item.rankInfo.effectivePoints}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-0.5">đ</span>
                    </td>

                    {/* CURRENT RANK BADGE */}
                    <td className="py-3 px-4">
                      <EmulationRankBadge rank={item.rankInfo.currentRank} size="sm" showPoints={false} />
                    </td>

                    {/* LEVEL FRACTION */}
                    <td className="py-3 px-4 font-bold text-slate-600 font-mono">
                      {item.rankInfo.currentLevel}/17
                    </td>

                    {/* PROGRESS BAR */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">{item.rankInfo.progressPercent}%</span>
                          {item.rankInfo.nextRank && (
                            <span className="text-slate-400">➔ {item.rankInfo.nextRank.name}</span>
                          )}
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.rankInfo.isHighestRank
                                ? 'bg-amber-500'
                                : item.rankInfo.progressPercent >= 75
                                ? 'bg-emerald-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${item.rankInfo.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* POINTS TO NEXT */}
                    <td className="py-3 px-4">
                      {item.rankInfo.isHighestRank ? (
                        <Badge variant="warning" className="text-[10px] font-bold">
                          Đỉnh cao
                        </Badge>
                      ) : (
                        <span className="font-semibold text-slate-600">
                          +{item.rankInfo.pointsToNextRank}đ
                        </span>
                      )}
                    </td>

                    {/* DETAIL BUTTON */}
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="secondary"
                        onClick={() => setActiveStudentDetail(item)}
                        className="p-1.5 h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        title="Xem chi tiết cấp bậc và lịch sử"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <User className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">Không tìm thấy học sinh phù hợp bộ lọc</h4>
            <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các điều kiện lọc.</p>
          </div>
        )}

        {/* PAGINATION BAR */}
        {sortedStudents.length > pageSize && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Trang {currentPage} / {totalPages} (Tổng {sortedStudents.length} học sinh)
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

      {/* STUDENT DETAIL MODAL */}
      <Modal
        isOpen={!!activeStudentDetail}
        onClose={() => setActiveStudentDetail(null)}
        title="Thông Tin Cấp Bậc & Lịch Sử Thi Đua"
      >
        {activeStudentDetail && (
          <div className="space-y-5 py-2">
            {/* STUDENT HEADER */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <StudentAvatar
                student={activeStudentDetail.student}
                size="xl"
                className="border-2 border-blue-400 shadow-xs shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-800 truncate">{activeStudentDetail.student.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono">Mã HS: {activeStudentDetail.student.studentCode} • {activeStudentDetail.className}</p>
                <div className="mt-2 flex items-center gap-2">
                  <EmulationRankBadge rank={activeStudentDetail.rankInfo.currentRank} size="sm" showPoints={false} />
                  <span className="text-xs font-bold text-slate-600 font-mono">Level {activeStudentDetail.rankInfo.currentLevel}/17</span>
                </div>
              </div>
            </div>

            {/* PROGRESS STATUS */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-blue-900">Tiến độ tới cấp bậc tiếp theo:</span>
                <span className="text-blue-700 font-mono font-extrabold text-sm">{activeStudentDetail.rankInfo.progressPercent}%</span>
              </div>
              <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${activeStudentDetail.rankInfo.progressPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Tổng điểm hợp lệ: <strong className="text-slate-800">{activeStudentDetail.rankInfo.effectivePoints}đ</strong></span>
                {activeStudentDetail.rankInfo.nextRank ? (
                  <span>Còn thiếu <strong className="text-blue-700">{activeStudentDetail.rankInfo.pointsToNextRank}đ</strong> để đạt <strong className="text-blue-900">{activeStudentDetail.rankInfo.nextRank.name}</strong></span>
                ) : (
                  <span className="text-amber-700 font-bold">Đã đạt danh hiệu cao nhất!</span>
                )}
              </div>
            </div>

            {/* STUDENT PROMOTION HISTORY */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" /> Nhật ký thay đổi cấp bậc ({studentHistoriesMap.get(activeStudentDetail.student.id)?.length || 0}):
              </h4>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {(studentHistoriesMap.get(activeStudentDetail.student.id) || []).length > 0 ? (
                  (studentHistoriesMap.get(activeStudentDetail.student.id) || []).map((h) => {
                    const fromRank = rankLevels.find((l) => l.level === h.fromLevel);
                    const toRank = rankLevels.find((l) => l.level === h.toLevel);
                    return (
                      <div key={h.id} className="p-2.5 space-y-1 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold">
                            {h.changeType === 'promotion' ? (
                              <Badge variant="success" className="text-[10px]">Thăng cấp</Badge>
                            ) : h.changeType === 'demotion' ? (
                              <Badge variant="danger" className="text-[10px]">Hạ cấp</Badge>
                            ) : (
                              <Badge variant="info" className="text-[10px]">Tính lại</Badge>
                            )}
                            <span className="text-slate-700">{fromRank ? fromRank.name : `Cấp ${h.fromLevel || 1}`}</span>
                            <span>➔</span>
                            <span className="text-blue-700 font-extrabold">{toRank ? toRank.name : `Cấp ${h.toLevel}`}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{formatDateTimeVietnamese(h.createdAt)}</span>
                        </div>
                        {h.reason && <p className="text-[11px] text-slate-500">{h.reason}</p>}
                      </div>
                    );
                  })
                ) : (
                  <p className="p-4 text-center text-slate-400 text-xs italic">Chưa có lịch sử thăng/hạ cấp nào.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="primary" onClick={() => setActiveStudentDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
