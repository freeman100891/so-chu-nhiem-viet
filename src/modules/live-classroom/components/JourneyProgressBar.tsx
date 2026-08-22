import React from 'react';
import {
  LogIn,
  CheckCheck,
  BookOpen,
  Sparkles,
  Trophy,
  Check,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface JourneyStep {
  id: string;
  title: string;
  subText: string;
  icon: React.ReactNode;
  status: 'completed' | 'active' | 'upcoming';
}

interface JourneyProgressBarProps {
  currentStepId?: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

const DEFAULT_STEPS: JourneyStep[] = [
  {
    id: 'start',
    title: 'Khởi Động',
    subText: 'Sẵn sàng vào lớp',
    icon: <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />,
    status: 'completed',
  },
  {
    id: 'attendance',
    title: 'Điểm Danh',
    subText: 'Kiểm tra sĩ số',
    icon: <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
    status: 'completed',
  },
  {
    id: 'challenge',
    title: 'Thử Thách',
    subText: 'Khám phá bài học',
    icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
    status: 'active',
  },
  {
    id: 'interaction',
    title: 'Tương Tác',
    subText: 'Phát biểu & Đố vui',
    icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />,
    status: 'upcoming',
  },
  {
    id: 'honor',
    title: 'Vinh Danh',
    subText: 'Bảng vàng tổng kết',
    icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />,
    status: 'upcoming',
  },
];

export const JourneyProgressBar: React.FC<JourneyProgressBarProps> = ({
  currentStepId = 'challenge',
  onStepClick,
  className = '',
}) => {
  const activeIndex = Math.max(
    0,
    DEFAULT_STEPS.findIndex((s) => s.id === currentStepId)
  );

  const steps = DEFAULT_STEPS.map((step, idx) => {
    let status: 'completed' | 'active' | 'upcoming' = 'upcoming';
    if (idx < activeIndex) status = 'completed';
    else if (idx === activeIndex) status = 'active';
    return { ...step, status };
  });

  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-sky-100 dark:border-slate-800 shadow-sm backdrop-blur-md transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-live-dot" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Hành Trình Tiết Học Số
          </span>
        </div>
        <span className="text-[11px] font-black text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 shadow-2xs">
          <span>Chặng {activeIndex + 1} / {steps.length}</span>
          <span className="hidden sm:inline"> • {steps[activeIndex]?.title}</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative flex items-center justify-between gap-1 sm:gap-2 px-2">
        {/* Background Track Line */}
        <div className="absolute left-8 right-8 top-5 sm:top-5.5 h-1.5 bg-slate-100 dark:bg-slate-800 -z-0 rounded-full" />

        {/* Dynamic Progress Fill Line (300-600ms transition) */}
        <div
          className="absolute left-8 top-5 sm:top-5.5 h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 -z-0 rounded-full transition-all duration-500 ease-out shadow-xs"
          style={{
            width: `${Math.max(0, (activeIndex / (steps.length - 1)) * 100 - 4)}%`,
          }}
        />

        {/* Checkpoint Nodes */}
        {steps.map((step, _idx) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none transition-transform duration-300 active:scale-95"
              title={`Chuyển sang chặng: ${step.title}`}
            >
              {/* Checkpoint Icon / Disc */}
              <div
                className={cn(
                  'w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black transition-all duration-300 shadow-xs',
                  isCompleted &&
                    'bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-300 dark:ring-emerald-700 animate-check-bounce',
                  isActive &&
                    'bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-sky-500/30 ring-4 ring-sky-300/70 dark:ring-sky-500/50 scale-110 animate-pulse-glow',
                  !isCompleted &&
                    !isActive &&
                    'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Title & Subtext */}
              <div className="mt-2 text-center select-none">
                <p
                  className={cn(
                    'text-[11px] sm:text-xs font-black tracking-tight transition-colors',
                    isActive && 'text-sky-600 dark:text-sky-400 scale-105',
                    isCompleted && 'text-slate-800 dark:text-slate-200 font-bold',
                    !isCompleted && !isActive && 'text-slate-400 dark:text-slate-500 font-medium'
                  )}
                >
                  {step.title}
                </p>
                <p className="hidden md:block text-[10px] text-slate-400 font-semibold mt-0.5 max-w-[90px] truncate">
                  {step.subText}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

