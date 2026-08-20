import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from 'recharts';
import { Card } from '../../../../shared/components/Card';
import type { RankLevelChartData } from '../../../../core/services/rank-overview-analytics.service';
import { BarChart3, Table, RotateCcw, Info } from 'lucide-react';
import { cn } from '../../../../shared/utilities/cn';

export interface RankLevelBarChartProps {
  data: RankLevelChartData[];
  totalStudents: number;
  selectedLevel: number | null;
  onSelectLevel: (level: number | null) => void;
  loading?: boolean;
}

export const RankLevelBarChart: React.FC<RankLevelBarChartProps> = ({
  data,
  totalStudents,
  selectedLevel,
  onSelectLevel,
  loading = false,
}) => {
  const [hasStudentsOnly, setHasStudentsOnly] = useState(true);
  const [showTableView, setShowTableView] = useState(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Filtered dataset according to mode toggle
  const displayData = useMemo(() => {
    if (hasStudentsOnly) {
      const active = data.filter((d) => d.count > 0);
      return active.length > 0 ? active : data;
    }
    return data;
  }, [data, hasStudentsOnly]);

  const hasData = totalStudents > 0 && data.some((d) => d.count > 0);

  // Custom accessible Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0].payload as RankLevelChartData;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 max-w-[220px] z-50">
          <div className="flex items-center gap-1.5 font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.colorHex }} />
            <span>{item.name}</span>
            <span className="text-slate-400 font-normal">(Cấp {item.level}/17)</span>
          </div>
          <p className="text-slate-300">
            <strong className="text-white text-sm font-mono">{item.count}</strong> học sinh ({item.percentage}% tổng lớp)
          </p>
          <p className="text-[10px] text-slate-400">
            Ngưỡng điểm tối thiểu: <strong className="text-amber-300">{item.minPoints}đ</strong> • {item.group}
          </p>
          <p className="text-[10px] text-blue-300 italic pt-1">Nhấp để lọc danh sách học sinh cấp này</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Phân Bố 17 Cấp Bậc Thi Đua"
      action={
        <div className="flex items-center gap-1.5">
          {/* FILTER RESET BUTTON */}
          {selectedLevel !== null && (
            <button
              onClick={() => onSelectLevel(null)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100"
              title="Bỏ lọc cấp bậc"
            >
              <RotateCcw className="w-3 h-3" /> Bỏ lọc (Cấp {selectedLevel})
            </button>
          )}

          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-bold">
            <button
              onClick={() => setHasStudentsOnly(true)}
              className={cn(
                'px-2 py-1 rounded-md transition-all',
                hasStudentsOnly ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title="Chỉ hiển thị các cấp bậc có học sinh"
            >
              Có học sinh
            </button>
            <button
              onClick={() => setHasStudentsOnly(false)}
              className={cn(
                'px-2 py-1 rounded-md transition-all',
                !hasStudentsOnly ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
              title="Hiển thị đủ 17 cấp bậc"
            >
              Đủ 17 cấp
            </button>
          </div>

          {/* ACCESSIBLE TABLE TOGGLE */}
          <button
            onClick={() => setShowTableView(!showTableView)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title={showTableView ? 'Xem biểu đồ cột ngang' : 'Xem dữ liệu dạng bảng'}
          >
            {showTableView ? <BarChart3 className="w-4 h-4" /> : <Table className="w-4 h-4" />}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* DESCRIPTION */}
        <p className="text-xs text-slate-500">
          Số lượng và tỷ lệ học sinh theo từng bậc thi đua cụ thể từ Binh nhì đến Đại tướng.
        </p>

        {/* LOADING STATE */}
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-full h-8 bg-slate-100 rounded-md" />
            <div className="w-3/4 h-8 bg-slate-100 rounded-md" />
            <div className="w-1/2 h-8 bg-slate-100 rounded-md" />
            <span className="text-xs text-slate-400 font-bold">Đang tải dữ liệu biểu đồ...</span>
          </div>
        ) : !hasData ? (
          /* EMPTY STATE */
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
            <Info className="w-8 h-8 opacity-40 text-slate-500" />
            <p className="text-xs font-bold">Chưa có học sinh nào đạt điểm thi đua trong bộ lọc này.</p>
          </div>
        ) : showTableView ? (
          /* ACCESSIBLE TABLE VIEW */
          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left" aria-label="Bảng phân bố 17 cấp bậc">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 font-bold">
                  <th className="py-2.5 px-3">Cấp</th>
                  <th className="py-2.5 px-3">Tên Cấp Bậc</th>
                  <th className="py-2.5 px-3">Nhóm</th>
                  <th className="py-2.5 px-3 text-right">Điểm Tối Thiểu</th>
                  <th className="py-2.5 px-3 text-right">Số HS</th>
                  <th className="py-2.5 px-3 text-right">Tỷ Lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.map((item) => (
                  <tr
                    key={item.level}
                    onClick={() => onSelectLevel(selectedLevel === item.level ? null : item.level)}
                    className={cn(
                      'cursor-pointer hover:bg-slate-50 transition-colors',
                      selectedLevel === item.level && 'bg-blue-50/80 font-bold'
                    )}
                  >
                    <td className="py-2 px-3 font-mono font-bold text-slate-400">#{item.level}</td>
                    <td className="py-2 px-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.colorHex }} />
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{item.group}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{item.minPoints}đ</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{item.count}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* HORIZONTAL BAR CHART VIEW */
          <div
            className={cn(
              'w-full transition-all',
              !hasStudentsOnly ? 'max-h-96 overflow-y-auto pr-1' : ''
            )}
            style={{
              height: !hasStudentsOnly ? Math.max(340, displayData.length * 28) : Math.max(260, displayData.length * 36),
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={displayData}
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={({ x, y, payload }) => (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fill="#334155"
                      fontSize={11}
                      fontWeight={600}
                    >
                      {payload.value}
                    </text>
                  )}
                />
                <Tooltip content={renderCustomTooltip} />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(entry: any) => {
                    const lvl = entry.level ?? (entry.payload && entry.payload.level);
                    if (lvl !== undefined) onSelectLevel(selectedLevel === lvl ? null : lvl);
                  }}
                  cursor="pointer"
                >
                  {displayData.map((entry) => {
                    const isSelected = selectedLevel === entry.level;
                    const isDimmed = selectedLevel !== null && !isSelected;
                    return (
                      <Cell
                        key={`bar-${entry.level}`}
                        fill={entry.colorHex}
                        opacity={isDimmed ? 0.3 : 1}
                        stroke={isSelected ? '#0f172a' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                        className="transition-all hover:opacity-90"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};
