import { db } from '../database/db';
import {
  honorBoardRepository,
  honorTitleRepository,
  honorRecipientRepository,
} from '../repositories/honor-board.repository';
import { honorTitleSeedService } from './honor-title-seed.service';
import { honorRuleEngineService } from './honor-rule-engine.service';
import { rankSeedService } from './rank-seed.service';
import { rankCalculationService } from './rank-calculation.service';
import type {
  HonorBoard,
  HonorTitle,
  HonorRecipient,
  Student,
  HonorBoardPeriodType,
} from '../database/types';

export interface CreateHonorBoardInput {
  classId: string;
  academicYearId: string;
  termId?: string | null;
  title: string;
  periodType: HonorBoardPeriodType;
  startDate: string;
  endDate: string;
  selectedTitleIds?: string[];
  showPointValues?: boolean;
  showRankProgress?: boolean;
}

export interface HonorBoardRecipientDetail extends HonorRecipient {
  student?: Student;
  title?: HonorTitle;
}

export interface HonorBoardDetailsResult {
  board: HonorBoard;
  recipients: HonorBoardRecipientDetail[];
  titles: HonorTitle[];
  topRankPodium: HonorBoardRecipientDetail[]; // Top 1, 2, 3
  groupedByTitle: {
    title: HonorTitle;
    recipients: HonorBoardRecipientDetail[];
  }[];
  collectiveMetrics: {
    totalHonors: number;
    totalStudentsAwarded: number;
    totalClassStudents: number;
    attendanceRate: number;
    totalMeritPointsInPeriod: number;
    totalPromotionsInPeriod: number;
  };
}

export class HonorBoardService {
  /**
   * Khởi tạo Bảng Vàng ở trạng thái Bản Nháp (Draft) và tự động tính toán ứng viên
   */
  async createDraftBoard(input: CreateHonorBoardInput): Promise<{ board: HonorBoard; recipientCount: number }> {
    // 1. Đảm bảo 8 danh hiệu mặc định đã có
    await honorTitleSeedService.seedDefaultTitles();

    // 2. Lấy danh sách danh hiệu được chọn
    let titles = await honorTitleRepository.getActive();
    if (input.selectedTitleIds && input.selectedTitleIds.length > 0) {
      titles = titles.filter((t) => input.selectedTitleIds!.includes(t.id));
    }

    // 3. Đảm bảo hệ thống cấp bậc của năm học đã có
    const { system } = await rankSeedService.seedDefaultRankSystem(input.academicYearId);

    // 4. Tạo bảng vàng trong DB
    const now = new Date().toISOString();
    const board = await honorBoardRepository.create({
      classId: input.classId,
      academicYearId: input.academicYearId,
      termId: input.termId || null,
      title: input.title,
      periodType: input.periodType,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'draft',
      showPointValues: input.showPointValues ?? false,
      showRankProgress: input.showRankProgress ?? true,
      generatedAt: now,
      publishedAt: null,
    });

    // 5. Chạy HonorRuleEngine để đề xuất ứng viên ban đầu
    const evalResults = await honorRuleEngineService.evaluateAllTitlesForClass(
      input.classId,
      titles,
      input.startDate,
      input.endDate,
      system.id,
      input.academicYearId
    );

    const recipientsToInsert: HonorRecipient[] = [];

    for (const res of evalResults) {
      for (const cand of res.candidates) {
        recipientsToInsert.push({
          id: crypto.randomUUID(),
          boardId: board.id,
          titleId: res.title.id,
          studentId: cand.student.id,
          position: cand.position ?? null,
          selectionType: 'automatic',
          metricValue: cand.metricValue,
          reason: cand.reason,
          rankLevelAtAward: cand.rankLevel,
          rankNameAtAward: cand.rankName,
          pointsAtAward: cand.points,
          titleNameAtAward: res.title.name,
          badgeKeyAtAward: res.title.badgeKey,
          isApproved: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (recipientsToInsert.length > 0) {
      await honorRecipientRepository.createBatch(recipientsToInsert);
    }

    // Ghi Audit log
    await db.auditLogs.add({
      id: crypto.randomUUID(),
      entityName: 'HonorBoard',
      recordId: board.id,
      action: 'CREATE',
      timestamp: now,
      details: `Tạo bản nháp Bảng vàng "${board.title}" với ${recipientsToInsert.length} ứng viên đề xuất`,
    });

    return { board, recipientCount: recipientsToInsert.length };
  }

  /**
   * Lấy chi tiết toàn bộ Bảng vàng kèm học sinh, bục vinh danh và chỉ số tập thể
   */
  async getBoardDetails(boardId: string): Promise<HonorBoardDetailsResult | null> {
    const board = await honorBoardRepository.findById(boardId);
    if (!board) return null;

    const rawRecipients = await honorRecipientRepository.findByBoard(boardId);
    const titles = await honorTitleRepository.getAll();
    const titleMap = new Map<string, HonorTitle>();
    titles.forEach((t) => titleMap.set(t.id, t));

    // Nạp học sinh theo batch
    const studentIds = Array.from(new Set(rawRecipients.map((r) => r.studentId)));
    const studentMap = new Map<string, Student>();
    for (const stId of studentIds) {
      const st = await db.students.get(stId);
      if (st) studentMap.set(st.id, st);
    }

    const recipientDetails: HonorBoardRecipientDetail[] = rawRecipients.map((r) => ({
      ...r,
      student: studentMap.get(r.studentId),
      title: titleMap.get(r.titleId),
    }));

    // Bục vinh danh Top Rank Podium
    const topRankTitle = titles.find((t) => t.code === 'top_rank');
    const topRankPodium = recipientDetails
      .filter((r) => r.titleId === topRankTitle?.id)
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

    // Group theo từng danh hiệu
    const groupedByTitle = titles.map((t) => ({
      title: t,
      recipients: recipientDetails.filter((r) => r.titleId === t.id && r.isApproved),
    })).filter((g) => g.recipients.length > 0 || board.status === 'draft');

    // Tính toán chỉ số tập thể (Collective Metrics)
    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(board.classId)
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();
    const totalClassStudents = enrollments.length;

    // Tổng điểm tích cực trong kỳ
    const pointEntries = await db.pointEntries
      .where('classId')
      .equals(board.classId)
      .filter((p) => !p.deletedAt && p.occurredAt >= board.startDate && p.occurredAt <= board.endDate && p.points > 0)
      .toArray();
    const totalMeritPointsInPeriod = pointEntries.reduce((sum, p) => sum + p.points, 0);

    // Tổng lượt thăng cấp trong kỳ
    const startISO = `${board.startDate}T00:00:00.000Z`;
    const endISO = `${board.endDate}T23:59:59.999Z`;
    const promoHistories = await db.studentRankHistory
      .where('classId')
      .equals(board.classId)
      .filter((h) => h.changeType === 'promotion' && h.createdAt >= startISO && h.createdAt <= endISO)
      .toArray();
    const totalPromotionsInPeriod = promoHistories.length;

    // Chuyên cần trung bình
    const sessions = await db.attendanceSessions
      .where('classId')
      .equals(board.classId)
      .filter((s) => !s.deletedAt && s.sessionDate >= board.startDate && s.sessionDate <= board.endDate)
      .toArray();
    let attendanceRate = 100;
    if (sessions.length > 0) {
      const records = await db.attendanceRecords
        .filter((r) => !r.deletedAt && sessions.some((s) => s.id === r.sessionId))
        .toArray();
      const presentCount = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
      attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 100;
    }

    const uniqueStudentsAwarded = new Set(recipientDetails.filter((r) => r.isApproved).map((r) => r.studentId));

    return {
      board,
      recipients: recipientDetails,
      titles,
      topRankPodium,
      groupedByTitle,
      collectiveMetrics: {
        totalHonors: recipientDetails.filter((r) => r.isApproved).length,
        totalStudentsAwarded: uniqueStudentsAwarded.size,
        totalClassStudents,
        attendanceRate,
        totalMeritPointsInPeriod,
        totalPromotionsInPeriod,
      },
    };
  }

  /**
   * Công bố Bảng Vàng (Published) và chụp Snapshot bất biến cho toàn bộ học sinh được vinh danh
   */
  async publishBoard(boardId: string): Promise<void> {
    const board = await honorBoardRepository.findById(boardId);
    if (!board) throw new Error('Không tìm thấy Bảng vàng.');

    const now = new Date().toISOString();
    const recipients = await honorRecipientRepository.findByBoard(boardId);
    const approvedRecipients = recipients.filter((r) => r.isApproved);

    if (approvedRecipients.length === 0) {
      throw new Error('Cần có ít nhất một học sinh được phê duyệt để công bố Bảng vàng.');
    }

    // Đảm bảo snapshot toàn bộ recipient
    const titles = await honorTitleRepository.getAll();
    const titleMap = new Map<string, HonorTitle>();
    titles.forEach((t) => titleMap.set(t.id, t));

    for (const rec of approvedRecipients) {
      const title = titleMap.get(rec.titleId);
      if (title) {
        await honorRecipientRepository.update(rec.id, {
          titleNameAtAward: title.name,
          badgeKeyAtAward: title.badgeKey,
          updatedAt: now,
        });
      }
    }

    // Cập nhật trạng thái published
    await honorBoardRepository.update(boardId, {
      status: 'published',
      publishedAt: now,
    });

    // Ghi Audit log
    await db.auditLogs.add({
      id: crypto.randomUUID(),
      entityName: 'HonorBoard',
      recordId: boardId,
      action: 'UPDATE',
      timestamp: now,
      details: `Công bố chính thức Bảng vàng "${board.title}" với ${approvedRecipients.length} danh hiệu`,
    });
  }

  /**
   * Chuyển Bảng vàng đã công bố về Bản Nháp (Revert to draft)
   */
  async revertToDraft(boardId: string, reason?: string): Promise<void> {
    const board = await honorBoardRepository.findById(boardId);
    if (!board) throw new Error('Không tìm thấy Bảng vàng.');

    const now = new Date().toISOString();
    await honorBoardRepository.update(boardId, {
      status: 'draft',
      publishedAt: null,
    });

    await db.auditLogs.add({
      id: crypto.randomUUID(),
      entityName: 'HonorBoard',
      recordId: boardId,
      action: 'UPDATE',
      timestamp: now,
      details: `Chuyển Bảng vàng "${board.title}" về bản nháp để chỉnh sửa. Lý do: ${reason || 'Giáo viên yêu cầu'}`,
    });
  }

  /**
   * Lưu trữ Bảng vàng (Archived)
   */
  async archiveBoard(boardId: string): Promise<void> {
    await honorBoardRepository.update(boardId, {
      status: 'archived',
    });
  }

  /**
   * Thêm học sinh vinh danh thủ công
   */
  async addManualRecipient(
    boardId: string,
    titleId: string,
    studentId: string,
    reason: string,
    position?: number | null
  ): Promise<HonorRecipient> {
    const board = await honorBoardRepository.findById(boardId);
    if (!board) throw new Error('Không tìm thấy Bảng vàng.');

    const title = await honorTitleRepository.findById(titleId);
    if (!title) throw new Error('Không tìm thấy danh hiệu.');

    const student = await db.students.get(studentId);
    if (!student) throw new Error('Không tìm thấy học sinh.');

    const { system } = await rankSeedService.seedDefaultRankSystem(board.academicYearId);
    const classRanks = await rankCalculationService.recalculateClassRanks(board.classId, system.id);
    const rInfo = classRanks.get(studentId);

    const now = new Date().toISOString();
    const recipient: HonorRecipient = {
      id: crypto.randomUUID(),
      boardId,
      titleId,
      studentId,
      position: position ?? null,
      selectionType: 'manual',
      metricValue: null,
      reason,
      rankLevelAtAward: rInfo ? rInfo.currentLevel : 1,
      rankNameAtAward: rInfo ? rInfo.currentRank.name : 'Binh nhì',
      pointsAtAward: rInfo ? rInfo.effectivePoints : 0,
      titleNameAtAward: title.name,
      badgeKeyAtAward: title.badgeKey,
      isApproved: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.honorRecipients.add(recipient);
    return recipient;
  }

  /**
   * Lấy lịch sử danh hiệu của một học sinh cụ thể (Snapshot bất biến)
   */
  async getStudentHonorHistory(studentId: string): Promise<{
    recipient: HonorRecipient;
    board: HonorBoard;
  }[]> {
    const recipients = await honorRecipientRepository.findByStudent(studentId);
    const result: { recipient: HonorRecipient; board: HonorBoard }[] = [];

    for (const rec of recipients) {
      const board = await honorBoardRepository.findById(rec.boardId);
      if (board && board.status === 'published') {
        result.push({ recipient: rec, board });
      }
    }

    return result;
  }
}

export const honorBoardService = new HonorBoardService();
