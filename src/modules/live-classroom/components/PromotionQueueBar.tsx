import React from 'react';
import type { RankPromotionEvent } from '../../../core/database/types';
import { Button } from '../../../shared/components/Button';
import { EmulationRankInsignia } from '../../../shared/components/EmulationRankBadge';
import { Sparkles, Tv, SkipForward, Settings, ChevronRight } from 'lucide-react';

export interface PromotionQueueBarProps {
  pendingEvents: RankPromotionEvent[];
  currentEvent: RankPromotionEvent | null;
  isBroadcasting: boolean;
  onShowEvent: (event: RankPromotionEvent) => void;
  onSkipEvent: (event: RankPromotionEvent) => void;
  onSkipAll: () => void;
  onOpenSettings: () => void;
}

export const PromotionQueueBar: React.FC<PromotionQueueBarProps> = ({
  pendingEvents,
  currentEvent,
  isBroadcasting,
  onShowEvent,
  onSkipEvent,
  onSkipAll,
  onOpenSettings,
}) => {
  if (!currentEvent || pendingEvents.length === 0) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/80 to-yellow-50 border-2 border-amber-300/80 shadow-md animate-fadeIn flex flex-col md:flex-row items-center justify-between gap-3 text-slate-800">
      {/* Left info */}
      <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
        <div className="p-2 rounded-xl bg-amber-400/90 text-amber-950 shadow-xs shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span className="font-extrabold text-xs">
            {pendingEvents.length} Thăng hạng
          </span>
        </div>

        {/* Current Event Target */}
        <div className="flex items-center gap-2 min-w-0">
          <EmulationRankInsignia level={currentEvent.toLevel} size="sm" className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-extrabold text-slate-900 text-sm truncate">
                {currentEvent.toRankName}
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 shrink-0">
                +{currentEvent.levelsGained} cấp
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate flex items-center gap-1">
              <span>{currentEvent.fromRankName}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <strong className="text-slate-800">{currentEvent.toRankName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
        {pendingEvents.length >= 2 && (
          <button
            type="button"
            onClick={onSkipAll}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-700 px-2 py-1 transition-colors"
            title="Bỏ qua toàn bộ hàng đợi thăng hạng"
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
          Trình chiếu chúc mừng
        </Button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl border border-amber-300 hover:bg-amber-200/60 text-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors shadow-xs"
          title="Cấu hình chế độ chúc mừng"
          aria-label="Cài đặt chúc mừng"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
