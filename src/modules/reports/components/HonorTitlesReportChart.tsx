/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
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
import { ChartCard } from './ChartCard';
import type { HonorTitleStats } from '../../../core/services/report-aggregation.service';
import { Trophy } from 'lucide-react';

export interface HonorTitlesReportChartProps {
  data: HonorTitleStats[];
}

export const HonorTitlesReportChart: React.FC<HonorTitlesReportChartProps> = ({
  data,
}) => {
  const chartData = data.map((d) => ({
    name: d.title.name,
    count: d.recipientCount,
    color: d.title.colorToken || '#f59e0b',
  }));

  const tableHeaders = ['Danh hiệu', 'Số học sinh được vinh danh'];
  const tableRows = chartData.map((d) => [d.name, `${d.count} học sinh`]);

  return (
    <ChartCard
      title="Bảng Vàng & Danh Hiệu Đã Trao"
      subtitle="Phân bố các danh hiệu vinh danh học sinh qua các kỳ Bảng Vàng"
      icon={<Trophy className="w-5 h-5 text-amber-600" />}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      exportFilename="danhhieu-bangvang"
    >
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" em" />
            <Tooltip formatter={(val: any) => [`${val} học sinh`, 'Số lượng']} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
