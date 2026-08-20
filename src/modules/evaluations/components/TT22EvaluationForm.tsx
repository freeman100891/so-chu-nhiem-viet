import React, { useState } from 'react';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { evaluationProfileService } from '../../../core/services/evaluation-profile.service';
import { SENSITIVE_WORDS_PATTERN } from '../../../core/services/evaluation-validation.service';
import type { Evaluation, EvaluationItem, EvaluationDomain, Student, RegulationProfileCode } from '../../../core/database/types';
import {
  BookOpen,
  Shield,
  GraduationCap,
  Award,
  BookText,
  AlertTriangle,
  Lightbulb,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface TT22EvaluationFormProps {
  student: Student;
  grade: number;
  regulationCode: RegulationProfileCode;
  evaluation: Partial<Evaluation>;
  items: Partial<EvaluationItem>[];
  onChangeEvaluation: (updates: Partial<Evaluation>) => void;
  onChangeItem: (item: Partial<EvaluationItem>) => void;
  onOpenTemplateDrawer: (domain: EvaluationDomain, criterionCode: string, levelCode?: string) => void;
  onOpenEvidenceDrawer: () => void;
  onOpenUnlockModal: () => void;
  isLocked: boolean;
}

export const TT22EvaluationForm: React.FC<TT22EvaluationFormProps> = ({
  student,
  grade: _grade,
  regulationCode,
  evaluation,
  items,
  onChangeEvaluation,
  onChangeItem,
  onOpenTemplateDrawer,
  onOpenEvidenceDrawer,
  onOpenUnlockModal,
  isLocked,
}) => {
  const [activeTab, setActiveTab] = useState<'SUBJECT' | 'CONDUCT' | 'LEARNING' | 'HOMEROOM'>('SUBJECT');

  const subjects =
    regulationCode === 'TT22_2021_LOWER_SECONDARY'
      ? evaluationProfileService.getTT22LowerSecondarySubjects()
      : evaluationProfileService.getTT22UpperSecondarySubjects();

  const conductScales = evaluationProfileService.getTT22ConductScales();
  const learningScales = evaluationProfileService.getTT22LearningScales();
  const commentSubjectScales = evaluationProfileService.getTT22CommentSubjectScales();

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
      levelCode: current.levelCode === levelCode ? null : levelCode,
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
          1. Môn học & Chuyên đề ({subjects.length})
        </button>

        <button
          type="button"
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'CONDUCT'
              ? 'bg-app-primary text-white shadow-sm'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          )}
          onClick={() => setActiveTab('CONDUCT')}
        >
          <Shield className="w-4 h-4 text-blue-300" />
          2. Kết quả Rèn luyện
        </button>

        <button
          type="button"
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'LEARNING'
              ? 'bg-app-primary text-white shadow-sm'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          )}
          onClick={() => setActiveTab('LEARNING')}
        >
          <GraduationCap className="w-4 h-4 text-emerald-300" />
          3. Kết quả Học tập
        </button>

        <button
          type="button"
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'HOMEROOM'
              ? 'bg-app-primary text-white shadow-sm'
              : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
          )}
          onClick={() => setActiveTab('HOMEROOM')}
        >
          <Award className="w-4 h-4 text-yellow-300" />
          4. Nhận xét của GVCN
        </button>
      </div>

      {/* TAB 1: MÔN HỌC */}
      {activeTab === 'SUBJECT' && (
        <div className="space-y-3">
          {subjects.map((sub) => {
            const domain: EvaluationDomain = sub.isCommentSubjectOnly ? 'SUBJECT_COMMENT' : 'SUBJECT_SCORE';
            const it = getItem(domain, sub.code);
            const sensitiveMatch = it.comment ? it.comment.match(SENSITIVE_WORDS_PATTERN) : null;

            return (
              <div
                key={sub.code}
                className="p-4 rounded-2xl bg-app-surface border border-app hover:border-app-primary/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-app-main">{sub.name}</span>
                    <Badge variant={sub.isCommentSubjectOnly ? 'primary' : 'neutral'} className="text-[10px]">
                      {sub.isCommentSubjectOnly ? 'Đánh giá nhận xét' : 'Điểm số + Nhận xét'}
                    </Badge>
                  </div>

                  {/* Comment-Only Scale (Đ / CĐ) */}
                  {sub.isCommentSubjectOnly && (
                    <div className="flex items-center gap-1 bg-app-surface-hover p-1 rounded-xl border border-app">
                      {commentSubjectScales.map((scale) => {
                        const isSelected = it.levelCode === scale.code;
                        return (
                          <button
                            key={scale.code}
                            type="button"
                            disabled={isLocked}
                            className={cn(
                              'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                              isSelected
                                ? scale.code === 'DAT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-rose-600 text-white shadow-xs'
                                : 'text-app-muted hover:bg-app-surface'
                            )}
                            onClick={() => handleLevelSelect(domain, sub.code, sub.name, scale.code)}
                          >
                            {scale.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-app-muted font-medium">Nhận xét sự tiến bộ, thái độ học tập và kỹ năng:</span>
                    <button
                      type="button"
                      className="text-app-primary hover:underline font-medium inline-flex items-center gap-1"
                      onClick={() => onOpenTemplateDrawer(domain, sub.code, it.levelCode || undefined)}
                    >
                      <BookText className="w-3.5 h-3.5" /> Thư viện mẫu
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    placeholder={`Nhập nhận xét cho môn ${sub.name}...`}
                    value={it.comment || ''}
                    onChange={(e) => handleCommentChange(domain, sub.code, sub.name, e.target.value)}
                    disabled={isLocked}
                    className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
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

      {/* TAB 2: KẾT QUẢ RÈN LUYỆN */}
      {activeTab === 'CONDUCT' && (
        <div className="space-y-4">
          <Card title="Đánh Giá Kết Quả Rèn Luyện (Hạnh Kiểm)" action={<Shield className="w-5 h-5 text-blue-500" />}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-app-main mb-1.5">Mức Rèn Luyện:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {conductScales.map((scale) => {
                    const isSelected = evaluation.conductLevel === scale.code;
                    return (
                      <button
                        key={scale.code}
                        type="button"
                        disabled={isLocked}
                        className={cn(
                          'p-3 rounded-xl border text-xs font-bold text-center transition-all',
                          isSelected
                            ? scale.code === 'TOT'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : scale.code === 'KHA'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : scale.code === 'DAT'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                  : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-app-surface border-app text-app-main hover:bg-app-surface-hover'
                        )}
                        onClick={() =>
                          onChangeEvaluation({
                            ...evaluation,
                            conductLevel: isSelected ? null : scale.code,
                          })
                        }
                      >
                        {scale.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conduct Detail Comment */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-app-main">Nhận xét rèn luyện (ý thức tổ chức kỷ luật, chấp hành nội quy...):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-app-primary hover:underline font-medium inline-flex items-center gap-1"
                      onClick={() => onOpenTemplateDrawer('CONDUCT', 'CONDUCT', evaluation.conductLevel || undefined)}
                    >
                      <BookText className="w-3.5 h-3.5" /> Thư viện mẫu
                    </button>
                    <button
                      type="button"
                      className="text-amber-600 hover:underline font-medium inline-flex items-center gap-1"
                      onClick={onOpenEvidenceDrawer}
                    >
                      <Lightbulb className="w-3.5 h-3.5" /> Xem minh chứng
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="Nhập nhận xét chi tiết về kết quả rèn luyện..."
                  value={getItem('CONDUCT', 'CONDUCT').comment || ''}
                  onChange={(e) => handleCommentChange('CONDUCT', 'CONDUCT', 'Rèn luyện', e.target.value)}
                  disabled={isLocked}
                  className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: KẾT QUẢ HỌC TẬP */}
      {activeTab === 'LEARNING' && (
        <div className="space-y-4">
          <Card title="Đánh Giá Kết Quả Học Tập (Học Lực)" action={<GraduationCap className="w-5 h-5 text-emerald-500" />}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-app-main mb-1.5">Mức Học Tập:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {learningScales.map((scale) => {
                    const isSelected = evaluation.overallLearningLevel === scale.code;
                    return (
                      <button
                        key={scale.code}
                        type="button"
                        disabled={isLocked}
                        className={cn(
                          'p-3 rounded-xl border text-xs font-bold text-center transition-all',
                          isSelected
                            ? scale.code === 'TOT'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : scale.code === 'KHA'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : scale.code === 'DAT'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                  : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-app-surface border-app text-app-main hover:bg-app-surface-hover'
                        )}
                        onClick={() =>
                          onChangeEvaluation({
                            ...evaluation,
                            overallLearningLevel: isSelected ? null : scale.code,
                          })
                        }
                      >
                        {scale.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Learning Detail Comment */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-app-main">Nhận xét năng lực học tập và sự tiến bộ:</span>
                  <button
                    type="button"
                    className="text-app-primary hover:underline font-medium inline-flex items-center gap-1"
                    onClick={() => onOpenTemplateDrawer('LEARNING', 'LEARNING', evaluation.overallLearningLevel || undefined)}
                  >
                    <BookText className="w-3.5 h-3.5" /> Thư viện mẫu
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Nhập nhận xét chi tiết về kết quả học tập..."
                  value={getItem('LEARNING', 'LEARNING').comment || ''}
                  onChange={(e) => handleCommentChange('LEARNING', 'LEARNING', 'Học tập', e.target.value)}
                  disabled={isLocked}
                  className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: NHẬN XÉT GVCN */}
      {activeTab === 'HOMEROOM' && (
        <div className="space-y-4">
          <Card title="Nhận Xét Tổng Hợp Của Giáo Viên Chủ Nhiệm" action={<Award className="w-5 h-5 text-yellow-500" />}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-app-main">
                    Nhận xét ưu điểm, hạn chế nổi bật và phương hướng giúp đỡ trong kỳ:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-app-primary hover:underline font-medium inline-flex items-center gap-1"
                      onClick={() => onOpenTemplateDrawer('HOMEROOM_SUMMARY', 'HOMEROOM_SUMMARY')}
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
                  rows={5}
                  placeholder="Nhập nhận xét tổng hợp của giáo viên chủ nhiệm..."
                  value={evaluation.homeroomComment || ''}
                  onChange={(e) => onChangeEvaluation({ ...evaluation, homeroomComment: e.target.value })}
                  disabled={isLocked}
                  className="w-full text-xs rounded-xl border border-app p-3 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
                />
              </div>

              {/* Promotion Result (Cuối năm) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-app">
                <Input
                  label="Kết quả rèn luyện trong hè / Lên lớp (nếu là cuối năm)"
                  placeholder="VD: Được lên lớp, Rèn luyện thêm trong hè..."
                  value={evaluation.promotionResult || ''}
                  onChange={(e) => onChangeEvaluation({ ...evaluation, promotionResult: e.target.value })}
                  disabled={isLocked}
                />
                <div className="p-3 rounded-xl border border-app bg-app-surface-hover/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-app-main">Kế hoạch giáo dục cá nhân</p>
                    <p className="text-[11px] text-app-muted">Đánh giá theo yêu cầu điều chỉnh</p>
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
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
