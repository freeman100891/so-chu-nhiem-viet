import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/database/db';
import type { RankPromotionEvent, RankSystem, PromotionCelebrationMode } from '../../../core/database/types';
import { rankPromotionRepository } from '../../../core/repositories/rank-promotion.repository';
import { rankRepository } from '../../../core/repositories/rank.repository';
import {
  liveBroadcastService,
  type PromotionBroadcastPayload,
  type BroadcastMessageType,
} from '../../../core/services/live-classroom/live-broadcast';
import { generateUUID } from '../../../shared/utilities/uuid';

export interface PromotionCelebrationSettings {
  mode: PromotionCelebrationMode;
  soundEnabled: boolean;
  showPoints: boolean;
  showPreviousRank: boolean;
  confettiEnabled: boolean;
  durationMs: number;
}

export interface UsePromotionQueueProps {
  sessionId?: string;
  classId?: string;
}

export function usePromotionQueue({ sessionId, classId }: UsePromotionQueueProps) {
  // 1. Reactive Live Query for Active Rank System
  const liveSystem = useLiveQuery(
    async () => {
      if (!classId) return null;
      return await rankRepository.findRankSystemForClass(classId);
    },
    [classId],
    null
  );

  // 2. Reactive Live Query for Pending Promotion Events in IndexedDB
  const livePendingEvents = useLiveQuery(
    async () => {
      if (!classId) return [];
      if (sessionId) {
        return await rankPromotionRepository.findPendingBySession(sessionId);
      }
      return await rankPromotionRepository.findPendingByClass(classId);
    },
    [sessionId, classId],
    []
  );

  // Fallback / manual refresh state to ensure immediate UI reconciliation
  const [fallbackEvents, setFallbackEvents] = useState<RankPromotionEvent[]>([]);
  const [activeSystem, setActiveSystem] = useState<RankSystem | null>(null);

  const [settings, setSettings] = useState<PromotionCelebrationSettings>({
    mode: 'MANUAL',
    soundEnabled: false,
    showPoints: false,
    showPreviousRank: true,
    confettiEnabled: true,
    durationMs: 4500,
  });

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentBroadcastingId, setCurrentBroadcastingId] = useState<string | null>(null);

  // Auto-play lock ref to prevent parallel overlapping celebration triggers
  const autoPlayLockRef = useRef(false);

  // Sync settings when liveSystem updates
  useEffect(() => {
    if (liveSystem) {
      setActiveSystem(liveSystem);
      setSettings({
        mode: liveSystem.promotionCelebrationMode || 'MANUAL',
        soundEnabled: liveSystem.promotionSoundEnabled === true,
        showPoints: liveSystem.promotionShowPoints === true,
        showPreviousRank: liveSystem.promotionShowPreviousRank !== false,
        confettiEnabled: liveSystem.promotionConfettiEnabled !== false,
        durationMs: liveSystem.promotionDurationMs || 4500,
      });
    }
  }, [liveSystem]);

  // Combined reactive pending events (deduplicated by ID)
  const pendingEvents = useMemo(() => {
    const sourceList = livePendingEvents && livePendingEvents.length > 0 ? livePendingEvents : fallbackEvents;
    const seen = new Set<string>();
    const deduplicated: RankPromotionEvent[] = [];

    for (const evt of sourceList) {
      if (!seen.has(evt.id) && evt.status === 'PENDING') {
        seen.add(evt.id);
        deduplicated.push(evt);
      }
    }
    return deduplicated;
  }, [livePendingEvents, fallbackEvents]);

  // Explicit queue refresh (used on mount, ACK, or post-mutation)
  const loadQueue = useCallback(async () => {
    if (!classId) return;

    try {
      const system = await rankRepository.findRankSystemForClass(classId);
      if (system) {
        setActiveSystem(system);
        setSettings({
          mode: system.promotionCelebrationMode || 'MANUAL',
          soundEnabled: system.promotionSoundEnabled === true,
          showPoints: system.promotionShowPoints === true,
          showPreviousRank: system.promotionShowPreviousRank !== false,
          confettiEnabled: system.promotionConfettiEnabled !== false,
          durationMs: system.promotionDurationMs || 4500,
        });
      }

      let events: RankPromotionEvent[] = [];
      if (sessionId) {
        events = await rankPromotionRepository.findPendingBySession(sessionId);
      } else {
        events = await rankPromotionRepository.findPendingByClass(classId);
      }

      setFallbackEvents(events);
    } catch (err) {
      console.error('Failed to load promotion queue:', err);
    }
  }, [sessionId, classId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Broadcast ACK and Channel Sync
  useEffect(() => {
    const unsubscribe = liveBroadcastService.onMessage((msg: BroadcastMessageType) => {
      if (msg.type === 'PROMOTION_ACK') {
        if (msg.payload.state === 'PRESENTED' || msg.payload.state === 'DISMISSED') {
          setIsBroadcasting(false);
          setCurrentBroadcastingId(null);
          loadQueue();
        }
      }
    });

    return unsubscribe;
  }, [loadQueue]);

  /**
   * Trình chiếu sự kiện thăng hạng
   */
  const showEvent = useCallback(
    async (event: RankPromotionEvent) => {
      if (!classId) return;

      try {
        setIsBroadcasting(true);
        setCurrentBroadcastingId(event.id);

        const student = await db.students.get(event.studentId);
        if (!student || student.deletedAt) {
          // Student deleted or invalid -> skip locally
          await rankPromotionRepository.markSkipped(event.id, 'Học sinh không tồn tại');
          await loadQueue();
          setIsBroadcasting(false);
          return;
        }

        // Privacy Check: If student is marked not presentation-visible, mark presented without public broadcast
        const isPresentationVisible = (student as any).presentationVisible !== false;
        if (!isPresentationVisible) {
          await rankPromotionRepository.markPresented(event.id);
          await loadQueue();
          setIsBroadcasting(false);
          return;
        }

        const commandId = generateUUID();
        const payload: PromotionBroadcastPayload = {
          protocolVersion: 1,
          commandId,
          eventId: event.id,
          classId,
          liveSessionId: sessionId || null,
          studentId: student.id,
          studentName: student.fullName,
          avatar: student.avatar || null,
          fromLevel: event.fromLevel,
          toLevel: event.toLevel,
          fromRankName: event.fromRankName,
          toRankName: event.toRankName,
          levelsGained: event.levelsGained,
          showPreviousRank: settings.showPreviousRank,
          showPoints: settings.showPoints,
          soundEnabled: settings.soundEnabled,
          confettiEnabled: settings.confettiEnabled,
          durationMs: settings.durationMs,
        };

        // Post broadcast message
        liveBroadcastService.postMessage({
          type: 'PROMOTION_SHOW',
          payload,
        });

        // Mark as PRESENTED in database
        await rankPromotionRepository.markPresented(event.id);

        // Audit Log
        await db.auditLogs.add({
          id: generateUUID(),
          entityName: 'RankPromotionEvent',
          recordId: event.id,
          action: 'UPDATE',
          timestamp: new Date().toISOString(),
          details: `Trình chiếu chúc mừng thăng hạng cho ${student.fullName}: ${event.fromRankName} ➔ ${event.toRankName}`,
        });

        // Refresh local fallback state immediately
        await loadQueue();

        // Set safety timer to unlock broadcasting if presentation ACK is missed
        setTimeout(() => {
          setIsBroadcasting(false);
          setCurrentBroadcastingId(null);
          loadQueue();
        }, (settings.durationMs || 4500) + 1000);
      } catch (err) {
        console.error('Failed to show promotion event:', err);
        setIsBroadcasting(false);
        setCurrentBroadcastingId(null);
      }
    },
    [classId, sessionId, settings, loadQueue]
  );

  /**
   * Bỏ qua sự kiện hiện tại
   */
  const skipEvent = useCallback(
    async (event: RankPromotionEvent, reason = 'Giáo viên bỏ qua') => {
      try {
        await rankPromotionRepository.markSkipped(event.id, reason);

        // If currently broadcasting this event, send dismiss command
        if (currentBroadcastingId === event.id) {
          liveBroadcastService.postMessage({
            type: 'PROMOTION_DISMISS',
            payload: {
              protocolVersion: 1,
              commandId: generateUUID(),
              eventId: event.id,
              classId,
              liveSessionId: sessionId || null,
            },
          });
          setIsBroadcasting(false);
          setCurrentBroadcastingId(null);
        }

        await loadQueue();
      } catch (err) {
        console.error('Failed to skip promotion event:', err);
      }
    },
    [classId, sessionId, currentBroadcastingId, loadQueue]
  );

  /**
   * Bỏ qua tất cả sự kiện đang chờ
   */
  const skipAllEvents = useCallback(
    async (reason = 'Bỏ qua tất cả') => {
      if (!sessionId) return;
      try {
        await rankPromotionRepository.skipAllPendingInSession(sessionId, reason);
        if (currentBroadcastingId) {
          liveBroadcastService.postMessage({
            type: 'PROMOTION_DISMISS',
            payload: {
              protocolVersion: 1,
              commandId: generateUUID(),
              eventId: currentBroadcastingId,
              classId,
              liveSessionId: sessionId,
            },
          });
          setIsBroadcasting(false);
          setCurrentBroadcastingId(null);
        }
        await loadQueue();
      } catch (err) {
        console.error('Failed to skip all promotion events:', err);
      }
    },
    [sessionId, classId, currentBroadcastingId, loadQueue]
  );

  /**
   * Trình chiếu lại một sự kiện đã diễn ra (Replay)
   */
  const replayEvent = useCallback(
    async (event: RankPromotionEvent) => {
      if (!classId) return;

      try {
        const student = await db.students.get(event.studentId);
        if (!student || student.deletedAt) return;

        const commandId = generateUUID();
        const payload: PromotionBroadcastPayload = {
          protocolVersion: 1,
          commandId,
          eventId: event.id,
          classId,
          liveSessionId: sessionId || null,
          studentId: student.id,
          studentName: student.fullName,
          avatar: student.avatar || null,
          fromLevel: event.fromLevel,
          toLevel: event.toLevel,
          fromRankName: event.fromRankName,
          toRankName: event.toRankName,
          levelsGained: event.levelsGained,
          showPreviousRank: settings.showPreviousRank,
          showPoints: settings.showPoints,
          soundEnabled: settings.soundEnabled,
          confettiEnabled: settings.confettiEnabled,
          durationMs: settings.durationMs,
        };

        liveBroadcastService.postMessage({
          type: 'PROMOTION_SHOW',
          payload,
        });

        // Audit Log Replay
        await db.auditLogs.add({
          id: generateUUID(),
          entityName: 'RankPromotionEvent',
          recordId: event.id,
          action: 'UPDATE',
          timestamp: new Date().toISOString(),
          details: `Trình chiếu lại (Replay) chúc mừng thăng hạng cho ${student.fullName}: ${event.toRankName}`,
        });
      } catch (err) {
        console.error('Failed to replay promotion event:', err);
      }
    },
    [classId, sessionId, settings]
  );

  /**
   * Cập nhật cài đặt chế độ chúc mừng
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<PromotionCelebrationSettings>) => {
      const sys = activeSystem || liveSystem || (classId ? await rankRepository.findRankSystemForClass(classId) : null);
      if (!sys) return;

      const merged = { ...settings, ...newSettings };
      setSettings(merged);

      try {
        await db.rankSystems.update(sys.id, {
          promotionCelebrationMode: merged.mode,
          promotionSoundEnabled: merged.soundEnabled,
          promotionShowPoints: merged.showPoints,
          promotionShowPreviousRank: merged.showPreviousRank,
          promotionConfettiEnabled: merged.confettiEnabled,
          promotionDurationMs: merged.durationMs,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to update promotion settings:', err);
      }
    },
    [activeSystem, liveSystem, classId, settings]
  );

  // Automatic Mode Runner: Auto-play next event in queue if mode === 'AUTOMATIC'
  useEffect(() => {
    if (settings.mode !== 'AUTOMATIC') return;
    if (pendingEvents.length === 0 || isBroadcasting || autoPlayLockRef.current) return;

    const nextEvt = pendingEvents[0];
    if (!nextEvt) return;

    autoPlayLockRef.current = true;
    const timer = setTimeout(async () => {
      await showEvent(nextEvt);
      autoPlayLockRef.current = false;
    }, 600);

    return () => {
      clearTimeout(timer);
      autoPlayLockRef.current = false;
    };
  }, [settings.mode, pendingEvents, isBroadcasting, showEvent]);

  return {
    pendingEvents,
    currentEvent: pendingEvents[0] || null,
    pendingCount: pendingEvents.length,
    isBroadcasting,
    settings,
    showEvent,
    skipEvent,
    skipAllEvents,
    replayEvent,
    updateSettings,
    refreshQueue: loadQueue,
  };
}
