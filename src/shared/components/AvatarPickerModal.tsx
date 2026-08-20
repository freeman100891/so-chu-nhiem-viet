import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  avatarCatalogService,
  AVATAR_CATEGORIES,
} from '../../core/services/avatar-catalog.service';
import {
  avatarThemeRegistry,
  resolveAvatarProgressLevel,
  DEFAULT_AVATAR_THEME_ID,
} from '../../core/services/avatar-theme-registry';
import {
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  CheckCircle2,
  Shield,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '../utilities/cn';

export interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAvatar?: (avatarKey: string | null) => void | Promise<void>;
  onSelectTheme?: (themeId: string | null, avatarKey?: string | null) => void | Promise<void>;
  currentAvatarThemeId?: string | null;
  currentAvatarKey?: string | null;
  defaultAvatarKey?: string | null;
  rankLevelOrOrder?: number | null;
  title?: string;
  studentName?: string;
  allowResetToDefault?: boolean;
  isSettingDefaultMode?: boolean;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAvatar,
  onSelectTheme,
  currentAvatarThemeId = null,
  currentAvatarKey = null,
  defaultAvatarKey: _defaultAvatarKey = 'default/default-student',
  rankLevelOrOrder = 1,
  title = 'Chọn Avatar cho Học sinh',
  studentName,
  allowResetToDefault = true,
  isSettingDefaultMode = false,
}) => {
  // Modes: 'progressive_themes' | 'legacy_gallery'
  const [activeTab, setActiveTab] = useState<'progressive_themes' | 'legacy_gallery'>(
    currentAvatarThemeId || (!currentAvatarKey && !isSettingDefaultMode)
      ? 'progressive_themes'
      : 'legacy_gallery'
  );

  const progressLevel = useMemo(() => resolveAvatarProgressLevel(rankLevelOrOrder), [rankLevelOrOrder]);

  const themes = useMemo(() => avatarThemeRegistry.getActiveThemes(), []);

  // Theme selection state
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    currentAvatarThemeId || DEFAULT_AVATAR_THEME_ID
  );

  // Legacy gallery selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLegacyKey, setSelectedLegacyKey] = useState<string | null>(currentAvatarKey);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialTheme = currentAvatarThemeId || DEFAULT_AVATAR_THEME_ID;
      setSelectedThemeId(initialTheme);
      setSelectedLegacyKey(currentAvatarKey);
      setSearchQuery('');
      setSelectedCategory('all');
      setIsSubmitting(false);

      if (currentAvatarThemeId || (!currentAvatarKey && !isSettingDefaultMode)) {
        setActiveTab('progressive_themes');
      } else {
        setActiveTab('legacy_gallery');
      }
    }
  }, [isOpen, currentAvatarThemeId, currentAvatarKey, isSettingDefaultMode]);

  // Selected Theme Details
  const focusedTheme = useMemo(() => {
    return avatarThemeRegistry.getThemeById(selectedThemeId) || themes[0]!;
  }, [selectedThemeId, themes]);

  // Current Stage of the focused theme
  const currentThemeStage = useMemo(() => {
    return focusedTheme.stages.find((s) => s.level === progressLevel) || focusedTheme.stages[0]!;
  }, [focusedTheme, progressLevel]);

  // Current Stage Asset URL
  const currentStageAssetUrl = useMemo(() => {
    return avatarCatalogService.resolveAvatar(currentThemeStage.assetKey);
  }, [currentThemeStage]);

  // Filtered legacy avatars
  const filteredLegacyAvatars = useMemo(() => {
    return avatarCatalogService.search(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleApply = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (activeTab === 'progressive_themes') {
        if (onSelectTheme) {
          await onSelectTheme(selectedThemeId, null);
        } else if (onSelectAvatar) {
          await onSelectAvatar(currentThemeStage.assetKey);
        }
      } else {
        if (onSelectTheme) {
          await onSelectTheme(null, selectedLegacyKey);
        }
        if (onSelectAvatar) {
          await onSelectAvatar(selectedLegacyKey);
        }
      }
      onClose();
    } catch (err) {
      console.error('Error applying avatar:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToDefault = async () => {
    if (isSubmitting) return;
    setSelectedThemeId(DEFAULT_AVATAR_THEME_ID);
    setSelectedLegacyKey(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div>
            {allowResetToDefault && !isSettingDefaultMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-4 h-4 text-amber-600" />}
                onClick={handleResetToDefault}
                disabled={isSubmitting}
                className="text-xs"
              >
                Đặt lại Mặc định
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={handleApply}
              isLoading={isSubmitting}
            >
              Lưu Avatar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* TAB SWITCHER */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('progressive_themes')}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all',
              activeTab === 'progressive_themes'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Chủ đề Tiến trình (5 Cấp)</span>
            <Badge variant="primary" className="text-[10px] py-0 px-1.5 bg-blue-100 text-blue-800 hidden sm:inline-flex">
              Tự động tiến hóa
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legacy_gallery')}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all',
              activeTab === 'legacy_gallery'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <span>Bộ sưu tập Tĩnh (31 Icon)</span>
          </button>
        </div>

        {/* TAB 1: PROGRESSIVE THEMES (FEAT-STUD-005) */}
        {activeTab === 'progressive_themes' && (
          <div className="space-y-4">
            {/* HERO PREVIEW CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={currentStageAssetUrl}
                  alt={currentThemeStage.altText}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 p-1.5 backdrop-blur-xs border-2 border-white/30 shadow-lg object-contain"
                />
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-md">
                  Cấp {progressLevel}/5
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-extrabold text-lg md:text-xl">{focusedTheme.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold text-yellow-200">
                    {currentThemeStage.name}
                  </span>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed max-w-md">
                  {currentThemeStage.description}
                </p>
                <p className="text-[11px] text-amber-200 font-semibold pt-1">
                  ✨ Học sinh: <span className="font-extrabold text-white">{studentName || 'Học sinh'}</span> (Cấp tiến trình hiện tại: <span className="font-black text-white">{progressLevel}/5</span>)
                </p>
              </div>
            </div>

            {/* THEME SELECTION CARDS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Chọn Chủ đề Yêu thích
                </label>
                <span className="text-[11px] text-slate-500">Đổi chủ đề không làm mất cấp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  const themeStage = theme.stages.find((s) => s.level === progressLevel) || theme.stages[0]!;
                  const previewSrc = avatarCatalogService.resolveAvatar(themeStage.assetKey);

                  return (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={cn(
                        'p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 relative select-none',
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-900/30 ring-2 ring-blue-400/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      )}
                    >
                      <img
                        src={previewSrc}
                        alt={theme.name}
                        className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-100 shadow-2xs object-contain shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                            {theme.name}
                          </h4>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {theme.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Cấp {progressLevel}: {themeStage.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5-STAGE PROGRESSION TIMELINE */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Tiến trình 5 Cấp của {focusedTheme.name}
                </span>
                <span className="text-[11px] font-semibold text-indigo-700">
                  Cấp hiện tại: {progressLevel}/5
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {focusedTheme.stages.map((stage) => {
                  const isCurrent = stage.level === progressLevel;
                  const isAchieved = stage.level <= progressLevel;
                  const stageSrc = avatarCatalogService.resolveAvatar(stage.assetKey);

                  return (
                    <div
                      key={stage.level}
                      className={cn(
                        'p-2 rounded-xl flex flex-col items-center text-center space-y-1 transition-all relative select-none',
                        isCurrent
                          ? 'bg-blue-100/90 border-2 border-blue-600 shadow-xs'
                          : isAchieved
                          ? 'bg-white border border-slate-200 shadow-2xs'
                          : 'bg-slate-100/80 border border-dashed border-slate-300 opacity-60'
                      )}
                      title={
                        isCurrent
                          ? `Cấp hiện tại: ${stage.name}`
                          : isAchieved
                          ? `Đã đạt: ${stage.name}`
                          : `Chưa mở khóa: ${stage.name}`
                      }
                    >
                      <div className="relative">
                        <img
                          src={stageSrc}
                          alt={stage.name}
                          className={cn(
                            'w-10 h-10 md:w-12 md:h-12 rounded-lg object-contain',
                            !isAchieved && 'grayscale-[50%]'
                          )}
                        />
                        {!isAchieved && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 rounded-lg">
                            <Lock className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] md:text-xs font-bold text-slate-800 line-clamp-1">
                        {stage.name}
                      </span>

                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.2 rounded-full font-bold',
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : isAchieved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {isCurrent ? 'Hiện tại' : isAchieved ? 'Đã đạt' : `Cấp ${stage.level}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEGACY GALLERY (31 ICONS) */}
        {activeTab === 'legacy_gallery' && (
          <div className="space-y-3">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm icon (mèo, tên lửa, học sinh...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1">
                {AVATAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Legacy Avatars */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto p-1">
              {filteredLegacyAvatars.map((item) => {
                const isSelected = selectedLegacyKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedLegacyKey(item.key)}
                    className={cn(
                      'p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all relative group',
                      isSelected
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-300 scale-105'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    )}
                    title={item.label}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                    <span className="text-[10px] text-slate-600 font-medium truncate w-full text-center">
                      {item.label}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
