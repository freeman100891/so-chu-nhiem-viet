import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card } from '../../../shared/components/Card';
import type { DashboardPointTrendItem } from '../../../core/services/dashboard-overview.service';
import { TrendingUp, Table, Info } from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface DashboardPointTrendChartProps {
  data: DashboardPointTrendItem[];
  daysRange: number;
  onRangeChange: (days: number) => void;
  loading?: boolean;
}

export const DashboardPointTrendChart: React.FC<DashboardPointTrendChartProps> = ({
  data,
  daysRange,
  onRangeChange,
  loading = false,
}) => {
  const [showTableView, setShowTableView] = useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hasData = data.some((d) => d.meritPoints > 0 || d.demeritPoints > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as DashboardPointTrendItem;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <p className="font-extrabold text-amber-400">Ngày {item.label}</p>
          <div className="space-y-0.5 text-slate-300">
            <p className="flex items-center justify-between gap-3">
              <span className="text-emerald-400">Điểm cộng (+):</span>
              <strong className="font-mono text-white">+{item.meritPoints}</strong>
            </p>
            {item.demeritPoints > 0 && (
              <p className="flex items-center justify-between gap-3">
                <span className="text-red-400">Điểm trừ (-):</span>
                <strong className="font-mono text-white">-{item.demeritPoints}</strong>
              </p>
            )}
            <p className="flex items-center justify-between gap-3 pt-1 border-t border-slate-700 font-bold">
              <span>Thực nhận:</span>
              <span className={cn('font-mono', item.netPoints >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                {item.netPoints >= 0 ? `+${item.netPoints}` : item.netPoints}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Diễn Biến Thi Đua Học Đường"
      action={
        <div className="flex items-center gap-2">
          {/* RANGE TOGGLES */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold">
            <button
              onClick={() => onRangeChange(7)}
              className={cn(
                'px-2 py-0.5 rounded-md transition-all',
                daysRange === 7
                  ? 'bg-white dark:bg-slate-700 text-app-primary shadow-xs'
                  : 'text-app-muted hover:text-app-main'
              )}
            >
              7 ngày
            </button>
            <button
              onClick={() => onRangeChange(30)}
              className={cn(
                'px-2 py-0.5 rounded-md transition-all',
                daysRange === 30
                  ? 'bg-white dark:bg-slate-700 text-app-primary shadow-xs'
                  : 'text-app-muted hover:text-app-main'
              )}
            >
              30 ngày
            </button>
          </div>

          <button
            onClick={() => setShowTableView(!showTableView)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={showTableView ? 'Xem biểu đồ miền' : 'Xem dữ liệu dạng bảng'}
          >
            {showTableView ? <TrendingUp className="w-4 h-4" /> : <Table className="w-4 h-4" />}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-app-muted">
          Tổng điểm cộng và điểm trừ của lớp học theo từng ngày trong giai đoạn vừa qua.
        </p>

        {loading ? (
          <div className="h-56 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <span className="text-xs text-app-muted font-bold">Đang tải biểu đồ thi đua...</span>
          </div>
        ) : !hasData ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-app-muted space-y-1.5">
            <Info className="w-7 h-7 opacity-40 mx-auto" />
            <p className="text-xs font-bold">Chưa có lượt ghi nhận điểm nào trong {daysRange} ngày qua.</p>
          </div>
        ) : showTableView ? (
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-xs text-left" aria-label="Bảng chi tiết điểm thi đua theo ngày">
              <thead>
                <tr className="border-b border-app text-app-muted font-bold">
                  <th className="py-2">Ngày</th>
                  <th className="py-2 text-right">Điểm cộng (+)</th>
                  <th className="py-2 text-right">Điểm trừ (-)</th>
                  <th className="py-2 text-right">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app font-mono">
                {data.map((item) => (
                  <tr key={item.date} className="hover:bg-app-primary-light/10">
                    <td className="py-1.5 font-sans font-semibold text-app-main">{item.label}</td>
                    <td className="py-1.5 text-right font-bold text-emerald-600">+{item.meritPoints}</td>
                    <td className="py-1.5 text-right font-bold text-red-600">
                      {item.demeritPoints > 0 ? `-${item.demeritPoints}` : '0'}
                    </td>
                    <td className="py-1.5 text-right font-black text-app-main">
                      {item.netPoints >= 0 ? `+${item.netPoints}` : item.netPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardMeritGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dashboardDemeritGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={renderCustomTooltip} />
                <Area
                  type="monotone"
                  dataKey="meritPoints"
                  name="Điểm cộng"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashboardMeritGrad)"
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={450}
                />
                <Area
                  type="monotone"
                  dataKey="demeritPoints"
                  name="Điểm trừ"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#dashboardDemeritGrad)"
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={450}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};
