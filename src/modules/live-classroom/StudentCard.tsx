import React from 'react';
import { StudentAvatar } from '../../shared/components/StudentAvatar';
import type { LiveClassParticipant, Student } from '../../core/database/types';
import type { AvatarCardTheme, StudentAvatarPresentation } from '../../core/types/avatar-theme.types';
import { Hand, CheckSquare, Square, MoreHorizontal, Sparkles, Star } from 'lucide-react';
import type { UiDensityMode } from '../../shared/hooks/useUiScale';
import { avatarCardThemeService } from '../../core/services/avatar-card-theme.service';
import { cn } from '../../shared/utilities/cn';

export interface StudentCardProps {
  participant: LiveClassParticipant;
  student: Student;
  rollNumber?: number;
  points?: number;
  presentation?: StudentAvatarPresentation;
  cardTheme?: AvatarCardTheme;
  globalActiveThemeId?: string | null;
  cardDensity?: UiDensityMode;
  isSelected: boolean;
  isChecked: boolean;
  isSubmitting: boolean;
  floatingBadge?: { text: string; id: string; type: 'point' | 'star' };
  onSelectCard: (student: Student, participant: LiveClassParticipant) => void;
  onToggleCheck: (studentId: string) => void;
  onQuickAward: (studentId: string, points: number, reason: string) => void;
  onIncrementTalk: (studentId: string) => void;
  onOpenDeduct: (studentId: string) => void;
  onOpenCustomPoint: (studentId: string) => void;
}

export const StudentCard: React.FC<StudentCardProps> = React.memo(({
  participant: p,
  student: st,
  rollNumber,
  points = 0,
  presentation,
  cardTheme: customCardTheme,
  globalActiveThemeId,
  isSelected,
  isChecked,
  isSubmitting,
  floatingBadge,
  onSelectCard,
  onToggleCheck,
  onQuickAward,
  onIncrementTalk,
  onOpenDeduct,
  onOpenCustomPoint,
}) => {
  const effectivePoints = points;
  const effectiveRollNumber = rollNumber ?? '-';
  const spokeCount = p.participationCount || 0;

  // Resolve card visual theme tokens
  const theme =
    customCardTheme ||
    presentation?.cardTheme ||
    avatarCardThemeService.generateCardThemeFromBaseColor(
      avatarCardThemeService.DEFAULT_5_LEVEL_CARD_PALETTE[((presentation?.level || 1) - 1) % 5]!,
      presentation?.level || 1
    );

  const levelShortLabel = presentation?.levelShortLabel || `Cấp ${presentation?.level || 1}`;

  return (
    <div
      data-testid={`student-card-${st.id}`}
      data-avatar-level={presentation?.level || 1}
      className={cn(
        'student-card-live student-card-container p-3 sm:p-4 border-2 flex flex-col justify-between relative overflow-hidden select-none min-w-0 group shadow-sm bg-white/95 dark:bg-slate-900/95',
        isChecked
          ? 'ring-4 ring-blue-500 shadow-xl scale-[1.02] bg-gradient-to-b from-blue-50/90 to-indigo-50/90 dark:from-blue-950/80 dark:to-indigo-950/80 border-blue-500'
          : isSelected
          ? 'ring-4 ring-sky-400 shadow-lg scale-[1.01] bg-sky-50/60 dark:bg-sky-950/60 border-sky-400'
          : p.handRaised
          ? 'ring-4 ring-amber-400 shadow-lg bg-gradient-to-b from-amber-50/80 to-yellow-50/80 dark:from-amber-950/70 dark:to-yellow-950/70 border-amber-400 animate-hand-raised'
          : 'border-slate-200/90 dark:border-slate-800/80 hover:border-sky-300 dark:hover:border-sky-600',
        p.attendanceStatus === 'absent' && 'opacity-65 grayscale-[40%]'
      )}
    >
      {/* TOP DECORATIVE ACCENT BAR WITH LEVEL GRADIENT */}
      <div
        style={{
          background: isChecked
            ? 'linear-gradient(90deg, #3B82F6, #6366F1)'
            : isSelected
            ? 'linear-gradient(90deg, #0EA5E9, #38BDF8)'
            : p.handRaised
            ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
            : `linear-gradient(90deg, ${theme.border}, ${theme.avatarRing})`,
        }}
        className="absolute top-0 left-0 right-0 h-1.5"
      />

      {/* FLOATING BADGE OVERLAY ANIMATION (+1, +2, ⭐) */}
      {floatingBadge && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-blue-600/95 via-indigo-600/95 to-blue-700/95 text-white font-black text-2xl flex flex-col items-center justify-center animate-score-float rounded-3xl shadow-2xl backdrop-blur-xs">
          <Sparkles className="w-8 h-8 text-yellow-300 animate-spin mb-1" />
          <span>{floatingBadge.text}</span>
        </div>
      )}

      {/* TOP BAR: CHECKBOX & LEVEL BADGE / HAND RAISED */}
      <div className="flex items-center justify-between w-full mb-1 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(p.studentId);
          }}
          className="p-1 -m-1 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded-xl transition-all min-h-[32px] min-w-[32px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-90"
          title="Chọn học sinh"
          aria-label={`Chọn học sinh ${st.fullName}`}
        >
          {isChecked ? (
            <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-100 dark:fill-blue-950" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {/* Level Badge */}
          <span
            style={{
              backgroundColor: theme.badgeBackground,
              color: theme.badgeText,
              borderColor: theme.badgeBorder,
            }}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-wider uppercase shadow-2xs transition-transform group-hover:scale-105"
            title={`Cấp avatar: ${presentation?.levelName || levelShortLabel}`}
          >
            {levelShortLabel}
          </span>

          {/* Hand raised indicator */}
          {p.handRaised && (
            <div
              className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-xs flex items-center gap-1 shadow-xs ring-2 ring-amber-300 animate-bounce"
              title="Đang giơ tay phát biểu"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black">Giơ tay</span>
            </div>
          )}
        </div>
      </div>

      {/* BODY: CLICK TO OPEN FOCUS MODAL */}
      <div
        onClick={() => onSelectCard(st, p)}
        className="flex flex-col items-center text-center cursor-pointer py-1.5 group/avatar focus:outline-none flex-1 justify-center relative"
      >
        {/* AVATAR (64px - 84px) WITH LEVEL RING */}
        <div className="relative mb-2">
          {presentation?.avatarAsset.assetUrl ? (
            <div
              style={{ borderColor: theme.avatarRing }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 sm:border-4 bg-white dark:bg-slate-800 p-1 shadow-md overflow-hidden flex items-center justify-center transition-all duration-300 group-hover/avatar:scale-105 ring-4 ring-black/5 dark:ring-white/10"
            >
              <img
                src={presentation.avatarAsset.assetUrl}
                alt={presentation.avatarAsset.altText}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 group-hover/avatar:scale-105">
              <StudentAvatar
                student={st}
                score={effectivePoints}
                globalActiveThemeId={globalActiveThemeId}
                size="fluid"
                shape="circle"
                className="w-full h-full shadow-md ring-4 ring-black/5 dark:ring-white/10"
              />
            </div>
          )}

          {/* ATTENDANCE STATUS BADGES */}
          {p.attendanceStatus === 'absent' && (
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-full shadow-md ring-2 ring-white flex items-center gap-0.5">
              <span>✕</span> Vắng
            </span>
          )}
          {p.attendanceStatus === 'late' && (
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full shadow-md ring-2 ring-white flex items-center gap-0.5">
              <span>⏰</span> Muộn
            </span>
          )}
          {p.attendanceStatus === 'left' && (
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-sky-600 text-white text-[9px] font-black rounded-full shadow-md ring-2 ring-white flex items-center gap-0.5">
              <span>📝</span> Phép
            </span>
          )}
        </div>

        {/* Student Full Name (High contrast, 16px-18px) */}
        <h4
          style={{ color: theme.textPrimary }}
          className="student-name-text font-black text-sm sm:text-base tracking-tight leading-snug line-clamp-2 w-full px-1 drop-shadow-2xs group-hover/avatar:text-blue-600 transition-colors"
          title={st.fullName}
        >
          {st.fullName}
        </h4>

        {/* Subtle Roll Number & Student Code */}
        <p style={{ color: theme.textSecondary }} className="student-code-text text-[11px] font-mono font-semibold opacity-75 mt-0.5">
          STT: {effectiveRollNumber} {st.studentCode ? `• ${st.studentCode}` : ''}
        </p>

        {/* STATS: POINTS & SPEECH COUNT */}
        <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
          {/* Total Score Stat Pill */}
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-black font-mono shadow-2xs transition-all flex items-center gap-1 border',
              effectivePoints > 0
                ? 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-amber-950 border-amber-400 ring-1 ring-white/60'
                : effectivePoints < 0
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            )}
            title="Tổng điểm thi đua"
          >
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span>{effectivePoints > 0 ? `+${effectivePoints}` : effectivePoints} đ</span>
          </span>

          {/* Participation Talk Pill */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              onIncrementTalk(p.studentId);
            }}
            className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xs flex items-center gap-1"
            title="Số lần phát biểu (Bấm để +1)"
          >
            <span>🗣️</span>
            <span>{spokeCount}</span>
          </span>
        </div>
      </div>

      {/* QUICK ACTION 3D TACTILE BUTTONS */}
      <div className="student-card-actions flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAward(p.studentId, 1, 'Học tập tốt / Phát biểu');
          }}
          disabled={isSubmitting}
          className="tactile-btn flex-1 py-1.5 px-1 rounded-xl bg-gradient-to-b from-sky-50 to-sky-100 hover:from-sky-500 hover:to-sky-600 hover:text-white text-sky-800 font-black text-xs sm:text-sm transition-all border border-b-2 border-sky-300 hover:border-sky-600 min-h-[36px] flex items-center justify-center shadow-xs cursor-pointer"
          title="Thưởng nhanh +1 điểm"
        >
          +1
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAward(p.studentId, 2, 'Thành tích nổi bật trong giờ');
          }}
          disabled={isSubmitting}
          className="tactile-btn flex-1 py-1.5 px-1 rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100 hover:from-emerald-500 hover:to-emerald-600 hover:text-white text-emerald-800 font-black text-xs sm:text-sm transition-all border border-b-2 border-emerald-300 hover:border-emerald-600 min-h-[36px] flex items-center justify-center shadow-xs cursor-pointer"
          title="Thưởng nhanh +2 điểm"
        >
          +2
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAward(p.studentId, 5, 'Thành tích xuất sắc vượt trội');
          }}
          disabled={isSubmitting}
          className="tactile-btn flex-1 py-1.5 px-1 rounded-xl bg-gradient-to-b from-purple-50 to-purple-100 hover:from-purple-500 hover:to-purple-600 hover:text-white text-purple-800 font-black text-xs sm:text-sm transition-all border border-b-2 border-purple-300 hover:border-purple-600 min-h-[36px] flex items-center justify-center shadow-xs cursor-pointer"
          title="Thưởng nhanh +5 điểm"
        >
          +5
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDeduct(p.studentId);
          }}
          disabled={isSubmitting}
          className="tactile-btn p-1.5 rounded-xl bg-gradient-to-b from-rose-50 to-rose-100 hover:from-rose-500 hover:to-rose-600 hover:text-white text-rose-700 transition-all border border-b-2 border-rose-300 hover:border-rose-600 min-h-[36px] min-w-[34px] flex items-center justify-center shadow-xs font-black text-sm cursor-pointer"
          title="Trừ điểm nề nếp (-1 / -2 / -5)"
        >
          −
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenCustomPoint(p.studentId);
          }}
          disabled={isSubmitting}
          className="tactile-btn p-1.5 rounded-xl bg-white hover:bg-slate-800 hover:text-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-all border border-b-2 border-slate-300 dark:border-slate-700 min-h-[36px] min-w-[34px] flex items-center justify-center shadow-xs cursor-pointer"
          title="Tùy chỉnh điểm & lý do khác"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

StudentCard.displayName = 'StudentCard';

