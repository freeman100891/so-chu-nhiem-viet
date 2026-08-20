import React from 'react';
import { StudentAvatar } from '../../shared/components/StudentAvatar';
import type { LiveClassParticipant, Student } from '../../core/database/types';
import type { AvatarCardTheme, StudentAvatarPresentation } from '../../core/types/avatar-theme.types';
import { Hand, CheckSquare, Square, MoreHorizontal, Sparkles } from 'lucide-react';
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

  // Resolve card visual tokens
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
      style={{
        background: `linear-gradient(145deg, ${theme.surfaceStart} 0%, ${theme.surfaceEnd} 100%)`,
        borderColor: isChecked
          ? '#2563eb'
          : isSelected
          ? '#3b82f6'
          : p.handRaised
          ? '#f59e0b'
          : theme.border,
        boxShadow: isChecked || isSelected ? undefined : `0 4px 14px ${theme.shadow}`,
      }}
      className={cn(
        'student-card-container p-[var(--space-3)] rounded-2xl border-2 flex flex-col justify-between relative overflow-hidden select-none min-w-0 transition-all duration-300 motion-reduce:transition-none group',
        isChecked
          ? 'ring-4 ring-blue-500/70 shadow-2xl scale-[1.02] bg-blue-50/20'
          : isSelected
          ? 'ring-3 ring-blue-400/80 shadow-xl scale-[1.01]'
          : p.handRaised
          ? 'ring-3 ring-amber-400 shadow-md animate-pulse'
          : 'hover:-translate-y-1 hover:shadow-xl',
        p.attendanceStatus === 'absent' && 'opacity-75 grayscale-[25%]'
      )}
    >
      {/* TOP GLOW ACCENT LINE ON SELECTED / HIGHLIGHT */}
      {(isChecked || isSelected) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 animate-pulse" />
      )}

      {/* FLOATING BADGE OVERLAY ANIMATION (+1, +2, ⭐) */}
      {floatingBadge && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-blue-600/95 via-indigo-600/95 to-blue-700/95 text-white font-black text-2xl flex flex-col items-center justify-center animate-bounce rounded-2xl shadow-2xl backdrop-blur-xs">
          <Sparkles className="w-8 h-8 text-yellow-300 animate-spin mb-1" />
          <span>{floatingBadge.text}</span>
        </div>
      )}

      {/* TOP BAR: MULTI-SELECT CHECKBOX & LEVEL BADGE / HAND RAISED */}
      <div className="flex items-center justify-between w-full mb-1.5 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(p.studentId);
          }}
          className="p-1 -m-1 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded-xl transition-all min-h-[34px] min-w-[34px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-90"
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
          {/* Level short label badge */}
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
              className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-xs flex items-center gap-1 animate-bounce shadow-xs ring-1 ring-white/80"
              title="Đang giơ tay phát biểu"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Giơ tay</span>
            </div>
          )}
        </div>
      </div>

      {/* BODY: CLICK TO OPEN FOCUS MODAL */}
      <div
        onClick={() => onSelectCard(st, p)}
        className="flex flex-col items-center text-center cursor-pointer py-1 group/avatar focus:outline-none flex-1 justify-center relative"
      >
        {/* AVATAR WITH LEVEL-COLORED GLOW RING */}
        <div className="relative mb-2">
          {presentation?.avatarAsset.assetUrl ? (
            <div
              style={{ borderColor: theme.avatarRing }}
              className="w-15 h-15 sm:w-16 sm:h-16 rounded-full border-3 bg-white/90 dark:bg-slate-800/90 p-1 shadow-md overflow-hidden flex items-center justify-center transition-all duration-300 group-hover/avatar:scale-108 group-hover/avatar:shadow-lg"
            >
              <img
                src={presentation.avatarAsset.assetUrl}
                alt={presentation.avatarAsset.altText}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          ) : (
            <StudentAvatar
              student={st}
              score={effectivePoints}
              globalActiveThemeId={globalActiveThemeId}
              size="fluid"
              shape="circle"
              className="shadow-md transition-all duration-300 group-hover/avatar:scale-108"
            />
          )}

          {p.attendanceStatus === 'absent' && (
            <span className="absolute -bottom-1 -right-1 px-2 py-0.2 bg-rose-600 text-white text-[10px] font-black rounded-full shadow-md ring-2 ring-white">
              Vắng
            </span>
          )}
          {p.attendanceStatus === 'late' && (
            <span className="absolute -bottom-1 -right-1 px-2 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-md ring-2 ring-white">
              Muộn
            </span>
          )}
        </div>

        {/* Student Full Name (Supports 2 lines, High contrast) */}
        <h4
          style={{ color: theme.textPrimary }}
          className="student-name-text font-black text-sm sm:text-base tracking-tight leading-snug line-clamp-2 w-full px-1 drop-shadow-2xs"
          title={st.fullName}
        >
          {st.fullName}
        </h4>

        {/* Roll Number or Code */}
        <p style={{ color: theme.textSecondary }} className="student-code-text text-xs font-mono font-bold opacity-80 mt-0.5">
          STT: {effectiveRollNumber} {st.studentCode ? `• ${st.studentCode}` : ''}
        </p>

        {/* STATS CHIPS: POINTS & SPEECH COUNT */}
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          {/* Points Pill */}
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-black font-mono shadow-2xs transition-all',
              effectivePoints > 0
                ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/80 shadow-emerald-500/10'
                : effectivePoints < 0
                ? 'bg-rose-100/90 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300/80'
                : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            )}
            title="Điểm thi đua trong tiết"
          >
            {effectivePoints > 0 ? `+${effectivePoints}` : effectivePoints} đ
          </span>

          {/* Participation Talk Pill */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              onIncrementTalk(p.studentId);
            }}
            className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/60 dark:to-yellow-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 font-mono cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xs"
            title="Số lần phát biểu (Click để +1)"
          >
            🗣️ {spokeCount}
          </span>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="student-card-actions flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAward(p.studentId, 1, 'Học tập tốt / Phát biểu');
          }}
          disabled={isSubmitting}
          className="quick-btn flex-1 py-1.5 px-1 rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/80 text-blue-700 hover:from-blue-600 hover:to-blue-700 hover:text-white font-black text-xs transition-all border border-blue-200/80 min-h-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
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
          className="quick-btn flex-1 py-1.5 px-1 rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100/80 text-emerald-700 hover:from-emerald-600 hover:to-emerald-700 hover:text-white font-black text-xs transition-all border border-emerald-200/80 min-h-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
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
          className="quick-btn flex-1 py-1.5 px-1 rounded-xl bg-gradient-to-b from-purple-50 to-purple-100/80 text-purple-700 hover:from-purple-600 hover:to-purple-700 hover:text-white font-black text-xs transition-all border border-purple-200/80 min-h-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
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
          className="quick-btn p-1.5 rounded-xl bg-gradient-to-b from-rose-50 to-rose-100/80 text-rose-600 hover:from-rose-600 hover:to-rose-700 hover:text-white transition-all border border-rose-200/80 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs font-black text-sm"
          title="Trừ điểm nề nếp (-1 / -2 / -5)"
        >
          -
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenCustomPoint(p.studentId);
          }}
          disabled={isSubmitting}
          className="quick-btn p-1.5 rounded-xl bg-white hover:bg-slate-700 hover:text-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-all border border-slate-200/90 dark:border-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
          title="Tùy chỉnh điểm & lý do khác"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

StudentCard.displayName = 'StudentCard';
