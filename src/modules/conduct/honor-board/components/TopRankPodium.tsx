import React, { useState } from 'react';
import { StudentAvatar } from '../../../../shared/components/StudentAvatar';
import type { HonorBoardRecipientDetail } from '../../../../core/services/honor-board.service';
import type { GlobalAvatarSystemSettings } from '../../../../core/types/avatar-theme.types';
import { playPromotionFanfare } from '../../../../shared/utilities/sound';
import { Crown, Trophy, Medal, Sparkles, Tv, Volume2, VolumeX, Award } from 'lucide-react';
import { cn } from '../../../../shared/utilities/cn';

export interface TopRankPodiumProps {
  podiumRecipients: HonorBoardRecipientDetail[];
  showPointValues?: boolean;
  globalActiveThemeId?: string | null;
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
  onOpenPresentation?: () => void;
  periodContextTitle?: string;
}

export const TopRankPodium: React.FC<TopRankPodiumProps> = ({
  podiumRecipients,
  showPointValues = true,
  globalActiveThemeId,
  globalSettings,
  uploadedAssetUrls,
  onOpenPresentation,
  periodContextTitle,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Find Rank 1, 2, 3
  const rank1 = podiumRecipients.find((r) => r.position === 1) || podiumRecipients[0];
  const rank2 = podiumRecipients.find((r) => r.position === 2) || podiumRecipients[1];
  const rank3 = podiumRecipients.find((r) => r.position === 3) || podiumRecipients[2];

  const handleSoundCelebrate = () => {
    playPromotionFanfare(soundEnabled);
  };

  // Empty state when no recipients exist
  if (!rank1 && !rank2 && !rank3) {
    return (
      <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-50/50 via-app-surface to-app-surface border border-amber-200/80 dark:border-amber-900/40 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 mx-auto flex items-center justify-center shadow-inner">
          <Trophy className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base sm:text-lg font-black text-app-main">
            Chưa Có Dữ Liệu Bục Vinh Danh Top 3
          </h3>
          <p className="text-xs text-app-muted">
            Hãy chấm điểm thi đua và tạo bảng vàng để vinh danh 3 gương mặt xuất sắc nhất trên bục trao giải.
          </p>
        </div>
      </div>
    );
  }

  const renderPodiumPillar = (
    recipient: HonorBoardRecipientDetail | undefined,
    position: 1 | 2 | 3
  ) => {
    if (!recipient) {
      return (
        <div className="flex-1 min-w-0 flex flex-col items-center justify-end opacity-35 max-w-[220px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[340px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
            Trống
          </div>
          <div className={cn(
            'w-full mt-4 rounded-t-3xl border-t-2 border-x border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 flex flex-col items-center justify-center text-xs font-bold text-slate-400 shadow-inner',
            position === 1
              ? 'h-44 sm:h-52 md:h-60 lg:h-68'
              : position === 2
              ? 'h-32 sm:h-38 md:h-44 lg:h-50'
              : 'h-24 sm:h-28 md:h-32 lg:h-38'
          )}>
            <span className="text-xl sm:text-2xl font-black font-mono">{position}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Hạng {position}</span>
          </div>
        </div>
      );
    }

    const isRank1 = position === 1;
    const isRank2 = position === 2;
    const isRank3 = position === 3;

    return (
      <div
        className={cn(
          'flex-1 min-w-0 flex flex-col items-center justify-end transition-all max-w-[220px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[340px] group select-none',
          isRank1 ? 'z-20 -mt-6' : 'z-10'
        )}
      >
        {/* CHARACTER STAGE PLATFORM (AVATAR + NAME + RANK + BADGE) */}
        <div className="relative flex flex-col items-center text-center mb-3 w-full px-1">
          {/* RADIANT AURA FOR RANK 1 */}
          {isRank1 && (
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-36 sm:h-44 rounded-full bg-gradient-to-tr from-amber-400/35 via-yellow-300/30 to-amber-500/20 blur-xl pointer-events-none animate-aura-pulse"
              aria-hidden="true"
            />
          )}

          {/* CROWN / TROPHY / MEDAL BADGE ON TOP */}
          {isRank1 && (
            <div className="relative mb-1.5 flex items-center justify-center">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-amber-950 shadow-lg ring-2 ring-white/80 animate-crown-float cursor-pointer"
                title="Quán quân thi đua"
                onClick={handleSoundCelebrate}
              >
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-100 stroke-amber-950" />
              </div>
            </div>
          )}

          {isRank2 && (
            <div className="mb-1.5 p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-800 shadow-md ring-1 ring-white/80">
              <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </div>
          )}

          {isRank3 && (
            <div className="mb-1.5 p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-amber-100 shadow-md ring-1 ring-white/60">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
            </div>
          )}

          {/* AVATAR EMBEDDED DIRECTLY ON PEDESTAL */}
          <div className="relative">
            <StudentAvatar
              student={recipient.student}
              score={recipient.pointsAtAward}
              rankLevelOrOrder={recipient.rankLevelAtAward}
              preferRankAvatar={true}
              globalActiveThemeId={globalActiveThemeId}
              globalSettings={globalSettings}
              uploadedAssetUrls={uploadedAssetUrls}
              size={isRank1 ? '2xl' : 'xl'}
              shape="circle"
              className={cn(
                'transition-all duration-300 group-hover:scale-105',
                isRank1
                  ? 'border-4 border-amber-300 ring-4 ring-amber-400/40 shadow-xl'
                  : isRank2
                  ? 'border-3 border-slate-200 ring-3 ring-slate-300/40 shadow-lg'
                  : 'border-3 border-amber-600/70 ring-2 ring-amber-600/30 shadow-md'
              )}
            />

            {/* POSITION PILL BADGE */}
            <span
              className={cn(
                'absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md whitespace-nowrap flex items-center gap-1',
                isRank1
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 ring-2 ring-white/80'
                  : isRank2
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 ring-1 ring-white/60'
                  : 'bg-gradient-to-r from-amber-700 to-orange-800 ring-1 ring-white/60'
              )}
            >
              {isRank1 && <Sparkles className="w-2.5 h-2.5 text-yellow-200" />}
              Hạng {position}
            </span>
          </div>

          {/* STUDENT NAME (SUPPORTS 2 LINES, NEVER TRUNCATE EARLY) */}
          <div className="mt-3.5 px-1 w-full max-w-[170px] sm:max-w-[210px] md:max-w-[260px] flex flex-col items-center">
            <h4
              className={cn(
                'font-extrabold text-app-main tracking-tight leading-snug line-clamp-2',
                isRank1 ? 'text-xs sm:text-sm md:text-base font-black' : 'text-xs sm:text-sm'
              )}
              title={recipient.student?.fullName || 'Học sinh'}
            >
              {recipient.student?.fullName || 'Học sinh'}
            </h4>

            {/* RANK & SCORE PILL */}
            <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
              <span className={cn(
                'text-[11px] sm:text-xs font-bold truncate max-w-[140px]',
                isRank1 ? 'text-amber-700 dark:text-amber-300' : 'text-app-primary'
              )}>
                {recipient.rankNameAtAward}
              </span>

              {showPointValues && recipient.pointsAtAward !== null && recipient.pointsAtAward !== undefined && (
                <>
                  <span className="text-[10px] text-app-muted opacity-60">•</span>
                  <span className="font-mono text-[10px] sm:text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md shadow-2xs">
                    {recipient.pointsAtAward} đ
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3D-SIMULATED CEREMONIAL PODIUM PILLAR */}
        <div className="w-full flex flex-col items-center">
          {/* PODIUM STEP PLATFORM (LANDING SURFACE) */}
          <div
            className={cn(
              'w-full h-3 sm:h-3.5 rounded-t-2xl border-t-2 border-x shadow-xs transition-colors',
              isRank1
                ? 'bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 border-amber-100 shadow-[0_-3px_12px_rgba(245,158,11,0.45)]'
                : isRank2
                ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border-slate-100 shadow-[0_-2px_8px_rgba(148,163,184,0.35)]'
                : 'bg-gradient-to-b from-orange-600 via-amber-700 to-orange-800 border-amber-400/50 shadow-[0_-2px_8px_rgba(180,83,9,0.3)]'
            )}
          />

          {/* PODIUM PILLAR MAIN BODY */}
          <div
            className={cn(
              'w-full border-x border-b-0 flex flex-col items-center justify-between p-3 sm:p-4 text-center transition-all relative overflow-hidden shadow-lg',
              isRank1
                ? 'h-44 sm:h-52 md:h-60 lg:h-68 bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 border-amber-300/80 text-amber-950 dark:from-amber-600 dark:via-amber-700 dark:to-yellow-800 dark:text-amber-50'
                : isRank2
                ? 'h-32 sm:h-38 md:h-44 lg:h-50 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-slate-300/80 text-slate-800 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100'
                : 'h-24 sm:h-28 md:h-32 lg:h-38 bg-gradient-to-b from-amber-700 via-orange-800 to-amber-950 border-amber-600/70 text-amber-50 dark:from-amber-900 dark:via-orange-950 dark:to-slate-950 dark:text-amber-100'
            )}
          >
            {/* SHIMMER LIGHT EFFECT */}
            <div className="absolute inset-0 shimmer-gold-effect opacity-40 pointer-events-none" />

            {/* LARGE EMBOSSED RANK NUMBER */}
            <div className="relative z-10 my-auto flex flex-col items-center">
              <span
                className={cn(
                  'font-black font-mono leading-none tracking-tighter drop-shadow-md select-none',
                  isRank1
                    ? 'text-4xl sm:text-5xl md:text-6xl text-amber-950/90 dark:text-amber-100'
                    : isRank2
                    ? 'text-3xl sm:text-4xl md:text-5xl text-slate-700 dark:text-slate-200'
                    : 'text-3xl sm:text-4xl md:text-5xl text-amber-100'
                )}
              >
                {position}
              </span>
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-black uppercase tracking-widest mt-1 opacity-90 px-2 py-0.5 rounded-full',
                  isRank1
                    ? 'bg-amber-300/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100'
                    : isRank2
                    ? 'bg-slate-100/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                    : 'bg-orange-900/60 text-amber-100'
                )}
              >
                {isRank1 ? 'Quán quân' : isRank2 ? 'Á quân 1' : 'Á quân 2'}
              </span>
            </div>

            {/* PODIUM BASE TRIM */}
            <div className={cn(
              'w-full h-1.5 sm:h-2 rounded-full opacity-60',
              isRank1 ? 'bg-amber-200' : isRank2 ? 'bg-slate-100' : 'bg-amber-400'
            )} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden p-4 sm:p-6 md:p-8 rounded-3xl bg-gradient-to-b from-amber-100/40 via-app-surface to-app-surface border border-amber-200/80 dark:border-amber-900/40 shadow-sm space-y-6 w-full">
      {/* AMBIENT SPOTLIGHT GLOW AT THE TOP */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-48 bg-gradient-to-b from-amber-300/30 via-yellow-200/20 to-transparent blur-3xl pointer-events-none animate-spotlight-glow"
        aria-hidden="true"
      />

      {/* HEADER SECTION WITH TITLE & ACTION BUTTONS */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-amber-200/50 dark:border-amber-900/30">
        <div className="text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 border border-amber-300/80 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
            Bục Vinh Danh Cấp Bậc
          </div>
          <h3 className="text-lg sm:text-2xl font-black text-app-main tracking-tight">
            Dẫn Đầu Cấp Bậc Thi Đua
          </h3>
          <p className="text-xs text-app-muted">
            {periodContextTitle || 'Tôn vinh 3 chiến sĩ nhỏ đạt cấp bậc và điểm thi đua xuất sắc nhất lớp'}
          </p>
        </div>

        {/* STAGE CONTROLS */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playPromotionFanfare(true);
            }}
            className={cn(
              'p-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs',
              soundEnabled
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 dark:bg-slate-800 border-app text-app-muted hover:bg-slate-200'
            )}
            title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
          </button>

          {onOpenPresentation && (
            <button
              type="button"
              onClick={onOpenPresentation}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <Tv className="w-4 h-4" />
              <span>Trình Chiếu Sân Khấu</span>
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP 3D PODIUM (ORDER: 2 - 1 - 3) */}
      <div className="hidden sm:flex items-end justify-center gap-3 sm:gap-6 md:gap-8 lg:gap-10 w-full max-w-4xl lg:max-w-5xl mx-auto pt-4 pb-2 min-h-[320px] sm:min-h-[380px] md:min-h-[420px]">
        {renderPodiumPillar(rank2, 2)}
        {renderPodiumPillar(rank1, 1)}
        {renderPodiumPillar(rank3, 3)}
      </div>

      {/* MOBILE CEREMONIAL CARDS VIEW */}
      <div className="sm:hidden space-y-3 pt-2">
        {[rank1, rank2, rank3].filter(Boolean).map((item, idx) => {
          const pos = (idx + 1) as 1 | 2 | 3;
          const is1 = pos === 1;
          const is2 = pos === 2;

          return (
            <div
              key={item!.id}
              className={cn(
                'p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md relative overflow-hidden transition-all',
                is1
                  ? 'bg-gradient-to-r from-amber-100/90 via-amber-50 to-yellow-100/80 border-amber-300 ring-2 ring-amber-400/30'
                  : is2
                  ? 'bg-gradient-to-r from-slate-100/90 via-slate-50 to-slate-100/80 border-slate-300'
                  : 'bg-gradient-to-r from-orange-100/80 via-amber-50 to-orange-100/60 border-orange-300/80'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* RANK MEDAL BADGE */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-2xl text-white text-sm font-black flex items-center justify-center shrink-0 shadow-md',
                    is1
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-amber-300'
                      : is2
                      ? 'bg-gradient-to-br from-slate-500 to-slate-700 ring-2 ring-slate-300'
                      : 'bg-gradient-to-br from-amber-700 to-orange-900 ring-2 ring-amber-600'
                  )}
                >
                  {is1 ? <Crown className="w-5 h-5 fill-current" /> : pos}
                </div>

                <StudentAvatar
                  student={item!.student}
                  score={item!.pointsAtAward}
                  rankLevelOrOrder={item!.rankLevelAtAward}
                  preferRankAvatar={true}
                  globalActiveThemeId={globalActiveThemeId}
                  globalSettings={globalSettings}
                  uploadedAssetUrls={uploadedAssetUrls}
                  size="md"
                  className="border-2 border-white shrink-0 shadow-sm"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-app-main truncate">{item!.student?.fullName}</p>
                    {is1 && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                        Top 1
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-app-primary truncate">{item!.rankNameAtAward}</p>
                </div>
              </div>

              {showPointValues && item!.pointsAtAward !== null && item!.pointsAtAward !== undefined && (
                <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-1 rounded-xl shadow-2xs shrink-0">
                  {item!.pointsAtAward} đ
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* WINNER CONGRATULATION FOOTER BANNER */}
      {rank1?.student && (
        <div className="pt-2">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-400/20 to-amber-500/10 border border-amber-300/60 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs font-bold text-amber-950 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Xin chúc mừng <strong className="text-amber-800 dark:text-amber-300 underline underline-offset-2">{rank1.student.fullName}</strong> đã xuất sắc dẫn đầu bảng vàng cấp bậc thi đua!
              </span>
            </div>
            <span className="hidden md:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 shrink-0">
              {rank1.rankNameAtAward}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

