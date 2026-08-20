import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { EvaluationCommentTemplate, RegulationProfileCode, EvaluationDomain, TemplateOrigin } from '../database/types';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';

export interface TemplateFilterOptions {
  regulationCode?: RegulationProfileCode;
  domain?: EvaluationDomain;
  criterionCode?: string;
  levelCode?: string;
  grade?: number;
  origin?: TemplateOrigin;
  onlyFavorites?: boolean;
  searchQuery?: string;
}

export class EvaluationTemplateRepository extends BaseRepository<EvaluationCommentTemplate> {
  constructor() {
    super(db.evaluationCommentTemplates, 'EvaluationCommentTemplate');
  }

  /**
   * Lọc danh sách mẫu câu nhận xét theo nhiều tiêu chí
   */
  async findTemplates(options: TemplateFilterOptions): Promise<EvaluationCommentTemplate[]> {
    let collection = this.table.filter((tpl) => !tpl.deletedAt && tpl.isActive);

    if (options.regulationCode) {
      collection = collection.filter((tpl) => tpl.regulationCode === options.regulationCode);
    }

    if (options.domain) {
      collection = collection.filter((tpl) => tpl.domain === options.domain);
    }

    if (options.criterionCode) {
      collection = collection.filter((tpl) => !tpl.criterionCode || tpl.criterionCode === options.criterionCode);
    }

    if (options.levelCode) {
      collection = collection.filter((tpl) => !tpl.levelCode || tpl.levelCode === options.levelCode);
    }

    if (options.grade !== undefined) {
      collection = collection.filter((tpl) => options.grade! >= tpl.gradeFrom && options.grade! <= tpl.gradeTo);
    }

    if (options.origin) {
      collection = collection.filter((tpl) => tpl.origin === options.origin);
    }

    if (options.onlyFavorites) {
      collection = collection.filter((tpl) => tpl.isFavorite);
    }

    let results = await collection.toArray();

    if (options.searchQuery && options.searchQuery.trim()) {
      const normQuery = normalizeVietnameseText(options.searchQuery);
      results = results.filter((tpl) => {
        const normText = normalizeVietnameseText(tpl.templateText);
        const matchTags = tpl.tags.some((tag) => normalizeVietnameseText(tag).includes(normQuery));
        return normText.includes(normQuery) || matchTags;
      });
    }

    return results;
  }

  /**
   * Đánh dấu / Bỏ đánh dấu yêu thích
   */
  async toggleFavorite(templateId: string): Promise<boolean> {
    const tpl = await this.findById(templateId);
    if (!tpl) throw new Error('Không tìm thấy mẫu nhận xét');
    const newStatus = !tpl.isFavorite;
    await this.update(templateId, { isFavorite: newStatus });
    return newStatus;
  }
}

export const evaluationTemplateRepository = new EvaluationTemplateRepository();
