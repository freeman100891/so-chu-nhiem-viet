import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentAvatar } from '../../../../shared/components/StudentAvatar';
import type { HonorTitle } from '../../../../core/database/types';
import type { HonorBoardRecipientDetail } from '../../../../core/services/honor-board.service';
import type { GlobalAvatarSystemSettings } from '../../../../core/types/avatar-theme.types';
import {
  Trophy,
  Sparkles,
  Zap,
  Award,
  TrendingUp,
  Heart,
  Star,
  ChevronRight,
} from 'lucide-react';

export interface HonorTitleCardProps {
  title: HonorTitle;
  recipients: HonorBoardRecipientDetail[];
  showPointValues?: boolean;
  globalActiveThemeId?: string | null;
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
}

export const HonorTitleCard: React.FC<HonorTitleCardProps> = ({
  title,
  recipients,
  showPointValues = false,
  globalActiveThemeId,
  globalSettings,
  uploadedAssetUrls,
}) => {
  const navigate = useNavigate();

  const getTitleIcon = (iconKey: string) => {
    switch (iconKey) {
      case 'trophy':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-emerald-500" />;
      case 'award':
        return <Award className="w-5 h-5 text-blue-500" />;
      case 'trending_up':
        return <TrendingUp className="w-5 h-5 text-pink-500" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-orange-500" />;
      case 'star':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-app-primary" />;
    }
  };

  if (recipients.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-full p-4 sm:p-5 rounded-3xl bg-app-surface border border-app shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
      {/* TITLE HEADER */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0">
              {getTitleIcon(title.iconKey)}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-app-main leading-tight">{title.name}</h4>
              <span className="text-[10px] font-bold text-app-muted">{recipients.length} học sinh</span>
            </div>
          </div>
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: title.colorToken }}
            title={title.name}
          />
        </div>
        <p className="text-[11px] text-app-muted line-clamp-2 mt-1">{title.description}</p>
      </div>

      {/* RECIPIENTS LIST */}
      <div className="divide-y divide-app/60 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
        {recipients.map((rec) => (
          <div
            key={rec.id}
            onClick={() => rec.student && navigate(`/students/${rec.student.id}`)}
            className="py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <StudentAvatar
                student={rec.student}
                score={rec.pointsAtAward}
                rankLevelOrOrder={rec.rankLevelAtAward}
                preferRankAvatar={true}
                globalActiveThemeId={globalActiveThemeId}
                globalSettings={globalSettings}
                uploadedAssetUrls={uploadedAssetUrls}
                size="sm"
                className="border border-app shrink-0 shadow-2xs"
              />

              <div className="min-w-0">
                <p className="text-xs font-bold text-app-main truncate">{rec.student?.fullName || 'Học sinh'}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-app-muted">
                  <span className="font-semibold text-app-primary">{rec.rankNameAtAward}</span>
                  {rec.metricValue !== null && rec.metricValue !== undefined && (
                    <span className="font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                      {rec.metricValue > 0 ? `+${rec.metricValue}` : rec.metricValue}
                    </span>
                  )}
                </div>
                {rec.reason && (
                  <p className="text-[10px] text-slate-500 italic truncate mt-0.5">{rec.reason}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-app-muted shrink-0">
              {showPointValues && rec.pointsAtAward !== null && (
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {rec.pointsAtAward} đ
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-app-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
