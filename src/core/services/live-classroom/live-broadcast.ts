import type { LiveClassSession, LiveClassParticipant, Student } from '../../database/types';
import type { GroupWithMembers } from './live-group.service';

export interface PromotionBroadcastPayload {
  protocolVersion: 1;
  commandId: string;
  eventId: string;
  classId: string;
  liveSessionId?: string | null;
  studentId: string;
  studentName: string;
  avatar?: string | null;
  fromLevel: number;
  toLevel: number;
  fromRankName: string;
  toRankName: string;
  levelsGained: number;
  showPreviousRank?: boolean;
  showPoints?: boolean;
  soundEnabled?: boolean;
  confettiEnabled?: boolean;
  durationMs?: number;
}

export interface PromotionDismissPayload {
  protocolVersion: 1;
  commandId: string;
  eventId: string;
  classId?: string;
  liveSessionId?: string | null;
}

export interface PromotionAckPayload {
  protocolVersion: 1;
  commandId: string;
  eventId: string;
  state: 'PRESENTED' | 'DISMISSED';
}

export interface LevelUpBroadcastPayload {
  protocolVersion: 2;
  commandId: string;
  eventId: string;
  classId: string;
  liveSessionId?: string | null;
  studentId: string;
  studentName: string;
  studentCode?: string;
  fromLevel: {
    levelId: 1 | 2 | 3 | 4 | 5;
    levelName: string;
    levelShortLabel: string;
    avatarAssetUrl?: string;
    cardBaseColor: string;
  };
  toLevel: {
    levelId: 1 | 2 | 3 | 4 | 5;
    levelName: string;
    levelShortLabel: string;
    avatarAssetUrl?: string;
    cardBaseColor: string;
    cardTheme?: any;
  };
  levelsGained: number;
  currentScore: number;
  soundEnabled?: boolean;
  confettiEnabled?: boolean;
  intensity?: 'FULL' | 'BALANCED' | 'MINIMAL';
  durationMs?: number;
}

export interface LevelUpDismissPayload {
  protocolVersion: 2;
  commandId: string;
  eventId: string;
  classId?: string;
  liveSessionId?: string | null;
}

export interface LevelUpAckPayload {
  protocolVersion: 2;
  commandId: string;
  eventId: string;
  state: 'STARTED' | 'COMPLETED' | 'DISMISSED';
}

import type { DirectLevelChangeNotification } from '../../types/avatar-theme.types';

export interface LevelChangeBroadcastPayload {
  protocolVersion: 3;
  commandId: string;
  classId: string;
  liveSessionId?: string | null;
  notifications: DirectLevelChangeNotification[];
  sentAt: string;
}

export interface LevelChangeAckPayload {
  protocolVersion: 3;
  commandId: string;
  notificationIds: string[];
  shownAt: string;
}

export interface LevelChangeDismissPayload {
  protocolVersion: 3;
  commandId: string;
  classId?: string;
  liveSessionId?: string | null;
}

export type BroadcastMessageType =
  | { type: 'SESSION_STATE'; payload: { session: LiveClassSession; participantsCount: number } }
  | { type: 'STUDENT_SELECTED'; payload: { student: Student; participant: LiveClassParticipant } }
  | { type: 'STUDENT_PROMOTED'; payload: { studentName: string; avatar?: string | null; fromLevel?: number | null; toLevel: number; rankName: string; levelsGained: number } }
  | { type: 'PROMOTION_SHOW'; payload: PromotionBroadcastPayload }
  | { type: 'PROMOTION_DISMISS'; payload: PromotionDismissPayload }
  | { type: 'PROMOTION_ACK'; payload: PromotionAckPayload }
  | { type: 'LEVEL_UP_SHOW'; payload: LevelUpBroadcastPayload }
  | { type: 'LEVEL_UP_STARTED'; payload: LevelUpAckPayload }
  | { type: 'LEVEL_UP_COMPLETED'; payload: LevelUpAckPayload }
  | { type: 'LEVEL_UP_DISMISS'; payload: LevelUpDismissPayload }
  | { type: 'LEVEL_UP_ACK'; payload: LevelUpAckPayload }
  | { type: 'LEVEL_CHANGE_SHOW'; payload: LevelChangeBroadcastPayload }
  | { type: 'LEVEL_CHANGE_SHOWN_ACK'; payload: LevelChangeAckPayload }
  | { type: 'LEVEL_CHANGE_DISMISS'; payload: LevelChangeDismissPayload }
  | { type: 'TIMER_UPDATE'; payload: { seconds: number; isRunning: boolean } }
  | { type: 'GROUPS_UPDATE'; payload: { groups: GroupWithMembers[] } }
  | { type: 'POINT_AWARDED'; payload: { studentName: string; points: number; reason: string } }
  | { type: 'POLL_STATE'; payload: { question: string; options: string[]; correctAnswerIndex?: number | null; counts: number[] } | null }
  | { type: 'BREAK_SCREEN_STATE'; payload: { active: boolean; remainingSeconds: number; message: string } | null }
  | { type: 'PRESENT_QR'; payload: { title: string; url: string } | null };

class LiveBroadcastService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(message: BroadcastMessageType) => void> = new Set();

  private getChannel(): BroadcastChannel | null {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return null;
    }
    if (!this.channel) {
      try {
        this.channel = new BroadcastChannel('live_classroom_sync');
      } catch (err) {
        console.warn('BroadcastChannel initialization failed:', err);
      }
    }
    return this.channel;
  }

  postMessage(message: BroadcastMessageType): void {
    // Notify in-process listeners first
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error('Broadcast listener error:', err);
      }
    });

    const ch = this.getChannel();
    if (ch) {
      try {
        ch.postMessage(message);
      } catch (err) {
        console.error('Failed to post broadcast message:', err);
      }
    }
  }

  onMessage(callback: (message: BroadcastMessageType) => void): () => void {
    this.listeners.add(callback);

    const ch = this.getChannel();
    let handler: ((event: MessageEvent<BroadcastMessageType>) => void) | null = null;
    if (ch) {
      handler = (event: MessageEvent<BroadcastMessageType>) => {
        if (event.data) {
          callback(event.data);
        }
      };
      ch.addEventListener('message', handler);
    }

    return () => {
      this.listeners.delete(callback);
      if (ch && handler) {
        ch.removeEventListener('message', handler);
      }
    };
  }

  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const liveBroadcastService = new LiveBroadcastService();
