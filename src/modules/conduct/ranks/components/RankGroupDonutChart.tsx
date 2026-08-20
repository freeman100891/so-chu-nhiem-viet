import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '../../../../shared/components/Card';
import type { RankGroupChartData, RankGroupName } from '../../../../core/services/rank-overview-analytics.service';
import { PieChart as PieChartIcon, Table, RotateCcw, Info } from 'lucide-react';
import { cn } from '../../../../shared/utilities/cn';

export interface RankGroupDonutChartProps {
  data: RankGroupChartData[];
  totalStudents: number;
  selectedGroup: RankGroupName | null;
  onSelectGroup: (group: RankGroupName | null) => void;
  loading?: boolean;
}

export const RankGroupDonutChart: React.FC<RankGroupDonutChartProps> = ({
  data,
  totalStudents,
  selectedGroup,
  onSelectGroup,
  loading = false,
}) => {
  const [showTableView, setShowTableView] = useState(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hasData = totalStudents > 0 && data.some((d) => d.count > 0);

  // Custom accessible Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as RankGroupChartData;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 max-w-[200px] z-50">
          <p className="font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.colorHex }} />
            {item.group}
          </p>
          <p className="text-slate-300">
            <strong className="text-white text-sm font-mono">{item.count}</strong> học sinh ({item.percentage}%)
          </p>
          <p className="text-[10px] text-blue-300 italic">Nhấp để lọc học sinh nhóm này</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Phân Bố Theo Nhóm Cấp"
      action={
        <div className="flex items-center gap-1">
          {selectedGroup && (
            <button
              onClick={() => onSelectGroup(null)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100"
              title="Bỏ lọc nhóm"
            >
              <RotateCcw className="w-3 h-3" /> Bỏ lọc
            </button>
          )}
          <button
            onClick={() => setShowTableView(!showTableView)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title={showTableView ? 'Xem biểu đồ Donut' : 'Xem dữ liệu dạng bảng'}
          >
            {showTableView ? <PieChartIcon className="w-4 h-4" /> : <Table className="w-4 h-4" />}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* DESCRIPTION */}
        <p className="text-xs text-slate-500">
          Tỷ lệ phân bổ học sinh qua 4 nhóm cấp bậc thi đua của lớp/khối.
        </p>

        {/* LOADING STATE */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-36 h-36 rounded-full border-8 border-slate-200 border-t-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Đang tải dữ liệu biểu đồ...</span>
          </div>
        ) : !hasData ? (
          /* EMPTY STATE */
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
            <Info className="w-8 h-8 opacity-40 text-slate-500" />
            <p className="text-xs font-bold">Chưa có dữ liệu cấp bậc cho bộ lọc này.</p>
          </div>
        ) : showTableView ? (
          /* ACCESSIBLE TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" aria-label="Bảng phân bố theo nhóm cấp">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2">Nhóm Cấp</th>
                  <th className="py-2 text-right">Số HS</th>
                  <th className="py-2 text-right">Tỷ Lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.map((item) => (
                  <tr
                    key={item.group}
                    onClick={() => onSelectGroup(selectedGroup === item.group ? null : item.group)}
                    className={cn(
                      'cursor-pointer hover:bg-slate-50 transition-colors',
                      selectedGroup === item.group && 'bg-blue-50/80 font-bold'
                    )}
                  >
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                      <span>{item.group}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold">{item.count}</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* DONUT CHART VIEW */
          <div className="space-y-4">
            <div className="relative h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={renderCustomTooltip} />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="group"
                    isAnimationActive={!prefersReducedMotion}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={(entry: any) => {
                      const grp = (entry.group || (entry.payload && entry.payload.group)) as RankGroupName;
                      if (grp) onSelectGroup(selectedGroup === grp ? null : grp);
                    }}
                    cursor="pointer"
                  >
                    {data.map((entry) => {
                      const isSelected = selectedGroup === entry.group;
                      const isDimmed = selectedGroup !== null && !isSelected;
                      return (
                        <Cell
                          key={`cell-${entry.group}`}
                          fill={entry.colorHex}
                          opacity={isDimmed ? 0.35 : 1}
                          stroke={isSelected ? '#1e293b' : '#ffffff'}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all hover:opacity-90"
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* CENTER DISPLAY: TOTAL STUDENTS */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono leading-none">
                  {totalStudents}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Học sinh
                </span>
              </div>
            </div>

            {/* INTERACTIVE LEGEND */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              {data.map((item) => {
                const isSelected = selectedGroup === item.group;
                return (
                  <button
                    key={item.group}
                    onClick={() => onSelectGroup(isSelected ? null : item.group)}
                    className={cn(
                      'p-2 rounded-xl text-left text-xs transition-all border flex items-center justify-between',
                      isSelected
                        ? 'border-slate-800 bg-slate-100 shadow-xs ring-1 ring-slate-800'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    )}
                    title={`Lọc theo nhóm ${item.group}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                      <span className="font-bold text-slate-700 truncate">{item.group}</span>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 text-xs ml-1 shrink-0">
                      {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
