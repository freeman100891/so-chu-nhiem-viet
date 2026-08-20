/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useReports } from './ReportsContext';
import { Card } from '../../shared/components/Card';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { ChartCard } from './components/ChartCard';
import {
  reportComparisonService,
  type ClassComparisonResult,
} from '../../core/services/report-comparison.service';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { GitCompare, CalendarCheck, Award, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '../../shared/utilities/cn';

export const ClassComparisonPage: React.FC = () => {
  const { classList, filter } = useReports();
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ClassComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (classList.length >= 2 && selectedClassIds.length === 0) {
      setSelectedClassIds(classList.slice(0, 3).map((c) => c.id));
    }
  }, [classList, selectedClassIds.length]);

  useEffect(() => {
    const runComparison = async () => {
      if (selectedClassIds.length < 2) return;
      setLoading(true);
      try {
        const res = await reportComparisonService.compareClasses(
          selectedClassIds,
          filter.academicYearId,
          filter.startDate,
          filter.endDate,
          filter.termId
        );
        setComparisonResult(res);
      } catch (err) {
        console.error('Error comparing classes:', err);
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, [selectedClassIds, filter]);

  const toggleClassSelection = (clsId: string) => {
    if (selectedClassIds.includes(clsId)) {
      if (selectedClassIds.length > 2) {
        setSelectedClassIds(selectedClassIds.filter((id) => id !== clsId));
      }
    } else {
      if (selectedClassIds.length < 3) {
        setSelectedClassIds([...selectedClassIds, clsId]);
      }
    }
  };

  if (classList.length < 2) {
    return (
      <Card className="p-8 text-center bg-app-surface border border-dashed border-app">
        <GitCompare className="w-10 h-10 text-app-muted mx-auto mb-2" />
        <h3 className="text-sm font-bold text-app-main">Cần ít nhất 2 lớp để thực hiện so sánh</h3>
        <p className="text-xs text-app-muted mt-1 max-w-sm mx-auto">
          Tính năng so sánh đối chiếu tự động kích hoạt khi giáo viên có từ 2 lớp học trở lên trong năm học.
        </p>
      </Card>
    );
  }

  const barColors = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CLASS SELECTOR BAR */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-app-primary" />
            <div>
              <h3 className="text-sm font-black text-app-main">Chọn Lớp So Sánh (Tối đa 3 lớp)</h3>
              <p className="text-xs text-app-muted">Chọn các lớp để đối chiếu các chỉ số rèn luyện và thi đua</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {classList.map((c, idx) => {
              const isSelected = selectedClassIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleClassSelection(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5',
                    isSelected
                      ? 'bg-app-primary text-app-primary-fg border-app-primary shadow-xs'
                      : 'bg-app-surface border-app text-app-muted hover:text-app-main'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : barColors[idx % 3] }}
                  />
                  Lớp {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* COMPARISON RESULTS */}
      {loading && !comparisonResult ? (
        <div className="space-y-4">
          <LoadingSkeleton type="card" count={2} />
        </div>
      ) : comparisonResult ? (
        <div className="space-y-6">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonResult.classes.map((cls, idx) => (
              <div
                key={cls.classId}
                className="p-5 rounded-3xl bg-app-surface border border-app shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: barColors[idx % 3] }}
                    />
                    <h4 className="text-base font-black text-app-main">{cls.className}</h4>
                  </div>
                  <span className="text-xs font-bold text-app-muted">{cls.totalStudents} học sinh</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-app">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-app-muted block font-bold">Chuyên cần</span>
                    <strong className="text-emerald-600 font-mono text-sm">{cls.attendanceRate}%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-app-muted block font-bold">Điểm ròng TB/HS</span>
                    <strong className="text-blue-600 font-mono text-sm">+{cls.averageNetPerStudent} đ</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-app-muted block font-bold">Lượt thăng cấp</span>
                    <strong className="text-purple-600 font-mono text-sm">{cls.promotedStudentsCount}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-app-muted block font-bold">Danh hiệu trao</span>
                    <strong className="text-amber-600 font-mono text-sm">{cls.honorsCount}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* INDEPENDENT COMPARISON CHARTS (DO NOT MIX DIFFERENT UNITS ON SAME AXIS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. ATTENDANCE COMPARISON */}
            <ChartCard
              title="So Sánh Tỷ Lệ Chuyên Cần (%)"
              icon={<CalendarCheck className="w-5 h-5 text-emerald-600" />}
              tableHeaders={['Lớp', 'Tỷ lệ chuyên cần (%)']}
              tableRows={comparisonResult.classes.map((c) => [c.className, `${c.attendanceRate}%`])}
            >
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonResult.classes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="className" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="%" />
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Chuyên cần']} />
                    <Bar dataKey="attendanceRate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {comparisonResult.classes.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={barColors[i % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* 2. AVERAGE NET POINTS PER STUDENT */}
            <ChartCard
              title="Điểm Thi Đua Ròng Trung Bình / Học Sinh"
              icon={<Award className="w-5 h-5 text-blue-600" />}
              tableHeaders={['Lớp', 'Điểm ròng TB / HS']}
              tableRows={comparisonResult.classes.map((c) => [c.className, `${c.averageNetPerStudent} đ`])}
            >
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonResult.classes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="className" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" đ" />
                    <Tooltip formatter={(val: any) => [`${val} điểm/em`, 'Điểm TB']} />
                    <Bar dataKey="averageNetPerStudent" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {comparisonResult.classes.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={barColors[i % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* 3. ENGAGEMENT RATE */}
            <ChartCard
              title="Tỷ Lệ Tương Tác Phát Biểu (%)"
              icon={<MessageSquare className="w-5 h-5 text-pink-600" />}
              tableHeaders={['Lớp', 'Tỷ lệ tương tác (%)']}
              tableRows={comparisonResult.classes.map((c) => [c.className, `${c.engagementRate}%`])}
            >
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonResult.classes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="className" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="%" />
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Tương tác']} />
                    <Bar dataKey="engagementRate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {comparisonResult.classes.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={barColors[i % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* 4. PROMOTIONS & HONORS */}
            <ChartCard
              title="Số Lượt Thăng Cấp & Danh Hiệu Đạt Được"
              icon={<Sparkles className="w-5 h-5 text-purple-600" />}
              tableHeaders={['Lớp', 'Lượt thăng cấp', 'Danh hiệu']}
              tableRows={comparisonResult.classes.map((c) => [c.className, c.promotedStudentsCount, c.honorsCount])}
            >
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonResult.classes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis dataKey="className" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" lượt" />
                    <Tooltip />
                    <Bar dataKey="promotedStudentsCount" name="Lượt thăng cấp" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="honorsCount" name="Danh hiệu trao" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      ) : null}
    </div>
  );
};
