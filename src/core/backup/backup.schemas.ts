import { z } from 'zod';

export const BackupManifestSchema = z.object({
  appName: z.string().default('Sổ Chủ Nhiệm Việt Offline'),
  appVersion: z.string().default('1.0.0'),
  schemaVersion: z.number().int().default(1),
  createdAt: z.string(),
  isEncrypted: z.boolean().default(false),
  tables: z.array(z.string()),
  counts: z.record(z.number().int()),
});

export const BackupFileContentSchema = z.object({
  manifest: BackupManifestSchema,
  data: z.record(z.array(z.record(z.any()))),
  checksum: z.string().min(10, 'Checksum SHA-256 không hợp lệ'),
});
