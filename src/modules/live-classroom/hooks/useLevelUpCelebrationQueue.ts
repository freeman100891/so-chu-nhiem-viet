import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/database/db';
import type { LevelUpCelebrationEvent } from '../../../core/database/types';
import type { LevelUpCelebrationSettings } from '../../../core/types/avatar-theme.types';
import { DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS } from '../../../core/types/avatar-theme.types';
import { levelUpCelebrationService } from '../../../core/services/level-up-celebration/level-up-celebration.service';
import {
  liveBroadcastService,
  type LevelUpBroadcastPayload,
  type BroadcastMessageType,
} from '../../../core/services/live-classroom/live-broadcast';
import { generateUUID } from '../../../shared/utilities/uuid';

export interface UseLevelUpCelebrationQueueProps {
  sessionId?: string;
  classId?: string;
}

export function useLevelUpCelebrationQueue({ sessionId, classId }: UseLevelUpCelebrationQueueProps) {
  // 1. Reactive Live Query for pending/presenting LevelUpCelebrationEvents
  const livePendingEvents = useLiveQuery(
    async () => {
      if (!classId) return [];
      if (sessionId) {
        return await levelUpCelebrationService.findPendingBySession(sessionId);
      }
      return await levelUpCelebrationService.findPendingByClass(classId);
    },
    [sessionId, classId],
    []
  );

  // Fallback state for manual refresh / immediate reconciliation
  const [fallbackEvents, setFallbackEvents] = useState<LevelUpCelebrationEvent[]>([]);

  const [settings, setSettings] = useState<LevelUpCelebrationSettings>(DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentBroadcastingId, setCurrentBroadcastingId] = useState<string | null>(null);

  // Local interactive modal state (for single-screen presentation)
  const [activeLocalEvent, setActiveLocalEvent] = useState<LevelUpCelebrationEvent | null>(null);

  // Auto-play batch safety lock
  const autoPlayLockRef = useRef(false);
  const autoSequenceCountRef = useRef(0);
  const [isSequencePaused, setIsSequencePaused] = useState(false);

  // Load Settings from DB
  const loadSettings = useCallback(async () => {
    const s = await levelUpCelebrationService.getSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Combined reactive pending events (deduplicated by ID and status === 'PENDING' | 'PRESENTING')
  const pendingEvents = useMemo(() => {
    const sourceList = livePendingEvents && livePendingEvents.length > 0 ? livePendingEvents : fallbackEvents;
    const seen = new Set<string>();
    const deduplicated: LevelUpCelebrationEvent[] = [];

    for (const evt of sourceList) {
      if (!seen.has(evt.id) && (evt.status === 'PENDING' || evt.status === 'PRESENTING')) {
        seen.add(evt.id);
        deduplicated.push(evt);
      }
    }
    return deduplicated;
  }, [livePendingEvents, fallbackEvents]);

  // Explicit queue refresh
  const loadQueue = useCallback(async () => {
    if (!classId) return;
    try {
      let events: LevelUpCelebrationEvent[] = [];
      if (sessionId) {
        events = await levelUpCelebrationService.findPendingBySession(sessionId);
      } else {
        events = await levelUpCelebrationService.findPendingByClass(classId);
      }
      setFallbackEvents(events);
    } catch (err) {
      console.error('Failed to load level-up queue:', err);
    }
  }, [sessionId, classId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Broadcast ACK and Channel Sync
  useEffect(() => {
    const unsubscribe = liveBroadcastService.onMessage(async (msg: BroadcastMessageType) => {
      if (msg.type === 'LEVEL_UP_STARTED') {
        setIsBroadcasting(true);
        setCurrentBroadcastingId(msg.payload.eventId);
        await levelUpCelebrationService.markPresenting(msg.payload.eventId, msg.payload.commandId);
      } else if (msg.type === 'LEVEL_UP_COMPLETED') {
        setIsBroadcasting(false);
        setCurrentBroadcastingId(null);
        await levelUpCelebrationService.markPresented(msg.payload.eventId);
        await loadQueue();
      } else if (msg.type === 'LEVEL_UP_DISMISS') {
        setIsBroadcasting(false);
        setCurrentBroadcastingId(null);
        await loadQueue();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadQueue]);

  /**
   * Trình chiếu sự kiện thăng cấp (Phát sóng tới Presentation Screen hoặc Mở Local Modal)
   */
  const showEvent = useCallback(
    async (event: LevelUpCelebrationEvent, forceLocal = false) => {
      if (!classId) return;

      try {
        setIsBroadcasting(true);
        setCurrentBroadcastingId(event.id);

        const student = await db.students.get(event.studentId);
        if (!student || student.deletedAt) {
          await levelUpCelebrationService.markSkipped(event.id, 'Học sinh không tồn tại');
          await loadQueue();
          setIsBroadcasting(false);
          return;
        }

        const commandId = generateUUID();
        const payload: LevelUpBroadcastPayload = {
          protocolVersion: 2,
          commandId,
          eventId: event.id,
          classId,
          liveSessionId: sessionId || null,
          studentId: student.id,
          studentName: student.fullName,
          studentCode: student.studentCode,
          fromLevel: {
            levelId: event.fromLevel.levelId,
            levelName: event.fromLevel.levelName,
            levelShortLabel: event.fromLevel.levelShortLabel,
            avatarAssetUrl: event.fromLevel.avatarAssetUrl,
            cardBaseColor: event.fromLevel.cardBaseColor,
          },
          toLevel: {
            levelId: event.toLevel.levelId,
            levelName: event.toLevel.levelName,
            levelShortLabel: event.toLevel.levelShortLabel,
            avatarAssetUrl: event.toLevel.avatarAssetUrl,
            cardBaseColor: event.toLevel.cardBaseColor,
            cardTheme: (event.toLevel as any).cardTheme,
          },
          levelsGained: event.levelsGained,
          currentScore: event.currentScore,
          soundEnabled: settings.soundEnabled,
          confettiEnabled: settings.confettiEnabled,
          intensity: settings.intensity,
          durationMs: settings.durationMs,
        };

        // Post broadcast message to presentation window
        liveBroadcastService.postMessage({
          type: 'LEVEL_UP_SHOW',
          payload,
        });

        // If local mode requested or single-screen
        if (forceLocal) {
          setActiveLocalEvent(event);
        }

        // Mark as PRESENTING in database
        await levelUpCelebrationService.markPresenting(event.id, commandId);
        await loadQueue();

        // Safety fallback timer if no presentation ACK received
        setTimeout(async () => {
          if (currentBroadcastingId === event.id) {
            await levelUpCelebrationService.markPresented(event.id);
            setIsBroadcasting(false);
            setCurrentBroadcastingId(null);
            await loadQueue();
          }
        }, (settings.durationMs || 5200) + 1500);
      } catch (err) {
        console.error('Failed to show level-up celebration event:', err);
        setIsBroadcasting(false);
        setCurrentBroadcastingId(null);
      }
    },
    [classId, sessionId, settings, currentBroadcastingId, loadQueue]
  );

  /**
   * Bỏ qua sự kiện hiện tại
   */
  const skipEvent = useCallback(
    async (event: LevelUpCelebrationEvent, reason = 'Giáo viên bỏ qua') => {
      try {
        await levelUpCelebrationService.markSkipped(event.id, reason);

        if (currentBroadcastingId === event.id) {
          liveBroadcastService.postMessage({
            type: 'LEVEL_UP_DISMISS',
            payload: {
              protocolVersion: 2,
              commandId: generateUUID(),
              eventId: event.id,
              classId,
              liveSessionId: sessionId || null,
            },
          });
          setIsBroadcasting(false);
          setCurrentBroadcastingId(null);
        }

        if (activeLocalEvent?.id === event.id) {
          setActiveLocalEvent(null);
        }

        await loadQueue();
      } catch (err) {
        console.error('Failed to skip level-up celebration event:', err);
      }
    },
    [classId, sessionId, currentBroadcastingId, activeLocalEvent, loadQueue]
  );

  /**
   * Bỏ qua tất cả sự kiện đang chờ
   */
  const skipAllEvents = useCallback(
    async (reason = 'Bỏ qua tất cả') => {
      if (!sessionId) return;
      try {
        await levelUpCelebrationService.skipAllPendingInSession(sessionId, reason);
        if (currentBroadcastingId) {
          liveBroadcastService.postMessage({
            type: 'LEVEL_UP_DISMISS',
            payload: {
              protocolVersion: 2,
              commandId: generateUUID(),
              eventId: currentBroadcastingId,
              classId,
              liveSessionId: sessionId,
            },
          });
          setIsBroadcasting(false);
          setCurrentBroadcastingId(null);
        }
        setActiveLocalEvent(null);
        setIsSequencePaused(false);
        autoSequenceCountRef.current = 0;
        await loadQueue();
      } catch (err) {
        console.error('Failed to skip all level-up celebration events:', err);
      }
    },
    [sessionId, classId, currentBroadcastingId, loadQueue]
  );

  /**
   * Trình chiếu lại sự kiện (Replay)
   */
  const replayEvent = useCallback(
    async (event: LevelUpCelebrationEvent) => {
      await showEvent(event, false);
    },
    [showEvent]
  );

  /**
   * Tiếp tục chuỗi tự động khi bị tạm dừng
   */
  const resumeAutoSequence = useCallback(() => {
    setIsSequencePaused(false);
    autoSequenceCountRef.current = 0;
  }, []);

  /**
   * Cập nhật cài đặt chế độ chúc mừng
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<LevelUpCelebrationSettings>) => {
      const merged = await levelUpCelebrationService.updateSettings(newSettings);
      setSettings(merged);
    },
    []
  );

  /**
   * Hoàn tất local modal
   */
  const handleLocalModalComplete = useCallback(
    async (event: LevelUpCelebrationEvent) => {
      setActiveLocalEvent(null);
      setIsBroadcasting(false);
      setCurrentBroadcastingId(null);
      await levelUpCelebrationService.markPresented(event.id);
      await loadQueue();
    },
    [loadQueue]
  );

  // Automatic Mode Runner: Tự động phát khi có event trong queue nếu mode === 'AUTOMATIC'
  useEffect(() => {
    if (settings.mode !== 'AUTOMATIC' || !settings.enabled) return;
    if (pendingEvents.length === 0 || isBroadcasting || activeLocalEvent || autoPlayLockRef.current) return;
    if (isSequencePaused) return;

    // Check max sequence limit
    const maxSeq = settings.maxAutomaticSequence || 5;
    if (autoSequenceCountRef.current >= maxSeq) {
      setIsSequencePaused(true);
      return;
    }

    const nextEvt = pendingEvents[0];
    if (!nextEvt || nextEvt.status === 'PRESENTING') return;

    autoPlayLockRef.current = true;
    const timer = setTimeout(async () => {
      autoSequenceCountRef.current += 1;
      await showEvent(nextEvt, false);
      autoPlayLockRef.current = false;
    }, 700);

    return () => {
      clearTimeout(timer);
      autoPlayLockRef.current = false;
    };
  }, [settings, pendingEvents, isBroadcasting, activeLocalEvent, isSequencePaused, showEvent]);

  return {
    pendingEvents,
    currentEvent: pendingEvents[0] || null,
    pendingCount: pendingEvents.length,
    isBroadcasting,
    activeLocalEvent,
    isSequencePaused,
    settings,
    showEvent,
    skipEvent,
    skipAllEvents,
    replayEvent,
    resumeAutoSequence,
    updateSettings,
    handleLocalModalComplete,
    refreshQueue: loadQueue,
  };
}
