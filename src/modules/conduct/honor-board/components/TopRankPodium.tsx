import React from 'react';
import { StudentAvatar } from '../../../../shared/components/StudentAvatar';
import type { HonorBoardRecipientDetail } from '../../../../core/services/honor-board.service';
import type { GlobalAvatarSystemSettings } from '../../../../core/types/avatar-theme.types';
import { Crown, Trophy, Medal, Sparkles } from 'lucide-react';
import { cn } from '../../../../shared/utilities/cn';

export interface TopRankPodiumProps {
  podiumRecipients: HonorBoardRecipientDetail[];
  showPointValues?: boolean;
  globalActiveThemeId?: string | null;
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
}

export const TopRankPodium: React.FC<TopRankPodiumProps> = ({
  podiumRecipients,
  showPointValues = false,
  globalActiveThemeId,
  globalSettings,
  uploadedAssetUrls,
}) => {
  // Find Rank 1, 2, 3
  const rank1 = podiumRecipients.find((r) => r.position === 1) || podiumRecipients[0];
  const rank2 = podiumRecipients.find((r) => r.position === 2) || podiumRecipients[1];
  const rank3 = podiumRecipients.find((r) => r.position === 3) || podiumRecipients[2];

  if (!rank1 && !rank2 && !rank3) {
    return null;
  }

  const renderPodiumPillar = (
    recipient: HonorBoardRecipientDetail | undefined,
    position: 1 | 2 | 3
  ) => {
    if (!recipient) {
      return (
        <div className="flex-1 flex flex-col items-center justify-end opacity-40">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
            Trống
          </div>
          <div className={cn(
            'w-full mt-3 rounded-t-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400',
            position === 1 ? 'h-40' : position === 2 ? 'h-32' : 'h-24'
          )}>
            Vị trí {position}
          </div>
        </div>
      );
    }

    const isRank1 = position === 1;
    const isRank2 = position === 2;
    const isRank3 = position === 3;

    return (
      <div className={cn(
        'flex-1 flex flex-col items-center justify-end transition-all',
        isRank1 ? 'z-20 -mt-4' : 'z-10'
      )}>
        {/* AVATAR & BADGE BADGE */}
        <div className="relative flex flex-col items-center text-center mb-2.5">
          {/* CROWN / MEDAL ICON */}
          {isRank1 && (
            <div className="mb-1 p-1.5 rounded-full bg-amber-400 text-amber-950 shadow-md animate-bounce">
              <Crown className="w-5 h-5 fill-current" />
            </div>
          )}
          {isRank2 && (
            <div className="mb-1 p-1 rounded-full bg-slate-200 text-slate-700 shadow-xs">
              <Medal className="w-4 h-4" />
            </div>
          )}
          {isRank3 && (
            <div className="mb-1 p-1 rounded-full bg-amber-700/20 text-amber-800 shadow-xs">
              <Trophy className="w-4 h-4 text-amber-700" />
            </div>
          )}

          {/* AVATAR */}
          <div className="relative">
            <StudentAvatar
              student={recipient.student}
              score={recipient.pointsAtAward ?? recipient.metricValue}
              globalActiveThemeId={globalActiveThemeId}
              globalSettings={globalSettings}
              uploadedAssetUrls={uploadedAssetUrls}
              size={isRank1 ? '2xl' : 'xl'}
              shape="circle"
              className={cn(
                'border-2 shadow-md group-hover:scale-105 transition-transform',
                isRank1
                  ? 'border-amber-400 ring-4 ring-amber-400/30'
                  : isRank2
                  ? 'border-slate-300 ring-2 ring-slate-300/30'
                  : 'border-amber-600/40 ring-2 ring-amber-600/20'
              )}
            />

            {/* POSITION BADGE */}
            <span className={cn(
              'absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-xs whitespace-nowrap',
              isRank1 ? 'bg-amber-500' : isRank2 ? 'bg-slate-600' : 'bg-amber-700'
            )}>
              Hạng {position}
            </span>
          </div>

          {/* STUDENT NAME & RANK */}
          <div className="mt-3.5 px-1 max-w-[130px]">
            <p className="text-xs sm:text-sm font-extrabold text-app-main truncate">
              {recipient.student?.fullName || 'Học sinh'}
            </p>
            <p className="text-[11px] font-bold text-app-primary truncate">
              {recipient.rankNameAtAward}
            </p>
            {showPointValues && recipient.pointsAtAward !== null && (
              <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                {recipient.pointsAtAward} đ
              </span>
            )}
          </div>
        </div>

        {/* PODIUM PILLAR */}
        <div className={cn(
          'w-full rounded-t-3xl border-t-2 border-x border-b-0 flex flex-col items-center justify-center p-3 text-center transition-all shadow-md',
          isRank1
            ? 'h-40 bg-gradient-to-b from-amber-200/90 via-amber-100/70 to-amber-50/40 border-amber-300 text-amber-950 dark:from-amber-900/60 dark:to-amber-950/30 dark:text-amber-100'
            : isRank2
            ? 'h-32 bg-gradient-to-b from-slate-200/90 via-slate-100/70 to-slate-50/40 border-slate-300 text-slate-900 dark:from-slate-800/60 dark:to-slate-900/30 dark:text-slate-100'
            : 'h-24 bg-gradient-to-b from-orange-200/80 via-orange-100/60 to-orange-50/40 border-orange-300 text-orange-950 dark:from-orange-950/60 dark:to-orange-900/30 dark:text-orange-100'
        )}>
          <span className="text-2xl sm:text-3xl font-black font-mono opacity-80">{position}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">
            {isRank1 ? 'Quán quân' : isRank2 ? 'Á quân 1' : 'Á quân 2'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-50/40 via-app-surface to-app-surface border border-amber-200/80 dark:border-amber-900/40 shadow-sm space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300/80 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Bục Vinh Danh Cấp Bậc
        </div>
        <h3 className="text-lg sm:text-xl font-black text-app-main">
          Dẫn Đầu Cấp Bậc Thi Đua
        </h3>
        <p className="text-xs text-app-muted max-w-md mx-auto">
          Tôn vinh 3 chiến sĩ nhỏ đạt cấp bậc và điểm thi đua xuất sắc nhất lớp
        </p>
      </div>

      {/* DESKTOP PODIUM (3 COLUMNS: 2 - 1 - 3) */}
      <div className="hidden sm:flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto pt-6 min-h-[300px]">
        {renderPodiumPillar(rank2, 2)}
        {renderPodiumPillar(rank1, 1)}
        {renderPodiumPillar(rank3, 3)}
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="sm:hidden space-y-3">
        {[rank1, rank2, rank3].filter(Boolean).map((item, idx) => {
          const pos = (idx + 1) as 1 | 2 | 3;
          return (
            <div
              key={item!.id}
              className={cn(
                'p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xs',
                pos === 1
                  ? 'bg-amber-50/80 border-amber-300'
                  : pos === 2
                  ? 'bg-slate-50/80 border-slate-300'
                  : 'bg-orange-50/80 border-orange-200'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  'w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0',
                  pos === 1 ? 'bg-amber-500' : pos === 2 ? 'bg-slate-600' : 'bg-amber-700'
                )}>
                  {pos}
                </span>
                <StudentAvatar
                  student={item!.student}
                  score={item!.pointsAtAward ?? item!.metricValue}
                  globalActiveThemeId={globalActiveThemeId}
                  globalSettings={globalSettings}
                  uploadedAssetUrls={uploadedAssetUrls}
                  size="sm"
                  className="border border-app shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-app-main truncate">{item!.student?.fullName}</p>
                  <p className="text-[11px] text-app-muted truncate">{item!.rankNameAtAward}</p>
                </div>
              </div>

              {showPointValues && item!.pointsAtAward !== null && (
                <span className="text-xs font-mono font-bold text-emerald-600 shrink-0">
                  {item!.pointsAtAward} đ
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
