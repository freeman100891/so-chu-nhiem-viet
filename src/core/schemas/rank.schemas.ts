import { z } from 'zod';

export const RankCalculationScopeSchema = z.enum(['academic_year', 'term', 'all_time']);
export const RankModeSchema = z.enum(['achievement', 'dynamic']);
export const RankGroupSchema = z.enum([
  'Hạ sĩ quan và Binh sĩ',
  'Cấp Úy',
  'Cấp Tá',
  'Cấp Tướng',
]);
export const RankChangeTypeSchema = z.enum(['promotion', 'demotion', 'recalculated']);

export const RankSystemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Tên hệ thống cấp bậc không được để trống'),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid().nullable().optional(),
  calculationScope: RankCalculationScopeSchema,
  rankMode: RankModeSchema,
  celebrationEnabled: z.boolean().default(true),
  presentationCelebrationEnabled: z.boolean().default(true),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export const RankLevelSchema = z.object({
  id: z.string().uuid(),
  rankSystemId: z.string().uuid(),
  level: z.number().int().min(1).max(17),
  code: z.string().min(1),
  name: z.string().min(1),
  group: RankGroupSchema,
  minPoints: z.number().int().min(0),
  colorToken: z.string(),
  badgeKey: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export const StudentRankHistorySchema = z.object({
  id: z.string().uuid(),
  rankSystemId: z.string().uuid(),
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  fromLevel: z.number().int().nullable().optional(),
  toLevel: z.number().int().min(1).max(17),
  pointsBefore: z.number(),
  pointsAfter: z.number(),
  changeType: RankChangeTypeSchema,
  sourcePointEntryId: z.string().uuid().nullable().optional(),
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
});
