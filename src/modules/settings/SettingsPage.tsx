import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { Modal } from '../../shared/components/Modal';
import { useToast } from '../../shared/hooks/useToast';
import { themeService, THEME_OPTIONS, type ThemeId } from '../../core/services/theme.service';
import { ThemePreviewModal } from './ThemePreviewModal';
import { SavedAvatarAssetsModal } from './components/SavedAvatarAssetsModal';
import { teacherProfileRepository } from '../../core/repositories/teacher-profile.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { avatarCatalogService, AVATAR_CATEGORIES } from '../../core/services/avatar-catalog.service';
import {
  avatarThemeRegistry,
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
  DEFAULT_AVATAR_THEME_ID,
} from '../../core/services/avatar-theme-registry';
import {
  avatarCardThemeService,
} from '../../core/services/avatar-card-theme.service';
import {
  avatarAssetService,
  processAvatarImage,
  type ProcessedAvatarAsset,
} from '../../core/services/avatar-asset.service';
import { TeacherProfileSchema } from '../../core/validation/schemas';
import { validateImageFile, resizeImageFile } from '../../shared/utilities/image';
import type {
  AvatarLevelDefinition,
  AvatarProgressLevel,
  GlobalAvatarSystemSettings,
} from '../../core/types/avatar-theme.types';
import type { Student } from '../../core/database/types';
import { db } from '../../core/database/db';
import {
  Save,
  Check,
  Sparkles,
  Image as ImageIcon,
  RotateCcw,
  Layers,
  Shield,
  Users,
  CheckCircle2,
  Upload,
  Eye,
  CheckSquare,
  HardDrive,
  Camera,
  Trash2,
  UserCheck,
  Search,
} from 'lucide-react';
import { cn } from '../../shared/utilities/cn';

export const SettingsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [currentTheme, setCurrentTheme] = useState<ThemeId>(themeService.getCurrentTheme());
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Global 5-Level Avatar System Settings State (FEAT-AVATAR-001 & FEAT-AVATAR-004)
  const [savedSettings, setSavedSettings] = useState<GlobalAvatarSystemSettings>(
    DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS
  );
  const [draftSettings, setDraftSettings] = useState<GlobalAvatarSystemSettings>(
    DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS
  );
  const [uploadedAssetUrls, setUploadedAssetUrls] = useState<Map<string, string>>(new Map());
  const [newUploadedAssets, setNewUploadedAssets] = useState<Map<string, ProcessedAvatarAsset>>(new Map());

  // Active level editor tab (1..5)
  const [activeLevelTab, setActiveLevelTab] = useState<AvatarProgressLevel>(1);
  const [previewCardState, setPreviewCardState] = useState<'normal' | 'selected' | 'hand' | 'absent'>('normal');

  // Stats & impact state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentPointsMap, setStudentPointsMap] = useState<Map<string, number>>(new Map());
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showStagePickerModal, setShowStagePickerModal] = useState<AvatarProgressLevel | null>(null);
  const [showSavedAssetsModal, setShowSavedAssetsModal] = useState<AvatarProgressLevel | null>(null);
  const [showPresetConfirmModal, setShowPresetConfirmModal] = useState(false);
  const [pendingPresetThemeId, setPendingPresetThemeId] = useState<string | null>(null);
  const [savingGlobalSettings, setSavingGlobalSettings] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showTeacherAvatarPickerModal, setShowTeacherAvatarPickerModal] = useState(false);
  const [teacherAvatarCategory, setTeacherAvatarCategory] = useState('all');
  const [teacherAvatarSearch, setTeacherAvatarSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const themePresets = useMemo(() => avatarThemeRegistry.getActiveThemes(), []);

  // Load Settings & Student Data
  const loadSettingsAndStats = useCallback(async () => {
    try {
      const profile = await teacherProfileRepository.getProfile();
      if (profile) {
        setFullName(profile.fullName || '');
        setSchoolName(profile.schoolName || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setAvatar(profile.avatar || '');
      }

      const s = await settingsRepository.getSettings();
      let activeSysSettings = DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;

      if (s?.avatarSystemSettings && s.avatarSystemSettings.levels?.length === 5) {
        activeSysSettings = s.avatarSystemSettings;
      } else if (s?.activeAvatarThemeId) {
        const presetLevels = avatarThemeRegistry.getPresetThemeLevelDefinitions(s.activeAvatarThemeId);
        activeSysSettings = {
          ...DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
          presetThemeId: s.activeAvatarThemeId,
          levels: presetLevels as unknown as typeof DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS.levels,
        };
      }

      setSavedSettings(activeSysSettings);
      setDraftSettings(activeSysSettings);

      // Preload all uploaded asset URLs (current levels & saved custom images by level)
      const uploadedIds: string[] = [];
      activeSysSettings.levels.forEach((l) => {
        if (l.image.kind === 'UPLOADED') {
          uploadedIds.push(l.image.assetId);
        }
      });
      if (activeSysSettings.savedCustomImagesByLevel) {
        Object.values(activeSysSettings.savedCustomImagesByLevel).forEach((imgRef) => {
          if (imgRef && imgRef.kind === 'UPLOADED') {
            uploadedIds.push(imgRef.assetId);
          }
        });
      }

      if (uploadedIds.length > 0) {
        const urlMap = await avatarAssetService.preloadAssetUrls(uploadedIds);
        setUploadedAssetUrls(urlMap);
      }

      // Load students and points for impact calculation
      const students = await db.students.filter((st) => !st.deletedAt).toArray();
      const pointEntries = await db.pointEntries.filter((pe) => !pe.deletedAt).toArray();

      const pMap = new Map<string, number>();
      for (const pe of pointEntries) {
        const cur = pMap.get(pe.studentId) || 0;
        pMap.set(pe.studentId, cur + pe.points);
      }

      setAllStudents(students);
      setStudentPointsMap(pMap);
    } catch (err) {
      console.error('Error loading settings and student stats:', err);
    }
  }, []);

  useEffect(() => {
    loadSettingsAndStats();
  }, [loadSettingsAndStats]);

  // Calculate Impact between saved thresholds vs draft thresholds
  const impactData = useMemo(() => {
    const currentThresholds = savedSettings.levels.map((l) => ({ level: l.level, minPoints: l.minPoints }));
    const draftThresholds = draftSettings.levels.map((l) => ({ level: l.level, minPoints: l.minPoints }));

    return avatarThemeRegistry.calculateThresholdImpact(
      allStudents,
      studentPointsMap,
      currentThresholds,
      draftThresholds
    );
  }, [allStudents, studentPointsMap, savedSettings, draftSettings]);

  // Check if draft has unsaved changes
  const isDirty = useMemo(() => {
    return JSON.stringify(savedSettings) !== JSON.stringify(draftSettings) || newUploadedAssets.size > 0;
  }, [savedSettings, draftSettings, newUploadedAssets]);

  // Apply Preset Theme logic
  const applyPresetTheme = (presetThemeId: string, keepCustomImages: boolean) => {
    const currentThresholds = draftSettings.levels.map((l) => ({ level: l.level, minPoints: l.minPoints }));
    const presetLevels = avatarThemeRegistry.getPresetThemeLevelDefinitions(presetThemeId, currentThresholds, {
      keepCustomImages,
      currentLevels: draftSettings.levels,
      savedCustomImagesByLevel: draftSettings.savedCustomImagesByLevel,
    });

    setDraftSettings((prev) => ({
      ...prev,
      presetThemeId,
      levels: presetLevels as unknown as typeof prev.levels,
    }));
    setShowPresetConfirmModal(false);
    setPendingPresetThemeId(null);

    const themeName = themePresets.find((t) => t.id === presetThemeId)?.name || presetThemeId;
    showSuccess(
      'Đã nạp Chủ đề',
      keepCustomImages
        ? `Đã áp dụng chủ đề "${themeName}" và giữ lại các ảnh avatar tùy chỉnh của bạn.`
        : `Đã điền 5 cấp theo chủ đề "${themeName}". Bạn có thể chỉnh sửa thêm trước khi Lưu.`
    );
  };

  // Handle Preset Theme Click
  const handleLoadPresetTheme = (presetThemeId: string) => {
    const hasCustomImages =
      draftSettings.levels.some((l) => l.image.kind === 'UPLOADED') ||
      (draftSettings.savedCustomImagesByLevel && Object.keys(draftSettings.savedCustomImagesByLevel).length > 0);

    if (hasCustomImages) {
      setPendingPresetThemeId(presetThemeId);
      setShowPresetConfirmModal(true);
    } else {
      applyPresetTheme(presetThemeId, false);
    }
  };

  // Handle Level Field Change
  const handleLevelChange = <K extends keyof AvatarLevelDefinition>(
    levelNumber: AvatarProgressLevel,
    field: K,
    value: AvatarLevelDefinition[K]
  ) => {
    setDraftSettings((prev) => {
      const updatedLevels = prev.levels.map((l) => {
        if (l.level === levelNumber) {
          return { ...l, [field]: value };
        }
        return l;
      }) as unknown as typeof prev.levels;

      return {
        ...prev,
        levels: updatedLevels,
      };
    });
  };

  // Handle Image Upload for a Level (Optimized WebP/PNG 320x320 & saved by level)
  const handleUploadImage = async (levelNumber: AvatarProgressLevel, file: File) => {
    try {
      const processed = await processAvatarImage(file, { targetLevel: levelNumber });
      setNewUploadedAssets((prev) => {
        const next = new Map(prev);
        next.set(processed.id, processed);
        return next;
      });

      setUploadedAssetUrls((prev) => {
        const next = new Map(prev);
        next.set(processed.id, processed.objectUrl);
        return next;
      });

      setDraftSettings((prev) => {
        const nextLevels = prev.levels.map((l) => {
          if (l.level === levelNumber) {
            return {
              ...l,
              image: { kind: 'UPLOADED' as const, assetId: processed.id },
            };
          }
          return l;
        }) as unknown as typeof prev.levels;

        return {
          ...prev,
          levels: nextLevels,
          savedCustomImagesByLevel: {
            ...(prev.savedCustomImagesByLevel || {}),
            [levelNumber]: { kind: 'UPLOADED' as const, assetId: processed.id },
          },
        };
      });

      showSuccess('Tải ảnh thành công', `Đã tối ưu và áp dụng ảnh mới cho Cấp ${levelNumber}.`);
    } catch (err: unknown) {
      showError('Lỗi tải ảnh', (err as Error).message);
    }
  };

  // Handle Save Global 5-Level Settings
  const handleSaveGlobalAvatarSettings = async () => {
    setSavingGlobalSettings(true);
    try {
      // 1. Validation: 5 levels, strictly increasing minPoints, character length limits
      for (let i = 0; i < draftSettings.levels.length; i++) {
        const lvl = draftSettings.levels[i]!;
        if (!lvl.name.trim()) {
          throw new Error(`Tên Cấp ${lvl.level} không được để trống.`);
        }
        if (lvl.name.trim().length > 40) {
          throw new Error(`Tên Cấp ${lvl.level} không được vượt quá 40 ký tự.`);
        }
        if (!lvl.shortLabel.trim()) {
          throw new Error(`Nhãn ngắn Cấp ${lvl.level} không được để trống.`);
        }
        if (lvl.shortLabel.trim().length > 16) {
          throw new Error(`Nhãn ngắn Cấp ${lvl.level} không được vượt quá 16 ký tự.`);
        }
        if (i > 0) {
          const prevLvl = draftSettings.levels[i - 1]!;
          if (lvl.minPoints <= prevLvl.minPoints) {
            throw new Error(
              `Ngưỡng điểm Cấp ${lvl.level} (${lvl.minPoints}đ) phải lớn hơn Cấp ${prevLvl.level} (${prevLvl.minPoints}đ).`
            );
          }
        }
      }

      // 2. Persist new uploaded image blobs to Dexie avatarAssets with metadata
      for (const [, asset] of newUploadedAssets.entries()) {
        await avatarAssetService.saveAvatarAsset(asset, {
          targetLevel: asset.targetLevel,
          originalFileName: asset.originalFileName,
        });
      }
      setNewUploadedAssets(new Map());

      // 3. Build updated savedCustomImagesByLevel
      const updatedSavedCustomImages = { ...(draftSettings.savedCustomImagesByLevel || {}) };
      draftSettings.levels.forEach((l) => {
        if (l.image.kind === 'UPLOADED') {
          updatedSavedCustomImages[l.level] = l.image;
        }
      });

      // 4. Persist Global Settings
      const nextRevision = (savedSettings.revision || 1) + 1;
      const finalSettings: GlobalAvatarSystemSettings = {
        ...draftSettings,
        savedCustomImagesByLevel: updatedSavedCustomImages,
        revision: nextRevision,
        updatedAt: new Date().toISOString(),
      };

      await settingsRepository.updateSettings({
        avatarSystemSettings: finalSettings,
        activeAvatarThemeId: finalSettings.presetThemeId || DEFAULT_AVATAR_THEME_ID,
        avatarProgressionEnabled: finalSettings.enabled,
        avatarSettingsRevision: nextRevision,
      });

      setSavedSettings(finalSettings);
      setShowSaveConfirmModal(false);
      showSuccess('Lưu thiết lập thành công', 'Toàn bộ học sinh đã được đồng bộ avatar và màu thẻ theo cấp độ mới.');
    } catch (err: unknown) {
      showError('Lỗi lưu thiết lập', (err as Error).message);
    } finally {
      setSavingGlobalSettings(false);
    }
  };

  // Handle Teacher Avatar Upload
  const handleTeacherAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showError('Ảnh không hợp lệ', validation.error || 'Vui lòng chọn ảnh JPG, PNG, WEBP dưới 2MB');
      return;
    }

    try {
      const resized = await resizeImageFile(file, 256, 256, 0.85);
      setAvatar(resized);
      showSuccess('Đã tải ảnh lên', 'Ảnh đại diện giáo viên đã được cập nhật.');
    } catch (err) {
      showError('Lỗi tải ảnh', 'Không thể xử lý định dạng file ảnh.');
    }
  };

  // Handle Select Preset Teacher Avatar
  const handleSelectPresetTeacherAvatar = (src: string) => {
    setAvatar(src);
    setShowTeacherAvatarPickerModal(false);
    showSuccess('Đã chọn avatar', 'Đã đổi ảnh đại diện giáo viên.');
  };

  // Handle Remove Teacher Avatar
  const handleRemoveTeacherAvatar = () => {
    setAvatar('');
    showSuccess('Đã xóa avatar', 'Đã chuyển về avatar mặc định theo tên viết tắt.');
  };

  // Handle Save Teacher Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = TeacherProfileSchema.safeParse({ fullName, schoolName, phone, email, avatar });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      showError('Thông tin không hợp lệ', 'Vui lòng kiểm tra lại các trường báo đỏ.');
      return;
    }

    setSaving(true);
    try {
      await teacherProfileRepository.saveProfile({
        fullName,
        schoolName,
        phone,
        email: email || undefined,
        avatar: avatar || undefined,
      });
      window.dispatchEvent(new CustomEvent('TEACHER_PROFILE_UPDATED'));
      showSuccess('Lưu hồ sơ thành công', 'Thông tin và ảnh đại diện giáo viên chủ nhiệm đã được cập nhật.');
    } catch (err) {
      showError('Lỗi lưu hồ sơ', 'Đã xảy ra lỗi trong quá trình lưu thông tin.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Active level definition and derived card theme
  const activeLevelDef = draftSettings.levels.find((l) => l.level === activeLevelTab) || draftSettings.levels[0]!;
  const activeLevelCardTheme = avatarCardThemeService.generateCardThemeFromBaseColor(
    activeLevelDef.cardBaseColor,
    activeLevelDef.level
  );

  // Helper to get image URL for a level
  const getLevelAssetUrl = (levelDef: AvatarLevelDefinition): string => {
    if (levelDef.image.kind === 'UPLOADED') {
      return uploadedAssetUrls.get(levelDef.image.assetId) || '';
    }
    const item = avatarCatalogService.getItemByKey(levelDef.image.assetKey);
    return item?.assetUrl || avatarCatalogService.getDefaultAvatarUrl();
  };

  // Check if active level has a saved custom image to quickly restore
  const savedCustomImageForActiveLevel = draftSettings.savedCustomImagesByLevel?.[activeLevelDef.level];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* SECTION 1: GLOBAL 5-LEVEL AVATAR SYSTEM & PROGRESSION SETTINGS */}
      {/* ========================================================================= */}
      <Card className="p-6 space-y-6">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-app-main">Hệ Thống 5 Cấp Độ Avatar Toàn Trường</h2>
              <Badge variant="primary">FEAT-AVATAR-004</Badge>
            </div>
            <p className="text-xs text-app-muted mt-0.5">
              Cấu hình 5 cấp bậc tiến trình dùng chung cho toàn bộ học sinh trong trường. Mọi thay đổi về ngưỡng điểm, tên cấp và avatar được cập nhật tức thì.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => {
                setDraftSettings(savedSettings);
                setNewUploadedAssets(new Map());
              }}
              disabled={!isDirty || savingGlobalSettings}
            >
              Hoàn Tác
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={() => setShowSaveConfirmModal(true)}
              disabled={!isDirty || savingGlobalSettings}
            >
              {savingGlobalSettings ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </div>

        {/* 1.1 THEME PRESETS SELECTOR */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-app-primary" />
              Chọn Mẫu Chủ Đề Có Sẵn (Preset Themes)
            </label>
            <span className="text-xs text-app-muted">
              Đổi chủ đề bảo toàn ảnh avatar tải lên
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {themePresets.map((theme) => {
              const isSelected = draftSettings.presetThemeId === theme.id;
              return (
                <div
                  key={theme.id}
                  data-testid={`preset-theme-${theme.id}`}
                  onClick={() => handleLoadPresetTheme(theme.id)}
                  className={cn(
                    'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none relative',
                    isSelected
                      ? 'border-app-primary bg-app-primary-light/30 shadow-xs ring-2 ring-app-primary/20'
                      : 'border-app hover:border-app-primary/40 bg-app-surface hover:bg-app-surface-hover'
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-app-main">{theme.name}</h4>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-app-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-app-muted line-clamp-2 leading-relaxed">{theme.description}</p>
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-app/60">
                    {theme.stages.map((stage) => {
                      const item = avatarCatalogService.getItemByKey(stage.assetKey);
                      return (
                        <div
                          key={stage.level}
                          className="w-7 h-7 rounded-lg bg-white p-0.5 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center"
                          title={`Cấp ${stage.level}: ${stage.name}`}
                        >
                          <img src={item?.assetUrl || ''} alt={stage.name} className="w-full h-full object-contain" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1.2 FIVE-LEVEL TAB SELECTOR */}
        <div className="space-y-4 pt-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-app-primary" />
            Tùy Chỉnh Chi Tiết Từng Cấp Độ (1 đến 5)
          </label>

          {/* Level Tabs */}
          <div className="grid grid-cols-5 gap-2">
            {draftSettings.levels.map((lvl) => {
              const isTabActive = activeLevelTab === lvl.level;
              const lvlTheme = avatarCardThemeService.generateCardThemeFromBaseColor(lvl.cardBaseColor, lvl.level);
              const assetUrl = getLevelAssetUrl(lvl);

              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setActiveLevelTab(lvl.level)}
                  style={{
                    backgroundColor: isTabActive ? lvlTheme.surfaceStart : undefined,
                    borderColor: isTabActive ? lvlTheme.accent : undefined,
                  }}
                  className={cn(
                    'p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-1.5 min-w-0 select-none relative',
                    isTabActive
                      ? 'shadow-xs ring-2 ring-blue-500/20 font-bold'
                      : 'border-app hover:border-slate-300 bg-app-surface'
                  )}
                >
                  <div
                    style={{ borderColor: lvlTheme.avatarRing }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs"
                  >
                    <img src={assetUrl} alt={lvl.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-xs font-black text-app-main truncate">{lvl.name}</p>
                    <p className="text-[10px] text-app-muted font-mono font-bold">≥ {lvl.minPoints}đ</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 1.3 ACTIVE LEVEL DETAILED CONFIGURATION FORM */}
          <div
            style={{
              background: `linear-gradient(135deg, ${activeLevelCardTheme.surfaceStart} 0%, ${activeLevelCardTheme.surfaceEnd} 100%)`,
              borderColor: activeLevelCardTheme.border,
            }}
            className="p-5 sm:p-6 rounded-3xl border-2 space-y-6 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
              <div className="flex items-center gap-3">
                <span
                  style={{
                    backgroundColor: activeLevelCardTheme.badgeBackground,
                    color: activeLevelCardTheme.badgeText,
                    borderColor: activeLevelCardTheme.badgeBorder,
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-black border uppercase tracking-wider"
                >
                  Cấp {activeLevelDef.level}
                </span>
                <h3 style={{ color: activeLevelCardTheme.textPrimary }} className="text-base sm:text-lg font-extrabold">
                  {activeLevelDef.name} ({activeLevelDef.shortLabel})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600">Độ tương phản chữ:</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-bold font-mono',
                    activeLevelCardTheme.contrastPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  )}
                >
                  {activeLevelCardTheme.contrastRatio}:1 (WCAG AA {activeLevelCardTheme.contrastPassed ? 'Đạt' : 'Chưa đạt'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COL: LEVEL INFO & THRESHOLD */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tên Cấp Độ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={activeLevelDef.name}
                      onChange={(e) => handleLevelChange(activeLevelDef.level, 'name', e.target.value)}
                      maxLength={40}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nhãn Ngắn (Badge Label) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={activeLevelDef.shortLabel}
                      onChange={(e) => handleLevelChange(activeLevelDef.level, 'shortLabel', e.target.value)}
                      maxLength={16}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Điểm Tối Thiểu (Threshold) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={activeLevelDef.minPoints}
                      disabled={activeLevelDef.level === 1}
                      onChange={(e) =>
                        handleLevelChange(activeLevelDef.level, 'minPoints', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                      min={0}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {activeLevelDef.level === 1 ? 'Cấp 1 luôn bắt đầu từ 0 điểm.' : `Điểm để học sinh đạt Cấp ${activeLevelDef.level}.`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Màu Nền Cơ Sở (Card Base Color)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeLevelDef.cardBaseColor}
                        onChange={(e) => handleLevelChange(activeLevelDef.level, 'cardBaseColor', e.target.value)}
                        className="w-10 h-10 p-0.5 rounded-xl border border-slate-300 bg-white cursor-pointer"
                      />
                      <input
                        type="text"
                        value={activeLevelDef.cardBaseColor}
                        onChange={(e) => handleLevelChange(activeLevelDef.level, 'cardBaseColor', e.target.value)}
                        maxLength={7}
                        className="w-28 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mô Tả & Ý Nghĩa Cấp
                  </label>
                  <textarea
                    value={activeLevelDef.description}
                    onChange={(e) => handleLevelChange(activeLevelDef.level, 'description', e.target.value)}
                    rows={2}
                    maxLength={150}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* RIGHT COL: AVATAR IMAGE CONFIG & ACTIONS */}
              <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                    Hình Ảnh Avatar Cấp {activeLevelDef.level}
                  </label>

                  <div className="flex flex-col items-center gap-2 py-1">
                    <div
                      style={{ borderColor: activeLevelCardTheme.avatarRing }}
                      className="w-20 h-20 rounded-full border-4 bg-white p-1 shadow-xs overflow-hidden flex items-center justify-center"
                    >
                      <img
                        src={getLevelAssetUrl(activeLevelDef)}
                        alt={activeLevelDef.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Badge variant={activeLevelDef.image.kind === 'UPLOADED' ? 'warning' : 'primary'}>
                      {activeLevelDef.image.kind === 'UPLOADED' ? 'Ảnh Tự Tải Lên' : 'Ảnh Built-in'}
                    </Badge>
                  </div>
                </div>

                {/* Image Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<ImageIcon className="w-4 h-4 text-blue-600" />}
                    onClick={() => setShowStagePickerModal(activeLevelDef.level)}
                  >
                    Chọn Từ Thư Viện
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<HardDrive className="w-4 h-4 text-indigo-600" />}
                    onClick={() => setShowSavedAssetsModal(activeLevelDef.level)}
                  >
                    Kho Ảnh Đã Tải Lên
                  </Button>

                  <label className="block w-full cursor-pointer">
                    <span className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                      <Upload className="w-4 h-4 text-slate-500" /> Tải Ảnh Mới (WebP/PNG ≤2MB)
                    </span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(activeLevelDef.level, file);
                      }}
                    />
                  </label>

                  {/* Restore from recent saved custom upload if currently built-in */}
                  {activeLevelDef.image.kind === 'BUILT_IN' && savedCustomImageForActiveLevel && savedCustomImageForActiveLevel.kind === 'UPLOADED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleLevelChange(activeLevelDef.level, 'image', savedCustomImageForActiveLevel)
                      }
                      className="w-full text-center text-xs text-indigo-600 hover:underline font-semibold pt-1 flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Dùng lại ảnh tải lên gần nhất
                    </button>
                  )}

                  {activeLevelDef.image.kind === 'UPLOADED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleLevelChange(activeLevelDef.level, 'image', {
                          kind: 'BUILT_IN',
                          assetKey: `military/military-stage-${activeLevelDef.level}`,
                        })
                      }
                      className="w-full text-center text-xs text-rose-600 hover:underline font-semibold pt-1"
                    >
                      Khôi phục ảnh mặc định
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1.4 THRESHOLD IMPACT PREVIEW */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Users className="w-4 h-4 text-app-primary" />
              Thống Kê Tác Động Phân Bổ Học Sinh (Impact Preview)
            </label>
            <Badge variant={impactData.changedCount > 0 ? 'warning' : 'neutral'}>
              {impactData.changedCount > 0
                ? `${impactData.changedCount} học sinh sẽ chuyển cấp`
                : 'Không có thay đổi về cấp'}
            </Badge>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {draftSettings.levels.map((lvl) => {
              const curCount = impactData.currentDistribution[lvl.level] || 0;
              const projCount = impactData.projectedDistribution[lvl.level] || 0;
              const diff = projCount - curCount;

              return (
                <div
                  key={lvl.level}
                  className="p-3 rounded-2xl border border-app bg-app-surface text-center space-y-1 shadow-2xs"
                >
                  <p className="text-xs font-extrabold text-app-main truncate">{lvl.name}</p>
                  <p className="text-lg font-black text-blue-600 font-mono">{projCount} <span className="text-xs font-normal text-app-muted">HS</span></p>
                  <p className="text-[10px] text-app-muted">
                    Hiện tại: {curCount} {diff !== 0 && <span className={diff > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>({diff > 0 ? `+${diff}` : diff})</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1.5 GLOBAL 5-CARD LIVE PREVIEW GRID */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-app-primary" />
              Xem Trước Thẻ Học Sinh Cả 5 Cấp Độ (Live 5-Card Preview)
            </label>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['normal', 'selected', 'hand', 'absent'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPreviewCardState(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors',
                    previewCardState === st ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {st === 'normal' && 'Bình thường'}
                  {st === 'selected' && 'Đang chọn'}
                  {st === 'hand' && 'Giơ tay'}
                  {st === 'absent' && 'Vắng mặt'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {draftSettings.levels.map((lvl) => {
              const cardTheme = avatarCardThemeService.generateCardThemeFromBaseColor(lvl.cardBaseColor, lvl.level);
              const assetUrl = getLevelAssetUrl(lvl);
              const isSelected = previewCardState === 'selected';
              const handRaised = previewCardState === 'hand';
              const isAbsent = previewCardState === 'absent';

              return (
                <div
                  key={lvl.level}
                  style={{
                    background: `linear-gradient(135deg, ${cardTheme.surfaceStart} 0%, ${cardTheme.surfaceEnd} 100%)`,
                    borderColor: isSelected
                      ? '#2563eb'
                      : handRaised
                      ? '#f59e0b'
                      : cardTheme.border,
                    boxShadow: `0 2px 8px ${cardTheme.shadow}`,
                  }}
                  className={cn(
                    'p-3 rounded-2xl border-2 flex flex-col justify-between relative overflow-hidden select-none min-h-[220px]',
                    isSelected && 'ring-2 ring-blue-500/50 scale-[1.02]',
                    handRaised && 'ring-2 ring-amber-400/60',
                    isAbsent && 'opacity-80 grayscale-[20%]'
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="text-slate-400">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <div className="w-4 h-4 rounded border border-slate-300" />}
                    </div>

                    <span
                      style={{
                        backgroundColor: cardTheme.badgeBackground,
                        color: cardTheme.badgeText,
                        borderColor: cardTheme.badgeBorder,
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wide shadow-2xs"
                    >
                      {lvl.shortLabel || `Cấp ${lvl.level}`}
                    </span>
                  </div>

                  {/* Card Avatar & Info */}
                  <div className="flex flex-col items-center text-center py-1">
                    <div
                      style={{ borderColor: cardTheme.avatarRing }}
                      className="w-12 h-12 rounded-full border-2 bg-white p-0.5 shadow-xs overflow-hidden flex items-center justify-center mb-1"
                    >
                      <img src={assetUrl} alt={lvl.name} className="w-full h-full object-contain" />
                    </div>

                    <h4 style={{ color: cardTheme.textPrimary }} className="font-extrabold text-sm truncate w-full">
                      {lvl.name}
                    </h4>
                    <p style={{ color: cardTheme.textSecondary }} className="text-[11px] font-mono font-semibold">
                      ≥ {lvl.minPoints} điểm thi đua
                    </p>
                  </div>

                  {/* Card Actions Mock */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-black/5 text-[10px] font-bold">
                    <span className="py-0.5 px-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200">+1</span>
                    <span className="py-0.5 px-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">+2</span>
                    <span className="py-0.5 px-1.5 rounded bg-purple-50 text-purple-700 border border-purple-200">+5</span>
                    <span className="py-0.5 px-1.5 rounded bg-red-50 text-red-700 border border-red-200">-</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 2: APPLICATION THEME & DEFAULT AVATAR */}
      {/* ========================================================================= */}
      <Card className="p-6 space-y-6">
        <div className="border-b border-app pb-4">
          <h2 className="text-lg font-bold text-app-main">Giao Diện & Màu Sắc Ứng Dụng</h2>
          <p className="text-xs text-app-muted mt-0.5">Chọn phong cách màu sắc chính cho toàn bộ ứng dụng Sổ Chủ Nhiệm</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => {
                  setCurrentTheme(theme.id);
                  themeService.applyTheme(theme.id);
                  settingsRepository.updateSettings({ theme: theme.id });
                }}
                className={cn(
                  'p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none relative',
                  isSelected
                    ? 'border-app-primary bg-app-primary-light/20 shadow-xs ring-2 ring-app-primary/20'
                    : 'border-app hover:border-app-primary/40 bg-app-surface'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-app-main">{theme.name}</h4>
                    <p className="text-xs text-app-muted mt-1 leading-relaxed">{theme.description}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-app-primary shrink-0" />}
                </div>

                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-app">
                  {[theme.primaryColor, theme.secondaryColor, theme.accentColor].map((c, i) => (
                    <span key={i} style={{ backgroundColor: c }} className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 3: TEACHER PROFILE & AVATAR CARD */}
      {/* ========================================================================= */}
      <Card className="p-6 space-y-6">
        <div className="border-b border-app pb-4">
          <h2 className="text-lg font-bold text-app-main flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-app-primary" />
            Hồ Sơ & Thẻ Avatar Giáo Viên Chủ Nhiệm
          </h2>
          <p className="text-xs text-app-muted mt-0.5">
            Tùy chỉnh ảnh đại diện, danh thiếp và thông tin xuất hiện trên các báo cáo, phiếu nhận xét và sổ chủ nhiệm
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* TEACHER AVATAR HERO CARD */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-app-surface via-app-surface to-app-primary-light/30 border border-app shadow-2xs">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* AVATAR PEDESTAL & QUICK ACTIONS */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-app-primary/20 shadow-xl overflow-hidden bg-gradient-to-tr from-app-primary via-indigo-500 to-purple-600 flex items-center justify-center border-4 border-app-surface transition-transform group-hover:scale-105">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={fullName || 'Avatar Giáo viên'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-black text-3xl sm:text-4xl select-none">
                        {fullName ? fullName.trim().charAt(0).toUpperCase() : 'GV'}
                      </span>
                    )}
                  </div>

                  {/* Camera overlay badge */}
                  <label
                    htmlFor="teacher-avatar-upload-input"
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-app-primary text-app-primary-fg shadow-lg border-2 border-app-surface cursor-pointer hover:scale-110 active:scale-95 transition-all"
                    title="Đổi ảnh đại diện từ máy tính"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      id="teacher-avatar-upload-input"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleTeacherAvatarUpload}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <label
                    htmlFor="teacher-avatar-upload-btn"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app bg-app-surface hover:bg-app-surface-hover text-xs font-bold text-app-main shadow-2xs transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-app-primary" />
                    <span>Tải ảnh từ máy</span>
                    <input
                      type="file"
                      id="teacher-avatar-upload-btn"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleTeacherAvatarUpload}
                    />
                  </label>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                    onClick={() => setShowTeacherAvatarPickerModal(true)}
                  >
                    Chọn mẫu có sẵn
                  </Button>

                  {avatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={handleRemoveTeacherAvatar}
                    >
                      Xóa ảnh
                    </Button>
                  )}
                </div>
              </div>

              {/* LIVE TEACHER IDENTITY CARD PREVIEW */}
              <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Badge variant="primary" className="px-2.5 py-0.5 text-xs font-bold">
                    Giáo viên Chủ nhiệm
                  </Badge>
                  <span className="text-[11px] font-medium text-app-muted">
                    Thẻ thông tin giảng dạy chính thức
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-app-main tracking-tight truncate">
                    {fullName || 'Thầy/Cô Giáo Viên'}
                  </h3>
                  <p className="text-sm font-semibold text-app-primary truncate">
                    {schoolName || 'Chưa cập nhật tên trường học'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-app-muted pt-1">
                  <span className="flex items-center gap-1.5 bg-app-surface/80 px-2.5 py-1 rounded-lg border border-app">
                    📞 {phone || 'Chưa cập nhật SĐT'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-app-surface/80 px-2.5 py-1 rounded-lg border border-app">
                    ✉️ {email || 'Chưa cập nhật Email'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FORM INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên giáo viên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Thị Mai"
              error={errors.fullName}
              required
            />
            <Input
              label="Tên trường học"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Ví dụ: Trường Tiểu Học Lê Quý Đôn"
              error={errors.schoolName}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số điện thoại liên hệ"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0912345678"
              error={errors.phone}
            />
            <Input
              label="Email liên hệ (Tùy chọn)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ví dụ: giaovien@edu.vn"
              error={errors.email}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Hồ Sơ'}
            </Button>
          </div>
        </form>
      </Card>

      {/* MODAL 1: CONFIRM SAVE GLOBAL AVATAR SETTINGS */}
      <ConfirmModal
        isOpen={showSaveConfirmModal}
        onClose={() => setShowSaveConfirmModal(false)}
        onConfirm={handleSaveGlobalAvatarSettings}
        title="Xác Nhận Áp Dụng Cấu Hình Cho Toàn Trường"
        message={
          impactData.changedCount > 0
            ? `Thay đổi ngưỡng điểm sẽ làm ${impactData.changedCount} học sinh chuyển sang cấp avatar mới. Bạn có chắc chắn muốn áp dụng cho toàn bộ học sinh?`
            : 'Cấu hình 5 cấp độ mới (tên, nhãn, ảnh và màu thẻ) sẽ được áp dụng đồng bộ ngay lập tức cho toàn bộ học sinh. Bạn có chắc chắn muốn lưu?'
        }
        confirmText={savingGlobalSettings ? 'Đang áp dụng...' : 'Áp Dụng Toàn Trường'}
        variant="primary"
      />

      {/* MODAL 2: STAGE PICKER FROM BUILT-IN THEMES */}
      {showStagePickerModal !== null && (
        <Modal
          isOpen={true}
          onClose={() => setShowStagePickerModal(null)}
          title={`Chọn Hình Ảnh Cho Cấp ${showStagePickerModal}`}
        >
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {themePresets.map((theme) => (
              <div key={theme.id} className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">{theme.name}</h4>
                <div className="grid grid-cols-5 gap-2">
                  {theme.stages.map((stage) => {
                    const item = avatarCatalogService.getItemByKey(stage.assetKey);
                    return (
                      <div
                        key={stage.level}
                        onClick={() => {
                          handleLevelChange(showStagePickerModal, 'image', {
                            kind: 'BUILT_IN',
                            assetKey: stage.assetKey,
                          });
                          setShowStagePickerModal(null);
                          showSuccess('Đã đổi ảnh', `Đã chọn "${stage.name}" cho Cấp ${showStagePickerModal}.`);
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50 cursor-pointer flex flex-col items-center text-center gap-1 transition-all"
                      >
                        <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
                          <img src={item?.assetUrl || ''} alt={stage.name} className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 truncate w-full">{stage.name}</p>
                        <span className="text-[9px] text-slate-400">Cấp {stage.level}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* MODAL 3: SAVED UPLOADED AVATARS GALLERY (FEAT-AVATAR-004) */}
      {showSavedAssetsModal !== null && (
        <SavedAvatarAssetsModal
          isOpen={true}
          onClose={() => setShowSavedAssetsModal(null)}
          targetLevel={showSavedAssetsModal}
          currentAssetId={
            draftSettings.levels.find((l) => l.level === showSavedAssetsModal)?.image.kind === 'UPLOADED'
              ? (draftSettings.levels.find((l) => l.level === showSavedAssetsModal)?.image as { assetId: string }).assetId
              : undefined
          }
          onSelectAsset={(assetId, objectUrl) => {
            setUploadedAssetUrls((prev) => {
              const next = new Map(prev);
              next.set(assetId, objectUrl);
              return next;
            });
            handleLevelChange(showSavedAssetsModal, 'image', {
              kind: 'UPLOADED',
              assetId,
            });
            setDraftSettings((prev) => ({
              ...prev,
              savedCustomImagesByLevel: {
                ...(prev.savedCustomImagesByLevel || {}),
                [showSavedAssetsModal]: { kind: 'UPLOADED', assetId },
              },
            }));
            showSuccess('Đã áp dụng ảnh', `Đã chọn ảnh từ kho lưu trữ cho Cấp ${showSavedAssetsModal}.`);
          }}
        />
      )}

      {/* MODAL 4: PRESET THEME CHANGE OPTIONS (FEAT-AVATAR-004) */}
      {showPresetConfirmModal && pendingPresetThemeId && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowPresetConfirmModal(false);
            setPendingPresetThemeId(null);
          }}
          title="Tùy Chọn Khi Nạp Chủ Đề Mới"
          maxWidth="md"
        >
          <div className="space-y-4 py-1">
            <p className="text-sm text-app-main leading-relaxed">
              Hệ thống phát hiện bạn đang có ảnh avatar tùy chỉnh đã tải lên. Khi chuyển sang chủ đề mới, bạn muốn:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => applyPresetTheme(pendingPresetThemeId, true)}
                className="w-full p-4 rounded-2xl border-2 border-app-primary bg-app-primary-light/20 hover:bg-app-primary-light/30 transition-all text-left flex items-start gap-3.5 group shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-app-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm text-app-main block font-extrabold group-hover:text-app-primary transition-colors">
                    Giữ lại ảnh avatar đã tải lên (Khuyên dùng)
                  </strong>
                  <p className="text-xs text-app-muted mt-1 leading-relaxed">
                    Cập nhật Tên cấp, Mô tả và Bảng màu nhận diện theo chủ đề mới, nhưng vẫn giữ nguyên các ảnh avatar bạn đã tải lên.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => applyPresetTheme(pendingPresetThemeId, false)}
                className="w-full p-4 rounded-2xl border-2 border-app hover:border-slate-400 bg-app-surface hover:bg-app-surface-hover transition-all text-left flex items-start gap-3.5 group cursor-pointer"
              >
                <Layers className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm text-app-main block font-extrabold">
                    Dùng toàn bộ ảnh mẫu của chủ đề mới
                  </strong>
                  <p className="text-xs text-app-muted mt-1 leading-relaxed">
                    Thay toàn bộ ảnh thành ảnh mẫu của chủ đề mới. Các ảnh cũ vẫn được lưu trong kho để tái sử dụng bất cứ lúc nào.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPresetConfirmModal(false);
                  setPendingPresetThemeId(null);
                }}
              >
                Hủy Bỏ
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: THEME PREVIEW */}
      <ThemePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onThemeChanged={(themeId) => {
          setCurrentTheme(themeId);
          settingsRepository.updateSettings({ theme: themeId });
        }}
      />

      {/* MODAL 6: TEACHER AVATAR PRESET PICKER */}
      {showTeacherAvatarPickerModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowTeacherAvatarPickerModal(false)}
          title="Chọn Ảnh Đại Diện Giáo Viên Từ Bộ Sưu Tập"
        >
          <div className="space-y-4 py-2 max-h-[75vh] overflow-y-auto">
            {/* Search & Category Filter */}
            <div className="space-y-2.5">
              <Input
                placeholder="Tìm kiếm mẫu avatar..."
                value={teacherAvatarSearch}
                onChange={(e) => setTeacherAvatarSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-app-muted" />}
              />

              <div className="flex flex-wrap items-center gap-1.5">
                {AVATAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTeacherAvatarCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      teacherAvatarCategory === cat.id
                        ? 'bg-app-primary text-app-primary-fg'
                        : 'bg-app-surface border border-app text-app-muted hover:bg-app-surface-hover'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              {avatarCatalogService
                .search(teacherAvatarSearch, teacherAvatarCategory)
                .map((item) => (
                  <div
                    key={item.key}
                    onClick={() => handleSelectPresetTeacherAvatar(item.src)}
                    className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer text-center space-y-1.5 flex flex-col items-center ${
                      avatar === item.src
                        ? 'bg-app-primary-light border-app-primary ring-2 ring-app-primary shadow-sm'
                        : 'bg-app-surface border-app hover:border-app-primary/60 hover:bg-app-surface-hover hover:scale-105 shadow-2xs'
                    }`}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-app-surface p-1 border border-app shadow-2xs flex items-center justify-center">
                      <img src={item.src} alt={item.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-app-main truncate max-w-full block leading-tight">
                      {item.label}
                    </span>
                    {avatar === item.src && (
                      <span className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-app-primary text-app-primary-fg">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
