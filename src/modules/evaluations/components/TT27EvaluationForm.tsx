import React, { useState } from 'react';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { evaluationProfileService } from '../../../core/services/evaluation-profile.service';
import { SENSITIVE_WORDS_PATTERN } from '../../../core/services/evaluation-validation.service';
import type { Evaluation, EvaluationItem, EvaluationDomain, Student } from '../../../core/database/types';
import {
  BookOpen,
  Heart,
  Sparkles,
  Award,
  BookText,
  AlertTriangle,
  Lightbulb,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface TT27EvaluationFormProps {
  student: Student;
  grade: number;
  evaluation: Partial<Evaluation>;
  items: Partial<EvaluationItem>[];
  onChangeEvaluation: (updates: Partial<Evaluation>) => void;
  onChangeItem: (item: Partial<EvaluationItem>) => void;
  onOpenTemplateDrawer: (domain: EvaluationDomain, criterionCode: string, levelCode?: string) => void;
  onOpenEvidenceDrawer: () => void;
  onOpenUnlockModal: () => void;
  isLocked: boolean;
}

export const TT27EvaluationForm: React.FC<TT27EvaluationFormProps> = ({
  student,
  grade,
  evaluation,
  items,
  onChangeEvaluation,
  onChangeItem,
  onOpenTemplateDrawer,
  onOpenEvidenceDrawer,
  onOpenUnlockModal,
  isLocked,
}) => {
  const [activeTab, setActiveTab] = useState<'SUBJECT' | 'QUALITY' | 'CAPACITY' | 'SUMMARY'>('SUBJECT');

  const subjects = evaluationProfileService.getTT27Subjects(grade);
  const qualities = evaluationProfileService.getTT27Qualities();
  const genCapacities = evaluationProfileService.getTT27GeneralCapacities();
  const specCapacities = evaluationProfileService.getTT27SpecificCapacities();

  const subjectScales = evaluationProfileService.getTT27SubjectScales();
  const qualityCapacityScales = evaluationProfileService.getTT27QualityCapacityScales();
  const endYearScales = evaluationProfileService.getTT27EndYearSummaryScales();

  const getItem = (domain: EvaluationDomain, criterionCode: string) => {
    return items.find((it) => it.domain === domain && it.criterionCode === criterionCode) || {
      domain,
      criterionCode,
      levelCode: null,
      periodicScore: null,
      comment: '',
    };
  };

  const handleLevelSelect = (domain: EvaluationDomain, criterionCode: string, criterionName: string, levelCode: string) => {
    if (isLocked) return;
    const current = getItem(domain, criterionCode);
    onChangeItem({
      ...current,
      domain,
      criterionCode,
      criterionName,
      levelCode: current.levelCode === levelCode ? null : levelCode, // Toggle
    });
  };

  const handlePeriodicScoreChange = (domain: EvaluationDomain, criterionCode: string, criterionName: string, scoreVal: string) => {
    if (isLocked) return;
    const current = getItem(domain, criterionCode);
    const num = scoreVal === '' ? null : Number(scoreVal);
    onChangeItem({
      ...current,
      domain,
      criterionCode,
      criterionName,
      periodicScore: num,
    });
  };

  const handleCommentChange = (domain: EvaluationDomain, criterionCode: string, criterionName: string, commentVal: string) => {
    if (isLocked) return;
    const current = getItem(domain, criterionCode);
    onChangeItem({
      ...current,
      domain,
      criterionCode,
      criterionName,
      comment: commentVal,
    });
  };

  return (
    <div className="space-y-4">
      {/* Locked Notice Banner */}
      {isLocked && (
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-600 shrink-0" />
            <span>Hồ sơ đánh giá của học sinh <strong>{student.fullName}</strong> đã được khóa sổ chính thức (Read-only).</span>
          </div>
          <Button size="sm" variant="outline" leftIcon={<Unlock className="w-3.5 h-3.5" />} onClick={onOpenUnlockModal}>
            Mở khóa chỉnh sửa
          </Button>
        </div>
      )}

      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-app pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'SUBJECT'
              ? 'bg-app-primary text-white shadow-sm'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          )}
          onClick={() => setActiveTab('SUBJECT')}
        >
          <BookOpen className="w-4 h-4" />
          1. Môn học & HĐGD ({subjects.length})
        </button>

        <button
          type="button"
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'QUALITY'
              ? 'bg-app-primary text-white shadow-sm'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          )}
          onClick={() => setActiveTab('QUALITY')}
        >
          <Heart className="w-4 h-4 text-rose-300" />
          2. Phẩm chất chủ yếu (5)
        </button>

        <button
          type="button"
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'CAPACITY'
              ? 'bg-app-primary text-white shadow-sm'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          )}
          onClick={() => setActiveTab('CAPACITY')}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          3. Năng lực chung & Đặc thù (10)
        </button>

        <button
          type="button"
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'SUMMARY'
              ? 'bg-app-primary text-white shadow-sm'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          )}
          onClick={() => setActiveTab('SUMMARY')}
        >
          <Award className="w-4 h-4 text-yellow-300" />
          4. Tổng hợp cuối kỳ / cuối năm
        </button>
      </div>

      {/* TAB 1: MÔN HỌC & HĐGD */}
      {activeTab === 'SUBJECT' && (
        <div className="space-y-3">
          {subjects.map((sub) => {
            const it = getItem('SUBJECT', sub.code);
            const sensitiveMatch = it.comment ? it.comment.match(SENSITIVE_WORDS_PATTERN) : null;

            return (
              <div
                key={sub.code}
                className="p-4 rounded-2xl bg-app-surface border border-app hover:border-app-primary/40 transition-all space-y-3"
              >
                {/* Header Row: Subject Name + Scales + Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-app-main">{sub.name}</span>
                    {sub.isPeriodicScoreApplicable && (
                      <Badge variant="neutral" className="text-[10px]">Điểm ĐK</Badge>
                    )}
                  </div>

                  {/* Right: Scale Buttons + Optional Score Input */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Scales (T - H - C) */}
                    <div className="flex items-center gap-1 bg-app-surface-hover p-1 rounded-xl border border-app">
                      {subjectScales.map((scale) => {
                        const isSelected = it.levelCode === scale.code;
                        return (
                          <button
                            key={scale.code}
                            type="button"
                            disabled={isLocked}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                              isSelected
                                ? scale.code === 'HOAN_THANH_TOT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : scale.code === 'HOAN_THANH'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-amber-500 text-white shadow-xs'
                                : 'text-app-muted hover:bg-app-surface hover:text-app-main'
                            )}
                            onClick={() => handleLevelSelect('SUBJECT', sub.code, sub.name, scale.code)}
                            title={scale.label}
                          >
                            {scale.shortLabel} — {scale.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Periodic Score (1 - 10) */}
                    {sub.isPeriodicScoreApplicable && (
                      <div className="flex items-center gap-1.5 w-24">
                        <Input
                          type="number"
                          placeholder="Điểm (1-10)"
                          value={it.periodicScore !== null && it.periodicScore !== undefined ? String(it.periodicScore) : ''}
                          onChange={(e) => handlePeriodicScoreChange('SUBJECT', sub.code, sub.name, e.target.value)}
                          disabled={isLocked}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-app-muted font-medium">Nhận xét môn học (sự tiến bộ, hứng thú, hỗ trợ...):</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-app-primary hover:underline font-medium inline-flex items-center gap-1"
                        onClick={() => onOpenTemplateDrawer('SUBJECT', sub.code, it.levelCode || undefined)}
                      >
                        <BookText className="w-3.5 h-3.5" /> Thư viện mẫu
                      </button>
                      <button
                        type="button"
                        className="text-amber-600 hover:underline font-medium inline-flex items-center gap-1"
                        onClick={onOpenEvidenceDrawer}
                      >
                        <Lightbulb className="w-3.5 h-3.5" /> Minh chứng
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    placeholder={`Nhập nhận xét cho môn ${sub.name}...`}
                    value={it.comment || ''}
                    onChange={(e) => handleCommentChange('SUBJECT', sub.code, sub.name, e.target.value)}
                    disabled={isLocked}
                    className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary transition-all resize-y"
                  />

                  {sensitiveMatch && (
                    <p className="text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Cảnh báo từ ngữ: Tránh dùng từ "{sensitiveMatch[0]}". Nên diễn đạt theo hướng tích cực, trung tính.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PHẨM CHẤT CHỦ YẾU */}
      {activeTab === 'QUALITY' && (
        <div className="space-y-3">
          {qualities.map((qual) => {
            const it = getItem('QUALITY', qual.code);
            const sensitiveMatch = it.comment ? it.comment.match(SENSITIVE_WORDS_PATTERN) : null;

            return (
              <div
                key={qual.code}
                className="p-4 rounded-2xl bg-app-surface border border-app hover:border-app-primary/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-sm text-app-main">{qual.name}</span>
                    {qual.description && (
                      <p className="text-xs text-app-muted mt-0.5">{qual.description}</p>
                    )}
                  </div>

                  {/* Scales (T - Đ - C) */}
                  <div className="flex items-center gap-1 bg-app-surface-hover p-1 rounded-xl border border-app self-start sm:self-auto">
                    {qualityCapacityScales.map((scale) => {
                      const isSelected = it.levelCode === scale.code;
                      return (
                        <button
                          key={scale.code}
                          type="button"
                          disabled={isLocked}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                            isSelected
                              ? scale.code === 'TOT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : scale.code === 'DAT'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-amber-500 text-white shadow-xs'
                              : 'text-app-muted hover:bg-app-surface hover:text-app-main'
                          )}
                          onClick={() => handleLevelSelect('QUALITY', qual.code, qual.name, scale.code)}
                        >
                          {scale.shortLabel} — {scale.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-app-muted font-medium">Nhận xét biểu hiện phẩm chất:</span>
                    <button
                      type="button"
                      className="text-app-primary hover:underline font-medium inline-flex items-center gap-1"
                      onClick={() => onOpenTemplateDrawer('QUALITY', qual.code, it.levelCode || undefined)}
                    >
                      <BookText className="w-3.5 h-3.5" /> Thư viện mẫu
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    placeholder={`Nhận xét biểu hiện ${qual.name.toLowerCase()} của học sinh...`}
                    value={it.comment || ''}
                    onChange={(e) => handleCommentChange('QUALITY', qual.code, qual.name, e.target.value)}
                    disabled={isLocked}
                    className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary transition-all resize-y"
                  />

                  {sensitiveMatch && (
                    <p className="text-[11px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Cảnh báo từ ngữ: Tránh dùng từ "{sensitiveMatch[0]}".
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: NĂNG LỰC CHUNG & ĐẶC THÙ */}
      {activeTab === 'CAPACITY' && (
        <div className="space-y-6">
          {/* Năng lực chung */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-app-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> I. Năng lực chung (3 năng lực)
            </h4>
            {genCapacities.map((cap) => {
              const it = getItem('GENERAL_CAPACITY', cap.code);
              return (
                <div
                  key={cap.code}
                  className="p-4 rounded-2xl bg-app-surface border border-app space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-sm text-app-main">{cap.name}</span>
                      {cap.description && <p className="text-xs text-app-muted mt-0.5">{cap.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 bg-app-surface-hover p-1 rounded-xl border border-app">
                      {qualityCapacityScales.map((scale) => (
                        <button
                          key={scale.code}
                          type="button"
                          disabled={isLocked}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                            it.levelCode === scale.code
                              ? 'bg-app-primary text-white shadow-xs'
                              : 'text-app-muted hover:bg-app-surface'
                          )}
                          onClick={() => handleLevelSelect('GENERAL_CAPACITY', cap.code, cap.name, scale.code)}
                        >
                          {scale.shortLabel} — {scale.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder={`Nhận xét năng lực ${cap.name.toLowerCase()}...`}
                    value={it.comment || ''}
                    onChange={(e) => handleCommentChange('GENERAL_CAPACITY', cap.code, cap.name, e.target.value)}
                    disabled={isLocked}
                    className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
                  />
                </div>
              );
            })}
          </div>

          {/* Năng lực đặc thù */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-app-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> II. Năng lực đặc thù (7 năng lực)
            </h4>
            {specCapacities.map((cap) => {
              const it = getItem('SPECIFIC_CAPACITY', cap.code);
              return (
                <div
                  key={cap.code}
                  className="p-4 rounded-2xl bg-app-surface border border-app space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-sm text-app-main">{cap.name}</span>
                      {cap.description && <p className="text-xs text-app-muted mt-0.5">{cap.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 bg-app-surface-hover p-1 rounded-xl border border-app">
                      {qualityCapacityScales.map((scale) => (
                        <button
                          key={scale.code}
                          type="button"
                          disabled={isLocked}
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                            it.levelCode === scale.code
                              ? 'bg-app-primary text-white shadow-xs'
                              : 'text-app-muted hover:bg-app-surface'
                          )}
                          onClick={() => handleLevelSelect('SPECIFIC_CAPACITY', cap.code, cap.name, scale.code)}
                        >
                          {scale.shortLabel} — {scale.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder={`Nhận xét năng lực ${cap.name.toLowerCase()}...`}
                    value={it.comment || ''}
                    onChange={(e) => handleCommentChange('SPECIFIC_CAPACITY', cap.code, cap.name, e.target.value)}
                    disabled={isLocked}
                    className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TỔNG HỢP CUỐI KỲ / CUỐI NĂM */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-4">
          <Card title="Kết Quả Đánh Giá Tổng Hợp Cuối Năm" action={<Award className="w-5 h-5 text-yellow-500" />}>
            <div className="space-y-4">
              {/* Overall Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-app-main mb-1.5">
                  Mức Đánh Giá Kết Quả Giáo Dục:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {endYearScales.map((scale) => {
                    const isSelected = evaluation.overallEducationLevel === scale.code;
                    return (
                      <button
                        key={scale.code}
                        type="button"
                        disabled={isLocked}
                        className={cn(
                          'p-3 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1',
                          isSelected
                            ? scale.code === 'HOAN_THANH_XUAT_SAC'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : scale.code === 'HOAN_THANH_TOT'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : scale.code === 'HOAN_THANH'
                                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                                  : 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-app-surface border-app text-app-main hover:bg-app-surface-hover'
                        )}
                        onClick={() =>
                          onChangeEvaluation({
                            ...evaluation,
                            overallEducationLevel: isSelected ? null : scale.code,
                          })
                        }
                      >
                        <span>{scale.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Promotion Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Kết quả hoàn thành chương trình / Lên lớp"
                  placeholder="VD: Được lên lớp 5, Hoàn thành chương trình Tiểu học..."
                  value={evaluation.promotionResult || ''}
                  onChange={(e) => onChangeEvaluation({ ...evaluation, promotionResult: e.target.value })}
                  disabled={isLocked}
                />

                {/* Individual Plan Checkbox */}
                <div className="p-3 rounded-xl border border-app bg-app-surface-hover/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-app-main">Kế hoạch giáo dục cá nhân</p>
                    <p className="text-[11px] text-app-muted">Đánh giá theo yêu cầu điều chỉnh riêng biệt</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(evaluation.individualPlanConfirmed)}
                    onChange={(e) =>
                      onChangeEvaluation({ ...evaluation, individualPlanConfirmed: e.target.checked })
                    }
                    disabled={isLocked}
                    className="w-4 h-4 rounded text-app-primary focus:ring-app-primary"
                  />
                </div>
              </div>

              {/* General / Homeroom Summary Comment */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-app-main">Nhận xét đánh giá tổng quát của Giáo viên Chủ nhiệm:</span>
                  <button
                    type="button"
                    className="text-app-primary hover:underline font-medium inline-flex items-center gap-1"
                    onClick={() => onOpenTemplateDrawer('SUMMARY', 'SUMMARY')}
                  >
                    <BookText className="w-3.5 h-3.5" /> Thư viện mẫu
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Nhập nhận xét tổng hợp kết quả học tập và rèn luyện của học sinh trong năm học..."
                  value={evaluation.homeroomComment || ''}
                  onChange={(e) => onChangeEvaluation({ ...evaluation, homeroomComment: e.target.value })}
                  disabled={isLocked}
                  className="w-full text-xs rounded-xl border border-app p-3 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
