import type {
  Evaluation,
  EvaluationItem,
} from '../database/types';
import { evaluationTemplateSeedService } from './evaluation-template-seed.service';

export interface ValidationIssue {
  type: 'ERROR' | 'WARNING';
  code: string;
  field?: string;
  domain?: string;
  criterionCode?: string;
  message: string;
  suggestion?: string;
}

export interface EvaluationValidationResult {
  isValid: boolean; // True nếu không có ERROR nào
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export const SENSITIVE_WORDS_PATTERN = /\b(lười|lười biếng|kém cỏi|kém|cá biệt|học dốt|dốt|chậm chạp|hư|hư đốn|vô kỷ luật)\b/i;

export class EvaluationValidationService {
  /**
   * Kiểm tra tính hợp lệ toàn diện của một bản ghi Evaluation kèm Items
   */
  validateEvaluation(
    evaluation: Partial<Evaluation>,
    items: Partial<EvaluationItem>[],
    grade: number | undefined | null,
    enrolledStudentIds: string[]
  ): EvaluationValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // 1. BLOCKING: Khối lớp & Profile
    if (grade === undefined || grade === null || grade < 1 || grade > 12) {
      errors.push({
        type: 'ERROR',
        code: 'INVALID_GRADE',
        field: 'grade',
        message: 'Lớp học chưa được cấu hình khối lớp hợp lệ (1 đến 12). Không thể khóa sổ.',
      });
    }

    if (!evaluation.regulationCode) {
      errors.push({
        type: 'ERROR',
        code: 'MISSING_REGULATION_CODE',
        field: 'regulationCode',
        message: 'Thiếu quy chuẩn Thông tư đánh giá.',
      });
    }

    // 2. BLOCKING: Học sinh có thuộc danh sách lớp
    if (evaluation.studentId && enrolledStudentIds.length > 0 && !enrolledStudentIds.includes(evaluation.studentId)) {
      errors.push({
        type: 'ERROR',
        code: 'STUDENT_NOT_ENROLLED',
        field: 'studentId',
        message: 'Học sinh không thuộc danh sách phân lớp hoạt động.',
      });
    }

    // 3. Validation từng Item
    items.forEach((item, idx) => {
      const fieldId = `item_${item.domain}_${item.criterionCode || idx}`;

      // Token unresolved check
      if (item.comment) {
        const unresolved = evaluationTemplateSeedService.findUnresolvedTokens(item.comment);
        if (unresolved.length > 0) {
          errors.push({
            type: 'ERROR',
            code: 'UNRESOLVED_TOKEN',
            field: fieldId,
            domain: item.domain,
            criterionCode: item.criterionCode,
            message: `Nhận xét chứa biến mẫu chưa được thay thế: ${unresolved.join(', ')}`,
            suggestion: 'Vui lòng chỉnh sửa hoặc điền thông tin thay thế các dấu ngoặc nhọn {...}',
          });
        }

        // Sensitive / labeling wording warning
        const sensitiveMatch = item.comment.match(SENSITIVE_WORDS_PATTERN);
        if (sensitiveMatch) {
          warnings.push({
            type: 'WARNING',
            code: 'SENSITIVE_WORDING',
            field: fieldId,
            domain: item.domain,
            criterionCode: item.criterionCode,
            message: `Nhận xét có chứa từ ngữ có thể gây tổn thương hoặc dán nhãn: "${sensitiveMatch[0]}"`,
            suggestion: 'Khuyến nghị diễn đạt theo hướng tích cực, trung tính (ví dụ: "Cần tích cực hơn trong ôn tập", "Cần cố gắng rèn luyện thêm")',
          });
        }

        // Whitespace only comment
        if (item.comment.length > 0 && item.comment.trim().length === 0) {
          errors.push({
            type: 'ERROR',
            code: 'EMPTY_WHITESPACE_COMMENT',
            field: fieldId,
            domain: item.domain,
            criterionCode: item.criterionCode,
            message: 'Nhận xét không được chỉ chứa khoảng trắng rỗng.',
          });
        }
      }

      // Check periodic score valid range (1 - 10)
      if (item.periodicScore !== undefined && item.periodicScore !== null) {
        if (isNaN(item.periodicScore) || item.periodicScore < 1 || item.periodicScore > 10) {
          errors.push({
            type: 'ERROR',
            code: 'INVALID_PERIODIC_SCORE',
            field: fieldId,
            domain: item.domain,
            criterionCode: item.criterionCode,
            message: 'Điểm kiểm tra định kỳ phải nằm trong thang điểm từ 1 đến 10.',
          });
        }
      }
    });

    // 4. Nhận xét GVCN / Homeroom comment
    if (evaluation.homeroomComment) {
      const unresolved = evaluationTemplateSeedService.findUnresolvedTokens(evaluation.homeroomComment);
      if (unresolved.length > 0) {
        errors.push({
          type: 'ERROR',
          code: 'UNRESOLVED_TOKEN',
          field: 'homeroomComment',
          message: `Nhận xét GVCN còn chứa biến mẫu chưa thay thế: ${unresolved.join(', ')}`,
        });
      }

      const sensitiveMatch = evaluation.homeroomComment.match(SENSITIVE_WORDS_PATTERN);
      if (sensitiveMatch) {
        warnings.push({
          type: 'WARNING',
          code: 'SENSITIVE_WORDING',
          field: 'homeroomComment',
          message: `Nhận xét GVCN chứa từ ngữ dán nhãn: "${sensitiveMatch[0]}"`,
          suggestion: 'Nên dùng các từ khích lệ, mang tính xây dựng sư phạm',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Phát hiện các nhận xét bị trùng lặp hoàn toàn trên nhiều học sinh trong cùng 1 lớp
   */
  detectDuplicateComments(
    studentEvaluations: Array<{ studentId: string; studentName: string; comments: string[] }>
  ): Map<string, string[]> {
    const commentToStudents = new Map<string, string[]>();

    for (const st of studentEvaluations) {
      for (const comment of st.comments) {
        const trimmed = comment ? comment.trim() : '';
        if (trimmed.length >= 15) {
          // Chỉ kiểm tra các câu nhận xét có độ dài đáng kể
          const existing = commentToStudents.get(trimmed) || [];
          if (!existing.includes(st.studentName)) {
            existing.push(st.studentName);
          }
          commentToStudents.set(trimmed, existing);
        }
      }
    }

    // Chỉ giữ lại những comment trùng trên từ 2 học sinh trở lên
    const duplicates = new Map<string, string[]>();
    for (const [cmt, students] of commentToStudents.entries()) {
      if (students.length >= 2) {
        duplicates.set(cmt, students);
      }
    }

    return duplicates;
  }
}

export const evaluationValidationService = new EvaluationValidationService();
