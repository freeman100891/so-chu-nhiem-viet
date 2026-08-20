import { describe, it, expect } from 'vitest';
import { evaluationValidationService } from './evaluation-validation.service';
import type { Evaluation, EvaluationItem } from '../database/types';

describe('EvaluationValidationService Tests', () => {
  it('1. Should block evaluation when grade is invalid or missing', () => {
    const evaluation: Partial<Evaluation> = {
      regulationCode: 'TT27_2020_PRIMARY',
      periodCode: 'END_TERM_1',
      studentId: 'st-1',
    };

    const res = evaluationValidationService.validateEvaluation(evaluation, [], null, ['st-1']);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.code === 'INVALID_GRADE')).toBe(true);
  });

  it('2. Should block evaluation when unresolved tokens exist in comment', () => {
    const evaluation: Partial<Evaluation> = {
      regulationCode: 'TT27_2020_PRIMARY',
      periodCode: 'END_TERM_1',
      studentId: 'st-1',
    };

    const items: Partial<EvaluationItem>[] = [
      {
        domain: 'SUBJECT',
        criterionCode: 'TOAN',
        levelCode: 'HOAN_THANH_TOT',
        comment: 'Em có tiến bộ ở {progressEvidence}, cần luyện thêm.',
      },
    ];

    const res = evaluationValidationService.validateEvaluation(evaluation, items, 3, ['st-1']);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.code === 'UNRESOLVED_TOKEN')).toBe(true);
  });

  it('3. Should trigger reviewable warning when sensitive or labeling words are used', () => {
    const evaluation: Partial<Evaluation> = {
      regulationCode: 'TT27_2020_PRIMARY',
      periodCode: 'END_TERM_1',
      studentId: 'st-1',
    };

    const items: Partial<EvaluationItem>[] = [
      {
        domain: 'QUALITY',
        criterionCode: 'CHAM_CHI',
        levelCode: 'CAN_CO_GANG',
        comment: 'Học sinh còn lười biếng trong giờ học, chưa tự giác làm bài tập.',
      },
    ];

    const res = evaluationValidationService.validateEvaluation(evaluation, items, 3, ['st-1']);
    // Warnings do not make isValid false
    expect(res.isValid).toBe(true);
    expect(res.warnings.length).toBe(1);
    expect(res.warnings[0]?.code).toBe('SENSITIVE_WORDING');
  });

  it('4. Should detect duplicate comments across multiple students in the same class', () => {
    const classEvaluations = [
      {
        studentId: 'st-1',
        studentName: 'Nguyễn Văn An',
        comments: ['Em hoàn thành tốt các nhiệm vụ học tập được giao và luôn gương mẫu trong lớp.'],
      },
      {
        studentId: 'st-2',
        studentName: 'Trần Thị Bình',
        comments: ['Em hoàn thành tốt các nhiệm vụ học tập được giao và luôn gương mẫu trong lớp.'],
      },
      {
        studentId: 'st-3',
        studentName: 'Lê Văn Cường',
        comments: ['Em rất chăm chỉ và năng nổ phát biểu trong giờ học toán.'],
      },
    ];

    const duplicates = evaluationValidationService.detectDuplicateComments(classEvaluations);
    expect(duplicates.size).toBe(1);
    const studentsWithDup = duplicates.get('Em hoàn thành tốt các nhiệm vụ học tập được giao và luôn gương mẫu trong lớp.');
    expect(studentsWithDup).toBeDefined();
    expect(studentsWithDup?.length).toBe(2);
    expect(studentsWithDup).toContain('Nguyễn Văn An');
    expect(studentsWithDup).toContain('Trần Thị Bình');
  });
});
