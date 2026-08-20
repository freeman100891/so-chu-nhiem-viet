import React from 'react';
import type { LevelUpCelebrationEvent } from '../../../core/database/types';
import { Button } from '../../../shared/components/Button';
import { Sparkles, Tv, SkipForward, Settings, ChevronRight, Play, Award } from 'lucide-react';

export interface LevelUpQueueBarProps {
  pendingEvents: LevelUpCelebrationEvent[];
  currentEvent: LevelUpCelebrationEvent | null;
  isBroadcasting: boolean;
  isSequencePaused?: boolean;
  onShowEvent: (event: LevelUpCelebrationEvent) => void;
  onSkipEvent: (event: LevelUpCelebrationEvent) => void;
  onSkipAll: () => void;
  onResumeSequence?: () => void;
  onOpenSettings: () => void;
}

export const LevelUpQueueBar: React.FC<LevelUpQueueBarProps> = ({
  pendingEvents,
  currentEvent,
  isBroadcasting,
  isSequencePaused,
  onShowEvent,
  onSkipEvent,
  onSkipAll,
  onResumeSequence,
  onOpenSettings,
}) => {
  if (!currentEvent || pendingEvents.length === 0) return null;

  const toLevel = currentEvent.toLevel;
  const fromLevel = currentEvent.fromLevel;

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-2 border-amber-400/80 shadow-md animate-fadeIn flex flex-col md:flex-row items-center justify-between gap-3 text-slate-800">
      {/* LEFT: INFO & LEVEL TRANSITION */}
      <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
        <div className="p-2 rounded-xl bg-amber-400 text-amber-950 shadow-xs shrink-0 flex items-center gap-1.5 font-black text-xs">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>{pendingEvents.length} Thăng cấp</span>
        </div>

        {/* Current Student Target */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar Thumbnail */}
          <div
            className="w-9 h-9 rounded-full overflow-hidden border-2 shadow-xs shrink-0 bg-white flex items-center justify-center"
            style={{ borderColor: toLevel.cardBaseColor || '#f59e0b' }}
          >
            {toLevel.avatarAssetUrl ? (
              <img
                src={toLevel.avatarAssetUrl}
                alt={toLevel.levelName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Award className="w-5 h-5 text-amber-600" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-extrabold text-slate-900 text-sm truncate">
                {toLevel.levelShortLabel} • {toLevel.levelName}
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-950 shrink-0">
                +{currentEvent.levelsGained} cấp
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate flex items-center gap-1">
              <span>{fromLevel.levelShortLabel}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <strong className="text-slate-900">{toLevel.levelShortLabel} ({toLevel.levelName})</strong>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: ACTION BUTTONS */}
      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
        {isSequencePaused && onResumeSequence && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-xs"
            leftIcon={<Play className="w-3.5 h-3.5 text-blue-600" />}
            onClick={onResumeSequence}
            title="Tiếp tục tự động phát"
          >
            Tiếp tục phát ({pendingEvents.length})
          </Button>
        )}

        {pendingEvents.length >= 2 && (
          <button
            type="button"
            onClick={onSkipAll}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-700 px-2 py-1 transition-colors"
            title="Bỏ qua tất cả lượt chúc mừng đang chờ"
          >
            Bỏ qua tất cả ({pendingEvents.length})
          </button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:bg-amber-200/50 hover:text-slate-900 text-xs min-h-[36px]"
          leftIcon={<SkipForward className="w-3.5 h-3.5" />}
          onClick={() => onSkipEvent(currentEvent)}
          disabled={isBroadcasting}
          title="Bỏ qua học sinh này"
        >
          Bỏ qua
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs text-xs min-h-[36px]"
          leftIcon={<Tv className="w-4 h-4" />}
          onClick={() => onShowEvent(currentEvent)}
          isLoading={isBroadcasting}
          title="Phát màn chúc mừng lên màn hình trình chiếu"
        >
          {isBroadcasting ? 'Đang phát...' : 'Trình chiếu chúc mừng'}
        </Button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-amber-200/40 transition-colors"
          title="Cấu hình chúc mừng thăng cấp"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
