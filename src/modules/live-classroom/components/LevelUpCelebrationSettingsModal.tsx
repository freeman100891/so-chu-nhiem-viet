import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Volume2, VolumeX, Sparkles, Clock, Power, Shield, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import type {
  LevelUpCelebrationIntensity,
  LevelUpCelebrationSettings,
} from '../../../core/types/avatar-theme.types';

export interface LevelUpCelebrationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LevelUpCelebrationSettings;
  onSave: (newSettings: Partial<LevelUpCelebrationSettings>) => Promise<void>;
  onPreviewDemo?: (direction: 'UP' | 'DOWN') => void;
}

export const LevelUpCelebrationSettingsModal: React.FC<LevelUpCelebrationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onPreviewDemo,
}) => {
  const [enabled, setEnabled] = useState(settings.enabled !== false && settings.mode !== 'OFF');
  const [showLevelUp, setShowLevelUp] = useState(settings.showLevelUp !== false);
  const [showLevelDown, setShowLevelDown] = useState(settings.showLevelDown !== false);
  const [levelDownTarget, setLevelDownTarget] = useState<'CONTROLLER_ONLY' | 'PRESENTATION_ALLOWED'>(
    settings.levelDownTarget || 'CONTROLLER_ONLY'
  );
  const [intensity, setIntensity] = useState<LevelUpCelebrationIntensity>(settings.intensity || 'BALANCED');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled !== false);
  const [confettiEnabled, setConfettiEnabled] = useState(settings.confettiEnabled !== false);
  const [durationMs, setDurationMs] = useState(settings.durationMs || 5200);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        enabled,
        mode: enabled ? 'AUTOMATIC' : 'OFF',
        showLevelUp,
        showLevelDown,
        levelDownTarget,
        intensity,
        soundEnabled,
        confettiEnabled,
        durationMs,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cấu Hình Thông Báo Thay Đổi Cấp Bậc Avatar 5 Cấp">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 text-sm">
        {/* MASTER ENABLE TOGGLE */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Power className={`w-4 h-4 ${enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
              Bật thông báo thay đổi cấp bậc tức thời
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Modal xuất hiện ngay sau khi điểm thay đổi vượt ngưỡng, không cần tải lại trang.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <>
            {/* UP & DOWN TOGGLES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* LEVEL UP TOGGLE */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-200 flex items-start justify-between bg-white">
                <div className="pr-2">
                  <span className="font-bold text-xs text-emerald-800 flex items-center gap-1">
                    <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                    Thông báo Thăng Cấp (UP)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mở modal chúc mừng rực rỡ với pháo hoa & âm thanh.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showLevelUp}
                  onChange={(e) => setShowLevelUp(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* LEVEL DOWN TOGGLE */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-200 flex items-start justify-between bg-white">
                <div className="pr-2">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                    <ArrowDownCircle className="w-4 h-4 text-slate-500" />
                    Thông báo Giảm Cấp (DOWN)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mở thông báo trung tính khi điều chỉnh điểm làm giảm cấp.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showLevelDown}
                  onChange={(e) => setShowLevelDown(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-slate-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* LEVEL DOWN TARGET SELECTOR */}
            {showLevelDown && (
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  Phạm vi hiển thị khi Giảm Cấp
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLevelDownTarget('CONTROLLER_ONLY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      levelDownTarget === 'CONTROLLER_ONLY'
                        ? 'border-amber-500 bg-white text-amber-950 shadow-xs'
                        : 'border-transparent text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    Chỉ màn hình giáo viên (Khuyên dùng)
                    <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Bảo vệ tâm lý học sinh, không chiếu lên máy chiếu.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevelDownTarget('PRESENTATION_ALLOWED')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      levelDownTarget === 'PRESENTATION_ALLOWED'
                        ? 'border-amber-500 bg-white text-amber-950 shadow-xs'
                        : 'border-transparent text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    Cho phép chiếu cả Máy chiếu
                    <p className="text-[10px] font-normal text-amber-700 mt-0.5 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      Cần cân nhắc sư phạm.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* INTENSITY SELECTOR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Mức độ hiệu ứng chuyển động
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['FULL', 'BALANCED', 'MINIMAL'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensity(lvl)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      intensity === lvl
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {lvl === 'FULL' ? 'Đầy đủ (Ấn tượng)' : lvl === 'BALANCED' ? 'Cân bằng (Khuyên dùng)' : 'Tối giản (Nhẹ máy)'}
                  </button>
                ))}
              </div>
            </div>

            {/* SOUND & CONFETTI TOGGLES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span className="font-bold text-xs text-slate-700">Âm thanh chúc mừng</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs text-slate-700">Pháo hoa hạt Confetti</span>
                </div>
                <input
                  type="checkbox"
                  checked={confettiEnabled}
                  onChange={(e) => setConfettiEnabled(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* DURATION SLIDER */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Thời gian hiển thị modal
                </label>
                <span className="font-mono font-bold text-indigo-600">{(durationMs / 1000).toFixed(1)} giây</span>
              </div>
              <input
                type="range"
                min="3000"
                max="8000"
                step="500"
                value={durationMs}
                onChange={(e) => setDurationMs(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </>
        )}

        {/* DEMO PREVIEW BUTTONS */}
        {onPreviewDemo && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPreviewDemo('UP')}
              className="flex-1 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Xem thử Demo Thăng Cấp (UP)
            </button>
            <button
              type="button"
              onClick={() => onPreviewDemo('DOWN')}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-slate-600" /> Xem thử Demo Giảm Cấp (DOWN)
            </button>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={saving}>
            Lưu cấu hình
          </Button>
        </div>
      </form>
    </Modal>
  );
};
