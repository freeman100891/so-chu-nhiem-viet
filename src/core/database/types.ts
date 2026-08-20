export type SoftDeleteEntity = {
  id: string;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
  deletedAt?: string | null; // ISO UTC
};

// 1. teacherProfiles
export type TeacherProfile = SoftDeleteEntity & {
  fullName: string;
  schoolName: string;
  phone: string;
  email?: string;
  avatar?: string;
};

// 2. academicYears
export type AcademicYear = SoftDeleteEntity & {
  name: string; // e.g. "2024 - 2025"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
};

// 3. terms
export type TermName = 'HK1' | 'HK2' | 'CATHAN';
export type Term = SoftDeleteEntity & {
  academicYearId: string;
  name: string; // "Học kỳ 1", "Học kỳ 2"
  startDate: string;
  endDate: string;
  isActive: boolean;
};

// 4. classes
export type ClassStatus = 'Active' | 'Completed' | 'Archived';
export type ClassRoom = SoftDeleteEntity & {
  academicYearId: string;
  name: string; // e.g. "10A1"
  grade: number; // 10, 11, 12
  description?: string;
  status: ClassStatus;
};

// 5. students
export type Gender = 'Nam' | 'Nữ' | 'Khác';
export type Student = SoftDeleteEntity & {
  studentCode: string;
  fullName: string;
  normalizedName: string; // Tiếng Việt không dấu chữ thường
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  ethnicity?: string;
  address?: string;
  avatar?: string;
  avatarKey?: string | null;
  avatarThemeId?: string | null;
  medicalNote?: string;
};

// 6. classEnrollments
export type EnrollmentStatus = 'Active' | 'Transferred' | 'Dropped' | 'Suspended';
export type ClassEnrollment = SoftDeleteEntity & {
  classId: string;
  studentId: string;
  rollNumber?: number;
  joinedAt: string; // YYYY-MM-DD
  leftAt?: string | null;
  status: EnrollmentStatus;
};

// 7. parentContacts
export type ParentContact = SoftDeleteEntity & {
  studentId: string;
  fullName: string;
  relation: string; // Cha, Mẹ, Người giám hộ
  phone: string;
  email?: string;
  zalo?: string;
  occupation?: string;
  isPrimary: boolean;
};

// 8. attendanceSessions
export type AttendanceSessionStatus = 'Completed' | 'Pending' | 'Cancelled';
export type AttendanceSession = SoftDeleteEntity & {
  classId: string;
  termId?: string;
  sessionDate: string; // YYYY-MM-DD local format
  status?: AttendanceSessionStatus;
  note?: string;
  isLocked?: boolean;
  totalPresent?: number;
  totalExcused?: number;
  totalUnexcused?: number;
  totalLate?: number;
};

// 9. attendanceRecords
export type AttendanceRecordStatus = 'Present' | 'ExcusedAbsence' | 'UnexcusedAbsence' | 'Late' | 'EarlyLeave';
export type AttendanceRecord = SoftDeleteEntity & {
  sessionId: string;
  studentId: string;
  rollNumber?: number;
  status: AttendanceRecordStatus;
  reason?: string;
  note?: string;
};

// 10. pointCategories
export type PointCategoryType = 'Merit' | 'Demerit';
export type PointCategory = SoftDeleteEntity & {
  name: string;
  type: PointCategoryType;
  defaultPoints: number;
  description?: string;
  countsTowardRank?: boolean;
};

// 11. pointEntries
export type PointEntry = SoftDeleteEntity & {
  classId: string;
  studentId: string;
  categoryId: string;
  points: number;
  reason: string;
  occurredAt: string; // YYYY-MM-DD local format
  recordedBy?: string;
  source?: 'manual' | 'live_classroom';
  sourceId?: string | null;
  reversedEntryId?: string | null;
};

// 12. studentNotes
export type StudentNoteCategory = 'HocTap' | 'KyLuat' | 'NangLuc' | 'PhamChat' | 'SucKhoe' | 'HoanCanh' | 'Khac';
export type StudentNote = SoftDeleteEntity & {
  classId: string;
  studentId: string;
  termId?: string;
  content: string;
  category: StudentNoteCategory;
  isPinned?: boolean;
  recordedAt?: string; // YYYY-MM-DD
};

// 13. evaluations & regulations
export type RegulationProfileCode = 'TT27_2020_PRIMARY' | 'TT22_2021_LOWER_SECONDARY' | 'TT22_2021_UPPER_SECONDARY';

export type EvaluationPeriodCode =
  | 'MID_TERM_1' // Giữa Học kỳ 1 (Tiểu học TT27)
  | 'END_TERM_1' // Cuối Học kỳ 1 (Tiểu học TT27)
  | 'MID_TERM_2' // Giữa Học kỳ 2 (Tiểu học TT27)
  | 'END_YEAR' // Cuối Năm học (Tiểu học TT27)
  | 'TERM_1' // Học kỳ 1 (THCS / THPT TT22)
  | 'TERM_2' // Học kỳ 2 (THCS / THPT TT22)
  | 'FULL_YEAR' // Cả năm (THCS / THPT TT22)
  | 'LEGACY_UNMAPPED'; // Bản ghi cũ từ phiên bản trước

export type EvaluationDomain =
  | 'SUBJECT' // Môn học & Hoạt động giáo dục (TT27)
  | 'QUALITY' // Phẩm chất chủ yếu (TT27)
  | 'GENERAL_CAPACITY' // Năng lực chung (TT27)
  | 'SPECIFIC_CAPACITY' // Năng lực đặc thù (TT27)
  | 'SUMMARY' // Đánh giá tổng hợp cuối kỳ / cuối năm (TT27)
  | 'SUBJECT_COMMENT' // Môn đánh giá bằng nhận xét (TT22)
  | 'SUBJECT_SCORE' // Môn kết hợp điểm số và nhận xét (TT22)
  | 'CONDUCT' // Kết quả Rèn luyện (TT22)
  | 'LEARNING' // Kết quả Học tập (TT22)
  | 'HOMEROOM_SUMMARY'; // Nhận xét của Giáo viên Chủ nhiệm (TT22)

export type EvaluationStatus = 'DRAFT' | 'READY_FOR_REVIEW' | 'FINALIZED';
export type CommentSource = 'SYSTEM_TEMPLATE' | 'CUSTOM_TEMPLATE' | 'EVIDENCE_SUGGESTION' | 'MANUAL';
export type TemplateOrigin = 'SYSTEM' | 'CUSTOM';

export type EvaluationRank = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';

export type Evaluation = SoftDeleteEntity & {
  classId: string;
  studentId: string;
  academicYearId: string;
  termId?: string | null;
  periodCode: EvaluationPeriodCode;
  regulationCode: RegulationProfileCode;
  status: EvaluationStatus;
  overallEducationLevel?: string | null; // e.g. HOAN_THANH_XUAT_SAC, HOAN_THANH_TOT, HOAN_THANH, CHUA_HOAN_THANH
  conductLevel?: string | null; // e.g. TOT, KHA, DAT, CHUA_DAT
  overallLearningLevel?: string | null; // e.g. TOT, KHA, DAT, CHUA_DAT
  homeroomComment?: string | null;
  promotionResult?: string | null; // Hoàn thành chương trình lớp học, lên lớp, rèn luyện hè
  individualPlanConfirmed?: boolean; // Xác nhận kế hoạch giáo dục cá nhân
  teacherProfileId?: string | null;
  finalizedAt?: string | null; // ISO UTC
  finalizedBy?: string | null;
  unlockReason?: string | null;

  // Legacy compatibility fields
  academicRank?: EvaluationRank;
  conductRank?: EvaluationRank;
  generalComment?: string;
  criteriaComment?: string;
};

// 13b. evaluationItems
export type EvaluationItem = SoftDeleteEntity & {
  evaluationId: string;
  domain: EvaluationDomain;
  criterionCode: string; // e.g. YEU_NUOC, TU_CHU_TU_HOC, MATH, LITERATURE...
  criterionName?: string;
  subjectCode?: string | null;
  levelCode?: string | null; // HOAN_THANH_TOT, TOT, DAT, CAN_CO_GANG, etc.
  periodicScore?: number | null; // 1 - 10 nếu có
  comment?: string | null;
  commentSource?: CommentSource;
  templateId?: string | null;
  evidenceRefs?: string[] | null;
};

// 13c. evaluationCommentTemplates
export type EvaluationCommentTemplate = SoftDeleteEntity & {
  catalogVersion: number;
  regulationCode: RegulationProfileCode;
  gradeFrom: number;
  gradeTo: number;
  domain: EvaluationDomain;
  criterionCode?: string | null;
  levelCode?: string | null;
  templateText: string;
  tags: string[];
  origin: TemplateOrigin;
  isFavorite: boolean;
  isActive: boolean;
};

// 13d. commentTemplates (Legacy)
export type CommentTemplate = SoftDeleteEntity & {
  category: string;
  content: string;
};

// 14. parentInteractions
export type InteractionMethod = 'GoiDien' | 'TrucTiep' | 'Zalo' | 'HopPhuHuynh' | 'Khac';
export type ParentInteraction = SoftDeleteEntity & {
  classId: string;
  studentId: string;
  parentContactId?: string;
  interactionDate: string; // YYYY-MM-DD local format
  method: InteractionMethod;
  topic: string;
  content: string;
  result?: string;
  parentFeedback?: string;
  followUpDate?: string; // YYYY-MM-DD
  status?: 'Pending' | 'Resolved';
};

// 15. rewards
export type RewardLevel = 'Truong' | 'Quan' | 'Tinh' | 'QuocGia';
export type Reward = SoftDeleteEntity & {
  classId: string;
  studentId: string;
  termId?: string;
  title: string;
  level?: RewardLevel;
  date: string; // YYYY-MM-DD
  note?: string;
};

import type { GlobalAvatarSystemSettings } from '../types/avatar-theme.types';

// 16. settings
export type AppTheme = 'traditional' | 'lotus' | 'modern' | 'military' | 'ethnic' | 'regions';
export type UserSettings = {
  id: string; // 'default'
  theme: AppTheme;
  activeAcademicYearId?: string | null;
  activeClassId?: string | null;
  sidebarCollapsed: boolean;
  defaultStudentAvatarKey?: string | null;
  activeAvatarThemeId?: string | null;
  avatarProgressionEnabled?: boolean;
  avatarLevelThresholds?: Array<{ level: 1 | 2 | 3 | 4 | 5; minPoints: number }>;
  avatarProgressionPolicy?: 'HIGHEST_UNLOCKED' | 'CURRENT_SCORE';
  avatarSettingsRevision?: number;
  avatarSystemSettings?: GlobalAvatarSystemSettings;
  createdAt: string;
  updatedAt: string;
};

// 17. auditLogs
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'BACKUP' | 'RESTORE_DB' | 'IMPORT_EXCEL' | 'REVERSE';
export type AuditLog = {
  id: string;
  entityName: string;
  recordId: string;
  action: AuditAction;
  timestamp: string; // ISO UTC
  details?: string;
};

// 18. backupHistory
export type BackupStatus = 'Success' | 'Failed';
export type BackupHistory = {
  id: string;
  filename: string;
  fileSize: number;
  recordCount: number;
  status: BackupStatus;
  createdAt: string; // ISO UTC
};

// 19. liveClassSessions
export type MeetingPlatform = 'meet' | 'zoom' | 'teams' | 'other' | 'none';
export type LiveClassSessionStatus = 'draft' | 'active' | 'paused' | 'completed';

export type LiveClassSession = {
  id: string;
  classId: string;
  termId?: string | null;
  title: string;
  subject: string;
  sessionDate: string; // YYYY-MM-DD
  meetingPlatform: MeetingPlatform;
  meetingUrl?: string | null;
  status: LiveClassSessionStatus;
  startedAt?: string | null; // ISO UTC
  pausedAt?: string | null; // ISO UTC
  totalPausedMilliseconds: number;
  endedAt?: string | null; // ISO UTC
  presentationTheme?: string | null;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 20. liveClassParticipants
export type LiveAttendanceStatus = 'unchecked' | 'present' | 'late' | 'absent' | 'left';

export type LiveClassParticipant = {
  id: string;
  sessionId: string;
  studentId: string;
  attendanceStatus: LiveAttendanceStatus;
  participationCount: number;
  randomSelectionCount: number;
  handRaised: boolean;
  handRaisedAt?: string | null; // ISO UTC
  quickNote?: string | null;
  joinedAt?: string | null; // ISO UTC
  leftAt?: string | null; // ISO UTC
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 21. liveClassGroups
export type LiveClassGroup = {
  id: string;
  sessionId: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  sortOrder: number;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 22. liveClassGroupMembers
export type LiveClassGroupMember = {
  id: string;
  groupId: string;
  studentId: string;
  createdAt: string; // ISO UTC
};

// 23. liveClassEvents
export type LiveClassEventType =
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'student_selected'
  | 'participation_added'
  | 'hand_raised'
  | 'hand_lowered'
  | 'attendance_changed'
  | 'individual_point'
  | 'individual_point_reversed'
  | 'participation_reversed'
  | 'batch_points_awarded'
  | 'attendance_synced_to_main_book'
  | 'group_point'
  | 'timer_started'
  | 'timer_completed'
  | 'poll_started'
  | 'poll_completed'
  | 'called_student_answered'
  | 'called_student_needs_support'
  | 'called_student_skipped'
  | 'called_student_reopened'
  | 'called_student_removed_from_queue'
  | 'called_queue_reset';

export type LiveClassEvent = {
  id: string;
  sessionId: string;
  studentId?: string | null;
  groupId?: string | null;
  eventType: LiveClassEventType;
  value?: string | number | boolean | null;
  metadata?: Record<string, unknown> | null;
  reversedEventId?: string | null;
  createdAt: string; // ISO UTC
};

// 24. rankSystems
export type RankCalculationScope = 'academic_year' | 'term' | 'all_time';
export type RankMode = 'achievement' | 'dynamic';
export type PromotionCelebrationMode = 'AUTOMATIC' | 'MANUAL' | 'OFF';

export type RankSystem = SoftDeleteEntity & {
  name: string;
  academicYearId: string;
  termId?: string | null;
  calculationScope: RankCalculationScope;
  rankMode: RankMode;
  celebrationEnabled: boolean;
  presentationCelebrationEnabled: boolean;
  promotionCelebrationMode?: PromotionCelebrationMode;
  promotionSoundEnabled?: boolean;
  promotionShowPoints?: boolean;
  promotionShowPreviousRank?: boolean;
  promotionDurationMs?: number;
  promotionConfettiEnabled?: boolean;
  isActive: boolean;
};

// 25. rankSystemClasses
export type RankSystemClass = {
  id: string;
  rankSystemId: string;
  classId: string;
  createdAt: string; // ISO UTC
};

// 26. rankLevels
export type RankGroup = 'Hạ sĩ quan và Binh sĩ' | 'Cấp Úy' | 'Cấp Tá' | 'Cấp Tướng';

export type RankLevel = SoftDeleteEntity & {
  rankSystemId: string;
  level: number; // 1 to 17
  code: string;
  name: string;
  group: RankGroup;
  minPoints: number;
  colorToken: string;
  badgeKey: string;
  description: string;
};

// 27. studentRankHistory
export type RankChangeType = 'promotion' | 'demotion' | 'recalculated';

export type StudentRankHistory = {
  id: string;
  rankSystemId: string;
  classId: string;
  studentId: string;
  fromLevel?: number | null;
  toLevel: number;
  pointsBefore: number;
  pointsAfter: number;
  changeType: RankChangeType;
  sourcePointEntryId?: string | null;
  reason?: string | null;
  createdAt: string; // ISO UTC
};

// 28. honorTitles
export type HonorTitleCalculationType =
  | 'top_rank'
  | 'rank_progress'
  | 'point_growth'
  | 'attendance'
  | 'participation'
  | 'manual'
  | 'self_progress';

export type HonorTitle = SoftDeleteEntity & {
  code: string;
  name: string;
  description: string;
  calculationType: HonorTitleCalculationType;
  iconKey: string;
  badgeKey: string;
  colorToken: string;
  maxRecipients: number;
  isActive: boolean;
  sortOrder: number;
};

// 29. honorBoards
export type HonorBoardPeriodType = 'week' | 'month' | 'term' | 'custom';
export type HonorBoardStatus = 'draft' | 'published' | 'archived';

export type HonorBoard = SoftDeleteEntity & {
  classId: string;
  academicYearId: string;
  termId?: string | null;
  title: string;
  periodType: HonorBoardPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: HonorBoardStatus;
  showPointValues: boolean;
  showRankProgress: boolean;
  generatedAt: string; // ISO UTC
  publishedAt?: string | null; // ISO UTC
};

// 30. honorRecipients
export type HonorRecipientSelectionType = 'automatic' | 'manual';

export type HonorRecipient = {
  id: string;
  boardId: string;
  titleId: string;
  studentId: string;
  position?: number | null; // 1, 2, 3 cho bục vinh danh
  selectionType: HonorRecipientSelectionType;
  metricValue?: number | null;
  reason: string;
  rankLevelAtAward: number;
  rankNameAtAward: string;
  pointsAtAward?: number | null;
  titleNameAtAward: string;
  badgeKeyAtAward: string;
  isApproved: boolean;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 31. gifts (FEAT-GIFT-001)
export type GiftStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type GiftInventoryMode = 'TRACKED' | 'UNLIMITED';
export type GiftCategory = 'STATIONERY' | 'BOOK' | 'TOY' | 'PRIVILEGE' | 'SNACK' | 'OTHER';

export type Gift = SoftDeleteEntity & {
  name: string;
  normalizedName: string;
  description?: string;
  category: GiftCategory;
  pointCost: number; // Integer > 0
  status: GiftStatus;
  inventoryMode: GiftInventoryMode;
  stockOnHand?: number; // Integer >= 0 when TRACKED
  lowStockThreshold?: number; // Integer >= 0
  displayOrder: number;
  presentationVisible: boolean;
  icon?: string; // Lucide icon name or emoji
  imageRef?: string; // Optional legacy image or data URL fallback
  imageId?: string; // Reference to giftImages table (FEAT-GIFT-003)
  imageVersion?: number; // Version counter for cache invalidation
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 32. giftImages (FEAT-GIFT-003)
export type GiftImage = {
  id: string; // Primary key UUID
  giftId: string; // Foreign key to gifts.id (unique index)
  fullBlob: Blob; // Full size processed image blob (<= 1200px)
  fullMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fullWidth: number;
  fullHeight: number;
  fullSizeBytes: number;
  thumbnailBlob: Blob; // Lightweight thumbnail blob (<= 320px)
  thumbnailMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailSizeBytes: number;
  contentHash?: string; // SHA-256 hash for integrity/dedup
  version: number; // Incrementing integer
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 32. giftRedemptions (FEAT-GIFT-001)
export type GiftRedemptionStatus = 'COMPLETED' | 'CANCELLED';

export type GiftRedemption = SoftDeleteEntity & {
  studentId: string;
  classId: string;
  enrollmentId?: string;
  academicYearId?: string;
  termId?: string;
  status: GiftRedemptionStatus;
  totalPoints: number; // Total points deducted
  itemCount: number; // Total quantity of items
  idempotencyKey: string; // Unique submission guard
  note?: string;
  redeemedAt: string; // YYYY-MM-DD or ISO
  cancelledAt?: string | null;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 33. giftRedemptionItems (FEAT-GIFT-001)
export type GiftRedemptionItem = SoftDeleteEntity & {
  redemptionId: string;
  giftId: string;
  giftNameSnapshot: string;
  giftIconSnapshot?: string;
  giftCategorySnapshot?: GiftCategory;
  unitPointCostSnapshot: number;
  quantity: number; // Integer > 0
  lineTotalPoints: number; // unitPointCostSnapshot * quantity
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 34. giftStockMovements (FEAT-GIFT-001)
export type StockMovementType =
  | 'INITIAL'
  | 'RESTOCK'
  | 'MANUAL_ADJUSTMENT'
  | 'REDEMPTION'
  | 'REDEMPTION_CANCEL';

export interface StudentRewardBalance {
  studentId: string;
  classId: string;
  achievementScore: number;
  spentPoints: number;
  refundedPoints: number;
  redeemableBalance: number;
  completedRedemptionCount: number;
}

export type GiftStockMovement = {
  id: string;
  giftId: string;
  type: StockMovementType;
  quantityDelta: number; // Positive for additions/refunds, negative for deductions
  stockBefore?: number;
  stockAfter?: number;
  redemptionId?: string;
  reason?: string;
  occurredAt: string; // ISO UTC
  createdAt: string; // ISO UTC
};

// 35. rankPromotionEvents (FEAT-RANK-001)
export type PromotionEventStatus = 'PENDING' | 'PRESENTED' | 'SKIPPED';

export type RankPromotionEvent = {
  id: string; // Primary key UUID
  classId: string;
  studentId: string;
  liveSessionId?: string | null;
  sourcePointEntryId?: string | null;
  fromLevel: number;
  toLevel: number;
  fromRankName: string;
  toRankName: string;
  levelsGained: number;
  pointsBefore: number;
  pointsAfter: number;
  status: PromotionEventStatus;
  createdAt: string; // ISO UTC
  presentedAt?: string | null;
  skippedAt?: string | null;
  skipReason?: string | null;
  updatedAt: string; // ISO UTC
};

// 36. avatarAssets (FEAT-AVATAR-001 & FEAT-AVATAR-004)
export type AvatarAsset = {
  id: string; // Primary key UUID
  blob: Blob;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  sizeBytes: number;
  targetLevel?: number;
  originalFileName?: string;
  contentHash?: string;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
};

// 37. levelUpCelebrationEvents (FEAT-AVATAR-004 Level-Up Celebration in 5-Level Avatar System)
export type LevelUpCelebrationEvent = {
  id: string; // Primary key UUID
  dedupeKey: string; // sourcePointTransactionId + studentId (+ toLevelId)
  studentId: string;
  classId: string;
  liveSessionId?: string | null;
  sourcePointTransactionId: string;
  previousScore: number;
  currentScore: number;
  fromLevelId: 1 | 2 | 3 | 4 | 5;
  toLevelId: 1 | 2 | 3 | 4 | 5;
  levelsGained: number;
  fromLevel: {
    levelId: 1 | 2 | 3 | 4 | 5;
    levelName: string;
    levelShortLabel: string;
    levelDescription?: string;
    avatarAssetId?: string;
    avatarAssetKey?: string;
    avatarAssetUrl?: string;
    cardBaseColor: string;
  };
  toLevel: {
    levelId: 1 | 2 | 3 | 4 | 5;
    levelName: string;
    levelShortLabel: string;
    levelDescription?: string;
    avatarAssetId?: string;
    avatarAssetKey?: string;
    avatarAssetUrl?: string;
    cardBaseColor: string;
  };
  settingsRevision: number;
  status: 'PENDING' | 'PRESENTING' | 'PRESENTED' | 'SKIPPED' | 'EXPIRED' | 'FAILED';
  createdAt: string; // ISO UTC
  presentingAt?: string | null;
  presentedAt?: string | null;
  skippedAt?: string | null;
  skipReason?: string | null;
  commandId?: string | null;
  updatedAt: string; // ISO UTC
};



