import React from 'react';
import type { Student, LiveClassParticipant } from '../../../core/database/types';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { Flame, Star } from 'lucide-react';

export interface SpotlightStudent {
  student: Student;
  participant?: LiveClassParticipant;
  streakDays?: number;
  bonusPoints?: number;
  levelTitle?: string;
  levelNumber?: number;
  highlightReason?: string;
}

interface StudentSpotlightCarouselProps {
  students: SpotlightStudent[];
  onAwardQuickPoint?: (studentId: string, points: number) => void;
  onStudentClick?: (studentId: string) => void;
  className?: string;
}

export const StudentSpotlightCarousel: React.FC<StudentSpotlightCarouselProps> = ({
  students,
  onAwardQuickPoint,
  onStudentClick,
  className = '',
}) => {
  if (students.length === 0) {
    return null;
  }

  return (
    <div className={`p-5 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Star className="w-4 h-4 fill-current" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
            Lớp Mình Hôm Nay (Student Spotlight)
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {students.length} gương mặt tiêu biểu
        </span>
      </div>

      {/* Horizontal Scroll List */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {students.map((item) => {
          const { student, participant, streakDays = 3, bonusPoints = 10, levelNumber = 2 } = item;

          return (
            <div
              key={student.id}
              onClick={() => onStudentClick?.(student.id)}
              className="min-w-[170px] max-w-[190px] p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/90 dark:to-slate-900/90 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-400/80 dark:hover:border-amber-500/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col items-center text-center relative group cursor-pointer shrink-0 select-none"
            >
              {/* Avatar with Glow Ring */}
              <div className="relative mb-2">
                <StudentAvatar
                  student={student}
                  size="md"
                  className="ring-2 ring-amber-300 dark:ring-amber-600 shadow-sm"
                />
                {levelNumber && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] shadow-xs">
                    Lv.{levelNumber}
                  </span>
                )}
              </div>

              {/* Name */}
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-1 w-full">
                {student.fullName}
              </h4>

              {/* Badges / Streak */}
              <div className="mt-1.5 flex flex-col gap-1 w-full items-center">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <Flame className="w-3 h-3 text-orange-500 fill-current" />
                  Chuỗi {streakDays} ngày
                </span>

                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Star className="w-3 h-3 text-emerald-500 fill-current" />
                  +{participant?.participationCount ? participant.participationCount * 5 + bonusPoints : bonusPoints} sao
                </span>
              </div>

              {/* Quick Point Action on Hover */}
              {onAwardQuickPoint && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAwardQuickPoint(student.id, 1);
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 text-[10px] font-black transition-transform active:scale-90"
                    title="Cộng 1 điểm"
                  >
                    +1 ⭐
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAwardQuickPoint(student.id, 2);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 text-[10px] font-black transition-transform active:scale-90"
                    title="Cộng 2 điểm"
                  >
                    +2 🌟
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
