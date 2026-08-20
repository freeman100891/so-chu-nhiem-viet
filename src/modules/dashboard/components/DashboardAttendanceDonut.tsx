import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '../../../shared/components/Card';
import type { DashboardAttendanceDonutItem } from '../../../core/services/dashboard-overview.service';
import { PieChart as PieChartIcon, Table, Info } from 'lucide-react';

export interface DashboardAttendanceDonutProps {
  total: number;
  data: DashboardAttendanceDonutItem[];
  loading?: boolean;
}

export const DashboardAttendanceDonut: React.FC<DashboardAttendanceDonutProps> = ({
  total,
  data,
  loading = false,
}) => {
  const [showTableView, setShowTableView] = useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hasData = total > 0 && data.some((d) => d.count > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as DashboardAttendanceDonutItem;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <p className="font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.colorHex }} />
            {item.name}
          </p>
          <p className="text-slate-300">
            <strong className="text-white text-sm font-mono">{item.count}</strong> học sinh ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Chuyên Cần Hôm Nay"
      action={
        <button
          onClick={() => setShowTableView(!showTableView)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={showTableView ? 'Xem biểu đồ Donut' : 'Xem dữ liệu dạng bảng'}
        >
          {showTableView ? <PieChartIcon className="w-4 h-4" /> : <Table className="w-4 h-4" />}
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-app-muted">
          Tỷ lệ học sinh có mặt, vắng và đi muộn trong ngày hôm nay.
        </p>

        {loading ? (
          <div className="h-56 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-32 h-32 rounded-full border-8 border-slate-200 dark:border-slate-800 border-t-emerald-500 animate-spin" />
            <span className="text-xs text-app-muted font-bold">Đang tải biểu đồ chuyên cần...</span>
          </div>
        ) : !hasData ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-app-muted space-y-1.5">
            <Info className="w-7 h-7 opacity-40 mx-auto" />
            <p className="text-xs font-bold">Chưa có dữ liệu điểm danh hôm nay.</p>
          </div>
        ) : showTableView ? (
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-xs text-left" aria-label="Bảng chi tiết chuyên cần hôm nay">
              <thead>
                <tr className="border-b border-app text-app-muted font-bold">
                  <th className="py-2">Trạng thái</th>
                  <th className="py-2 text-right">Số HS</th>
                  <th className="py-2 text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {data.map((item) => (
                  <tr key={item.name} className="hover:bg-app-primary-light/10">
                    <td className="py-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                      <span className="font-semibold text-app-main">{item.name}</span>
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-app-main">{item.count}</td>
                    <td className="py-2 text-right font-mono text-app-muted">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={renderCustomTooltip} />
                  <Pie
                    data={data.filter((d) => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={450}
                  >
                    {data
                      .filter((d) => d.count > 0)
                      .map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={entry.colorHex}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          className="transition-all hover:opacity-90"
                        />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* CENTER DISPLAY: TOTAL STUDENTS */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-2xl font-black text-app-main font-mono leading-none">
                  {total}
                </span>
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-0.5">
                  Sĩ số
                </span>
              </div>
            </div>

            {/* LEGEND GRID */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-app">
              {data.map((item) => (
                <div
                  key={item.name}
                  className="p-1.5 rounded-lg text-xs flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                    <span className="font-bold text-app-main truncate text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-app-main text-[11px] ml-1 shrink-0">
                    {item.count} <span className="text-[10px] text-app-muted font-normal">({item.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
