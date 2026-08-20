import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Volume2, VolumeX, Sparkles, Clock, Eye, Sliders, Play } from 'lucide-react';
import type { PromotionCelebrationSettings } from '../hooks/usePromotionQueue';

export interface PromotionCelebrationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PromotionCelebrationSettings;
  onSave: (newSettings: Partial<PromotionCelebrationSettings>) => Promise<void>;
  onPreviewDemo?: () => void;
}

export const PromotionCelebrationSettingsModal: React.FC<PromotionCelebrationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onPreviewDemo,
}) => {
  const [mode, setMode] = useState(settings.mode);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [showPoints] = useState(settings.showPoints);
  const [showPreviousRank, setShowPreviousRank] = useState(settings.showPreviousRank);
  const [confettiEnabled, setConfettiEnabled] = useState(settings.confettiEnabled);
  const [durationMs, setDurationMs] = useState(settings.durationMs || 4500);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        mode,
        soundEnabled,
        showPoints,
        showPreviousRank,
        confettiEnabled,
        durationMs,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cấu Hình Chúc Mừng Thăng Hạng">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 text-sm">
        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Chế độ trình chiếu chúc mừng
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('MANUAL')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                mode === 'MANUAL'
                  ? 'border-app-primary bg-app-primary-light/40 text-app-primary font-bold shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="text-xs font-extrabold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Thủ công (Khuyên dùng)
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1 leading-snug">
                Giáo viên chủ động bấm nút để phát màn chúc mừng khi thích hợp.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('AUTOMATIC')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                mode === 'AUTOMATIC'
                  ? 'border-app-primary bg-app-primary-light/40 text-app-primary font-bold shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="text-xs font-extrabold flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Tự động phát
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1 leading-snug">
                Tự động xếp hàng và phát lần lượt sau mỗi lượt cộng điểm.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('OFF')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                mode === 'OFF'
                  ? 'border-app-primary bg-app-primary-light/40 text-app-primary font-bold shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="text-xs font-extrabold flex items-center gap-1.5 text-slate-700">
                Tắt chúc mừng
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-1 leading-snug">
                Vẫn tính thăng cấp nhưng không hiển thị màn hình chúc mừng.
              </p>
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${soundEnabled ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Âm thanh chúc mừng (Fanfare)</p>
                <p className="text-[11px] text-slate-500">Phát âm thanh hào hứng trên màn hình trình chiếu</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
            </label>
          </div>

          {/* Confetti Toggle */}
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${confettiEnabled ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'}`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Hiệu ứng pháo giấy (Confetti)</p>
                <p className="text-[11px] text-slate-500">Tạo không khí sôi nổi và hào hứng cho tiết học</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={confettiEnabled}
                onChange={(e) => setConfettiEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
            </label>
          </div>

          {/* Show Previous Rank */}
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Hiển thị cấp cũ ➔ cấp mới</p>
                <p className="text-[11px] text-slate-500">Ghi nhận tiến bộ cá nhân của học sinh</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPreviousRank}
                onChange={(e) => setShowPreviousRank(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
            </label>
          </div>
        </div>

        {/* Duration Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Thời gian hiển thị chúc mừng
            </label>
            <span className="font-mono text-xs font-extrabold text-app-primary">
              {(durationMs / 1000).toFixed(1)} giây
            </span>
          </div>
          <input
            type="range"
            min={3000}
            max={8000}
            step={500}
            value={durationMs}
            onChange={(e) => setDurationMs(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-app-primary"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>3.0s</span>
            <span>4.5s (Chuẩn)</span>
            <span>8.0s</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          {onPreviewDemo ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
              onClick={onPreviewDemo}
            >
              Xem trước Demo
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
