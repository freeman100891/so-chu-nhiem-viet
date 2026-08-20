import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { evaluationTemplateSeedService } from './evaluation-template-seed.service';

describe('EvaluationTemplateSeedService Tests', () => {
  beforeEach(async () => {
    await db.evaluationCommentTemplates.clear();
  });

  it('1. Should seed templates idempotently without duplicate rows', async () => {
    const res1 = await evaluationTemplateSeedService.seedTemplates();
    expect(res1.addedCount).toBeGreaterThan(10);
    expect(res1.existingCount).toBe(0);

    const countAfterFirstSeed = await db.evaluationCommentTemplates.count();
    expect(countAfterFirstSeed).toBe(res1.addedCount);

    // Second call should detect existing templates and not add duplicates
    const res2 = await evaluationTemplateSeedService.seedTemplates();
    expect(res2.addedCount).toBe(0);
    expect(res2.existingCount).toBe(countAfterFirstSeed);

    const countAfterSecondSeed = await db.evaluationCommentTemplates.count();
    expect(countAfterSecondSeed).toBe(countAfterFirstSeed);
  });

  it('2. Should compose comment replacing known tokens correctly', () => {
    const tpl = 'Em thực hiện tốt các yêu cầu của {subjectName}, nổi bật ở {strengthEvidence}. Tiếp tục phát huy {nextStep}.';
    const composed = evaluationTemplateSeedService.composeComment(tpl, {
      subjectName: 'Toán',
      strengthEvidence: 'kỹ năng tính nhẩm nhanh',
      nextStep: 'trong các bài toán tư duy',
    });

    expect(composed).toBe(
      'Em thực hiện tốt các yêu cầu của Toán, nổi bật ở kỹ năng tính nhẩm nhanh. Tiếp tục phát huy trong các bài toán tư duy.'
    );
  });

  it('3. Should identify unresolved tokens in comment', () => {
    const textWithTokens = 'Em đạt kết quả tốt ở môn {subjectName}, cần rèn luyện thêm {improvementArea}.';
    const unresolved = evaluationTemplateSeedService.findUnresolvedTokens(textWithTokens);

    expect(unresolved).toEqual(['{subjectName}', '{improvementArea}']);

    const cleanText = 'Em rất chăm ngoan và có tiến bộ vượt bậc.';
    expect(evaluationTemplateSeedService.findUnresolvedTokens(cleanText)).toEqual([]);
  });
});
