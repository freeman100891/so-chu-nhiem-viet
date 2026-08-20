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
import type { EngagementData } from '../../../core/services/report-aggregation.service';
import { MessageSquare, Star } from 'lucide-react';

export interface EngagementReportChartProps {
  data: EngagementData;
}

export const EngagementReportChart: React.FC<EngagementReportChartProps> = ({
  data,
}) => {
  const chartData = [
    { name: 'Gọi tên', count: data.callsCount, color: '#3b82f6' },
    { name: 'Trả lời', count: data.answersCount, color: '#10b981' },
    { name: 'Giơ tay', count: data.handRaisesCount, color: '#ec4899' },
    { name: 'Hoạt động nhóm', count: data.groupWorkCount, color: '#8b5cf6' },
    { name: 'Điểm nhanh', count: data.quickPointsCount, color: '#f59e0b' },
  ];

  const tableHeaders = ['Loại tương tác', 'Số lượt thực hiện'];
  const tableRows = chartData.map((d) => [d.name, `${d.count} lượt`]);

  return (
    <ChartCard
      title="Tương Tác Lớp Học Trực Tuyến"
      subtitle="Thống kê các hoạt động sôi nổi: gọi tên, giơ tay, trả lời bài và làm việc nhóm"
      icon={<MessageSquare className="w-5 h-5 text-pink-600" />}
      tableHeaders={tableHeaders}
      tableRows={tableRows}
      exportFilename="tuongtac-lophoc"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 items-center">
        {/* BAR CHART (7 COLS) */}
        <div className="md:col-span-7 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" lượt" />
              <Tooltip formatter={(val: any) => [`${val} lượt`, 'Số lượng']} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TOP ACTIVE STUDENTS (5 COLS) */}
        <div className="md:col-span-5 space-y-2 border-t md:border-t-0 md:border-l border-app md:pl-4">
          <h4 className="text-xs font-bold text-app-main flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> Gương mặt tương tác tích cực nhất:
          </h4>

          {data.studentRanking.length === 0 ? (
            <p className="text-xs text-app-muted italic py-4">Chưa có dữ liệu tương tác trong kỳ.</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {data.studentRanking.slice(0, 5).map((st, idx) => (
                <div
                  key={st.studentId}
                  className="p-2 rounded-xl border border-app bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-app-main truncate">{st.studentName}</span>
                  </div>
                  <span className="font-mono font-bold text-pink-600 shrink-0 ml-2">
                    {st.interactionCount} lượt
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
};
