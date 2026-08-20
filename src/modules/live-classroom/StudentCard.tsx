import React from 'react';
import { StudentAvatar } from '../../shared/components/StudentAvatar';
import type { LiveClassParticipant, Student } from '../../core/database/types';
import type { AvatarCardTheme, StudentAvatarPresentation } from '../../core/types/avatar-theme.types';
import { Hand, CheckSquare, Square, MoreHorizontal } from 'lucide-react';
import type { UiDensityMode } from '../../shared/hooks/useUiScale';
import { avatarCardThemeService } from '../../core/services/avatar-card-theme.service';

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
        background: `linear-gradient(135deg, ${theme.surfaceStart} 0%, ${theme.surfaceEnd} 100%)`,
        borderColor: isChecked
          ? '#2563eb'
          : isSelected
          ? '#3b82f6'
          : p.handRaised
          ? '#f59e0b'
          : theme.border,
        boxShadow: isChecked || isSelected ? undefined : `0 2px 8px ${theme.shadow}`,
      }}
      className={`student-card-container p-[var(--space-3)] rounded-[var(--card-radius)] border-2 transition-all duration-200 motion-reduce:transition-none hover:shadow-md flex flex-col justify-between relative overflow-hidden select-none min-w-0 ${
        isChecked
          ? 'ring-3 ring-blue-500/50 shadow-md scale-[1.01]'
          : isSelected
          ? 'ring-2 ring-blue-400 shadow-md'
          : p.handRaised
          ? 'ring-2 ring-amber-400/60 shadow-xs'
          : 'hover:-translate-y-0.5'
      } ${p.attendanceStatus === 'absent' ? 'opacity-80 grayscale-[20%]' : ''}`}
    >
      {/* FLOATING BADGE OVERLAY ANIMATION (+1, +2, ⭐) */}
      {floatingBadge && (
        <div className="absolute inset-0 z-20 bg-blue-600/95 text-white font-extrabold text-2xl flex items-center justify-center animate-bounce rounded-2xl shadow-lg">
          {floatingBadge.text}
        </div>
      )}

      {/* TOP BAR: MULTI-SELECT CHECKBOX & LEVEL BADGE / HAND RAISED */}
      <div className="flex items-center justify-between w-full mb-1 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(p.studentId);
          }}
          className="p-1 -m-1 text-slate-500 hover:text-blue-600 rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-blue-500"
          title="Chọn học sinh"
          aria-label={`Chọn học sinh ${st.fullName}`}
        >
          {isChecked ? (
            <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-100" />
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
            className="px-2 py-0.5 rounded-full text-[10px] font-black border tracking-wide uppercase shadow-2xs"
            title={`Cấp avatar: ${presentation?.levelName || levelShortLabel}`}
          >
            {levelShortLabel}
          </span>

          {/* Hand raised indicator */}
          {p.handRaised && (
            <div
              className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-xs flex items-center gap-1 animate-bounce shadow-xs"
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
        className="flex flex-col items-center text-center cursor-pointer py-1 group/avatar focus:outline-none flex-1 justify-center"
      >
        <div className="relative mb-2">
          {presentation?.avatarAsset.assetUrl ? (
            <div
              style={{ borderColor: theme.avatarRing }}
              className="w-14 h-14 rounded-full border-2 bg-white/80 p-0.5 shadow-xs overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover/avatar:scale-105"
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
              className="shadow-xs transition-transform duration-200 group-hover/avatar:scale-105"
            />
          )}

          {p.attendanceStatus === 'absent' && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-xs">
              Vắng
            </span>
          )}
          {p.attendanceStatus === 'late' && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-xs">
              Muộn
            </span>
          )}
        </div>

        {/* Student Full Name */}
        <h4
          style={{ color: theme.textPrimary }}
          className="student-name-text font-bold text-sm sm:text-base line-clamp-1 w-full px-1"
          title={st.fullName}
        >
          {st.fullName}
        </h4>

        {/* Roll Number or Code */}
        <p style={{ color: theme.textSecondary }} className="student-code-text text-xs font-mono mt-0.5">
          STT: {effectiveRollNumber} {st.studentCode ? `• ${st.studentCode}` : ''}
        </p>

        {/* STATS CHIPS: POINTS & SPEECH COUNT */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono transition-colors shadow-2xs ${
              effectivePoints > 0
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : effectivePoints < 0
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-white/80 text-slate-700 border border-slate-200'
            }`}
            title="Điểm thi đua trong tiết"
          >
            {effectivePoints > 0 ? `+${effectivePoints}` : effectivePoints} đ
          </span>

          <span
            onClick={(e) => {
              e.stopPropagation();
              onIncrementTalk(p.studentId);
            }}
            className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 font-mono cursor-pointer hover:bg-amber-200 transition-colors shadow-2xs"
            title="Số lần phát biểu (Click để +1)"
          >
            🗣️ {spokeCount}
          </span>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="student-card-actions flex items-center justify-between gap-1 mt-2 pt-2 border-t border-black/5 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAward(p.studentId, 1, 'Học tập tốt / Phát biểu');
          }}
          disabled={isSubmitting}
          className="quick-btn flex-1 py-1 px-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors border border-blue-200 min-h-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
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
          className="quick-btn flex-1 py-1 px-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-colors border border-emerald-200 min-h-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
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
          className="quick-btn flex-1 py-1 px-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white font-bold text-xs transition-colors border border-purple-200 min-h-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
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
          className="quick-btn p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors border border-red-200 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
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
          className="quick-btn p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-700 hover:text-white transition-colors border border-slate-300 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
          title="Tùy chỉnh điểm & lý do khác"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

StudentCard.displayName = 'StudentCard';
