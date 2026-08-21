import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { Input } from '../../../shared/components/Input';
import { PageHeader } from '../../../shared/components/PageHeader';
import { classRepository } from '../../../core/repositories/class.repository';
import { settingsRepository } from '../../../core/repositories/settings.repository';
import { academicYearRepository } from '../../../core/repositories/academic-year.repository';
import { honorTitleSeedService } from '../../../core/services/honor-title-seed.service';
import { honorBoardService } from '../../../core/services/honor-board.service';
import { honorRuleEngineService, type TitleEvaluationResult } from '../../../core/services/honor-rule-engine.service';
import { rankSeedService } from '../../../core/services/rank-seed.service';
import { avatarAssetService } from '../../../core/services/avatar-asset.service';
import { avatarThemeRegistry, DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS } from '../../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { getTodayDateString } from '../../../shared/utilities/date';
import { TieResolutionModal } from './components/TieResolutionModal';
import type { ClassRoom, AcademicYear, HonorTitle, HonorBoardPeriodType } from '../../../core/database/types';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Sparkles,
  Calendar,
  Layers,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export const HonorBoardCreateWizard: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [globalAvatarSettings, setGlobalAvatarSettings] = useState<GlobalAvatarSystemSettings>(DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS);
  const [uploadedAssetUrls, setUploadedAssetUrls] = useState<Map<string, string>>(new Map());

  // Form State
  const [boardTitle, setBoardTitle] = useState<string>('');
  const [periodType, setPeriodType] = useState<HonorBoardPeriodType>('week');
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  const [showPointValues, setShowPointValues] = useState<boolean>(false);
  const [showRankProgress, setShowRankProgress] = useState<boolean>(true);

  // Titles Selection
  const [availableTitles, setAvailableTitles] = useState<HonorTitle[]>([]);
  const [selectedTitleIds, setSelectedTitleIds] = useState<string[]>([]);

  // Calculation Proposals & Tie State
  const [evaluationResults, setEvaluationResults] = useState<TitleEvaluationResult[]>([]);
  const [activeTieTitle, setActiveTieTitle] = useState<TitleEvaluationResult | null>(null);
  const [isTieModalOpen, setIsTieModalOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const loadInitialData = useCallback(async () => {
    try {
      const titles = await honorTitleSeedService.seedDefaultTitles();
      const uniqueTitles = Array.from(
        new Map(titles.map((t) => [t.code || t.id, t])).values()
      ).sort((a, b) => a.sortOrder - b.sortOrder);
      setAvailableTitles(uniqueTitles);
      setSelectedTitleIds(uniqueTitles.filter((t) => t.isActive).map((t) => t.id));

      const settings = await settingsRepository.getSettings();
      const activeSysSettings = avatarThemeRegistry.resolveGlobalSettings(settings);
      setGlobalAvatarSettings(activeSysSettings);

      const uploadedIds = activeSysSettings.levels
        .filter((l) => l.image.kind === 'UPLOADED')
        .map((l) => (l.image as { kind: 'UPLOADED'; assetId: string }).assetId);
      if (uploadedIds.length > 0) {
        const urlMap = await avatarAssetService.preloadAssetUrls(uploadedIds);
        setUploadedAssetUrls(urlMap);
      }

      let yearId = settings.activeAcademicYearId;
      if (!yearId) {
        const year = await academicYearRepository.getCurrentYear();
        yearId = year?.id;
      }

      if (yearId) {
        const year = await academicYearRepository.findById(yearId);
        setActiveYear(year || null);

        const classes = await classRepository.findByAcademicYear(yearId);
        setClassList(classes);

        const initialClsId = settings.activeClassId || classes[0]?.id || '';
        setSelectedClassId(initialClsId);

        const clsObj = classes.find((c) => c.id === initialClsId);
        setBoardTitle(`Bảng Vàng Danh Hiệu - Lớp ${clsObj?.name || '1A1'} - Tuần này`);
      }
    } catch (err) {
      console.error('Error loading wizard metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle calculation when entering Step 3
  const handleCalculateProposals = async () => {
    if (!selectedClassId || !activeYear) return;
    setLoading(true);
    try {
      const { system } = await rankSeedService.seedDefaultRankSystem(activeYear.id);
      const chosenTitles = availableTitles.filter((t) => selectedTitleIds.includes(t.id));

      const results = await honorRuleEngineService.evaluateAllTitlesForClass(
        selectedClassId,
        chosenTitles,
        startDate,
        endDate,
        system.id,
        activeYear.id
      );

      setEvaluationResults(results);
      setCurrentStep(3);
    } catch (err) {
      console.error('Error computing proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle title checkbox
  const toggleTitle = (id: string) => {
    setSelectedTitleIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  // Handle Tie Resolution
  const handleResolveTie = (
    action: 'accept_all' | 'increase_limit' | 'select_manual',
    selectedIds: string[],
    customReason?: string
  ) => {
    if (!activeTieTitle) return;

    setEvaluationResults((prev) =>
      prev.map((res) => {
        if (res.title.id !== activeTieTitle.title.id) return res;

        let newCandidates = [...res.candidates];
        if (action === 'accept_all') {
          newCandidates = res.tiedCandidates;
        } else if (action === 'select_manual') {
          newCandidates = res.tiedCandidates.filter((c) => selectedIds.includes(c.student.id));
          if (customReason) {
            newCandidates = newCandidates.map((c) => ({ ...c, reason: customReason }));
          }
        }

        return {
          ...res,
          candidates: newCandidates,
          hasTie: false,
        };
      })
    );
  };

  // Handle Final Save & Publish
  const handleFinish = async (publishImmediately: boolean = true) => {
    if (!selectedClassId || !activeYear) return;
    setSaving(true);
    try {
      const { board } = await honorBoardService.createDraftBoard({
        classId: selectedClassId,
        academicYearId: activeYear.id,
        title: boardTitle,
        periodType,
        startDate,
        endDate,
        selectedTitleIds,
        showPointValues,
        showRankProgress,
      });

      if (publishImmediately) {
        await honorBoardService.publishBoard(board.id);
      }

      navigate(`/conduct/honor-board/${board.id}`);
    } catch (err) {
      console.error('Error saving honor board:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Thiết Lập Bảng Vàng Danh Hiệu"
        description="Quy trình 4 bước tạo và đề xuất danh hiệu sư phạm công bằng cho học sinh"
        badgeText={`Bước ${currentStep}/4`}
      />

      {/* STEP PROGRESS INDICATOR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 select-none">
        {[
          { step: 1, label: 'Kỳ xét & Lớp', icon: Calendar },
          { step: 2, label: 'Chọn danh hiệu', icon: Sliders },
          { step: 3, label: 'Duyệt ứng viên', icon: Layers },
          { step: 4, label: 'Hoàn tất & Công bố', icon: FileCheck },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentStep === item.step;
          const isDone = currentStep > item.step;
          return (
            <div
              key={item.step}
              className={cn(
                'p-3 rounded-2xl border text-center transition-all flex flex-col sm:flex-row items-center justify-center gap-2',
                isActive
                  ? 'bg-app-primary text-app-primary-fg border-app-primary shadow-xs font-bold'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                  : 'bg-app-surface border-app text-app-muted'
              )}
            >
              <div className="p-1 rounded-lg shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs truncate">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: CLASS & PERIOD */}
      {currentStep === 1 && (
        <Card title="1. Thông Tin Bảng Vàng & Kỳ Xét">
          <div className="space-y-4">
            <div>
              <Input
                label="Tiêu đề Bảng Vàng"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="Ví dụ: Bảng Vàng Danh Hiệu Tuần 3 - Lớp 1A1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Lớp học áp dụng"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  const cls = classList.find((c) => c.id === e.target.value);
                  if (cls) setBoardTitle(`Bảng Vàng Danh Hiệu - Lớp ${cls.name} - Tuần này`);
                }}
                options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
              />

              <Select
                label="Kỳ xét vinh danh"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as HonorBoardPeriodType)}
                options={[
                  { value: 'week', label: 'Theo Tuần' },
                  { value: 'month', label: 'Theo Tháng' },
                  { value: 'term', label: 'Theo Học Kỳ' },
                  { value: 'custom', label: 'Khoảng ngày tùy chỉnh' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Từ ngày"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Đến ngày"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-app">
              <Button
                variant="primary"
                size="md"
                className="font-bold"
                onClick={() => setCurrentStep(2)}
              >
                Tiếp tục: Chọn danh hiệu <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: SELECT TITLES */}
      {currentStep === 2 && (
        <Card title="2. Lựa Chọn Danh Hiệu & Chỉ Tiêu">
          <div className="space-y-4">
            <p className="text-xs text-app-muted">
              Thầy/Cô có thể bật/tắt từng danh hiệu để phù hợp với kế hoạch thi đua của lớp trong kỳ này.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableTitles.map((title) => {
                const isSelected = selectedTitleIds.includes(title.id);
                return (
                  <div
                    key={title.id}
                    onClick={() => toggleTitle(title.id)}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3',
                      isSelected
                        ? 'bg-app-primary-light/20 border-app-primary/50 shadow-2xs'
                        : 'bg-app-surface border-app opacity-60'
                    )}
                  >
                    <div className="min-w-0 flex items-start gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: title.colorToken }}
                      />
                      <div>
                        <h4 className="text-xs font-black text-app-main">{title.name}</h4>
                        <p className="text-[11px] text-app-muted line-clamp-2 mt-0.5">{title.description}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-app-primary">
                          Tối đa {title.maxRecipients} học sinh
                        </span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-app-primary pointer-events-none mt-1"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-app">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1 inline" /> Quay lại
              </Button>
              <Button
                variant="primary"
                size="md"
                className="font-bold"
                onClick={handleCalculateProposals}
                disabled={loading || selectedTitleIds.length === 0}
              >
                {loading ? 'Đang tính toán...' : 'Tính toán đề xuất'} <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: REVIEW PROPOSALS */}
      {currentStep === 3 && (
        <Card title="3. Duyệt Đề Xuất & Xử Lý Đồng Hạng">
          <div className="space-y-5">
            <p className="text-xs text-app-muted">
              Kết quả tính toán tự động dựa trên dữ liệu thi đua, cấp bậc và chuyên cần. Thầy/Cô có thể can thiệp trước khi công bố.
            </p>

            <div className="space-y-4">
              {evaluationResults.map((res) => (
                <div key={res.title.id} className="p-4 rounded-2xl border border-app bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: res.title.colorToken }} />
                      <h4 className="text-xs font-black text-app-main">{res.title.name}</h4>
                      <span className="text-[11px] text-app-muted">({res.candidates.length} ứng viên)</span>
                    </div>

                    {res.hasTie && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                        leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setActiveTieTitle(res);
                          setIsTieModalOpen(true);
                        }}
                      >
                        Xử lý đồng hạng
                      </Button>
                    )}
                  </div>

                  {res.candidates.length === 0 ? (
                    <p className="text-xs text-app-muted italic">Chưa có ứng viên đạt tiêu chí tự động. Thầy/Cô có thể đề cử thủ công.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                      {res.candidates.map((cand) => (
                        <div key={cand.student.id} className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-app flex items-center justify-between gap-2 text-xs shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <StudentAvatar
                              student={cand.student}
                              score={cand.points}
                              rankLevelOrOrder={cand.rankLevel}
                              preferRankAvatar={true}
                              globalActiveThemeId={globalAvatarSettings.presetThemeId}
                              globalSettings={globalAvatarSettings}
                              uploadedAssetUrls={uploadedAssetUrls}
                              size="xs"
                              className="border border-app shrink-0 shadow-2xs"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-app-main truncate">{cand.student.fullName}</p>
                              <p className="text-[10px] text-emerald-600 font-bold">{cand.metricLabel}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-app-primary shrink-0 font-mono ml-2">
                            {cand.rankName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-app">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1 inline" /> Quay lại
              </Button>
              <Button variant="primary" size="md" className="font-bold" onClick={() => setCurrentStep(4)}>
                Xác nhận danh sách <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: PUBLISH / SAVE */}
      {currentStep === 4 && (
        <Card title="4. Hoàn Tất & Quyết Định Công Bố">
          <div className="space-y-5">
            <div className="p-6 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-3xl space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-emerald-950 dark:text-emerald-200">
                Sẵn Sàng Công Bố Bảng Vàng Danh Hiệu!
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300 max-w-md mx-auto">
                Khi công bố, hệ thống sẽ cố định snapshot cấp bậc và điểm thi đua của học sinh tại thời điểm vinh danh.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPointValues}
                  onChange={(e) => setShowPointValues(e.target.checked)}
                  className="rounded text-app-primary"
                />
                <span className="font-bold text-app-main">Hiển thị điểm số chi tiết trên Bảng vàng</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRankProgress}
                  onChange={(e) => setShowRankProgress(e.target.checked)}
                  className="rounded text-app-primary"
                />
                <span className="font-bold text-app-main">Hiển thị cấp bậc quân hàm của học sinh</span>
              </label>
            </div>

            <div className="pt-4 border-t border-app flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button variant="outline" size="md" onClick={() => setCurrentStep(3)} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-1 inline" /> Quay lại duyệt
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1 sm:flex-initial"
                  disabled={saving}
                  onClick={() => handleFinish(false)}
                >
                  Lưu dạng bản nháp
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="font-bold flex-1 sm:flex-initial shadow-md"
                  disabled={saving}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={() => handleFinish(true)}
                >
                  {saving ? 'Đang công bố...' : 'Công bố Bảng Vàng'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TIE RESOLUTION MODAL */}
      {activeTieTitle && (
        <TieResolutionModal
          isOpen={isTieModalOpen}
          onClose={() => setIsTieModalOpen(false)}
          title={activeTieTitle.title}
          tiedCandidates={activeTieTitle.tiedCandidates}
          onResolve={handleResolveTie}
          globalActiveThemeId={globalAvatarSettings.presetThemeId}
          globalSettings={globalAvatarSettings}
          uploadedAssetUrls={uploadedAssetUrls}
        />
      )}
    </div>
  );
};
