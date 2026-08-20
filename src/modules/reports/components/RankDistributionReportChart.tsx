/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { DrillDownModal, type DrillDownStudentItem } from './DrillDownModal';
import type { RankDistributionData, RankLevelDistributionItem } from '../../../core/services/report-aggregation.service';
import { Award, Shield, ChevronRight } from 'lucide-react';

export interface RankDistributionReportChartProps {
  data: RankDistributionData;
}

export const RankDistributionReportChart: React.FC<RankDistributionReportChartProps> = ({
  data,
}) => {
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownStudents, setDrillDownStudents] = useState<DrillDownStudentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tableHeaders = ['Cấp bậc', 'Nhóm cấp', 'Số lượng học sinh', 'Tỷ lệ %'];
  const totalStudents = data.groups.reduce((sum, g) => sum + g.count, 0) || 1;
  const tableRows = data.levels.map((l) => [
    `${l.name} (Cấp ${l.level})`,
    l.group,
    l.count,
    `${Math.round((l.count / totalStudents) * 100)}%`,
  ]);

  const handleGroupClick = (groupName: string) => {
    const groupLevels = data.levels.filter((l) => l.group === groupName);
    const students: DrillDownStudentItem[] = [];
    groupLevels.forEach((l) => {
      l.students.forEach((st) => {
        students.push({
          student: st,
          subtitle: `${l.name} (Cấp ${l.level})`,
          badge: l.name,
          badgeColor: l.color,
        });
      });
    });

    setDrillDownTitle(`Danh Sách Học Sinh: ${groupName}`);
    setDrillDownStudents(students);
    setIsModalOpen(true);
  };

  const handleLevelClick = (levelItem: RankLevelDistributionItem) => {
    const students: DrillDownStudentItem[] = levelItem.students.map((st) => ({
      student: st,
      subtitle: `Mã HS: ${st.studentCode}`,
      badge: `${levelItem.name} - Cấp ${levelItem.level}`,
      badgeColor: levelItem.color,
    }));

    setDrillDownTitle(`Học Sinh Cấp: ${levelItem.name}`);
    setDrillDownStudents(students);
    setIsModalOpen(true);
  };

  return (
    <>
      <ChartCard
        title="Phân Bố 17 Cấp Bậc Thi Đua"
        subtitle="Tổng quan theo 4 nhóm cấp bậc và chi tiết từng cấp bậc của học sinh"
        icon={<Award className="w-5 h-5 text-amber-600" />}
        tableHeaders={tableHeaders}
        tableRows={tableRows}
        exportFilename="phanbo-capbac"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 items-center">
          {/* DONUT 4 GROUPS (5 COLS) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.groups}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    onClick={(e) => {
                      if (e && e.name) handleGroupClick(e.name);
                    }}
                    cursor="pointer"
                  >
                    {data.groups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} học sinh`, `${name}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black font-mono text-app-main">{totalStudents}</span>
                <span className="text-[10px] font-bold text-app-muted uppercase">Học sinh</span>
              </div>
            </div>

            {/* 4 GROUPS LEGEND */}
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              {data.groups.map((g) => (
                <div
                  key={g.name}
                  onClick={() => handleGroupClick(g.name)}
                  className="p-2 rounded-xl border border-app hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="font-bold text-app-main truncate text-[11px]">{g.name}</span>
                  </div>
                  <span className="font-mono font-bold text-app-muted text-[11px] shrink-0 ml-1">
                    {g.count} ({g.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 17 LEVELS HORIZONTAL BAR (7 COLS) */}
          <div className="md:col-span-7 space-y-1.5 max-h-72 overflow-y-auto pr-1">
            <p className="text-xs font-bold text-app-main flex items-center gap-1 mb-2">
              <Shield className="w-3.5 h-3.5 text-app-primary" /> Chi tiết 17 cấp bậc (Nhấp vào dòng để xem học sinh):
            </p>
            {data.levels.map((l) => (
              <div
                key={l.level}
                onClick={() => l.count > 0 && handleLevelClick(l)}
                className={`p-2 rounded-xl border border-app/60 flex items-center justify-between text-xs transition-all ${
                  l.count > 0 ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer' : 'opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-5 h-5 rounded-md text-[10px] font-black text-white flex items-center justify-center shrink-0"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.level}
                  </span>
                  <span className="font-bold text-app-main truncate">{l.name}</span>
                  <span className="text-[10px] text-app-muted truncate hidden sm:inline">({l.group})</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-app-primary text-xs">{l.count} em</span>
                  {l.count > 0 && <ChevronRight className="w-3.5 h-3.5 text-app-muted" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* DRILL DOWN MODAL */}
      <DrillDownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={drillDownTitle}
        students={drillDownStudents}
      />
    </>
  );
};
