import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { useToast } from '../../shared/hooks/useToast';
import { db } from '../../core/database/db';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { classRepository } from '../../core/repositories/class.repository';
import {
  evaluationService,
  type ClassEvaluationSummary,
} from '../../core/services/evaluation.service';
import { evaluationProfileService } from '../../core/services/evaluation-profile.service';
import { evaluationValidationService } from '../../core/services/evaluation-validation.service';
import type {
  ClassRoom,
  AcademicYear,
  EvaluationPeriodCode,
  Evaluation,
  EvaluationItem,
  EvaluationDomain,
} from '../../core/database/types';

import { EvaluationHeader } from './components/EvaluationHeader';
import { EvaluationRoster } from './components/EvaluationRoster';
import { TT27EvaluationForm } from './components/TT27EvaluationForm';
import { TT22EvaluationForm } from './components/TT22EvaluationForm';
import { EvaluationTemplateDrawer } from './components/EvaluationTemplateDrawer';
import { EvaluationEvidencePanel } from './components/EvaluationEvidencePanel';
import { EvaluationReviewModal } from './components/EvaluationReviewModal';
import { EvaluationUnlockModal } from './components/EvaluationUnlockModal';
import { EvaluationExportModal } from './components/EvaluationExportModal';

import {
  BookOpen,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { StudentAvatar } from '../../shared/components/StudentAvatar';

export const EvaluationsPage: React.FC = () => {
  const { showSuccess, showError, showToast } = useToast();

  // Primary Selection States
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<EvaluationPeriodCode>('END_TERM_1');

  // Summary & Roster State
  const [summary, setSummary] = useState<ClassEvaluationSummary | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Student Working Draft State
  const [currentEvaluation, setCurrentEvaluation] = useState<Partial<Evaluation>>({});
  const [currentItems, setCurrentItems] = useState<Partial<EvaluationItem>[]>([]);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Modal / Drawer States
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [activeTemplateTarget, setActiveTemplateTarget] = useState<{
    domain: EvaluationDomain;
    criterionCode: string;
    levelCode?: string;
  } | null>(null);

  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isFinalizingClass, setIsFinalizingClass] = useState(false);

  // Autosave Debounce Ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeStudentIdRef = useRef<string | null>(null);
  activeStudentIdRef.current = selectedStudentId;

  // 1. Initial Load: Years, Classes & Settings
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const years = await academicYearRepository.findAll();
      setAcademicYears(years);

      const settings = await settingsRepository.getSettings();
      let yearId = settings.activeAcademicYearId;
      if (!yearId && years.length > 0) {
        yearId = years[0]!.id;
      }
      setSelectedYearId(yearId || '');

      if (yearId) {
        const clsList = await classRepository.findByAcademicYear(yearId);
        setClasses(clsList);

        let clsId = settings.activeClassId;
        if ((!clsId || !clsList.some((c) => c.id === clsId)) && clsList.length > 0) {
          clsId = clsList[0]!.id;
        }
        setSelectedClassId(clsId || '');

        if (clsId) {
          const activeCls = clsList.find((c) => c.id === clsId);
          if (activeCls) {
            const reg = evaluationProfileService.resolveProfile(activeCls.grade);
            const initialPeriod = reg === 'TT27_2020_PRIMARY' ? 'END_TERM_1' : 'TERM_1';
            setSelectedPeriod(initialPeriod);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing evaluations page:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  // 2. Load Class Summary when Year / Class / Period changes
  const loadClassSummary = useCallback(async () => {
    if (!selectedClassId || !selectedYearId || !selectedPeriod) return;

    try {
      const sum = await evaluationService.getClassEvaluationSummary(
        selectedClassId,
        selectedYearId,
        selectedPeriod
      );
      setSummary(sum);

      // Auto select first student if none selected or selected not in roster
      if (sum.roster.length > 0) {
        if (!selectedStudentId || !sum.roster.some((r) => r.student.id === selectedStudentId)) {
          setSelectedStudentId(sum.roster[0]!.student.id);
        }
      } else {
        setSelectedStudentId(null);
      }
    } catch (err) {
      console.error('Error loading class evaluation summary:', err);
    }
  }, [selectedClassId, selectedYearId, selectedPeriod, selectedStudentId]);

  useEffect(() => {
    loadClassSummary();
  }, [selectedClassId, selectedYearId, selectedPeriod]);

  // 3. Load Active Student Evaluation Draft
  const loadStudentEvaluation = useCallback(async () => {
    if (!selectedStudentId || !selectedClassId || !selectedYearId || !selectedPeriod) {
      setCurrentEvaluation({});
      setCurrentItems([]);
      return;
    }

    try {
      const evalData = await evaluationService.getStudentEvaluation(
        selectedClassId,
        selectedStudentId,
        selectedYearId,
        selectedPeriod
      );

      if (evalData) {
        setCurrentEvaluation(evalData.evaluation);
        setCurrentItems(evalData.items);
      } else {
        // Initialize blank draft in UI
        const regCode = summary?.regulationCode || 'TT27_2020_PRIMARY';
        setCurrentEvaluation({
          classId: selectedClassId,
          studentId: selectedStudentId,
          academicYearId: selectedYearId,
          periodCode: selectedPeriod,
          regulationCode: regCode,
          status: 'DRAFT',
        });
        setCurrentItems([]);
      }
      setSaveStatus('IDLE');
    } catch (err) {
      console.error('Error loading student evaluation:', err);
    }
  }, [selectedStudentId, selectedClassId, selectedYearId, selectedPeriod, summary?.regulationCode]);

  useEffect(() => {
    loadStudentEvaluation();
  }, [selectedStudentId, loadStudentEvaluation]);

  // 4. Trigger Debounced Autosave
  const triggerAutosave = useCallback(
    (evalState: Partial<Evaluation>, itemsState: Partial<EvaluationItem>[]) => {
      const studentIdAtTrigger = activeStudentIdRef.current;
      if (!studentIdAtTrigger || evalState.status === 'FINALIZED') return;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      setSaveStatus('SAVING');

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          // Verify student has not changed during debounce
          if (activeStudentIdRef.current !== studentIdAtTrigger) return;

          const saved = await evaluationService.saveEvaluationDraft({
            evaluation: {
              ...evalState,
              classId: selectedClassId,
              studentId: studentIdAtTrigger,
              academicYearId: selectedYearId,
              periodCode: selectedPeriod,
              regulationCode: summary?.regulationCode || 'TT27_2020_PRIMARY',
              status: evalState.status || 'DRAFT',
            } as any,
            items: itemsState as any,
          });

          setCurrentEvaluation(saved.evaluation);
          setCurrentItems(saved.items);
          setSaveStatus('SAVED');
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          setLastSavedTime(timeStr);

          // Update summary in background
          loadClassSummary();
        } catch (err: unknown) {
          console.error('Autosave failed:', err);
          setSaveStatus('ERROR');
        }
      }, 600);
    },
    [selectedClassId, selectedYearId, selectedPeriod, summary?.regulationCode, loadClassSummary]
  );

  // Form State Updaters
  const handleUpdateEvaluation = (updates: Partial<Evaluation>) => {
    const next = { ...currentEvaluation, ...updates };
    setCurrentEvaluation(next);
    triggerAutosave(next, currentItems);
  };

  const handleUpdateItem = (itemUpdate: Partial<EvaluationItem>) => {
    const existingIdx = currentItems.findIndex(
      (it) => it.domain === itemUpdate.domain && it.criterionCode === itemUpdate.criterionCode
    );

    let nextItems: Partial<EvaluationItem>[];
    if (existingIdx >= 0) {
      nextItems = [...currentItems];
      nextItems[existingIdx] = { ...nextItems[existingIdx], ...itemUpdate };
    } else {
      nextItems = [...currentItems, itemUpdate];
    }

    setCurrentItems(nextItems);
    triggerAutosave(currentEvaluation, nextItems);
  };

  // Student Navigation
  const activeStudentIndex = useMemo(() => {
    if (!summary || !selectedStudentId) return -1;
    return summary.roster.findIndex((r) => r.student.id === selectedStudentId);
  }, [summary, selectedStudentId]);

  const activeStudentItem = useMemo(() => {
    if (!summary || activeStudentIndex < 0) return null;
    return summary.roster[activeStudentIndex] || null;
  }, [summary, activeStudentIndex]);

  const handlePrevStudent = () => {
    if (!summary || activeStudentIndex <= 0) return;
    setSelectedStudentId(summary.roster[activeStudentIndex - 1]!.student.id);
  };

  const handleNextStudent = () => {
    if (!summary || activeStudentIndex >= summary.roster.length - 1) return;
    setSelectedStudentId(summary.roster[activeStudentIndex + 1]!.student.id);
  };

  // Finalize Active Student
  const handleFinalizeActiveStudent = async () => {
    if (!currentEvaluation.id || !summary || !activeStudentItem) return;

    try {
      const teacher = await db.teacherProfiles.toCollection().first();
      const teacherName = teacher ? teacher.fullName : 'Giáo viên Chủ nhiệm';
      const studentIds = summary.roster.map((r) => r.student.id);

      await evaluationService.finalizeStudent(
        currentEvaluation.id,
        teacherName,
        summary.grade,
        studentIds
      );

      showSuccess('Khóa sổ thành công', `Đã khóa sổ đánh giá học sinh ${activeStudentItem.student.fullName}`);
      loadStudentEvaluation();
      loadClassSummary();
    } catch (err: unknown) {
      showError('Chưa thể khóa sổ', (err as Error).message);
    }
  };

  // Unlock Active Student
  const handleUnlockActiveStudent = async (reason: string) => {
    if (!currentEvaluation.id || !activeStudentItem) return;

    const teacher = await db.teacherProfiles.toCollection().first();
    const teacherName = teacher ? teacher.fullName : 'Giáo viên Chủ nhiệm';

    await evaluationService.unlockStudent(currentEvaluation.id, reason, teacherName);
    showSuccess('Mở khóa thành công', `Hồ sơ học sinh ${activeStudentItem.student.fullName} đã chuyển về bản nháp.`);
    loadStudentEvaluation();
    loadClassSummary();
  };

  // Finalize Entire Class Batch
  const handleFinalizeClass = async () => {
    if (!selectedClassId || !selectedYearId || !selectedPeriod) return;

    setIsFinalizingClass(true);
    try {
      const teacher = await db.teacherProfiles.toCollection().first();
      const teacherName = teacher ? teacher.fullName : 'Giáo viên Chủ nhiệm';

      const res = await evaluationService.finalizeClass(
        selectedClassId,
        selectedYearId,
        selectedPeriod,
        teacherName
      );

      if (res.errors.length > 0) {
        showToast(
          `Đã khóa ${res.finalizedCount} học sinh`,
          `Còn ${res.errors.length} học sinh có lỗi chưa thể khóa sổ. Vui lòng mở "Rà soát lỗi" để kiểm tra.`,
          'warning'
        );
      } else {
        showSuccess('Hoàn tất khóa sổ cả lớp', `Toàn bộ ${res.finalizedCount} học sinh đã được khóa sổ chính thức.`);
      }

      loadStudentEvaluation();
      loadClassSummary();
    } catch (err: unknown) {
      showError('Lỗi khóa sổ', (err as Error).message);
    } finally {
      setIsFinalizingClass(false);
    }
  };

  // Copy Previous Period
  const handleCopyPreviousPeriod = async () => {
    if (!selectedClassId || !selectedStudentId || !selectedYearId || !activeStudentItem) return;

    const periods = evaluationProfileService.getEvaluationPeriods(
      summary?.regulationCode || 'TT27_2020_PRIMARY'
    );
    const currIdx = periods.findIndex((p) => p.code === selectedPeriod);
    if (currIdx <= 0) {
      showToast('Không có kỳ trước', 'Đây là kỳ đánh giá đầu tiên của năm học.', 'warning');
      return;
    }

    const prevPeriod = periods[currIdx - 1]!.code;
    try {
      await evaluationService.copyFromPreviousPeriod(
        selectedClassId,
        selectedStudentId,
        selectedYearId,
        prevPeriod,
        selectedPeriod
      );
      showSuccess('Sao chép thành công', `Đã sao chép nội dung từ ${periods[currIdx - 1]!.name} sang bản nháp kỳ này.`);
      loadStudentEvaluation();
      loadClassSummary();
    } catch (err: unknown) {
      showError('Lỗi sao chép', (err as Error).message);
    }
  };

  // Duplicates computation for Review Modal
  const duplicatesMap = useMemo(() => {
    if (!summary) return new Map<string, string[]>();
    const evalDataList = summary.roster
      .filter((r) => r.evaluation)
      .map((r) => {
        const comments: string[] = [];
        if (r.evaluation?.homeroomComment) comments.push(r.evaluation.homeroomComment);
        return {
          studentId: r.student.id,
          studentName: r.student.fullName,
          comments,
        };
      });
    return evaluationValidationService.detectDuplicateComments(evalDataList);
  }, [summary]);

  const isCurrentLocked = currentEvaluation.status === 'FINALIZED';

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Page Title */}
      <PageHeader
        title="Sổ Nhận Xét & Đánh Giá Học Sinh"
        description="Đánh giá kết quả học tập, phẩm chất và năng lực theo chuẩn Thông tư 27/2020/TT-BGDĐT và Thông tư 22/2021/TT-BGDĐT"
        badgeText={summary ? `${summary.className} • Sĩ số: ${summary.totalStudents}` : undefined}
      />

      {/* Top Header: Selectors & Actions */}
      <EvaluationHeader
        academicYears={academicYears}
        selectedYearId={selectedYearId}
        onSelectYear={setSelectedYearId}
        classes={classes}
        selectedClassId={selectedClassId}
        onSelectClass={setSelectedClassId}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        summary={summary}
        onOpenReview={() => setShowReviewModal(true)}
        onFinalizeClass={handleFinalizeClass}
        onExportExcel={() => setShowExportModal(true)}
        isFinalizingClass={isFinalizingClass}
      />

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : !summary || summary.totalStudents === 0 ? (
        <div className="p-12 text-center bg-app-surface border border-app rounded-2xl space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-app-primary opacity-40" />
          <h3 className="font-bold text-base text-app-main">Lớp học chưa có danh sách học sinh</h3>
          <p className="text-xs text-app-muted max-w-md mx-auto">
            Vui lòng thêm học sinh hoặc nhập danh sách học sinh từ file Excel trong mục <strong>Học sinh</strong> để bắt đầu đánh giá.
          </p>
        </div>
      ) : (
        /* Main Workspace Split Layout: 1/3 Roster + 2/3 Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Student Roster (4 cols on lg) */}
          <div className="lg:col-span-4 h-[750px] sticky top-20">
            <EvaluationRoster
              roster={summary.roster}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          </div>

          {/* Right Column: Active Student Form Editor (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            {activeStudentItem && (
              <div className="bg-app-surface border border-app rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                {/* Student Profile Header in Editor */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-app">
                  <div className="flex items-center gap-3">
                    <StudentAvatar student={activeStudentItem.student} size="lg" shape="circle" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-app-main">
                          {activeStudentItem.student.fullName}
                        </h3>
                        <Badge variant="neutral" className="text-xs font-mono">
                          STT: {activeStudentItem.rollNumber || activeStudentIndex + 1}
                        </Badge>
                      </div>
                      <p className="text-xs text-app-muted font-mono mt-0.5">
                        Mã HS: {activeStudentItem.student.studentCode} • {activeStudentItem.student.gender} • Lớp {summary.className}
                      </p>
                    </div>
                  </div>

                  {/* Autosave Status & Student Switcher */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Autosave Indicator */}
                    <div className="text-[11px] flex items-center gap-1.5 font-medium">
                      {saveStatus === 'SAVING' ? (
                        <span className="text-blue-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                          Đang lưu...
                        </span>
                      ) : saveStatus === 'SAVED' ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã lưu {lastSavedTime}
                        </span>
                      ) : saveStatus === 'ERROR' ? (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Lỗi lưu tự động
                        </span>
                      ) : (
                        <span className="text-app-muted flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Tự động lưu
                        </span>
                      )}
                    </div>

                    {/* Nav Prev / Next */}
                    <div className="flex items-center gap-1 border border-app rounded-xl p-0.5 bg-app-surface-hover/50">
                      <button
                        type="button"
                        disabled={activeStudentIndex <= 0}
                        className="p-1 rounded-lg hover:bg-app-surface text-app-main disabled:opacity-30"
                        onClick={handlePrevStudent}
                        title="Học sinh trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold px-1.5 text-app-muted">
                        {activeStudentIndex + 1}/{summary.totalStudents}
                      </span>
                      <button
                        type="button"
                        disabled={activeStudentIndex >= summary.totalStudents - 1}
                        className="p-1 rounded-lg hover:bg-app-surface text-app-main disabled:opacity-30"
                        onClick={handleNextStudent}
                        title="Học sinh kế tiếp"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-actions toolbar */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Copy className="w-3.5 h-3.5" />}
                      onClick={handleCopyPreviousPeriod}
                      disabled={isCurrentLocked}
                    >
                      Sao chép từ kỳ trước
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      onClick={() => setShowEvidenceDrawer(true)}
                    >
                      Xem minh chứng & Gợi ý
                    </Button>
                  </div>

                  {/* Lock / Unlock Single Student Button */}
                  <div>
                    {isCurrentLocked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Unlock className="w-3.5 h-3.5" />}
                        onClick={() => setShowUnlockModal(true)}
                      >
                        Mở khóa chỉnh sửa
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                        onClick={handleFinalizeActiveStudent}
                      >
                        Khóa sổ học sinh này
                      </Button>
                    )}
                  </div>
                </div>

                {/* Form Body by Regulation Profile */}
                {summary.regulationCode === 'TT27_2020_PRIMARY' ? (
                  <TT27EvaluationForm
                    student={activeStudentItem.student}
                    grade={summary.grade}
                    evaluation={currentEvaluation}
                    items={currentItems}
                    onChangeEvaluation={handleUpdateEvaluation}
                    onChangeItem={handleUpdateItem}
                    onOpenTemplateDrawer={(domain, criterionCode, levelCode) => {
                      setActiveTemplateTarget({ domain, criterionCode, levelCode });
                      setShowTemplateDrawer(true);
                    }}
                    onOpenEvidenceDrawer={() => setShowEvidenceDrawer(true)}
                    onOpenUnlockModal={() => setShowUnlockModal(true)}
                    isLocked={isCurrentLocked}
                  />
                ) : (
                  <TT22EvaluationForm
                    student={activeStudentItem.student}
                    grade={summary.grade}
                    regulationCode={summary.regulationCode}
                    evaluation={currentEvaluation}
                    items={currentItems}
                    onChangeEvaluation={handleUpdateEvaluation}
                    onChangeItem={handleUpdateItem}
                    onOpenTemplateDrawer={(domain, criterionCode, levelCode) => {
                      setActiveTemplateTarget({ domain, criterionCode, levelCode });
                      setShowTemplateDrawer(true);
                    }}
                    onOpenEvidenceDrawer={() => setShowEvidenceDrawer(true)}
                    onOpenUnlockModal={() => setShowUnlockModal(true)}
                    isLocked={isCurrentLocked}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Drawer */}
      {showTemplateDrawer && activeStudentItem && (
        <EvaluationTemplateDrawer
          isOpen={showTemplateDrawer}
          onClose={() => setShowTemplateDrawer(false)}
          student={activeStudentItem.student}
          regulationCode={summary?.regulationCode || 'TT27_2020_PRIMARY'}
          grade={summary?.grade || 1}
          currentDomain={activeTemplateTarget?.domain}
          currentCriterionCode={activeTemplateTarget?.criterionCode}
          currentLevelCode={activeTemplateTarget?.levelCode}
          onApplyComment={(text) => {
            if (activeTemplateTarget) {
              if (activeTemplateTarget.domain === 'SUMMARY' || activeTemplateTarget.domain === 'HOMEROOM_SUMMARY') {
                handleUpdateEvaluation({ homeroomComment: text });
              } else {
                handleUpdateItem({
                  domain: activeTemplateTarget.domain,
                  criterionCode: activeTemplateTarget.criterionCode,
                  comment: text,
                });
              }
            }
          }}
        />
      )}

      {/* Evidence Suggestion Panel Drawer */}
      {showEvidenceDrawer && activeStudentItem && (
        <EvaluationEvidencePanel
          isOpen={showEvidenceDrawer}
          onClose={() => setShowEvidenceDrawer(false)}
          student={activeStudentItem.student}
          classId={selectedClassId}
          academicYearId={selectedYearId}
          periodCode={selectedPeriod}
          regulationCode={summary?.regulationCode || 'TT27_2020_PRIMARY'}
          onApplySuggestedComment={(text) => {
            if (summary?.regulationCode === 'TT27_2020_PRIMARY') {
              handleUpdateItem({
                domain: 'QUALITY',
                criterionCode: 'CHAM_CHI',
                comment: text,
              });
            } else {
              handleUpdateEvaluation({ homeroomComment: text });
            }
            showSuccess('Đã áp dụng câu gợi ý', 'Nội dung nhận xét đã được đưa vào ô soạn thảo.');
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && summary && (
        <EvaluationReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          roster={summary.roster}
          duplicates={duplicatesMap}
          onSelectStudent={(studentId) => setSelectedStudentId(studentId)}
        />
      )}

      {/* Unlock Reason Modal */}
      {showUnlockModal && activeStudentItem && (
        <EvaluationUnlockModal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
          studentName={activeStudentItem.student.fullName}
          onConfirmUnlock={handleUnlockActiveStudent}
        />
      )}

      {/* Export Modal */}
      {showExportModal && summary && (
        <EvaluationExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          classId={selectedClassId}
          className={summary.className}
          academicYearId={selectedYearId}
          periodCode={selectedPeriod}
        />
      )}
    </div>
  );
};
