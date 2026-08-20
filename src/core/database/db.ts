import Dexie, { type Table } from 'dexie';
import type {
  TeacherProfile,
  AcademicYear,
  Term,
  ClassRoom,
  Student,
  ClassEnrollment,
  ParentContact,
  AttendanceSession,
  AttendanceRecord,
  PointCategory,
  PointEntry,
  StudentNote,
  Evaluation,
  EvaluationItem,
  EvaluationCommentTemplate,
  ParentInteraction,
  Reward,
  UserSettings,
  AuditLog,
  BackupHistory,
  LiveClassSession,
  LiveClassParticipant,
  LiveClassGroup,
  LiveClassGroupMember,
  LiveClassEvent,
  RankSystem,
  RankSystemClass,
  RankLevel,
  StudentRankHistory,
  HonorTitle,
  HonorBoard,
  HonorRecipient,
  Gift,
  GiftRedemption,
  GiftRedemptionItem,
  GiftStockMovement,
  GiftImage,
  RankPromotionEvent,
  AvatarAsset,
  LevelUpCelebrationEvent,
} from './types';

export interface DatabaseHealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  tableCounts: Record<string, number>;
  totalRecords: number;
  estimatedSizeMB?: number;
  version: number;
}

export class SoChuNhiemDB extends Dexie {
  teacherProfiles!: Table<TeacherProfile, string>;
  academicYears!: Table<AcademicYear, string>;
  terms!: Table<Term, string>;
  classes!: Table<ClassRoom, string>;
  students!: Table<Student, string>;
  classEnrollments!: Table<ClassEnrollment, string>;
  parentContacts!: Table<ParentContact, string>;
  attendanceSessions!: Table<AttendanceSession, string>;
  attendanceRecords!: Table<AttendanceRecord, string>;
  pointCategories!: Table<PointCategory, string>;
  pointEntries!: Table<PointEntry, string>;
  studentNotes!: Table<StudentNote, string>;
  evaluations!: Table<Evaluation, string>;
  evaluationItems!: Table<EvaluationItem, string>;
  evaluationCommentTemplates!: Table<EvaluationCommentTemplate, string>;
  parentInteractions!: Table<ParentInteraction, string>;
  rewards!: Table<Reward, string>;
  settings!: Table<UserSettings, string>;
  auditLogs!: Table<AuditLog, string>;
  backupHistory!: Table<BackupHistory, string>;
  liveClassSessions!: Table<LiveClassSession, string>;
  liveClassParticipants!: Table<LiveClassParticipant, string>;
  liveClassGroups!: Table<LiveClassGroup, string>;
  liveClassGroupMembers!: Table<LiveClassGroupMember, string>;
  liveClassEvents!: Table<LiveClassEvent, string>;
  rankSystems!: Table<RankSystem, string>;
  rankSystemClasses!: Table<RankSystemClass, string>;
  rankLevels!: Table<RankLevel, string>;
  studentRankHistory!: Table<StudentRankHistory, string>;
  honorTitles!: Table<HonorTitle, string>;
  honorBoards!: Table<HonorBoard, string>;
  honorRecipients!: Table<HonorRecipient, string>;
  gifts!: Table<Gift, string>;
  giftRedemptions!: Table<GiftRedemption, string>;
  giftRedemptionItems!: Table<GiftRedemptionItem, string>;
  giftStockMovements!: Table<GiftStockMovement, string>;
  giftImages!: Table<GiftImage, string>;
  rankPromotionEvents!: Table<RankPromotionEvent, string>;
  avatarAssets!: Table<AvatarAsset, string>;
  levelUpCelebrationEvents!: Table<LevelUpCelebrationEvent, string>;

  constructor() {
    super('SoChuNhiemVietOfflineDB');

    this.version(1).stores({
      teacherProfiles: 'id, phone',
      academicYears: 'id, name, isActive',
      terms: 'id, academicYearId, isActive, [academicYearId+isActive]',
      classes: 'id, academicYearId, name, status, deletedAt, [academicYearId+deletedAt]',
      students: 'id, studentCode, normalizedName, deletedAt',
      classEnrollments: 'id, classId, studentId, &[classId+studentId], status',
      parentContacts: 'id, studentId, isPrimary',
      attendanceSessions: 'id, classId, termId, sessionDate, &[classId+sessionDate]',
      attendanceRecords: 'id, sessionId, studentId, status, &[sessionId+studentId]',
      pointCategories: 'id, name, type',
      pointEntries: 'id, classId, studentId, categoryId, sourceId, occurredAt',
      studentNotes: 'id, classId, studentId, termId',
      evaluations: 'id, classId, studentId, termId, &[classId+studentId+termId]',
      parentInteractions: 'id, classId, studentId, interactionDate',
      rewards: 'id, classId, studentId, termId, date',
      settings: 'id',
      auditLogs: 'id, entityName, recordId, timestamp',
      backupHistory: 'id, createdAt',
    });

    this.version(2).stores({
      classes: 'id, academicYearId, name, status, deletedAt',
    });

    this.version(3).stores({
      liveClassSessions: 'id, classId, sessionDate, status',
      liveClassParticipants: 'id, sessionId, studentId, &[sessionId+studentId], attendanceStatus',
      liveClassGroups: 'id, sessionId',
      liveClassGroupMembers: 'id, groupId, studentId, &[groupId+studentId]',
      liveClassEvents: 'id, sessionId, eventType, createdAt',
    });

    this.version(4).stores({
      pointEntries: 'id, classId, studentId, categoryId, sourceId, occurredAt',
    });

    this.version(5).stores({
      rankSystems: 'id, academicYearId, isActive, [academicYearId+isActive]',
      rankSystemClasses: 'id, rankSystemId, classId, &[rankSystemId+classId]',
      rankLevels: 'id, rankSystemId, level, code, &[rankSystemId+level], &[rankSystemId+code]',
      studentRankHistory: 'id, rankSystemId, classId, studentId, createdAt, [studentId+createdAt]',
    }).upgrade(async (tx) => {
      // Safe migration for existing pointCategories data: assign countsTowardRank = true
      await tx.table('pointCategories').toCollection().modify((cat) => {
        if (cat.countsTowardRank === undefined) {
          cat.countsTowardRank = true;
        }
      });
    });

    this.version(6).stores({
      honorTitles: 'id, code, calculationType, isActive, sortOrder, createdAt, deletedAt',
      honorBoards: 'id, classId, academicYearId, termId, status, startDate, endDate, periodType, createdAt, deletedAt, [classId+startDate+endDate]',
      honorRecipients: 'id, boardId, titleId, studentId, isApproved, &[boardId+titleId+studentId], createdAt',
    });

    this.version(7).stores({
      pointEntries: 'id, classId, studentId, categoryId, sourceId, occurredAt, [classId+occurredAt], [studentId+occurredAt]',
    });

    this.version(8).stores({
      evaluations: 'id, classId, studentId, academicYearId, termId, periodCode, regulationCode, status, deletedAt, &[classId+studentId+academicYearId+periodCode]',
      evaluationItems: 'id, evaluationId, domain, criterionCode, subjectCode, deletedAt, &[evaluationId+domain+criterionCode]',
      evaluationCommentTemplates: 'id, catalogVersion, regulationCode, domain, criterionCode, levelCode, origin, isFavorite, isActive, deletedAt',
    }).upgrade(async (tx) => {
      // Safe migration for legacy evaluations rows
      const evTable = tx.table('evaluations');
      const classTable = tx.table('classes');
      const termTable = tx.table('terms');

      const legacyRows = await evTable.toArray();
      for (const row of legacyRows) {
        let academicYearId = row.academicYearId;
        let regulationCode = row.regulationCode;
        let periodCode = row.periodCode;

        if (!academicYearId && row.classId) {
          const cls = await classTable.get(row.classId);
          if (cls) {
            academicYearId = cls.academicYearId;
            if (!regulationCode) {
              regulationCode = cls.grade >= 1 && cls.grade <= 5
                ? 'TT27_2020_PRIMARY'
                : cls.grade >= 6 && cls.grade <= 9
                  ? 'TT22_2021_LOWER_SECONDARY'
                  : 'TT22_2021_UPPER_SECONDARY';
            }
          }
        }

        if (!regulationCode) {
          regulationCode = 'TT22_2021_LOWER_SECONDARY';
        }

        if (!periodCode) {
          if (row.termId) {
            const term = await termTable.get(row.termId);
            if (term && (term.name.includes('1') || term.name.includes('I'))) {
              periodCode = regulationCode === 'TT27_2020_PRIMARY' ? 'END_TERM_1' : 'TERM_1';
            } else if (term && (term.name.includes('2') || term.name.includes('II'))) {
              periodCode = regulationCode === 'TT27_2020_PRIMARY' ? 'END_YEAR' : 'TERM_2';
            } else {
              periodCode = 'LEGACY_UNMAPPED';
            }
          } else {
            periodCode = 'LEGACY_UNMAPPED';
          }
        }

        await evTable.update(row.id, {
          academicYearId: academicYearId || 'default-year',
          regulationCode,
          periodCode,
          status: row.status || 'DRAFT',
        });
      }
    });

    this.version(9).stores({
      gifts: 'id, name, normalizedName, status, category, pointCost, inventoryMode, displayOrder, presentationVisible, deletedAt',
      giftRedemptions: 'id, studentId, classId, academicYearId, termId, status, redeemedAt, &idempotencyKey, [studentId+redeemedAt], [classId+redeemedAt], deletedAt',
      giftRedemptionItems: 'id, redemptionId, giftId, [redemptionId+giftId], deletedAt',
      giftStockMovements: 'id, giftId, type, occurredAt, createdAt, [giftId+occurredAt]',
    });

    this.version(10).stores({
      giftImages: 'id, &giftId, updatedAt',
    });

    this.version(11).stores({
      rankPromotionEvents: 'id, classId, studentId, liveSessionId, status, createdAt, [classId+status+createdAt], [liveSessionId+status+createdAt], [studentId+sourcePointEntryId]',
    });

    this.version(12).stores({
      avatarAssets: 'id, createdAt',
    });

    this.version(13).stores({
      avatarAssets: 'id, targetLevel, createdAt',
    });

    this.version(14).stores({
      levelUpCelebrationEvents: 'id, &dedupeKey, classId, studentId, liveSessionId, status, createdAt, [classId+status+createdAt], [liveSessionId+status+createdAt]',
    });
  }

  /**
   * Health Check cho IndexedDB: Đếm tổng số bản ghi và ước tính dung lượng bộ nhớ
   */
  async checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
    try {
      const tableCounts: Record<string, number> = {};
      let totalRecords = 0;

      for (const table of this.tables) {
        const count = await table.count();
        tableCounts[table.name] = count;
        totalRecords += count;
      }

      let estimatedSizeMB: number | undefined;
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          estimatedSizeMB = Number((estimate.usage / (1024 * 1024)).toFixed(2));
        }
      }

      return {
        status: 'healthy',
        tableCounts,
        totalRecords,
        estimatedSizeMB,
        version: this.verno,
      };
    } catch (err) {
      console.error('Database health check failed:', err);
      return {
        status: 'error',
        tableCounts: {},
        totalRecords: 0,
        version: this.verno,
      };
    }
  }

  /**
   * Safe transaction helper tự động rollback khi callback ném exception
   */
  async runTransaction<T>(
    mode: 'r' | 'rw',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tables: Table<any, any>[],
    callback: () => Promise<T>
  ): Promise<T> {
    return await this.transaction(mode, tables, async () => {
      return await callback();
    });
  }
}

export const db = new SoChuNhiemDB();
