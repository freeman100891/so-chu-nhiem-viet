import { db } from '../../database/db';
import type { LevelUpCelebrationEvent, Student } from '../../database/types';
import type {
  GlobalAvatarSystemSettings,
  LevelUpCelebrationSettings,
  DirectLevelChangeNotification,
} from '../../types/avatar-theme.types';
import { DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS } from '../../types/avatar-theme.types';
import {
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
  avatarThemeRegistry,
} from '../avatar-theme-registry';
import { avatarAssetService } from '../avatar-asset.service';
import { detectLevelTransition } from './level-transition-detector';
import { generateUUID } from '../../../shared/utilities/uuid';

import { settingsRepository } from '../../repositories/settings.repository';

export interface ProcessLevelUpTransitionInput {
  classId: string;
  studentId: string;
  liveSessionId?: string | null;
  sourcePointTransactionId: string;
  previousScore: number;
  currentScore: number;
  reason?: string;
}

export class LevelUpCelebrationService {
  /**
   * Đọc cấu hình chế độ chúc mừng thăng cấp từ hệ thống
   */
  async getSettings(): Promise<LevelUpCelebrationSettings> {
    try {
      const userSettings = await settingsRepository.getSettings();
      if (userSettings.avatarSystemSettings?.celebrationSettings) {
        return {
          ...DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS,
          ...userSettings.avatarSystemSettings.celebrationSettings,
        };
      }
    } catch (err) {
      console.warn('Lỗi đọc celebrationSettings, dùng cấu hình mặc định:', err);
    }
    return { ...DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS };
  }

  /**
   * Cập nhật cấu hình chế độ chúc mừng thăng cấp
   */
  async updateSettings(
    newSettings: Partial<LevelUpCelebrationSettings>
  ): Promise<LevelUpCelebrationSettings> {
    const current = await this.getSettings();
    const merged: LevelUpCelebrationSettings = {
      ...current,
      ...newSettings,
      revision: (current.revision || 1) + 1,
    };

    try {
      const userSettings = await settingsRepository.getSettings();
      const sysSettings: GlobalAvatarSystemSettings = userSettings.avatarSystemSettings || {
        ...DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
      };

      sysSettings.celebrationSettings = merged;
      sysSettings.updatedAt = new Date().toISOString();

      await settingsRepository.updateSettings({
        avatarSystemSettings: sysSettings,
      });
    } catch (err) {
      console.error('Lỗi lưu celebrationSettings:', err);
    }

    return merged;
  }

  /**
   * Đọc Global Avatar Settings đang active
   */
  private async getGlobalAvatarSettings(): Promise<GlobalAvatarSystemSettings> {
    try {
      const userSettings = await settingsRepository.getSettings();
      if (userSettings.avatarSystemSettings && userSettings.avatarSystemSettings.levels?.length === 5) {
        return userSettings.avatarSystemSettings;
      }
      if (userSettings.activeAvatarThemeId) {
        const presetLevels = avatarThemeRegistry.getPresetThemeLevelDefinitions(userSettings.activeAvatarThemeId);
        return {
          ...DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
          presetThemeId: userSettings.activeAvatarThemeId,
          levels: presetLevels as unknown as typeof DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS.levels,
        };
      }
    } catch (err) {
      console.warn('Lỗi đọc global-avatar-system-settings:', err);
    }
    return DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
  }

  /**
   * Tự động kiểm tra chuyển cấp 5 cấp độ và tạo LevelUpCelebrationEvent sau khi point transaction commit thành công.
   */
  async processPointEntryTransition(
    input: ProcessLevelUpTransitionInput
  ): Promise<LevelUpCelebrationEvent | null> {
    const {
      classId,
      studentId,
      liveSessionId,
      sourcePointTransactionId,
      previousScore,
      currentScore,
      reason,
    } = input;

    // 1. Kiểm tra celebration mode: nếu OFF thì không tạo celebration notification
    const celebrationSettings = await this.getSettings();
    if (!celebrationSettings.enabled || celebrationSettings.mode === 'OFF') {
      return null;
    }

    // 2. Lấy thông tin học sinh
    const student: Student | undefined = await db.students.get(studentId);
    if (!student || student.deletedAt) {
      return null;
    }

    // 3. Đọc Global Settings và nạp asset URLs cho ảnh tải lên
    const globalSettings = await this.getGlobalAvatarSettings();

    let uploadedAssetUrls: Map<string, string> | undefined;
    const uploadedIds: string[] = [];
    globalSettings.levels.forEach((l) => {
      if (l.image.kind === 'UPLOADED') {
        uploadedIds.push(l.image.assetId);
      }
    });
    if (globalSettings.savedCustomImagesByLevel) {
      Object.values(globalSettings.savedCustomImagesByLevel).forEach((imgRef) => {
        if (imgRef && imgRef.kind === 'UPLOADED') {
          uploadedIds.push(imgRef.assetId);
        }
      });
    }
    if (uploadedIds.length > 0) {
      try {
        uploadedAssetUrls = await avatarAssetService.preloadAssetUrls(uploadedIds);
      } catch (err) {
        console.warn('Lỗi tải URL ảnh tùy chỉnh của cấp độ:', err);
      }
    }

    // 4. Phát hiện chuyển cấp bằng Pure Detector (UP hoặc DOWN)
    const transition = detectLevelTransition({
      previousScore,
      currentScore,
      student,
      globalSettings,
      uploadedAssetUrls,
    });

    if (!transition) {
      return null;
    }

    // Kiểm tra toggle bật/tắt theo hướng
    if (transition.direction === 'UP' && celebrationSettings.showLevelUp === false) {
      return null;
    }
    if (transition.direction === 'DOWN' && celebrationSettings.showLevelDown === false) {
      return null;
    }

    // 5. Idempotency Guard (Khóa chống trùng lặp theo sourcePointTransactionId + studentId + toLevelId)
    const dedupeKey = `${sourcePointTransactionId}_${studentId}_${transition.toLevelId}`;
    const existing = await db.levelUpCelebrationEvents
      .where('dedupeKey')
      .equals(dedupeKey)
      .first();

    const nowISO = new Date().toISOString();

    // 6. Tạo bản ghi LevelUpCelebrationEvent (Audit Log)
    const event: LevelUpCelebrationEvent = existing || {
      id: generateUUID(),
      dedupeKey,
      studentId,
      classId,
      liveSessionId: liveSessionId || null,
      sourcePointTransactionId,
      previousScore,
      currentScore,
      fromLevelId: transition.fromLevelId,
      toLevelId: transition.toLevelId,
      levelsGained: transition.levelsGained,
      fromLevel: transition.fromLevel,
      toLevel: transition.toLevel,
      settingsRevision: transition.settingsRevision,
      status: 'PRESENTED',
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    if (!existing) {
      try {
        await db.runTransaction('rw', [db.levelUpCelebrationEvents, db.auditLogs], async () => {
          await db.levelUpCelebrationEvents.add(event);
          await db.auditLogs.add({
            id: generateUUID(),
            entityName: 'LevelUpCelebrationEvent',
            recordId: event.id,
            action: 'CREATE',
            timestamp: nowISO,
            details: `${transition.direction === 'UP' ? 'Thăng cấp' : 'Cập nhật giảm cấp'} Avatar cho ${student.fullName}: Cấp ${event.fromLevelId} (${event.fromLevel.levelName}) ➔ Cấp ${event.toLevelId} (${event.toLevel.levelName})${reason ? ` • Lý do: ${reason}` : ''}`,
          });
        });
      } catch (err) {
        console.warn('Lỗi ghi audit log LevelUpCelebrationEvent:', err);
      }
    }

    // 7. Tạo DirectLevelChangeNotification payload hoàn chỉnh
    const notification: DirectLevelChangeNotification = {
      notificationId: event.id,
      mutationId: sourcePointTransactionId,
      studentId,
      studentDisplayName: student.fullName,
      studentCode: student.studentCode,
      classId,
      liveSessionId: liveSessionId || null,
      direction: transition.direction,
      previousScore,
      currentScore,
      fromLevelId: transition.fromLevelId,
      toLevelId: transition.toLevelId,
      previousLevel: transition.fromLevel,
      currentLevel: transition.toLevel,
      levelsChanged: transition.levelsChanged,
      settingsRevision: transition.settingsRevision,
      createdAt: nowISO,
      preferredTarget:
        transition.direction === 'DOWN'
          ? (celebrationSettings.levelDownTarget === 'PRESENTATION_ALLOWED' ? 'PRESENTATION' : 'CONTROLLER')
          : 'PRESENTATION',
    };

    return Object.assign(event, { notification }) as LevelUpCelebrationEvent & { notification: DirectLevelChangeNotification };
  }

  /**
   * Lấy lịch sử sự kiện theo Session (cho audit log / analytics)
   */
  async findBySession(sessionId: string): Promise<LevelUpCelebrationEvent[]> {
    const events = await db.levelUpCelebrationEvents
      .where('liveSessionId')
      .equals(sessionId)
      .toArray();

    return events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Lấy lịch sử sự kiện theo Class (cho audit log / analytics)
   */
  async findByClass(classId: string): Promise<LevelUpCelebrationEvent[]> {
    const events = await db.levelUpCelebrationEvents
      .where('classId')
      .equals(classId)
      .toArray();

    return events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Lấy danh sách sự kiện PENDING / PRESENTING theo Session (Legacy support)
   */
  async findPendingBySession(sessionId: string): Promise<LevelUpCelebrationEvent[]> {
    const events = await db.levelUpCelebrationEvents
      .where('liveSessionId')
      .equals(sessionId)
      .toArray();

    return events
      .filter((e) => e.status === 'PENDING' || e.status === 'PRESENTING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Lấy danh sách sự kiện PENDING / PRESENTING theo Class (Legacy support)
   */
  async findPendingByClass(classId: string): Promise<LevelUpCelebrationEvent[]> {
    const events = await db.levelUpCelebrationEvents
      .where('classId')
      .equals(classId)
      .toArray();

    return events
      .filter((e) => e.status === 'PENDING' || e.status === 'PRESENTING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Chuyển trạng thái sự kiện sang PRESENTING
   */
  async markPresenting(eventId: string, commandId?: string): Promise<LevelUpCelebrationEvent | null> {
    const event = await db.levelUpCelebrationEvents.get(eventId);
    if (!event) return null;

    const nowISO = new Date().toISOString();
    await db.levelUpCelebrationEvents.update(eventId, {
      status: 'PRESENTING',
      presentingAt: nowISO,
      commandId: commandId || event.commandId || generateUUID(),
      updatedAt: nowISO,
    });

    return (await db.levelUpCelebrationEvents.get(eventId)) || null;
  }

  /**
   * Đánh dấu sự kiện đã trình chiếu xong hoàn tất (PRESENTED)
   */
  async markPresented(eventId: string): Promise<LevelUpCelebrationEvent | null> {
    const event = await db.levelUpCelebrationEvents.get(eventId);
    if (!event) return null;

    const nowISO = new Date().toISOString();
    await db.levelUpCelebrationEvents.update(eventId, {
      status: 'PRESENTED',
      presentedAt: nowISO,
      updatedAt: nowISO,
    });

    return (await db.levelUpCelebrationEvents.get(eventId)) || null;
  }

  /**
   * Bỏ qua sự kiện (SKIPPED)
   */
  async markSkipped(eventId: string, reason = 'Giáo viên bỏ qua'): Promise<LevelUpCelebrationEvent | null> {
    const event = await db.levelUpCelebrationEvents.get(eventId);
    if (!event) return null;

    const nowISO = new Date().toISOString();
    await db.levelUpCelebrationEvents.update(eventId, {
      status: 'SKIPPED',
      skippedAt: nowISO,
      skipReason: reason,
      updatedAt: nowISO,
    });

    return (await db.levelUpCelebrationEvents.get(eventId)) || null;
  }

  /**
   * Bỏ qua tất cả sự kiện đang chờ trong session
   */
  async skipAllPendingInSession(sessionId: string, reason = 'Bỏ qua tất cả'): Promise<number> {
    const pending = await this.findPendingBySession(sessionId);
    const nowISO = new Date().toISOString();

    for (const evt of pending) {
      await db.levelUpCelebrationEvents.update(evt.id, {
        status: 'SKIPPED',
        skippedAt: nowISO,
        skipReason: reason,
        updatedAt: nowISO,
      });
    }

    return pending.length;
  }
}

export const levelUpCelebrationService = new LevelUpCelebrationService();
