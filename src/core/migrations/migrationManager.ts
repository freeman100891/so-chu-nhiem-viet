import { db } from '../database/db';

export interface MigrationStep {
  version: number;
  description: string;
  up: () => Promise<void>;
}

export class MigrationManager {
  private migrations: MigrationStep[] = [
    {
      version: 1,
      description: 'Khởi tạo Schema v1 đầy đủ 18 bảng cho Sổ Chủ Nhiệm Việt Offline',
      up: async () => {
        // Version 1 initialized automatically by Dexie stores()
      },
    },
  ];

  async runMigrations(): Promise<void> {
    const currentVersion = db.verno;
    for (const step of this.migrations) {
      if (step.version > currentVersion) {
        console.log(`Running migration version ${step.version}: ${step.description}`);
        await step.up();
      }
    }
  }
}

export const migrationManager = new MigrationManager();
