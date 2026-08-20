/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { DrillDownModal, type DrillDownStudentItem } from './DrillDownModal';
import type { PromotionHistoryDataPoint } from '../../../core/services/report-aggregation.service';
import { Sparkles } from 'lucide-react';
import { db } from '../../../core/database/db';

export interface PromotionHistoryReportChartProps {
  data: PromotionHistoryDataPoint[];
}

export const PromotionHistoryReportChart: React.FC<PromotionHistoryReportChartProps> = ({
  data,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStudents, setModalStudents] = useState<DrillDownStudentItem[]>([]);

  const tableHeaders = ['Thời gian', 'Lượt thăng cấp', 'Học sinh'];
  const tableRows = data.map((d) => [
    d.periodLabel,
    d.count,
    d.promotions.map((p) => p.studentName).join(', '),
  ]);

  if (data.length === 0) {
    return (
      <ChartCard title="Lịch Sử Thăng Cấp" icon={<Sparkles className="w-5 h-5 text-purple-600" />}>
        <div className="py-12 text-center text-xs text-app-muted">
          Chưa có sự kiện thăng cấp nào trong khoảng thời gian này.
        </div>
      </ChartCard>
    );
  }

  const handleBarClick = async (point: PromotionHistoryDataPoint) => {
    const students: DrillDownStudentItem[] = [];
    for (const p of point.promotions) {
      const st = await db.students.get(p.studentId);
      if (st) {
        students.push({
          student: st,
          subtitle: `Thăng từ Cấp ${p.fromLevel} lên ${p.rankName} (Cấp ${p.toLevel})`,
          badge: p.rankName,
          badgeColor: '#8b5cf6',
          points: p.points,
        });
      }
    }

    setModalTitle(`Danh Sách Học Sinh Thăng Cấp (${point.periodLabel})`);
    setModalStudents(students);
    setModalOpen(true);
  };

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as PromotionHistoryDataPoint;
      return (
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <p className="font-extrabold text-amber-400">{item.periodLabel}</p>
          <p className="text-slate-300">
            Số lượt thăng cấp: <strong className="font-mono text-purple-300">+{item.count}</strong>
          </p>
          <p className="text-[10px] text-slate-400 italic">Nhấp vào cột để xem chi tiết học sinh</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <ChartCard
        title="Lịch Sử Thăng Cấp Thi Đua"
        subtitle="Số lượt thăng cấp bậc đạt được qua các tuần và tháng (Nhấp cột để xem danh sách)"
        icon={<Sparkles className="w-5 h-5 text-purple-600" />}
        tableHeaders={tableHeaders}
        tableRows={tableRows}
        exportFilename="lichsu-thangcap"
      >
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  const item = e.activePayload[0].payload as PromotionHistoryDataPoint;
                  handleBarClick(item);
                }
              }}
              cursor="pointer"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" lượt" />
              <Tooltip content={renderTooltip} />
              <Bar dataKey="count" name="Lượt thăng cấp" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <DrillDownModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        students={modalStudents}
      />
    </>
  );
};
