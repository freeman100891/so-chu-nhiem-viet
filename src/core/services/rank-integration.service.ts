import { db } from '../database/db';
import type { StudentRankHistory, RankPromotionEvent } from '../database/types';
import { rankRepository } from '../repositories/rank.repository';
import { rankHistoryRepository } from '../repositories/rank-history.repository';
import { rankPromotionRepository } from '../repositories/rank-promotion.repository';
import { rankCalculationService } from './rank-calculation.service';
import { generateUUID } from '../../shared/utilities/uuid';

export interface ProcessPointChangeEventInput {
  classId: string;
  studentIds: string[];
  sourcePointEntryId?: string | null;
  liveSessionId?: string | null;
  reason?: string | null;
}

export interface ProcessPointChangeResult {
  studentId: string;
  previousLevel: number;
  newLevel: number;
  levelsCrossed: number;
  changeType: 'promotion' | 'demotion' | 'no_change';
  historyRecord: StudentRankHistory | null;
  promotionEvent: RankPromotionEvent | null;
}

export class RankIntegrationService {
  /**
   * Tự động tính lại cấp bậc, ghi nhận lịch sử và tạo sự kiện thăng hạng sau khi điểm đã được lưu thành công.
   * Phương thức này CHỈ được gọi SAU KHI transaction ghi điểm hoàn tất 100%.
   */
  async processPointEntryChange(input: ProcessPointChangeEventInput): Promise<ProcessPointChangeResult[]> {
    const results: ProcessPointChangeResult[] = [];
    if (!input.studentIds || input.studentIds.length === 0) return results;

    const system = await rankRepository.findRankSystemForClass(input.classId);
    if (!system || !system.isActive) {
      // Không có hệ thống thi đua active -> không ghi lịch sử thăng/hạ cấp
      return results;
    }

    const rankLevels = await rankRepository.findRankLevels(system.id);
    const nowISO = new Date().toISOString();

    for (const studentId of input.studentIds) {
      // 1. Kiểm tra chống Double Submit / Double Click (Idempotency Guard)
      if (input.sourcePointEntryId) {
        const existingEvent = await rankPromotionRepository.findBySourcePointEntry(studentId, input.sourcePointEntryId);
        if (existingEvent) {
          // Đã tạo sự kiện thăng hạng cho pointEntry này trước đó
          results.push({
            studentId,
            previousLevel: existingEvent.fromLevel,
            newLevel: existingEvent.toLevel,
            levelsCrossed: 0,
            changeType: 'no_change',
            historyRecord: null,
            promotionEvent: existingEvent,
          });
          continue;
        }

        const duplicateHistory = await db.studentRankHistory
          .where('studentId')
          .equals(studentId)
          .filter((h) => h.sourcePointEntryId === input.sourcePointEntryId)
          .first();

        if (duplicateHistory) {
          results.push({
            studentId,
            previousLevel: duplicateHistory.fromLevel || duplicateHistory.toLevel,
            newLevel: duplicateHistory.toLevel,
            levelsCrossed: 0,
            changeType: 'no_change',
            historyRecord: duplicateHistory,
            promotionEvent: null,
          });
          continue;
        }
      }

      // 2. Lấy cấp bậc trước đó từ lịch sử hoặc mặc định cấp 1
      const latestHistory = await db.studentRankHistory
        .where('studentId')
        .equals(studentId)
        .filter((h) => h.rankSystemId === system.id)
        .toArray();

      let previousLevel = 1;
      if (latestHistory.length > 0) {
        latestHistory.sort((a, b) => {
          const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (diff !== 0) return diff;
          return b.id.localeCompare(a.id);
        });
        previousLevel = latestHistory[0]!.toLevel;
      }

      // 3. Tính toán lại cấp bậc thi đua hiện tại từ pointEntries
      const rankResult = await rankCalculationService.recalculateStudentRank(studentId, system.id);
      const newLevel = rankResult.currentLevel;

      let changeType: 'promotion' | 'demotion' | 'no_change' = 'no_change';
      let historyRecord: StudentRankHistory | null = null;
      let promotionEvent: RankPromotionEvent | null = null;
      const levelsCrossed = Math.abs(newLevel - previousLevel);

      if (newLevel > previousLevel) {
        // THĂNG CẤP (Promotion) - Vượt 1 hoặc nhiều cấp
        changeType = 'promotion';
        const fromRankObj = rankLevels.find((l) => l.level === previousLevel);
        const toRankObj = rankResult.currentRank;

        historyRecord = await rankHistoryRepository.addHistory({
          rankSystemId: system.id,
          classId: input.classId,
          studentId,
          fromLevel: previousLevel,
          toLevel: newLevel,
          pointsBefore: rankResult.effectivePoints,
          pointsAfter: rankResult.effectivePoints,
          changeType: 'promotion',
          sourcePointEntryId: input.sourcePointEntryId || null,
          reason: input.reason || `Thăng cấp thi đua (+${levelsCrossed} cấp)`,
        });

        // Tạo bản ghi RankPromotionEvent với trạng thái PENDING
        const eventRecord: RankPromotionEvent = {
          id: generateUUID(),
          classId: input.classId,
          studentId,
          liveSessionId: input.liveSessionId || null,
          sourcePointEntryId: input.sourcePointEntryId || null,
          fromLevel: previousLevel,
          toLevel: newLevel,
          fromRankName: fromRankObj?.name || `Cấp ${previousLevel}`,
          toRankName: toRankObj.name,
          levelsGained: levelsCrossed,
          pointsBefore: rankResult.effectivePoints,
          pointsAfter: rankResult.effectivePoints,
          status: 'PENDING',
          createdAt: nowISO,
          updatedAt: nowISO,
        };

        await rankPromotionRepository.create(eventRecord);
        promotionEvent = eventRecord;

        // Ghi Audit Log cho StudentRankHistory & RankPromotionEvent
        await db.auditLogs.add({
          id: generateUUID(),
          entityName: 'StudentRankHistory',
          recordId: historyRecord.id,
          action: 'CREATE',
          timestamp: nowISO,
          details: `Học sinh (${studentId}) thăng cấp thi đua: ${eventRecord.fromRankName} ➔ ${eventRecord.toRankName} (+${levelsCrossed} cấp)`,
        });

        await db.auditLogs.add({
          id: generateUUID(),
          entityName: 'RankPromotionEvent',
          recordId: eventRecord.id,
          action: 'CREATE',
          timestamp: nowISO,
          details: `Học sinh (${studentId}) thăng hạng thi đua: ${eventRecord.fromRankName} ➔ ${eventRecord.toRankName} (+${levelsCrossed} cấp)`,
        });
      } else if (newLevel < previousLevel) {
        // HẠ CẤP (Demotion)
        if (system.rankMode === 'achievement') {
          // Achievement Mode: Không tự động hạ cấp! Giữ nguyên cấp cao nhất đã đạt được.
          changeType = 'no_change';
        } else if (system.rankMode === 'dynamic') {
          // Dynamic Mode: Cho phép hạ cấp khi điểm giảm qua ngưỡng
          changeType = 'demotion';
          historyRecord = await rankHistoryRepository.addHistory({
            rankSystemId: system.id,
            classId: input.classId,
            studentId,
            fromLevel: previousLevel,
            toLevel: newLevel,
            pointsBefore: rankResult.effectivePoints,
            pointsAfter: rankResult.effectivePoints,
            changeType: 'demotion',
            sourcePointEntryId: input.sourcePointEntryId || null,
            reason: input.reason || `Hạ cấp thi đua (Điểm giảm qua ngưỡng)`,
          });

          await db.auditLogs.add({
            id: generateUUID(),
            entityName: 'StudentRankHistory',
            recordId: historyRecord.id,
            action: 'CREATE',
            timestamp: nowISO,
            details: `Học sinh (${studentId}) hạ cấp thi đua [Dynamic Mode]: Cấp ${previousLevel} ➔ Cấp ${newLevel} (${rankResult.currentRank.name})`,
          });
        }
      }

      results.push({
        studentId,
        previousLevel,
        newLevel,
        levelsCrossed,
        changeType,
        historyRecord,
        promotionEvent,
      });
    }

    return results;
  }
}

export const rankIntegrationService = new RankIntegrationService();
