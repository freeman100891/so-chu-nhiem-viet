import { BaseRepository } from './base.repository';
import { db } from '../database/db';
import type { Evaluation, EvaluationItem, EvaluationPeriodCode } from '../database/types';
import { generateUUID } from '../../shared/utilities/uuid';

export interface EvaluationWithItems {
  evaluation: Evaluation;
  items: EvaluationItem[];
}

export interface SaveEvaluationPayload {
  evaluation: Omit<Evaluation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string };
  items: Array<Omit<EvaluationItem, 'id' | 'evaluationId' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }>;
}

export class EvaluationRepository extends BaseRepository<Evaluation> {
  constructor() {
    super(db.evaluations, 'Evaluation');
  }

  /**
   * Tìm bản ghi đánh giá theo khóa duy nhất nghiệp vụ: classId + studentId + academicYearId + periodCode
   */
  async findByUniqueScope(
    classId: string,
    studentId: string,
    academicYearId: string,
    periodCode: EvaluationPeriodCode
  ): Promise<Evaluation | undefined> {
    return await this.table
      .where('[classId+studentId+academicYearId+periodCode]')
      .equals([classId, studentId, academicYearId, periodCode])
      .filter((e) => !e.deletedAt)
      .first();
  }

  /**
   * Lấy danh sách đánh giá của cả lớp theo năm học và kỳ đánh giá
   */
  async findByClassYearAndPeriod(
    classId: string,
    academicYearId: string,
    periodCode: EvaluationPeriodCode
  ): Promise<Evaluation[]> {
    return await this.table
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.academicYearId === academicYearId && e.periodCode === periodCode)
      .toArray();
  }

  /**
   * Lấy toàn bộ đánh giá của 1 học sinh theo năm học
   */
  async findByStudentAndYear(studentId: string, academicYearId: string): Promise<Evaluation[]> {
    return await this.table
      .where('studentId')
      .equals(studentId)
      .filter((e) => !e.deletedAt && e.academicYearId === academicYearId)
      .toArray();
  }

  /**
   * Lấy đánh giá kèm danh sách tất cả các mục chi tiết (items)
   */
  async getWithItems(evaluationId: string): Promise<EvaluationWithItems | undefined> {
    const evaluation = await this.findById(evaluationId);
    if (!evaluation) return undefined;

    const items = await db.evaluationItems
      .where('evaluationId')
      .equals(evaluationId)
      .filter((item) => !item.deletedAt)
      .toArray();

    return { evaluation, items };
  }

  /**
   * Tìm đánh giá kèm items theo bộ 4 khóa duy nhất
   */
  async findWithItemsByUniqueScope(
    classId: string,
    studentId: string,
    academicYearId: string,
    periodCode: EvaluationPeriodCode
  ): Promise<EvaluationWithItems | undefined> {
    const evaluation = await this.findByUniqueScope(classId, studentId, academicYearId, periodCode);
    if (!evaluation) return undefined;

    const items = await db.evaluationItems
      .where('evaluationId')
      .equals(evaluation.id)
      .filter((item) => !item.deletedAt)
      .toArray();

    return { evaluation, items };
  }

  /**
   * Lưu toàn diện Evaluation + EvaluationItems trong 1 Transaction an toàn Rollback
   */
  async saveEvaluationWithItems(payload: SaveEvaluationPayload): Promise<EvaluationWithItems> {
    return await db.runTransaction('rw', [db.evaluations, db.evaluationItems, db.auditLogs], async () => {
      const now = new Date().toISOString();
      const isExisting = Boolean(payload.evaluation.id);
      const evalId = payload.evaluation.id || generateUUID();

      // 1. Kiểm tra trạng thái nếu đang cập nhật
      if (isExisting) {
        const existing = await db.evaluations.get(evalId);
        if (existing && existing.status === 'FINALIZED') {
          throw new Error('Không thể chỉnh sửa trực tiếp hồ sơ đánh giá đã khóa sổ (FINALIZED). Vui lòng mở khóa trước.');
        }
      }

      // 2. Lưu / Cập nhật Evaluation Header
      const evalRecord: Evaluation = {
        id: evalId,
        classId: payload.evaluation.classId,
        studentId: payload.evaluation.studentId,
        academicYearId: payload.evaluation.academicYearId,
        termId: payload.evaluation.termId ?? null,
        periodCode: payload.evaluation.periodCode,
        regulationCode: payload.evaluation.regulationCode,
        status: payload.evaluation.status || 'DRAFT',
        overallEducationLevel: payload.evaluation.overallEducationLevel ?? null,
        conductLevel: payload.evaluation.conductLevel ?? null,
        overallLearningLevel: payload.evaluation.overallLearningLevel ?? null,
        homeroomComment: payload.evaluation.homeroomComment ?? null,
        promotionResult: payload.evaluation.promotionResult ?? null,
        individualPlanConfirmed: Boolean(payload.evaluation.individualPlanConfirmed),
        teacherProfileId: payload.evaluation.teacherProfileId ?? null,
        finalizedAt: payload.evaluation.finalizedAt ?? null,
        finalizedBy: payload.evaluation.finalizedBy ?? null,
        unlockReason: payload.evaluation.unlockReason ?? null,
        academicRank: payload.evaluation.academicRank,
        conductRank: payload.evaluation.conductRank,
        generalComment: payload.evaluation.generalComment,
        criteriaComment: payload.evaluation.criteriaComment,
        createdAt: isExisting ? (await db.evaluations.get(evalId))?.createdAt || now : now,
        updatedAt: now,
        deletedAt: null,
      };

      await db.evaluations.put(evalRecord);

      // 3. Xử lý Items (Cập nhật hoặc thêm mới)
      // Lấy items hiện có trong DB
      const existingItems = await db.evaluationItems
        .where('evaluationId')
        .equals(evalId)
        .toArray();

      const existingItemMap = new Map(existingItems.map((it) => [`${it.domain}_${it.criterionCode}`, it]));
      const savedItems: EvaluationItem[] = [];

      for (const itemPayload of payload.items) {
        const key = `${itemPayload.domain}_${itemPayload.criterionCode}`;
        const existingItem = existingItemMap.get(key);
        const itemId = itemPayload.id || existingItem?.id || generateUUID();

        const itemRecord: EvaluationItem = {
          id: itemId,
          evaluationId: evalId,
          domain: itemPayload.domain,
          criterionCode: itemPayload.criterionCode,
          criterionName: itemPayload.criterionName,
          subjectCode: itemPayload.subjectCode ?? null,
          levelCode: itemPayload.levelCode ?? null,
          periodicScore: itemPayload.periodicScore !== undefined ? itemPayload.periodicScore : null,
          comment: itemPayload.comment ?? null,
          commentSource: itemPayload.commentSource || 'MANUAL',
          templateId: itemPayload.templateId ?? null,
          evidenceRefs: itemPayload.evidenceRefs ?? null,
          createdAt: existingItem ? existingItem.createdAt : now,
          updatedAt: now,
          deletedAt: null,
        };

        await db.evaluationItems.put(itemRecord);
        savedItems.push(itemRecord);
        existingItemMap.delete(key);
      }

      // 4. Ghi Audit Log
      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'Evaluation',
        recordId: evalId,
        action: isExisting ? 'UPDATE' : 'CREATE',
        timestamp: now,
        details: `Lưu đánh giá [${evalRecord.regulationCode} - ${evalRecord.periodCode}] học sinh ${evalRecord.studentId}`,
      });

      return {
        evaluation: evalRecord,
        items: savedItems,
      };
    });
  }

  /**
   * Khóa sổ đánh giá (Finalize)
   */
  async finalizeEvaluation(evaluationId: string, finalizedBy: string): Promise<Evaluation> {
    return await db.runTransaction('rw', [db.evaluations, db.auditLogs], async () => {
      const existing = await db.evaluations.get(evaluationId);
      if (!existing) {
        throw new Error('Không tìm thấy hồ sơ đánh giá để khóa sổ.');
      }

      const now = new Date().toISOString();
      const updated: Evaluation = {
        ...existing,
        status: 'FINALIZED',
        finalizedAt: now,
        finalizedBy,
        updatedAt: now,
      };

      await db.evaluations.put(updated);

      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'Evaluation',
        recordId: evaluationId,
        action: 'UPDATE',
        timestamp: now,
        details: `Khóa sổ đánh giá chính thức (FINALIZED) bởi ${finalizedBy}`,
      });

      return updated;
    });
  }

  /**
   * Mở khóa sổ đánh giá (Unlock) bắt buộc phải có lý do
   */
  async unlockEvaluation(evaluationId: string, reason: string, unlockedBy: string): Promise<Evaluation> {
    if (!reason || !reason.trim()) {
      throw new Error('Bắt buộc phải nhập lý do mở khóa sổ đánh giá.');
    }

    return await db.runTransaction('rw', [db.evaluations, db.auditLogs], async () => {
      const existing = await db.evaluations.get(evaluationId);
      if (!existing) {
        throw new Error('Không tìm thấy hồ sơ đánh giá để mở khóa.');
      }

      const now = new Date().toISOString();
      const updated: Evaluation = {
        ...existing,
        status: 'DRAFT',
        unlockReason: reason.trim(),
        updatedAt: now,
      };

      await db.evaluations.put(updated);

      await db.auditLogs.add({
        id: generateUUID(),
        entityName: 'Evaluation',
        recordId: evaluationId,
        action: 'UPDATE',
        timestamp: now,
        details: `Mở khóa sổ đánh giá (FINALIZED ➔ DRAFT). Lý do: "${reason.trim()}" bởi ${unlockedBy}`,
      });

      return updated;
    });
  }
}

export const evaluationRepository = new EvaluationRepository();
