import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { Modal } from '../../../shared/components/Modal';
import { Badge } from '../../../shared/components/Badge';
import { useToast } from '../../../shared/hooks/useToast';
import { EmulationRankBadge } from '../../../shared/components/EmulationRankBadge';
import { db } from '../../../core/database/db';
import type {
  RankSystem,
  RankLevel,
  RankCalculationScope,
  RankMode,
  ClassRoom,
} from '../../../core/database/types';
import { rankSeedService, DEFAULT_17_RANK_DEFINITIONS } from '../../../core/services/rank-seed.service';
import { rankCalculationService } from '../../../core/services/rank-calculation.service';
import { backupService } from '../../../core/backup/backup.service';
import {
  Shield,
  RotateCcw,
  Sparkles,
  Save,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';

export interface ConductRankConfigProps {
  academicYearId?: string;
}

export const ConductRankConfig: React.FC<ConductRankConfigProps> = ({ academicYearId }) => {
  const { showSuccess, showError, showInfo } = useToast();

  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<RankSystem | null>(null);
  const [draftLevels, setDraftLevels] = useState<RankLevel[]>([]);
  const [originalLevels, setOriginalLevels] = useState<RankLevel[]>([]);

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Generator Modal
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [stepPoints, setStepPoints] = useState<number>(50);

  // Impact Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImpacts, setPreviewImpacts] = useState<
    { studentId: string; studentName?: string; oldRankLevel: number; newRankLevel: number; changeType: 'promotion' | 'demotion' | 'no_change' }[]
  >([]);
  const [autoBackupChecked, setAutoBackupChecked] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mobile Group Accordions
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Hạ sĩ quan và Binh sĩ': true,
    'Cấp Úy': true,
    'Cấp Tá': true,
    'Cấp Tướng': true,
  });

  // Load Data
  const loadRankSystemData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Get current academic year if not provided
      let yearId = academicYearId;
      if (!yearId) {
        const year = await db.academicYears.filter((y) => y.isActive && !y.deletedAt).first();
        yearId = year?.id;
      }

      if (!yearId) {
        showError('Không tìm thấy năm học đang hoạt động.');
        setLoading(false);
        return;
      }

      // Seed / Fetch system
      const { system, levels } = await rankSeedService.seedDefaultRankSystem(yearId);
      setSystemConfig(system);

      const sorted = [...levels].sort((a, b) => a.level - b.level);
      setDraftLevels(sorted);
      setOriginalLevels(JSON.parse(JSON.stringify(sorted)));

      // Classes
      const classes = await db.classes.filter((c) => c.academicYearId === yearId && !c.deletedAt).toArray();
      setClassList(classes);

      const relations = await db.rankSystemClasses.where('rankSystemId').equals(system.id).toArray();
      if (relations.length > 0) {
        setSelectedClassIds(relations.map((r) => r.classId));
      } else {
        setSelectedClassIds(classes.map((c) => c.id));
      }
    } catch (err) {
      console.error('Error loading rank system data:', err);
      showError('Không thể nạp dữ liệu cấu hình cấp bậc thi đua.');
    } finally {
      setLoading(false);
    }
  }, [academicYearId, showError]);

  useEffect(() => {
    loadRankSystemData();
  }, [loadRankSystemData]);

  // Validation Logic
  const validationResult = useMemo(() => {
    if (draftLevels.length !== 17) {
      return { valid: false, message: 'Hệ thống phải duy trì đúng 17 cấp bậc.' };
    }

    if (draftLevels[0]?.minPoints !== 0) {
      return { valid: false, message: 'Cấp 1 (Binh nhì) phải có ngưỡng điểm bằng 0.' };
    }

    for (let i = 1; i < draftLevels.length; i++) {
      const prev = draftLevels[i - 1]!;
      const curr = draftLevels[i]!;

      if (curr.minPoints <= prev.minPoints) {
        return {
          valid: false,
          message: `Lỗi ngưỡng điểm: ${curr.name} (${curr.minPoints}đ) phải lớn hơn ${prev.name} (${prev.minPoints}đ).`,
        };
      }
    }

    return { valid: true };
  }, [draftLevels]);

  const hasUnsavedChanges = useMemo(() => {
    if (!systemConfig) return false;
    return JSON.stringify(draftLevels) !== JSON.stringify(originalLevels);
  }, [draftLevels, originalLevels, systemConfig]);

  // Handle Input Changes
  const handleMinPointsChange = (level: number, value: number) => {
    setDraftLevels((prev) =>
      prev.map((r) => (r.level === level ? { ...r, minPoints: Math.max(0, value) } : r))
    );
  };

  const handleDescriptionChange = (level: number, desc: string) => {
    setDraftLevels((prev) =>
      prev.map((r) => (r.level === level ? { ...r, description: desc } : r))
    );
  };

  // Restore Default Thresholds
  const handleRestoreDefaults = () => {
    const restored: RankLevel[] = draftLevels.map((l) => {
      const def = DEFAULT_17_RANK_DEFINITIONS.find((d) => d.level === l.level);
      return {
        ...l,
        minPoints: def ? def.minPoints : (l.level - 1) * 50,
        description: def ? def.description : l.description,
      };
    });
    setDraftLevels(restored);
    showInfo('Đã khôi phục ngưỡng điểm mặc định (0đ đến 800đ).');
  };

  // Generate Quick Equal Steps
  const handleApplyStepGenerator = () => {
    if (stepPoints <= 0) {
      showError('Bước điểm phải lớn hơn 0.');
      return;
    }

    const generated = draftLevels.map((l, index) => ({
      ...l,
      minPoints: index * stepPoints,
    }));

    setDraftLevels(generated);
    setShowGeneratorModal(false);
    showSuccess(`Đã tự động tạo 17 ngưỡng điểm với bước điểm +${stepPoints}đ.`);
  };

  // Initiate Save - Trigger Preview Impact Modal
  const handleOpenPreviewModal = async () => {
    if (!validationResult.valid) {
      showError(validationResult.message || 'Cấu hình cấp bậc không hợp lệ.');
      return;
    }

    if (!systemConfig) return;

    try {
      const impacts = await rankCalculationService.previewConfigurationImpact(systemConfig.id, draftLevels);

      // Enhance with student names
      const enhanced = await Promise.all(
        impacts.map(async (imp) => {
          const st = await db.students.get(imp.studentId);
          return {
            ...imp,
            studentName: st ? st.fullName : `Học sinh (${imp.studentId})`,
          };
        })
      );

      setPreviewImpacts(enhanced);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error previewing rank configuration impact:', err);
      showError('Không thể tính toán bản xem trước tác động cấu hình.');
    }
  };

  // Confirm & Apply Configuration Save
  const handleConfirmSaveConfiguration = async () => {
    if (!systemConfig) return;
    setSaving(true);

    try {
      // 1. Auto Backup if requested
      if (autoBackupChecked) {
        await backupService.createBackup();
      }

      const nowISO = new Date().toISOString();

      // 2. Perform Dexie Transaction
      await db.runTransaction(
        'rw',
        [
          db.rankSystems,
          db.rankLevels,
          db.rankSystemClasses,
          db.studentRankHistory,
          db.auditLogs,
          db.classEnrollments,
          db.pointEntries,
          db.pointCategories,
          db.academicYears,
          db.terms,
        ],
        async () => {
          // Update System Record
          await db.rankSystems.put({
            ...systemConfig,
            updatedAt: nowISO,
          });

          // Update Rank Levels
          await db.rankLevels.bulkPut(draftLevels);

          // Update Classes Relations
          await db.rankSystemClasses.where('rankSystemId').equals(systemConfig.id).delete();
          const newRelations = selectedClassIds.map((cId) => ({
            id: crypto.randomUUID(),
            rankSystemId: systemConfig.id,
            classId: cId,
            createdAt: nowISO,
          }));
          await db.rankSystemClasses.bulkAdd(newRelations);

          // Batch Recalculate Ranks
          for (const cId of selectedClassIds) {
            const classRanksMap = await rankCalculationService.recalculateClassRanks(cId, systemConfig.id);
            for (const [studentId, rankRes] of classRanksMap.entries()) {
              await db.studentRankHistory.add({
                id: crypto.randomUUID(),
                rankSystemId: systemConfig.id,
                classId: cId,
                studentId,
                fromLevel: null,
                toLevel: rankRes.currentLevel,
                pointsBefore: rankRes.effectivePoints,
                pointsAfter: rankRes.effectivePoints,
                changeType: 'recalculated',
                reason: 'Tính toán lại toàn bộ cấu hình cấp bậc',
                createdAt: nowISO,
              });
            }
          }

          // Audit Log
          await db.auditLogs.add({
            id: crypto.randomUUID(),
            entityName: 'RankSystem',
            recordId: systemConfig.id,
            action: 'UPDATE',
            timestamp: nowISO,
            details: `Cập nhật cấu hình 17 Cấp bậc thi đua (${systemConfig.calculationScope}, ${systemConfig.rankMode}) và áp dụng cho ${selectedClassIds.length} lớp học`,
          });
        }
      );

      setOriginalLevels(JSON.parse(JSON.stringify(draftLevels)));
      setShowPreviewModal(false);
      showSuccess('Đã lưu và áp dụng cấu hình Cấp bậc thi đua thành công!');
    } catch (err) {
      console.error('Lỗi khi lưu cấu hình cấp bậc:', err);
      showError('Lưu cấu hình thất bại. Hệ thống đã tự động khôi phục dữ liệu ban đầu.');
    } finally {
      setSaving(false);
    }
  };

  // Grouped Levels for Mobile Accordion
  const groupedLevels = useMemo(() => {
    const groups: Record<string, RankLevel[]> = {
      'Hạ sĩ quan và Binh sĩ': [],
      'Cấp Úy': [],
      'Cấp Tá': [],
      'Cấp Tướng': [],
    };

    draftLevels.forEach((l) => {
      if (groups[l.group]) {
        groups[l.group]!.push(l);
      }
    });

    return groups;
  }, [draftLevels]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const impactSummary = useMemo(() => {
    const promoted = previewImpacts.filter((i) => i.changeType === 'promotion').length;
    const demoted = previewImpacts.filter((i) => i.changeType === 'demotion').length;
    const unchanged = previewImpacts.filter((i) => i.changeType === 'no_change').length;
    return { promoted, demoted, unchanged, total: previewImpacts.length };
  }, [previewImpacts]);

  if (loading || !systemConfig) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-600">Đang nạp cấu hình 17 Cấp bậc thi đua...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* HEADER CONTROLS CARD */}
      <Card className="p-5 border-l-4 border-l-blue-600">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-800">Cấu Hình 17 Cấp Bậc Thi Đua Học Đường</h2>
            </div>
            <p className="text-xs text-slate-500">
              Quản lý ngưỡng điểm thăng cấp, chế độ Achievement/Dynamic và hiệu ứng ăn mừng thi đua.
            </p>
          </div>

          {/* SYSTEM QUICK SWITCHES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Select
              label="Phạm vi tính điểm"
              value={systemConfig.calculationScope}
              onChange={(e) =>
                setSystemConfig({
                  ...systemConfig,
                  calculationScope: e.target.value as RankCalculationScope,
                })
              }
              options={[
                { value: 'academic_year', label: 'Theo Năm học hiện tại' },
                { value: 'term', label: 'Theo Học kỳ được chọn' },
                { value: 'all_time', label: 'Tất cả thời gian (All time)' },
              ]}
            />

            <Select
              label="Chế độ Cấp bậc (Rank Mode)"
              value={systemConfig.rankMode}
              onChange={(e) =>
                setSystemConfig({
                  ...systemConfig,
                  rankMode: e.target.value as RankMode,
                })
              }
              options={[
                { value: 'achievement', label: 'Achievement Mode (Giữ cấp đạt được cao nhất)' },
                { value: 'dynamic', label: 'Dynamic Mode (Biến động theo tổng điểm thực)' },
              ]}
            />
          </div>
        </div>

        {/* TOGGLE SWITCHES & QUICK ACTIONS */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
            <input
              type="checkbox"
              checked={systemConfig.celebrationEnabled}
              onChange={(e) => setSystemConfig({ ...systemConfig, celebrationEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="font-semibold text-slate-700">Hiệu ứng ăn mừng thăng cấp</span>
          </label>

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
            <input
              type="checkbox"
              checked={systemConfig.presentationCelebrationEnabled}
              onChange={(e) => setSystemConfig({ ...systemConfig, presentationCelebrationEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="font-semibold text-slate-700">Trình chiếu thăng cấp lớp học</span>
          </label>

          <Button variant="secondary" onClick={handleRestoreDefaults} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Khôi phục mặc định
          </Button>

          <Button variant="secondary" onClick={() => setShowGeneratorModal(true)} className="text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Tạo nhanh ngưỡng đều
          </Button>
        </div>
      </Card>

      {/* APPLICABLE CLASSES SELECTION */}
      <Card className="p-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" /> Lớp học áp dụng cấu hình cấp bậc thi đua:
          </label>
          <div className="flex flex-wrap gap-2">
            {classList.map((cls) => {
              const selected = selectedClassIds.includes(cls.id);
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() =>
                    setSelectedClassIds((prev) =>
                      selected ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Lớp {cls.name} {selected ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* VALIDATION ERROR ALERT */}
      {!validationResult.valid && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-bold">{validationResult.message}</span>
        </div>
      )}

      {/* DESKTOP VIEW: FULL 17 RANKS TABLE */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" /> Bảng Ma Trận 17 Cấp Bậc Thi Đua Học Đường
          </h3>
          <span className="text-xs font-semibold text-slate-500">Đã sắp xếp tăng dần từ Cấp 1 đến Cấp 17</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-16 text-center">Level</th>
                <th className="py-3 px-4 w-28 text-center">Huy hiệu xem trước</th>
                <th className="py-3 px-4 w-36">Tên Cấp Bậc</th>
                <th className="py-3 px-4 w-44">Nhóm Cấp</th>
                <th className="py-3 px-4 w-36">Ngưỡng điểm tối thiểu</th>
                <th className="py-3 px-4">Mô tả & Danh hiệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {draftLevels.map((rank) => (
                <tr key={rank.id} className="hover:bg-slate-50 transition-colors">
                  {/* LEVEL */}
                  <td className="py-3 px-4 text-center font-extrabold text-slate-700">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200">
                      {rank.level}
                    </span>
                  </td>

                  {/* BADGE PREVIEW */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <EmulationRankBadge rank={rank} size="sm" showPoints={false} />
                    </div>
                  </td>

                  {/* RANK NAME */}
                  <td className="py-3 px-4 font-extrabold text-slate-800">
                    {rank.name}
                  </td>

                  {/* GROUP */}
                  <td className="py-3 px-4">
                    <Badge variant="neutral" className="text-[11px] font-bold">
                      {rank.group}
                    </Badge>
                  </td>

                  {/* MIN POINTS INPUT */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        disabled={rank.level === 1} // Level 1 (Binh nhì) MUST be 0
                        value={rank.minPoints}
                        onChange={(e) => handleMinPointsChange(rank.level, parseInt(e.target.value) || 0)}
                        className="w-24 text-center font-mono font-bold"
                      />
                      <span className="text-slate-400 font-semibold">đ</span>
                    </div>
                  </td>

                  {/* DESCRIPTION */}
                  <td className="py-3 px-4">
                    <Input
                      value={rank.description}
                      onChange={(e) => handleDescriptionChange(rank.level, e.target.value)}
                      placeholder="Mô tả danh hiệu..."
                      className="w-full text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE VIEW: GROUPED ACCORDION CARDS */}
      <div className="lg:hidden space-y-4">
        {Object.entries(groupedLevels).map(([groupName, levels]) => {
          const expanded = expandedGroups[groupName];
          return (
            <Card key={groupName} className="p-4 space-y-3">
              <button
                type="button"
                onClick={() => toggleGroup(groupName)}
                className="w-full flex items-center justify-between font-extrabold text-slate-800 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-xs">
                    {groupName}
                  </Badge>
                  <span className="text-xs text-slate-500 font-normal">({levels.length} cấp)</span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {expanded && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {levels.map((rank) => (
                    <div key={rank.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-blue-600">Cấp {rank.level}</span>
                          <span className="font-bold text-slate-800 text-xs">{rank.name}</span>
                        </div>
                        <EmulationRankBadge rank={rank} size="sm" showPoints={false} />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-slate-600 shrink-0">Điểm tối thiểu:</label>
                        <Input
                          type="number"
                          disabled={rank.level === 1}
                          value={rank.minPoints}
                          onChange={(e) => handleMinPointsChange(rank.level, parseInt(e.target.value) || 0)}
                          className="w-24 text-center font-mono font-bold text-xs"
                        />
                        <span className="text-xs text-slate-400 font-semibold">đ</span>
                      </div>

                      <Input
                        value={rank.description}
                        onChange={(e) => handleDescriptionChange(rank.level, e.target.value)}
                        placeholder="Mô tả..."
                        className="w-full text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* STICKY BOTTOM SAVE ACTION BAR */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 md:left-64 z-50 animate-slideUp">
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Bạn có thay đổi chưa lưu!</p>
                <p className="text-xs text-slate-400">Xem trước tác động tới học sinh trước khi áp dụng.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                onClick={() => setDraftLevels(JSON.parse(JSON.stringify(originalLevels)))}
                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs"
              >
                Khôi phục
              </Button>
              <Button
                variant="primary"
                onClick={handleOpenPreviewModal}
                disabled={!validationResult.valid}
                className="bg-blue-600 hover:bg-blue-500 text-xs font-extrabold shadow-md"
              >
                <Save className="w-4 h-4 mr-1" /> Xem Trước & Lưu Cấu Hình
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STEP GENERATOR MODAL */}
      <Modal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        title="Tạo Nhanh Ngưỡng Điểm Đều Cho 17 Cấp Bậc"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-600">
            Tự động khởi tạo ngưỡng điểm tối thiểu theo một bước điểm tăng đều cho cả 17 cấp bậc (Binh nhì = 0đ).
          </p>

          <Input
            label="Bước điểm tăng giữa các cấp (ví dụ: 50đ, 60đ, 100đ)"
            type="number"
            value={stepPoints}
            onChange={(e) => setStepPoints(parseInt(e.target.value) || 50)}
            className="font-bold text-lg text-center font-mono"
          />

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs font-mono">
            <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Xem trước ngưỡng điểm:</p>
            <p className="text-slate-600">Cấp 1 (Binh nhì): 0đ</p>
            <p className="text-slate-600">Cấp 2 (Binh nhất): {stepPoints}đ</p>
            <p className="text-slate-600">Cấp 3 (Hạ sĩ): {stepPoints * 2}đ</p>
            <p className="text-slate-500">...</p>
            <p className="text-blue-700 font-bold">Cấp 17 (Đại tướng): {stepPoints * 16}đ</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowGeneratorModal(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" onClick={handleApplyStepGenerator}>
              Áp dụng ngưỡng đều
            </Button>
          </div>
        </div>
      </Modal>

      {/* IMPACT PREVIEW & CONFIRMATION MODAL */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Xem Trước Tác Động Khi Lưu Cấu Hình Cấp Bậc"
      >
        <div className="space-y-5 py-2 max-h-[75vh] overflow-y-auto pr-1">
          {/* STATS CARDS */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
              <div className="text-xl font-extrabold">{impactSummary.promoted}</div>
              <div className="text-[11px] font-bold">Thăng cấp</div>
            </div>

            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800">
              <TrendingDown className="w-5 h-5 mx-auto mb-1 text-red-600" />
              <div className="text-xl font-extrabold">{impactSummary.demoted}</div>
              <div className="text-[11px] font-bold">Hạ cấp</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800">
              <Minus className="w-5 h-5 mx-auto mb-1 text-slate-500" />
              <div className="text-xl font-extrabold">{impactSummary.unchanged}</div>
              <div className="text-[11px] font-bold">Không đổi</div>
            </div>
          </div>

          {/* IMPACTED STUDENTS LIST PREVIEW */}
          {previewImpacts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Chi tiết tác động tới học sinh ({previewImpacts.length}):</p>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {previewImpacts.map((imp) => (
                  <div key={imp.studentId} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-semibold text-slate-800">{imp.studentName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Cấp {imp.oldRankLevel}</span>
                      <span className="font-bold text-slate-400">➔</span>
                      <span
                        className={`font-extrabold ${
                          imp.changeType === 'promotion'
                            ? 'text-emerald-600'
                            : imp.changeType === 'demotion'
                            ? 'text-red-600'
                            : 'text-slate-600'
                        }`}
                      >
                        Cấp {imp.newRankLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-2">Không có học sinh nào bị thay đổi cấp bậc với ngưỡng mới này.</p>
          )}

          {/* WARNING ALERT */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Cảnh báo quan trọng khi áp dụng cấu hình:
            </div>
            <p className="text-[11px]">
              Dữ liệu sẽ được tính toán lại hàng loạt theo Dexie Transaction và lưu vết `recalculated` vào nhật ký thi đua. Hiệu ứng ăn mừng sẽ KHÔNG phát hàng loạt trong lần cập nhật này.
            </p>
          </div>

          {/* BACKUP CHECKBOX */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={autoBackupChecked}
              onChange={(e) => setAutoBackupChecked(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-blue-600" /> Tự động tạo bản sao lưu CSDL (.gvcn-backup) trước khi lưu (Khuyến nghị)
            </span>
          </label>

          {/* BUTTONS */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSaveConfiguration}
              isLoading={saving}
              className="bg-blue-600 hover:bg-blue-700 font-extrabold"
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Xác Nhận & Áp Dụng Cấu Hình
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
