import React, { useState, useEffect } from 'react';
import { Drawer } from '../../../shared/components/Drawer';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { Modal } from '../../../shared/components/Modal';
import { evaluationTemplateRepository } from '../../../core/repositories/evaluation-template.repository';
import { evaluationTemplateSeedService, type TokenReplacementMap } from '../../../core/services/evaluation-template-seed.service';
import type { EvaluationCommentTemplate, RegulationProfileCode, EvaluationDomain, Student } from '../../../core/database/types';
import { Search, Star, Plus, Check, BookText, Sparkles } from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface EvaluationTemplateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  regulationCode: RegulationProfileCode;
  grade: number;
  currentDomain?: EvaluationDomain;
  currentCriterionCode?: string;
  currentLevelCode?: string;
  onApplyComment: (text: string) => void;
}

export const EvaluationTemplateDrawer: React.FC<EvaluationTemplateDrawerProps> = ({
  isOpen,
  onClose,
  student,
  regulationCode,
  grade,
  currentDomain,
  currentCriterionCode,
  currentLevelCode,
  onApplyComment,
}) => {
  const [templates, setTemplates] = useState<EvaluationCommentTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EvaluationCommentTemplate | null>(null);

  // Token Composer State
  const [customText, setCustomText] = useState('');

  // Add Custom Template Modal State
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateTags, setNewTemplateTags] = useState('');

  const loadTemplates = React.useCallback(async () => {
    try {
      const list = await evaluationTemplateRepository.findTemplates({
        regulationCode,
        grade,
        domain: currentDomain,
        levelCode: currentLevelCode,
        onlyFavorites,
        searchQuery,
      });
      setTemplates(list);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  }, [regulationCode, grade, currentDomain, currentLevelCode, onlyFavorites, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  const handleSelectTemplate = (tpl: EvaluationCommentTemplate) => {
    setSelectedTemplate(tpl);
    const initialTokens: TokenReplacementMap = {
      studentName: student.fullName,
      studentPronoun: 'Em',
      subjectName: currentCriterionCode || 'môn học',
      strengthEvidence: 'ý thức tự giác cao',
      progressEvidence: 'kết quả học tập',
      improvementArea: 'kỹ năng trình bày',
      supportAction: 'hướng dẫn ôn tập thêm tại nhà',
      nextStep: 'trong các bài học tiếp theo',
      observableBehavior: 'tinh thần trách nhiệm cao',
      positiveEvidence: 'sự cố gắng',
      targetBehavior: 'chủ động hơn',
    };
    setCustomText(evaluationTemplateSeedService.composeComment(tpl.templateText, initialTokens));
  };

  const handleApply = () => {
    if (customText.trim()) {
      onApplyComment(customText.trim());
      onClose();
    }
  };

  const handleToggleFavorite = async (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await evaluationTemplateRepository.toggleFavorite(tplId);
      loadTemplates();
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleCreateCustomTemplate = async () => {
    if (!newTemplateText.trim()) return;
    try {
      await evaluationTemplateRepository.create({
        catalogVersion: 1,
        regulationCode,
        gradeFrom: grade,
        gradeTo: grade,
        domain: currentDomain || 'SUBJECT',
        criterionCode: currentCriterionCode || null,
        levelCode: currentLevelCode || null,
        templateText: newTemplateText.trim(),
        tags: newTemplateTags.split(',').map((t) => t.trim()).filter(Boolean),
        origin: 'CUSTOM',
        isFavorite: true,
        isActive: true,
      });
      setShowAddCustomModal(false);
      setNewTemplateText('');
      setNewTemplateTags('');
      loadTemplates();
    } catch (err) {
      console.error('Error creating custom template:', err);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Thư Viện Mẫu Nhận Xét">
      <div className="flex flex-col h-full space-y-4">
        {/* Header Search & Actions */}
        <div className="space-y-2.5">
          <Input
            placeholder="Tìm kiếm mẫu nhận xét theo từ khóa, tag..."
            leftIcon={<Search className="w-4 h-4 text-app-muted" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5',
                onlyFavorites
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-app-surface border-app text-app-muted hover:bg-app-surface-hover'
              )}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              <Star className={cn('w-3.5 h-3.5', onlyFavorites && 'fill-amber-500 text-amber-500')} />
              Mẫu yêu thích
            </button>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowAddCustomModal(true)}
            >
              Tạo mẫu cá nhân
            </Button>
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto divide-y divide-app/50 space-y-2 pr-1">
          {templates.length === 0 ? (
            <div className="p-8 text-center text-xs text-app-muted space-y-2">
              <BookText className="w-8 h-8 mx-auto text-app-primary opacity-40" />
              <p className="font-semibold text-app-main">Không tìm thấy mẫu nhận xét phù hợp</p>
              <p>Thầy/Cô có thể tạo mẫu câu cá nhân hoặc thử xóa bộ lọc tìm kiếm.</p>
            </div>
          ) : (
            templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer space-y-2 group',
                    isSelected
                      ? 'bg-app-primary/10 border-app-primary text-app-main shadow-xs'
                      : 'bg-app-surface border-app hover:border-app-primary/50 text-app-main'
                  )}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={tpl.origin === 'SYSTEM' ? 'neutral' : 'primary'} className="text-[10px] py-0">
                        {tpl.origin === 'SYSTEM' ? 'Hệ thống' : 'Cá nhân'}
                      </Badge>
                      {tpl.levelCode && (
                        <Badge variant="success" className="text-[10px] py-0">
                          {tpl.levelCode}
                        </Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      className="text-app-muted hover:text-amber-500 transition-colors p-1"
                      onClick={(e) => handleToggleFavorite(tpl.id, e)}
                    >
                      <Star className={cn('w-4 h-4', tpl.isFavorite && 'fill-amber-500 text-amber-500')} />
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed">{tpl.templateText}</p>

                  {tpl.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {tpl.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-app-muted bg-app-surface-hover px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Template & Token Composer Preview */}
        {selectedTemplate && (
          <div className="p-3.5 rounded-2xl bg-app-surface border-2 border-app-primary/60 shadow-md space-y-3 shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-app-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Xem trước câu hoàn chỉnh:
              </span>
              <Badge variant="primary" className="text-[10px]">Đã điền tự động</Badge>
            </div>

            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full text-xs rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
            />

            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedTemplate(null)}>
                Hủy
              </Button>
              <Button size="sm" variant="primary" leftIcon={<Check className="w-4 h-4" />} onClick={handleApply}>
                Áp dụng vào nhận xét
              </Button>
            </div>
          </div>
        )}

        {/* Create Custom Template Modal */}
        {showAddCustomModal && (
          <Modal
            isOpen={showAddCustomModal}
            onClose={() => setShowAddCustomModal(false)}
            title="Thêm Mẫu Nhận Xét Cá Nhân"
          >
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-app-main">Nội dung mẫu nhận xét (hỗ trợ token):</label>
                <textarea
                  rows={4}
                  placeholder="VD: Em {studentName} có tiến bộ vượt bậc ở môn {subjectName}, nổi bật ở {strengthEvidence}..."
                  value={newTemplateText}
                  onChange={(e) => setNewTemplateText(e.target.value)}
                  className="w-full rounded-xl border border-app p-2.5 bg-app-surface text-app-main focus:outline-none focus:ring-2 focus:ring-app-primary"
                />
                <p className="text-[11px] text-app-muted">
                  Gợi ý token: {'{studentName}'}, {'{subjectName}'}, {'{strengthEvidence}'}, {'{progressEvidence}'}, {'{improvementArea}'}, {'{supportAction}'}...
                </p>
              </div>

              <Input
                label="Thẻ phân loại (cách nhau bằng dấu phẩy)"
                placeholder="VD: toán, chăm chỉ, tiến bộ"
                value={newTemplateTags}
                onChange={(e) => setNewTemplateTags(e.target.value)}
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setShowAddCustomModal(false)}>
                  Hủy
                </Button>
                <Button size="sm" variant="primary" onClick={handleCreateCustomTemplate}>
                  Lưu mẫu câu
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Drawer>
  );
};
