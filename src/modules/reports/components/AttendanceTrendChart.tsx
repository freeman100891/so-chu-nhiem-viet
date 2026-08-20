/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard } from './ChartCard';
import type { AttendanceTrendDataPoint } from '../../../core/services/report-aggregation.service';
import { CalendarCheck } from 'lucide-react';

export interface AttendanceTrendChartProps {
  data: AttendanceTrendDataPoint[];
  onSelectDate?: (date: string) => void;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  data,
  onSelectDate,
}) => {
  const [visibleSeries, setVisibleSeries] = useState({
    rate: true,
    present: true,
    late: true,
    unexcused: true,
  });

  const tableHeaders = ['Ngày', 'Có mặt', 'Đi muộn', 'Vắng phép', 'Vắng không phép', 'Tổng số', 'Tỷ lệ %'];
  const tableRows = data.map((d) => [
    d.label,
    d.present,
    d.late,
    d.excused,
    d.unexcused,
    d.total,
    `${d.rate}%`,
  ]);

  if (data.length === 0) {
    return (
      <ChartCard title="Xu hướng Chuyên cần" icon={<CalendarCheck className="w-5 h-5 text-emerald-600" />}>
        <div className="py-12 text-center text-xs text-app-muted">
          Chưa có dữ liệu điểm danh nào trong khoảng thời gian này.
        </div>
      </ChartCard>
    );
  }

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as AttendanceTrendDataPoint;
      return (
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <p className="font-extrabold text-amber-400">{item.label}</p>
          <div className="space-y-1 text-slate-300">
            <p className="flex justify-between gap-4">
              <span className="text-emerald-400">Tỷ lệ chuyên cần:</span>
              <strong className="font-mono text-white">{item.rate}%</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span>Có mặt:</span>
              <strong className="font-mono text-emerald-300">{item.present} em</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span>Đi muộn:</span>
              <strong className="font-mono text-amber-300">{item.late} em</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span>Nghỉ không phép:</span>
              <strong className="font-mono text-red-300">{item.unexcused} em</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="Xu Hướng Chuyên Cần Theo Ngày"
      subtitle="Theo dõi tỷ lệ đi học đầy đủ và tình hình đi muộn, vắng học"
      icon={<CalendarCheck className="w-5 h-5 text-emerald-600" />}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      exportFilename="xuhuong-chuyencan"
    >
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const item = e.activePayload[0].payload as AttendanceTrendDataPoint;
                if (onSelectDate) onSelectDate(item.date);
              }
            }}
          >
            <defs>
              <linearGradient id="attRateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={renderTooltip} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              onClick={(e) => {
                const key = e.dataKey as keyof typeof visibleSeries;
                if (key) setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
              }}
            />

            {visibleSeries.rate && (
              <Area
                type="monotone"
                name="Tỷ lệ chuyên cần (%)"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#attRateGrad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
