import { z } from 'zod';

export const BackupManifestSchema = z.object({
  appName: z.string().default('Sổ Chủ Nhiệm Việt Offline'),
  appVersion: z.string().default('1.0.0'),
  schemaVersion: z.number().int().default(1),
  createdAt: z.string(),
  isEncrypted: z.boolean().default(false),
  tables: z.array(z.string()).optional().default([]),
  counts: z.record(z.number().int()).optional().default({}),
  teacherName: z.string().optional(),
  academicYearName: z.string().optional(),
  classCount: z.number().int().optional(),
  studentCount: z.number().int().optional(),
}).passthrough();

export const BackupFileContentSchema = z.object({
  manifest: BackupManifestSchema,
  data: z.record(z.array(z.record(z.any()))),
  checksum: z.string().min(10, 'Checksum SHA-256 không hợp lệ'),
}).passthrough();

