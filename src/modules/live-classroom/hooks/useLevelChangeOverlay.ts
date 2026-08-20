import { useState, useRef, useCallback, useEffect } from 'react';
import type { DirectLevelChangeNotification } from '../../../core/types/avatar-theme.types';
import { generateUUID } from '../../../shared/utilities/uuid';

export type OverlayPhase = 'IDLE' | 'ENTERING' | 'VISIBLE' | 'EXITING';

export interface ActiveLevelChangeOverlay {
  overlayId: string;
  phase: OverlayPhase;
  notifications: DirectLevelChangeNotification[];
  openedAt: number;
  hardCloseAt: number;
}

export interface UseLevelChangeOverlayOptions {
  defaultDurationMs?: number;
  maxHoldCapMs?: number;
  onDismiss?: (reason: 'AUTO' | 'USER' | 'SCOPE_CHANGE') => void;
}

/**
 * Same-Tab Overlay Coordinator (FEAT-AVATAR-005)
 * Quản lý trạng thái hiển thị modal thay đổi cấp bậc trực tiếp (UP & DOWN)
 * Hỗ trợ:
 * - Direct show tức thì ngay sau khi point mutation commit
 * - Active merge và Coalesce khi có biến động điểm dồn dập
 * - Tự động giới hạn thời gian mở modal tối đa (Hard cap)
 * - Không phụ thuộc hàng đợi IndexedDB hay BroadcastChannel ACK
 */
export function useLevelChangeOverlay(options: UseLevelChangeOverlayOptions = {}) {
  const { defaultDurationMs = 5200, maxHoldCapMs = 8000, onDismiss } = options;

  const [overlay, setOverlay] = useState<ActiveLevelChangeOverlay>({
    overlayId: '',
    phase: 'IDLE',
    notifications: [],
    openedAt: 0,
    hardCloseAt: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(
    (reason: 'AUTO' | 'USER' | 'SCOPE_CHANGE' = 'USER') => {
      clearTimer();
      setOverlay((prev) => {
        if (prev.phase === 'IDLE') return prev;
        return {
          ...prev,
          phase: 'EXITING',
        };
      });

      setTimeout(() => {
        setOverlay({
          overlayId: '',
          phase: 'IDLE',
          notifications: [],
          openedAt: 0,
          hardCloseAt: 0,
        });
        onDismiss?.(reason);
      }, 300);
    },
    [clearTimer, onDismiss]
  );

  const scheduleDismiss = useCallback(
    (durationMs: number) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        dismiss('AUTO');
      }, durationMs);
    },
    [clearTimer, dismiss]
  );

  /**
   * Hiển thị modal trực tiếp cho danh sách notifications mới
   */
  const show = useCallback(
    (incoming: DirectLevelChangeNotification[]) => {
      if (!incoming || incoming.length === 0) return;

      const now = Date.now();
      const current = overlayRef.current;

      // Nếu modal đang mở -> Thực hiện Active Merge
      if (current.phase === 'VISIBLE' || current.phase === 'ENTERING') {
        const studentMap = new Map<string, DirectLevelChangeNotification>();

        // Giữ thông tin của các notifications hiện tại
        current.notifications.forEach((n) => studentMap.set(n.studentId, n));

        // Merge notifications mới
        incoming.forEach((inc) => {
          const existing = studentMap.get(inc.studentId);
          if (existing) {
            // Coalesce: Cấp ban đầu là của existing, cấp mới là của inc
            const levelsChanged = Math.abs(inc.toLevelId - existing.fromLevelId);
            if (inc.toLevelId === existing.fromLevelId) {
              // Quay về cấp gốc -> no-op, xóa khỏi danh sách
              studentMap.delete(inc.studentId);
            } else {
              studentMap.set(inc.studentId, {
                ...inc,
                fromLevelId: existing.fromLevelId,
                previousLevel: existing.previousLevel,
                levelsChanged,
                direction: inc.toLevelId > existing.fromLevelId ? 'UP' : 'DOWN',
              });
            }
          } else {
            studentMap.set(inc.studentId, inc);
          }
        });

        const mergedList = Array.from(studentMap.values());
        if (mergedList.length === 0) {
          setOverlay((prev) => ({
            ...prev,
            notifications: [],
          }));
          dismiss('AUTO');
          return;
        }

        // Gia hạn nhẹ thời gian mở nhưng không vượt quá hardCloseAt
        const remainingHardCap = Math.max(1000, current.hardCloseAt - now);
        const nextDuration = Math.min(remainingHardCap, defaultDurationMs * 0.6);

        setOverlay((prev) => ({
          ...prev,
          notifications: mergedList,
        }));

        scheduleDismiss(nextDuration);
        return;
      }

      // Mở mới hoàn toàn
      const overlayId = generateUUID();
      const hardCloseAt = now + maxHoldCapMs;

      setOverlay({
        overlayId,
        phase: 'ENTERING',
        notifications: incoming,
        openedAt: now,
        hardCloseAt,
      });

      // Transition ENTERING -> VISIBLE
      setTimeout(() => {
        setOverlay((prev) => {
          if (prev.overlayId !== overlayId) return prev;
          return { ...prev, phase: 'VISIBLE' };
        });
      }, 100);

      // Duration: Hướng UP khoảng 5.2s, Hướng DOWN khoảng 3.5s
      const isAllDown = incoming.every((n) => n.direction === 'DOWN');
      const holdTime = isAllDown ? Math.min(3800, defaultDurationMs) : defaultDurationMs;
      scheduleDismiss(holdTime);
    },
    [defaultDurationMs, maxHoldCapMs, scheduleDismiss, dismiss]
  );

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    isOpen: overlay.phase === 'VISIBLE' || overlay.phase === 'ENTERING',
    phase: overlay.phase,
    notifications: overlay.notifications,
    show,
    dismiss,
  };
}
