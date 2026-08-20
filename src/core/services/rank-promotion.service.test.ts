import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { rankRepository } from '../repositories/rank.repository';
import { rankIntegrationService } from './rank-integration.service';
import { rankPromotionRepository } from '../repositories/rank-promotion.repository';
import type { RankSystem, RankLevel, Student, PointCategory } from '../database/types';

describe('Rank Promotion Detection & Multi-level Jump (FEAT-RANK-001)', () => {
  const classId = 'class-demo-1';
  const academicYearId = 'year-1';
  const rankSystemId = 'system-1';

  beforeEach(async () => {
    await db.rankSystems.clear();
    await db.rankSystemClasses.clear();
    await db.rankLevels.clear();
    await db.studentRankHistory.clear();
    await db.rankPromotionEvents.clear();
    await db.pointEntries.clear();
    await db.pointCategories.clear();
    await db.students.clear();

    // 1. Create Rank System
    const system: RankSystem = {
      id: rankSystemId,
      name: 'Thi đua Quân hàm',
      academicYearId,
      calculationScope: 'all_time',
      rankMode: 'achievement',
      celebrationEnabled: true,
      presentationCelebrationEnabled: true,
      promotionCelebrationMode: 'MANUAL',
      promotionSoundEnabled: false,
      promotionShowPreviousRank: true,
      promotionConfettiEnabled: true,
      promotionDurationMs: 4500,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.rankSystems.add(system);
    await rankRepository.assignClassToRankSystem(rankSystemId, classId);

    // 2. Create 5 Rank Levels (Level 1: 0, Level 2: 30, Level 3: 60, Level 4: 100...)
    const levels: Partial<RankLevel>[] = [
      { level: 1, name: 'Binh nhì', minPoints: 0, group: 'Hạ sĩ quan và Binh sĩ', code: 'E1', colorToken: 'gray', badgeKey: 'binh_nhi', description: '' },
      { level: 2, name: 'Binh nhất', minPoints: 30, group: 'Hạ sĩ quan và Binh sĩ', code: 'E2', colorToken: 'blue', badgeKey: 'binh_nhat', description: '' },
      { level: 3, name: 'Hạ sĩ', minPoints: 60, group: 'Hạ sĩ quan và Binh sĩ', code: 'E3', colorToken: 'green', badgeKey: 'ha_si', description: '' },
      { level: 4, name: 'Trung sĩ', minPoints: 100, group: 'Hạ sĩ quan và Binh sĩ', code: 'E4', colorToken: 'amber', badgeKey: 'trung_si', description: '' },
      { level: 5, name: 'Thượng sĩ', minPoints: 150, group: 'Hạ sĩ quan và Binh sĩ', code: 'E5', colorToken: 'red', badgeKey: 'thuong_si', description: '' },
    ];

    for (const lvl of levels) {
      await db.rankLevels.add({
        id: `lvl-${lvl.level}`,
        rankSystemId,
        level: lvl.level!,
        name: lvl.name!,
        minPoints: lvl.minPoints!,
        group: lvl.group!,
        code: lvl.code!,
        colorToken: lvl.colorToken!,
        badgeKey: lvl.badgeKey!,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Create Point Category
    const cat: PointCategory = {
      id: 'cat-1',
      name: 'Phát biểu tốt',
      type: 'Merit',
      defaultPoints: 10,
      countsTowardRank: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.pointCategories.add(cat);

    // 4. Create Students
    const student1: Student = {
      id: 'student-1',
      fullName: 'Nguyễn Văn An',
      normalizedName: 'nguyen van an',
      studentCode: 'HS001',
      gender: 'Nam',
      dateOfBirth: '2015-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.students.add(student1);
  });

  it('1. Should detect 1-level promotion when points reach threshold', async () => {
    // Add 35 points (reaches Level 2 Binh nhất)
    await db.pointEntries.add({
      id: 'pt-1',
      classId,
      studentId: 'student-1',
      categoryId: 'cat-1',
      points: 35,
      reason: 'Phát biểu tích cực',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const results = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: ['student-1'],
      sourcePointEntryId: 'pt-1',
      liveSessionId: 'sess-1',
    });

    expect(results.length).toBe(1);
    expect(results[0]!.changeType).toBe('promotion');
    expect(results[0]!.previousLevel).toBe(1);
    expect(results[0]!.newLevel).toBe(2);
    expect(results[0]!.levelsCrossed).toBe(1);
    expect(results[0]!.promotionEvent).toBeDefined();
    expect(results[0]!.promotionEvent?.toRankName).toBe('Binh nhất');
    expect(results[0]!.promotionEvent?.status).toBe('PENDING');

    const pendingInDb = await rankPromotionRepository.findPendingBySession('sess-1');
    expect(pendingInDb.length).toBe(1);
    expect(pendingInDb[0]!.levelsGained).toBe(1);
  });

  it('2. Should detect multi-level jump (e.g. +3 levels from 0 to 110 points)', async () => {
    // Add 110 points in one go (skips Level 2 and Level 3, jumps to Level 4 Trung sĩ)
    await db.pointEntries.add({
      id: 'pt-large',
      classId,
      studentId: 'student-1',
      categoryId: 'cat-1',
      points: 110,
      reason: 'Đạt giải nhất hội thao',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const results = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: ['student-1'],
      sourcePointEntryId: 'pt-large',
      liveSessionId: 'sess-1',
    });

    expect(results.length).toBe(1);
    expect(results[0]!.changeType).toBe('promotion');
    expect(results[0]!.previousLevel).toBe(1);
    expect(results[0]!.newLevel).toBe(4);
    expect(results[0]!.levelsCrossed).toBe(3);
    expect(results[0]!.promotionEvent?.fromRankName).toBe('Binh nhì');
    expect(results[0]!.promotionEvent?.toRankName).toBe('Trung sĩ');
    expect(results[0]!.promotionEvent?.levelsGained).toBe(3);
  });

  it('3. Should be idempotent when called multiple times with same sourcePointEntryId', async () => {
    await db.pointEntries.add({
      id: 'pt-repeat',
      classId,
      studentId: 'student-1',
      categoryId: 'cat-1',
      points: 40,
      reason: 'Phát biểu',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Call 1st time
    const res1 = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: ['student-1'],
      sourcePointEntryId: 'pt-repeat',
      liveSessionId: 'sess-1',
    });
    expect(res1[0]!.changeType).toBe('promotion');

    // Call 2nd time with same point entry id (e.g. retry / double click)
    const res2 = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: ['student-1'],
      sourcePointEntryId: 'pt-repeat',
      liveSessionId: 'sess-1',
    });

    // Should return existing event without creating duplicate in DB
    expect(res2[0]!.promotionEvent?.id).toBe(res1[0]!.promotionEvent?.id);

    const allEvents = await db.rankPromotionEvents.toArray();
    expect(allEvents.length).toBe(1);
  });

  it('4. In Achievement Mode, reducing points does not create demotion or promotion event', async () => {
    // Initial: 40 points -> Level 2
    await db.pointEntries.add({
      id: 'pt-1',
      classId,
      studentId: 'student-1',
      categoryId: 'cat-1',
      points: 40,
      reason: 'Điểm ban đầu',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: ['student-1'],
      sourcePointEntryId: 'pt-1',
    });

    // Deduct: -20 points (total remaining 20 points, which is < 30)
    await db.pointEntries.add({
      id: 'pt-deduct',
      classId,
      studentId: 'student-1',
      categoryId: 'cat-1',
      points: -20,
      reason: 'Trừ điểm vi phạm',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const resDeduct = await rankIntegrationService.processPointEntryChange({
      classId,
      studentIds: ['student-1'],
      sourcePointEntryId: 'pt-deduct',
    });

    expect(resDeduct[0]!.changeType).toBe('no_change');
    expect(resDeduct[0]!.promotionEvent).toBeNull();
  });
});
