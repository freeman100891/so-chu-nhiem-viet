import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { evaluationService } from './evaluation.service';
import { generateUUID } from '../../shared/utilities/uuid';

describe('EvaluationService Core Workflow Tests', () => {
  const academicYearId = 'year-test-1';
  const classId = 'class-test-4a';
  const student1Id = 'student-test-1';
  const student2Id = 'student-test-2';

  beforeEach(async () => {
    await db.classes.clear();
    await db.students.clear();
    await db.classEnrollments.clear();
    await db.evaluations.clear();
    await db.evaluationItems.clear();
    await db.evaluationCommentTemplates.clear();
    await db.auditLogs.clear();

    // Create Class 4A (Grade 4 -> TT27_2020_PRIMARY)
    await db.classes.add({
      id: classId,
      academicYearId,
      name: '4A',
      grade: 4,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create Students
    await db.students.bulkAdd([
      {
        id: student1Id,
        studentCode: 'HS401',
        fullName: 'Nguyễn Hoàng Minh',
        normalizedName: 'nguyen hoang minh',
        gender: 'Nam',
        dateOfBirth: '2015-05-10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: student2Id,
        studentCode: 'HS402',
        fullName: 'Trần Thị Mai',
        normalizedName: 'tran thi mai',
        gender: 'Nữ',
        dateOfBirth: '2015-08-22',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Create Enrollments
    await db.classEnrollments.bulkAdd([
      {
        id: generateUUID(),
        classId,
        studentId: student1Id,
        rollNumber: 1,
        joinedAt: '2024-09-05',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUUID(),
        classId,
        studentId: student2Id,
        rollNumber: 2,
        joinedAt: '2024-09-05',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  });

  it('1. Should calculate class evaluation summary and seed default templates', async () => {
    const summary = await evaluationService.getClassEvaluationSummary(classId, academicYearId, 'END_TERM_1');

    expect(summary.totalStudents).toBe(2);
    expect(summary.notStartedCount).toBe(2);
    expect(summary.finalizedCount).toBe(0);
    expect(summary.regulationCode).toBe('TT27_2020_PRIMARY');
    expect(summary.roster.length).toBe(2);

    const templateCount = await db.evaluationCommentTemplates.count();
    expect(templateCount).toBeGreaterThan(0);
  });

  it('2. Should save draft, calculate progress, and finalize student', async () => {
    // Save draft for student 1
    await evaluationService.saveEvaluationDraft({
      evaluation: {
        classId,
        studentId: student1Id,
        academicYearId,
        periodCode: 'END_TERM_1',
        regulationCode: 'TT27_2020_PRIMARY',
        status: 'DRAFT',
      },
      items: [
        {
          domain: 'SUBJECT',
          criterionCode: 'TOAN',
          criterionName: 'Toán',
          levelCode: 'HOAN_THANH_TOT',
          periodicScore: 10,
          comment: 'Em giải toán nhanh và chính xác.',
        },
        {
          domain: 'QUALITY',
          criterionCode: 'CHAM_CHI',
          criterionName: 'Chăm chỉ',
          levelCode: 'TOT',
          comment: 'Em tự giác làm bài tập đầy đủ.',
        },
      ],
    });

    const summaryAfterDraft = await evaluationService.getClassEvaluationSummary(classId, academicYearId, 'END_TERM_1');
    expect(summaryAfterDraft.draftCount).toBe(1);
    expect(summaryAfterDraft.notStartedCount).toBe(1);

    // Finalize student 1
    const evalData = await evaluationService.getStudentEvaluation(classId, student1Id, academicYearId, 'END_TERM_1');
    expect(evalData).toBeDefined();

    await evaluationService.finalizeStudent(evalData!.evaluation.id, 'Cô Nguyễn Thị Giáo Viên', 4, [student1Id, student2Id]);

    const summaryAfterFinalize = await evaluationService.getClassEvaluationSummary(classId, academicYearId, 'END_TERM_1');
    expect(summaryAfterFinalize.finalizedCount).toBe(1);
    expect(summaryAfterFinalize.roster[0]?.status).toBe('FINALIZED');
  });

  it('3. Should unlock finalized evaluation with reason and write audit log', async () => {
    // 1. Create and Finalize
    const saved = await evaluationService.saveEvaluationDraft({
      evaluation: {
        classId,
        studentId: student1Id,
        academicYearId,
        periodCode: 'END_TERM_1',
        regulationCode: 'TT27_2020_PRIMARY',
        status: 'DRAFT',
      },
      items: [
        {
          domain: 'SUBJECT',
          criterionCode: 'TIENG_VIET',
          levelCode: 'HOAN_THANH_TOT',
          comment: 'Đọc diễn cảm tốt.',
        },
      ],
    });

    await evaluationService.finalizeStudent(saved.evaluation.id, 'Thầy Chủ Nhiệm', 4, [student1Id, student2Id]);

    // 2. Attempt direct edit on finalized evaluation should throw
    await expect(
      evaluationService.saveEvaluationDraft({
        evaluation: {
          id: saved.evaluation.id,
          classId,
          studentId: student1Id,
          academicYearId,
          periodCode: 'END_TERM_1',
          regulationCode: 'TT27_2020_PRIMARY',
          status: 'DRAFT',
        },
        items: [],
      })
    ).rejects.toThrow('Không thể chỉnh sửa trực tiếp');

    // 3. Unlock with reason
    const unlocked = await evaluationService.unlockStudent(
      saved.evaluation.id,
      'Cập nhật điểm kiểm tra sau khi phúc khảo bài thi',
      'Thầy Chủ Nhiệm'
    );

    expect(unlocked.status).toBe('DRAFT');
    expect(unlocked.unlockReason).toBe('Cập nhật điểm kiểm tra sau khi phúc khảo bài thi');

    // 4. Verify Audit Log recorded
    const auditLogs = await db.auditLogs.where('recordId').equals(saved.evaluation.id).toArray();
    expect(auditLogs.some((l) => l.details?.includes('Mở khóa sổ'))).toBe(true);
  });

  it('4. Should copy previous period evaluation as draft into new period', async () => {
    // Create Mid-Term 1 evaluation
    await evaluationService.saveEvaluationDraft({
      evaluation: {
        classId,
        studentId: student1Id,
        academicYearId,
        periodCode: 'MID_TERM_1',
        regulationCode: 'TT27_2020_PRIMARY',
        status: 'FINALIZED',
      },
      items: [
        {
          domain: 'QUALITY',
          criterionCode: 'TRUNG_THUC',
          levelCode: 'TOT',
          comment: 'Em luôn thật thà và trung thực.',
        },
      ],
    });

    // Copy to End-Term 1
    const copied = await evaluationService.copyFromPreviousPeriod(
      classId,
      student1Id,
      academicYearId,
      'MID_TERM_1',
      'END_TERM_1'
    );

    expect(copied).toBeDefined();
    expect(copied?.evaluation.periodCode).toBe('END_TERM_1');
    expect(copied?.evaluation.status).toBe('DRAFT'); // Copied state is always DRAFT
    expect(copied?.items.length).toBe(1);
    expect(copied?.items[0]?.criterionCode).toBe('TRUNG_THUC');
    expect(copied?.items[0]?.comment).toBe('Em luôn thật thà và trung thực.');
  });
});
