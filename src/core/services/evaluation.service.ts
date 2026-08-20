import { db } from '../database/db';
import { evaluationRepository, type EvaluationWithItems, type SaveEvaluationPayload } from '../repositories/evaluation.repository';
import { evaluationProfileService } from './evaluation-profile.service';
import { evaluationValidationService } from './evaluation-validation.service';
import { evaluationTemplateSeedService } from './evaluation-template-seed.service';
import type {
  Student,
  Evaluation,
  EvaluationItem,
  EvaluationPeriodCode,
  RegulationProfileCode,
  EvaluationStatus,
} from '../database/types';

export interface StudentRosterEvaluationItem {
  student: Student;
  rollNumber?: number;
  evaluation?: Evaluation;
  itemCount: number;
  status: EvaluationStatus | 'NOT_STARTED';
  hasWarnings: boolean;
  hasErrors: boolean;
  completionPercent: number;
}

export interface ClassEvaluationSummary {
  classId: string;
  className: string;
  grade: number;
  regulationCode: RegulationProfileCode;
  academicYearId: string;
  periodCode: EvaluationPeriodCode;
  totalStudents: number;
  notStartedCount: number;
  draftCount: number;
  readyCount: number;
  finalizedCount: number;
  completionPercent: number;
  roster: StudentRosterEvaluationItem[];
}

export class EvaluationService {
  /**
   * Khởi tạo thư viện mẫu nếu chưa có
   */
  async ensureTemplatesSeeded(): Promise<void> {
    await evaluationTemplateSeedService.seedTemplates();
  }

  /**
   * Lấy tiến độ và danh sách đánh giá của toàn bộ học sinh trong lớp (Batch query không N+1)
   */
  async getClassEvaluationSummary(
    classId: string,
    academicYearId: string,
    periodCode: EvaluationPeriodCode
  ): Promise<ClassEvaluationSummary> {
    // 1. Đảm bảo templates đã được seed
    await this.ensureTemplatesSeeded();

    // 2. Lấy thông tin lớp học
    const cls = await db.classes.get(classId);
    if (!cls) throw new Error('Không tìm thấy lớp học');

    const regulationCode = evaluationProfileService.resolveProfile(cls.grade);

    // 3. Lấy danh sách phân lớp hoạt động
    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();

    const studentIds = enrollments.map((e) => e.studentId);

    // 4. Lấy thông tin học sinh
    const students = await db.students
      .where('id')
      .anyOf(studentIds)
      .filter((s) => !s.deletedAt)
      .toArray();

    const studentMap = new Map(students.map((s) => [s.id, s]));

    // 5. Lấy toàn bộ Evaluations của lớp trong kỳ
    const evaluations = await evaluationRepository.findByClassYearAndPeriod(classId, academicYearId, periodCode);
    const evalMap = new Map(evaluations.map((e) => [e.studentId, e]));
    const evalIds = evaluations.map((e) => e.id);

    // 6. Lấy toàn bộ EvaluationItems của các evaluations này
    const allItems = await db.evaluationItems
      .where('evaluationId')
      .anyOf(evalIds)
      .filter((it) => !it.deletedAt)
      .toArray();

    const itemsByEvalId = new Map<string, EvaluationItem[]>();
    for (const it of allItems) {
      const list = itemsByEvalId.get(it.evaluationId) || [];
      list.push(it);
      itemsByEvalId.set(it.evaluationId, list);
    }

    // 7. Tổng hợp Roster Items
    let notStartedCount = 0;
    let draftCount = 0;
    let readyCount = 0;
    let finalizedCount = 0;

    const roster: StudentRosterEvaluationItem[] = [];

    // Sắp xếp theo STT hoặc tên
    const sortedEnrollments = [...enrollments].sort((a, b) => {
      if (a.rollNumber !== undefined && b.rollNumber !== undefined) {
        return a.rollNumber - b.rollNumber;
      }
      const stA = studentMap.get(a.studentId);
      const stB = studentMap.get(b.studentId);
      return (stA?.fullName || '').localeCompare(stB?.fullName || '', 'vi');
    });

    for (const en of sortedEnrollments) {
      const student = studentMap.get(en.studentId);
      if (!student) continue;

      const evalRec = evalMap.get(student.id);
      const items = evalRec ? itemsByEvalId.get(evalRec.id) || [] : [];
      const status: EvaluationStatus | 'NOT_STARTED' = evalRec ? evalRec.status : 'NOT_STARTED';

      if (status === 'NOT_STARTED') notStartedCount++;
      else if (status === 'DRAFT') draftCount++;
      else if (status === 'READY_FOR_REVIEW') readyCount++;
      else if (status === 'FINALIZED') finalizedCount++;

      // Đếm % hoàn thành dựa trên số tiêu chí có đánh giá
      let filledItemsCount = 0;
      for (const it of items) {
        if (it.levelCode || (it.comment && it.comment.trim().length > 0) || it.periodicScore !== null) {
          filledItemsCount++;
        }
      }

      const totalExpectedItems = regulationCode === 'TT27_2020_PRIMARY' ? 15 : 12;
      const completionPercent = Math.min(100, Math.round((filledItemsCount / totalExpectedItems) * 100));

      const valResult = evalRec
        ? evaluationValidationService.validateEvaluation(evalRec, items, cls.grade, studentIds)
        : { isValid: true, errors: [], warnings: [] };

      roster.push({
        student,
        rollNumber: en.rollNumber,
        evaluation: evalRec,
        itemCount: items.length,
        status,
        hasWarnings: valResult.warnings.length > 0,
        hasErrors: valResult.errors.length > 0,
        completionPercent: status === 'FINALIZED' ? 100 : completionPercent,
      });
    }

    const totalStudents = roster.length;
    const overallCompletionPercent =
      totalStudents > 0 ? Math.round((finalizedCount / totalStudents) * 100) : 0;

    return {
      classId,
      className: cls.name,
      grade: cls.grade,
      regulationCode,
      academicYearId,
      periodCode,
      totalStudents,
      notStartedCount,
      draftCount,
      readyCount,
      finalizedCount,
      completionPercent: overallCompletionPercent,
      roster,
    };
  }

  /**
   * Lấy chi tiết Evaluation kèm Items của 1 học sinh
   */
  async getStudentEvaluation(
    classId: string,
    studentId: string,
    academicYearId: string,
    periodCode: EvaluationPeriodCode
  ): Promise<EvaluationWithItems | undefined> {
    return await evaluationRepository.findWithItemsByUniqueScope(classId, studentId, academicYearId, periodCode);
  }

  /**
   * Lưu bản nháp (Autosave / Manual Save)
   */
  async saveEvaluationDraft(payload: SaveEvaluationPayload): Promise<EvaluationWithItems> {
    return await evaluationRepository.saveEvaluationWithItems(payload);
  }

  /**
   * Khóa sổ hồ sơ đánh giá của 1 học sinh
   */
  async finalizeStudent(
    evaluationId: string,
    finalizedBy: string,
    grade: number,
    enrolledStudentIds: string[]
  ): Promise<Evaluation> {
    const data = await evaluationRepository.getWithItems(evaluationId);
    if (!data) throw new Error('Không tìm thấy hồ sơ đánh giá.');

    const validation = evaluationValidationService.validateEvaluation(
      data.evaluation,
      data.items,
      grade,
      enrolledStudentIds
    );

    if (!validation.isValid) {
      const errMsgs = validation.errors.map((e) => e.message).join('; ');
      throw new Error(`Không thể khóa sổ do còn lỗi: ${errMsgs}`);
    }

    return await evaluationRepository.finalizeEvaluation(evaluationId, finalizedBy);
  }

  /**
   * Khóa sổ toàn bộ lớp học trong kỳ đánh giá
   */
  async finalizeClass(
    classId: string,
    academicYearId: string,
    periodCode: EvaluationPeriodCode,
    finalizedBy: string
  ): Promise<{ finalizedCount: number; errors: Array<{ studentName: string; error: string }> }> {
    const cls = await db.classes.get(classId);
    if (!cls) throw new Error('Không tìm thấy lớp học');

    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();

    const studentIds = enrollments.map((e) => e.studentId);
    const students = await db.students.where('id').anyOf(studentIds).toArray();
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const evaluations = await evaluationRepository.findByClassYearAndPeriod(classId, academicYearId, periodCode);
    const errors: Array<{ studentName: string; error: string }> = [];
    let finalizedCount = 0;

    for (const ev of evaluations) {
      if (ev.status === 'FINALIZED') continue;

      const items = await db.evaluationItems
        .where('evaluationId')
        .equals(ev.id)
        .filter((it) => !it.deletedAt)
        .toArray();

      const student = studentMap.get(ev.studentId);
      const studentName = student ? student.fullName : ev.studentId;

      const val = evaluationValidationService.validateEvaluation(ev, items, cls.grade, studentIds);
      if (!val.isValid) {
        errors.push({
          studentName,
          error: val.errors.map((e) => e.message).join('; '),
        });
      } else {
        await evaluationRepository.finalizeEvaluation(ev.id, finalizedBy);
        finalizedCount++;
      }
    }

    return { finalizedCount, errors };
  }

  /**
   * Mở khóa sổ đánh giá (bắt buộc nhập lý do)
   */
  async unlockStudent(evaluationId: string, reason: string, unlockedBy: string): Promise<Evaluation> {
    return await evaluationRepository.unlockEvaluation(evaluationId, reason, unlockedBy);
  }

  /**
   * Sao chép nhận xét/mức từ kỳ trước sang kỳ hiện tại dưới dạng BẢN NHÁP (Draft)
   */
  async copyFromPreviousPeriod(
    classId: string,
    studentId: string,
    academicYearId: string,
    fromPeriod: EvaluationPeriodCode,
    toPeriod: EvaluationPeriodCode
  ): Promise<EvaluationWithItems | undefined> {
    const previous = await evaluationRepository.findWithItemsByUniqueScope(
      classId,
      studentId,
      academicYearId,
      fromPeriod
    );

    if (!previous) {
      throw new Error(`Không tìm thấy dữ liệu đánh giá kỳ trước (${fromPeriod}) để sao chép.`);
    }

    const current = await evaluationRepository.findWithItemsByUniqueScope(
      classId,
      studentId,
      academicYearId,
      toPeriod
    );

    if (current && current.evaluation.status === 'FINALIZED') {
      throw new Error('Kỳ hiện tại đã khóa sổ, không thể ghi đè.');
    }

    const payload: SaveEvaluationPayload = {
      evaluation: {
        id: current?.evaluation.id,
        classId,
        studentId,
        academicYearId,
        periodCode: toPeriod,
        regulationCode: previous.evaluation.regulationCode,
        status: 'DRAFT',
        overallEducationLevel: previous.evaluation.overallEducationLevel,
        conductLevel: previous.evaluation.conductLevel,
        overallLearningLevel: previous.evaluation.overallLearningLevel,
        homeroomComment: previous.evaluation.homeroomComment,
      },
      items: previous.items.map((it) => ({
        domain: it.domain,
        criterionCode: it.criterionCode,
        criterionName: it.criterionName,
        subjectCode: it.subjectCode,
        levelCode: it.levelCode,
        periodicScore: it.periodicScore,
        comment: it.comment,
        commentSource: it.commentSource,
      })),
    };

    return await evaluationRepository.saveEvaluationWithItems(payload);
  }
}

export const evaluationService = new EvaluationService();
