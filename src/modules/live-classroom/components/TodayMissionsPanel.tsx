import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Flame,
  Target,
} from 'lucide-react';
import { CuteStarSVG } from '../../../shared/components/CuteDecorations';

export interface MissionItem {
  id: string;
  title: string;
  category: 'attendance' | 'warmup' | 'activity' | 'picker' | 'honor';
  isCompleted: boolean;
}

interface TodayMissionsPanelProps {
  className?: string;
  onMissionToggle?: (missionId: string, completed: boolean) => void;
}

const INITIAL_MISSIONS: MissionItem[] = [
  { id: 'm1', title: 'Điểm danh đủ sĩ số lớp', category: 'attendance', isCompleted: true },
  { id: 'm2', title: 'Khởi động & ôn bài cũ vui nhộn', category: 'warmup', isCompleted: true },
  { id: 'm3', title: 'Thử thách Toán học: Giải bài tập nhóm', category: 'activity', isCompleted: false },
  { id: 'm4', title: 'Bốc thăm may mắn nhận sao phát biểu', category: 'picker', isCompleted: false },
  { id: 'm5', title: 'Bảng vàng vinh danh cuối tiết học', category: 'honor', isCompleted: false },
];

export const TodayMissionsPanel: React.FC<TodayMissionsPanelProps> = ({
  className = '',
  onMissionToggle,
}) => {
  const [missions, setMissions] = useState<MissionItem[]>(INITIAL_MISSIONS);

  const completedCount = missions.filter((m) => m.isCompleted).length;
  const progressPercent = Math.round((completedCount / missions.length) * 100);

  const handleToggle = (id: string) => {
    setMissions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.isCompleted;
          onMissionToggle?.(id, next);
          return { ...item, isCompleted: next };
        }
        return item;
      })
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 🎯 NHIỆM VỤ HÔM NAY */}
      <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              Nhiệm Vụ Tiết Học
            </h3>
          </div>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {completedCount}/{missions.length} ({progressPercent}%)
          </span>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-3.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Mission Checklist */}
        <div className="space-y-2">
          {missions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => handleToggle(mission.id)}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                mission.isCompleted
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-slate-500 dark:text-slate-400'
                  : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="focus:outline-none transition-transform active:scale-90"
                  aria-label="Toggle Mission"
                >
                  {mission.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-check-bounce fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <span
                  className={`text-xs font-bold leading-snug ${
                    mission.isCompleted ? 'line-through opacity-75' : ''
                  }`}
                >
                  {mission.title}
                </span>
              </div>
              {mission.isCompleted && (
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                  Xong ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 💡 BẤT NGỜ HÔM NAY (SURPRISE CARD) */}
      <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-amber-950/40 border-2 border-purple-200 dark:border-purple-800/80 shadow-md">
        <CuteStarSVG className="absolute -right-2 -bottom-2 w-16 h-16 opacity-20 pointer-events-none animate-float-soft" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>BẤT NGỜ HÔM NAY</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              🔥 Lớp mình đang giữ chuỗi 4 ngày học tốt!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Chỉ cần thêm <strong>8 điểm tích cực</strong> nữa trong tiết học này để mở Rương Quà Tuần cùng Bé Bo! 🎁
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
