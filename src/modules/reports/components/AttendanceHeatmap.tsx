import React from 'react';
import { ChartCard } from './ChartCard';
import type { AttendanceHeatmapDay } from '../../../core/services/report-aggregation.service';
import { Calendar } from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface AttendanceHeatmapProps {
  days: AttendanceHeatmapDay[];
  onSelectDay?: (date: string) => void;
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  days,
  onSelectDay,
}) => {
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Table data
  const tableHeaders = ['Ngày', 'Thứ', 'Trạng thái', 'Tỷ lệ chuyên cần'];
  const tableRows = days.map((d) => [
    d.date,
    dayNames[d.dayOfWeek] || '',
    d.status === 'excellent'
      ? 'Xuất sắc (>=95%)'
      : d.status === 'good'
      ? 'Tốt (85-94%)'
      : d.status === 'warning'
      ? 'Cần chú ý (<85%)'
      : 'Không có buổi học',
    d.rate !== null ? `${d.rate}%` : '—',
  ]);

  return (
    <ChartCard
      title="Lịch Nhiệt Chuyên Cần"
      subtitle="Tổng quan chất lượng chuyên cần theo từng ngày học"
      icon={<Calendar className="w-5 h-5 text-blue-600" />}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      exportFilename="lich-nhiet-chuyencan"
    >
      <div className="space-y-4 pt-2">
        {/* HEATMAP GRID */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {dayNames.map((name, i) => (
            <div key={i} className="font-bold text-app-muted py-1">
              {name}
            </div>
          ))}

          {/* Padding for first day of week */}
          {days.length > 0 &&
            Array.from({ length: days[0]!.dayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} className="h-14 rounded-2xl bg-transparent" />
            ))}

          {days.map((d) => {
            const isExcellent = d.status === 'excellent';
            const isGood = d.status === 'good';
            const isWarning = d.status === 'warning';
            const isNoSession = d.status === 'no_session';

            return (
              <div
                key={d.date}
                onClick={() => !isNoSession && onSelectDay && onSelectDay(d.date)}
                className={cn(
                  'h-14 rounded-2xl p-1.5 flex flex-col justify-between transition-all border select-none',
                  !isNoSession ? 'cursor-pointer hover:scale-105 shadow-2xs' : 'opacity-40 border-dashed',
                  isExcellent && 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200',
                  isGood && 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300',
                  isWarning && 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200',
                  isNoSession && 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400'
                )}
                title={`${d.date}: ${d.rate !== null ? `Chuyên cần ${d.rate}%` : 'Không có buổi học'}`}
              >
                <span className="text-[11px] font-bold self-start">{d.dayOfMonth}</span>
                <span className="text-[10px] font-mono font-bold truncate">
                  {d.rate !== null ? `${d.rate}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-app-muted pt-2 border-t border-app">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-300 border border-emerald-400" />
            <span>Xuất sắc (≥ 95%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-200" />
            <span>Tốt (85% - 94%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-200 border border-amber-300" />
            <span>Cần chú ý (&lt; 85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-100 border border-dashed border-slate-300" />
            <span>Không có buổi học</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
};
