import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from './ChartCard';
import type { PointTrendDataPoint } from '../../../core/services/report-aggregation.service';
import { TrendingUp } from 'lucide-react';

export interface PointTrendReportChartProps {
  data: PointTrendDataPoint[];
}

export const PointTrendReportChart: React.FC<PointTrendReportChartProps> = ({
  data,
}) => {
  const [visibleSeries, setVisibleSeries] = useState({
    merit: true,
    demerit: true,
    net: true,
  });

  const tableHeaders = ['Thời gian', 'Điểm cộng (+)', 'Điểm trừ (-)', 'Điểm ròng'];
  const tableRows = data.map((d) => [d.label, `+${d.merit}`, `-${d.demerit}`, d.net >= 0 ? `+${d.net}` : d.net]);

  if (data.length === 0) {
    return (
      <ChartCard title="Biến Động Điểm Thi Đua" icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}>
        <div className="py-12 text-center text-xs text-app-muted">
          Chưa có giao dịch điểm thi đua nào trong khoảng thời gian này.
        </div>
      </ChartCard>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as PointTrendDataPoint;
      return (
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <p className="font-extrabold text-amber-400">{item.label}</p>
          <div className="space-y-0.5 text-slate-300">
            <p className="flex justify-between gap-4">
              <span className="text-emerald-400">Điểm cộng (+):</span>
              <strong className="font-mono text-white">+{item.merit}</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-red-400">Điểm trừ (-):</span>
              <strong className="font-mono text-white">-{item.demerit}</strong>
            </p>
            <p className="flex justify-between gap-4 pt-1 border-t border-slate-700 font-bold">
              <span>Điểm ròng:</span>
              <span className={item.net >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                {item.net >= 0 ? `+${item.net}` : item.net} đ
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="Biến Động Điểm Thi Đua & Điểm Ròng"
      subtitle="So sánh tương quan điểm cộng tích cực, điểm trừ và xu hướng điểm ròng"
      icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      exportFilename="biendong-diemthidua"
    >
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" đ" />
            <Tooltip content={renderTooltip} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              onClick={(e) => {
                const key = e.dataKey as keyof typeof visibleSeries;
                if (key) setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
              }}
            />

            {visibleSeries.merit && (
              <Bar name="Điểm cộng (+)" dataKey="merit" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
            )}
            {visibleSeries.demerit && (
              <Bar name="Điểm trừ (-)" dataKey="demerit" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={32} />
            )}
            {visibleSeries.net && (
              <Line
                type="monotone"
                name="Điểm ròng"
                dataKey="net"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
