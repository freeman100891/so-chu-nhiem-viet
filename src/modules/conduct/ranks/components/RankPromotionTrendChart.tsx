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
import { Card } from '../../../../shared/components/Card';
import type { PromotionTrendData } from '../../../../core/services/rank-overview-analytics.service';
import { TrendingUp, Table, Sparkles, Trophy, Info } from 'lucide-react';

export interface RankPromotionTrendChartProps {
  data: PromotionTrendData[];
  totalPromotions: number;
  peakPeriodLabel?: string;
  loading?: boolean;
}

export const RankPromotionTrendChart: React.FC<RankPromotionTrendChartProps> = ({
  data,
  totalPromotions,
  peakPeriodLabel,
  loading = false,
}) => {
  const [showTableView, setShowTableView] = useState(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hasData = totalPromotions > 0 && data.length > 0;

  // Custom accessible Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as PromotionTrendData;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 max-w-[200px] z-50">
          <p className="font-extrabold text-amber-400">{item.label}</p>
          <p className="text-slate-300">
            <strong className="text-white text-sm font-mono">{item.promotionCount}</strong> lượt thăng cấp
          </p>
          <p className="text-[10px] text-slate-400">
            Khoảng thời gian: {item.startDate} đến {item.endDate}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Xu Hướng Thăng Cấp Thi Đua"
      action={
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowTableView(!showTableView)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title={showTableView ? 'Xem biểu đồ miền' : 'Xem dữ liệu dạng bảng'}
          >
            {showTableView ? <TrendingUp className="w-4 h-4" /> : <Table className="w-4 h-4" />}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* KPI SUMMARY HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Lượt Thăng Cấp</p>
              <p className="text-base font-black text-slate-800 font-mono">{totalPromotions} lượt</p>
            </div>
          </div>

          {peakPeriodLabel && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giai Đoạn Cao Điểm</p>
                <p className="text-xs font-black text-amber-800">{peakPeriodLabel}</p>
              </div>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="h-60 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-full h-40 bg-slate-100 rounded-xl" />
            <span className="text-xs text-slate-400 font-bold">Đang tải dữ liệu xu hướng...</span>
          </div>
        ) : !hasData ? (
          /* EMPTY STATE */
          <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
            <Info className="w-8 h-8 opacity-40 text-slate-500" />
            <p className="text-xs font-bold">Chưa có lượt thăng cấp nào được ghi nhận trong khoảng thời gian đã chọn.</p>
          </div>
        ) : showTableView ? (
          /* ACCESSIBLE TABLE VIEW */
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left" aria-label="Bảng xu hướng thăng cấp">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 font-bold">
                  <th className="py-2 px-3">Giai Đoạn</th>
                  <th className="py-2 px-3">Bắt Đầu</th>
                  <th className="py-2 px-3">Kết Thúc</th>
                  <th className="py-2 px-3 text-right">Lượt Thăng Cấp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.map((item) => (
                  <tr key={item.bucketKey} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-800">{item.label}</td>
                    <td className="py-2 px-3 text-slate-500">{item.startDate}</td>
                    <td className="py-2 px-3 text-slate-500">{item.endDate}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-blue-700">{item.promotionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* AREA CHART VIEW */
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="promoTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={renderCustomTooltip} />
                <Area
                  type="monotone"
                  dataKey="promotionCount"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#promoTrendGradient)"
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
