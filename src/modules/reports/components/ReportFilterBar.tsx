import React from 'react';
import { Card } from '../../../shared/components/Card';
import { Select } from '../../../shared/components/Select';
import type { ClassRoom, AcademicYear, Term, Student } from '../../../core/database/types';
import type { ReportFilterParams } from '../../../core/services/report-aggregation.service';
import { getTodayDateString } from '../../../shared/utilities/date';
import { Calendar } from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface ReportFilterBarProps {
  filter: ReportFilterParams;
  onFilterChange: (newFilter: ReportFilterParams) => void;
  classList: ClassRoom[];
  academicYears: AcademicYear[];
  terms: Term[];
  studentsList: Student[];
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filter,
  onFilterChange,
  classList,
  academicYears,
  terms,
  studentsList,
}) => {
  const handleQuickPeriod = (periodType: ReportFilterParams['periodType']) => {
    const today = new Date();
    const todayStr = getTodayDateString(today);
    let startStr = todayStr;
    let endStr = todayStr;

    if (periodType === 'today') {
      startStr = todayStr;
      endStr = todayStr;
    } else if (periodType === 'last_7_days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      startStr = getTodayDateString(d);
      endStr = todayStr;
    } else if (periodType === 'this_week') {
      const day = today.getDay(); // 0 = Sun, 1 = Mon ...
      const diffToMon = day === 0 ? -6 : 1 - day;
      const mon = new Date(today);
      mon.setDate(today.getDate() + diffToMon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      startStr = getTodayDateString(mon);
      endStr = getTodayDateString(sun);
    } else if (periodType === 'this_month') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      startStr = getTodayDateString(firstDay);
      endStr = getTodayDateString(lastDay);
    } else if (periodType === 'this_term') {
      const currentYear = academicYears.find((y) => y.id === filter.academicYearId);
      if (currentYear) {
        startStr = currentYear.startDate;
        endStr = currentYear.endDate;
      }
    } else if (periodType === 'this_year') {
      const currentYear = academicYears.find((y) => y.id === filter.academicYearId);
      if (currentYear) {
        startStr = currentYear.startDate;
        endStr = currentYear.endDate;
      }
    }

    onFilterChange({
      ...filter,
      periodType,
      startDate: startStr,
      endDate: endStr,
    });
  };

  return (
    <Card className="p-4 sm:p-5 space-y-4 border-app shadow-xs">
      {/* ROW 1: SCOPE SELECTORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          label="Năm học"
          value={filter.academicYearId}
          onChange={(e) => onFilterChange({ ...filter, academicYearId: e.target.value })}
          options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
        />

        <Select
          label="Học kỳ"
          value={filter.termId || ''}
          onChange={(e) => onFilterChange({ ...filter, termId: e.target.value || null })}
          options={[
            { value: '', label: 'Tất cả học kỳ' },
            ...terms.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />

        <Select
          label="Lớp học"
          value={filter.classId}
          onChange={(e) => onFilterChange({ ...filter, classId: e.target.value, studentId: undefined })}
          options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
        />

        <Select
          label="Học sinh (Tùy chọn)"
          value={filter.studentId || ''}
          onChange={(e) => onFilterChange({ ...filter, studentId: e.target.value || undefined })}
          options={[
            { value: '', label: 'Toàn bộ lớp' },
            ...studentsList.map((s) => ({ value: s.id, label: s.fullName })),
          ]}
        />
      </div>

      {/* ROW 2: PERIOD QUICK SELECT & DATES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-app">
        {/* QUICK BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-app-muted flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-app-primary" /> Khoảng thời gian:
          </span>
          {[
            { key: 'today', label: 'Hôm nay' },
            { key: 'last_7_days', label: '7 ngày qua' },
            { key: 'this_week', label: 'Tuần này' },
            { key: 'this_month', label: 'Tháng này' },
            { key: 'this_term', label: 'Học kỳ' },
            { key: 'this_year', label: 'Cả năm' },
            { key: 'custom', label: 'Tùy chọn' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleQuickPeriod(item.key as ReportFilterParams['periodType'])}
              className={cn(
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all',
                filter.periodType === item.key
                  ? 'bg-app-primary text-app-primary-fg shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-app-muted hover:text-app-main hover:bg-slate-200'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* DATE PICKERS & COMPARE TOGGLE */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  periodType: 'custom',
                  startDate: e.target.value,
                })
              }
              className="p-1.5 rounded-lg border border-app bg-app-surface text-xs font-mono font-bold"
            />
            <span className="text-app-muted">đến</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  periodType: 'custom',
                  endDate: e.target.value,
                })
              }
              className="p-1.5 rounded-lg border border-app bg-app-surface text-xs font-mono font-bold"
            />
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-app-main pl-2 border-l border-app">
            <input
              type="checkbox"
              checked={filter.comparePreviousPeriod ?? true}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  comparePreviousPeriod: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-app-primary"
            />
            <span>So sánh kỳ trước</span>
          </label>
        </div>
      </div>
    </Card>
  );
};
