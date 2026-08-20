import { db } from '../database/db';
import { generateUUID } from '../../shared/utilities/uuid';
import type { EvaluationCommentTemplate, RegulationProfileCode, EvaluationDomain } from '../database/types';

export const EVALUATION_CATALOG_VERSION = 1;

export interface TokenReplacementMap {
  studentName?: string;
  studentPronoun?: string; // Em, Bạn...
  subjectName?: string;
  progressEvidence?: string;
  strengthEvidence?: string;
  positiveEvidence?: string;
  observableBehavior?: string;
  achievedPart?: string;
  improvementArea?: string;
  limitation?: string;
  targetBehavior?: string;
  context?: string;
  supportAction?: string;
  nextStep?: string;
  timeScope?: string;
  [key: string]: string | undefined;
}

export interface SeedTemplateDefinition {
  regulationCode: RegulationProfileCode;
  gradeFrom: number;
  gradeTo: number;
  domain: EvaluationDomain;
  criterionCode?: string | null;
  levelCode?: string | null;
  templateText: string;
  tags: string[];
}

export class EvaluationTemplateSeedService {
  /**
   * Danh sách các mẫu câu khung khởi tạo mặc định (Sản phẩm cung cấp, không phải trích dẫn pháp lý)
   */
  getDefaultTemplates(): SeedTemplateDefinition[] {
    return [
      // 1. TT27 - Môn học
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'SUBJECT',
        levelCode: 'HOAN_THANH_TOT',
        templateText: 'Em thực hiện tốt các yêu cầu của {subjectName}, nổi bật ở {strengthEvidence}. Tiếp tục phát huy {nextStep}.',
        tags: ['môn học', 'hoàn thành tốt', 'tiểu học'],
      },
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'SUBJECT',
        levelCode: 'HOAN_THANH',
        templateText: 'Em đã hoàn thành các yêu cầu cơ bản và có tiến bộ ở {progressEvidence}. Cần luyện thêm {improvementArea}.',
        tags: ['môn học', 'hoàn thành', 'tiểu học'],
      },
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'SUBJECT',
        levelCode: 'CHUA_HOAN_THANH',
        templateText: 'Em bước đầu thực hiện được {achievedPart}; còn cần hỗ trợ ở {improvementArea}. Đề nghị {supportAction}.',
        tags: ['môn học', 'chưa hoàn thành', 'cần giúp đỡ', 'tiểu học'],
      },

      // 2. TT27 - Phẩm chất
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'QUALITY',
        levelCode: 'TOT',
        templateText: 'Em thường xuyên thể hiện {observableBehavior} và có tiến bộ ở {progressEvidence}. Tiếp tục phát huy.',
        tags: ['phẩm chất', 'tốt', 'tiểu học'],
      },
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'QUALITY',
        levelCode: 'DAT',
        templateText: 'Em đã thể hiện {observableBehavior}; cần duy trì thường xuyên hơn trong {context}.',
        tags: ['phẩm chất', 'đạt', 'tiểu học'],
      },
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'QUALITY',
        levelCode: 'CAN_CO_GANG',
        templateText: 'Em đã có cố gắng ở {positiveEvidence}; cần được hướng dẫn thêm để {targetBehavior}. Giáo viên và gia đình phối hợp {supportAction}.',
        tags: ['phẩm chất', 'cần cố gắng', 'tiểu học'],
      },

      // 3. TT27 - Năng lực chung & đặc thù
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'GENERAL_CAPACITY',
        levelCode: 'TOT',
        templateText: 'Em chủ động, tích cực trong {observableBehavior}, hợp tác tốt cùng các bạn trong nhóm.',
        tags: ['năng lực chung', 'tốt', 'tiểu học'],
      },
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'GENERAL_CAPACITY',
        levelCode: 'DAT',
        templateText: 'Em biết tham gia hoạt động chung; cần mạnh dạn, tự tin hơn khi trao đổi trước lớp.',
        tags: ['năng lực chung', 'đạt', 'tiểu học'],
      },
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'SPECIFIC_CAPACITY',
        levelCode: 'TOT',
        templateText: 'Em có năng khiếu và kỹ năng tốt về {observableBehavior}, tư duy nhanh nhẹn.',
        tags: ['năng lực đặc thù', 'tốt', 'tiểu học'],
      },

      // 4. TT27 - Tổng hợp cuối năm
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'SUMMARY',
        levelCode: 'HOAN_THANH_XUAT_SAC',
        templateText: 'Em đạt kết quả học tập và rèn luyện xuất sắc, gương mẫu trong mọi phong trào của lớp.',
        tags: ['tổng hợp', 'cuối năm', 'xuất sắc', 'tiểu học'],
      },
      {
        regulationCode: 'TT27_2020_PRIMARY',
        gradeFrom: 1,
        gradeTo: 5,
        domain: 'SUMMARY',
        levelCode: 'HOAN_THANH_TOT',
        templateText: 'Em hoàn thành tốt chương trình lớp học, chăm ngoan, có ý thức kỷ luật tốt.',
        tags: ['tổng hợp', 'cuối năm', 'hoàn thành tốt', 'tiểu học'],
      },

      // 5. TT22 - Môn học THCS & THPT
      {
        regulationCode: 'TT22_2021_LOWER_SECONDARY',
        gradeFrom: 6,
        gradeTo: 9,
        domain: 'SUBJECT_SCORE',
        templateText: 'Em có tiến bộ ở {progressEvidence}, nổi bật ở {strengthEvidence}. Cần củng cố {limitation} bằng {supportAction}.',
        tags: ['môn học', 'thcs'],
      },
      {
        regulationCode: 'TT22_2021_UPPER_SECONDARY',
        gradeFrom: 10,
        gradeTo: 12,
        domain: 'SUBJECT_SCORE',
        templateText: 'Em có tiến bộ ở {progressEvidence}, nổi bật ở {strengthEvidence}. Cần củng cố {limitation} bằng {supportAction}.',
        tags: ['môn học', 'thpt'],
      },

      // 6. TT22 - Rèn luyện & Nhận xét GVCN THCS & THPT
      {
        regulationCode: 'TT22_2021_LOWER_SECONDARY',
        gradeFrom: 6,
        gradeTo: 9,
        domain: 'HOMEROOM_SUMMARY',
        levelCode: 'TOT',
        templateText: 'Em có tiến bộ trong {progressEvidence}; thể hiện tốt {observableBehavior}. Cần tiếp tục {nextStep}.',
        tags: ['gvcn', 'rèn luyện', 'tốt', 'thcs'],
      },
      {
        regulationCode: 'TT22_2021_LOWER_SECONDARY',
        gradeFrom: 6,
        gradeTo: 9,
        domain: 'HOMEROOM_SUMMARY',
        levelCode: 'CHUA_DAT',
        templateText: 'Em đã có cố gắng ở {positiveEvidence}; tuy nhiên chưa đáp ứng ổn định yêu cầu về {targetBehavior}. Cần phối hợp thực hiện {supportAction}.',
        tags: ['gvcn', 'rèn luyện', 'chưa đạt', 'thcs'],
      },
      {
        regulationCode: 'TT22_2021_UPPER_SECONDARY',
        gradeFrom: 10,
        gradeTo: 12,
        domain: 'HOMEROOM_SUMMARY',
        levelCode: 'TOT',
        templateText: 'Em có tiến bộ trong {progressEvidence}; thể hiện tốt {observableBehavior}. Cần tiếp tục {nextStep}.',
        tags: ['gvcn', 'rèn luyện', 'tốt', 'thpt'],
      },
      {
        regulationCode: 'TT22_2021_UPPER_SECONDARY',
        gradeFrom: 10,
        gradeTo: 12,
        domain: 'HOMEROOM_SUMMARY',
        levelCode: 'CHUA_DAT',
        templateText: 'Em đã có cố gắng ở {positiveEvidence}; tuy nhiên chưa đáp ứng ổn định yêu cầu về {targetBehavior}. Cần phối hợp thực hiện {supportAction}.',
        tags: ['gvcn', 'rèn luyện', 'chưa đạt', 'thpt'],
      },
    ];
  }

  /**
   * Khởi tạo Idempotent toàn bộ mẫu nhận xét hệ thống (origin: 'SYSTEM')
   */
  async seedTemplates(): Promise<{ addedCount: number; existingCount: number }> {
    const existingSystemCount = await db.evaluationCommentTemplates
      .where('origin')
      .equals('SYSTEM')
      .filter((t) => t.catalogVersion === EVALUATION_CATALOG_VERSION && !t.deletedAt)
      .count();

    if (existingSystemCount > 0) {
      return { addedCount: 0, existingCount: existingSystemCount };
    }

    const defaultDefs = this.getDefaultTemplates();
    const now = new Date().toISOString();
    let addedCount = 0;

    await db.runTransaction('rw', [db.evaluationCommentTemplates], async () => {
      for (const def of defaultDefs) {
        const record: EvaluationCommentTemplate = {
          id: generateUUID(),
          catalogVersion: EVALUATION_CATALOG_VERSION,
          regulationCode: def.regulationCode,
          gradeFrom: def.gradeFrom,
          gradeTo: def.gradeTo,
          domain: def.domain,
          criterionCode: def.criterionCode ?? null,
          levelCode: def.levelCode ?? null,
          templateText: def.templateText,
          tags: def.tags,
          origin: 'SYSTEM',
          isFavorite: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        await db.evaluationCommentTemplates.add(record);
        addedCount++;
      }
    });

    return { addedCount, existingCount: existingSystemCount };
  }

  /**
   * Thay thế các Token {tokenKey} trong chuỗi mẫu
   */
  composeComment(templateText: string, replacements: TokenReplacementMap): string {
    return templateText.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, tokenKey) => {
      const val = replacements[tokenKey];
      return val !== undefined && val.trim() !== '' ? val.trim() : match;
    });
  }

  /**
   * Trích xuất danh sách tất cả các Token còn chưa được thay thế (dạng `{token}`)
   */
  findUnresolvedTokens(text: string): string[] {
    const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g);
    return matches ? Array.from(new Set(matches)) : [];
  }
}

export const evaluationTemplateSeedService = new EvaluationTemplateSeedService();
