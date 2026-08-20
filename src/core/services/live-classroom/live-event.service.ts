import { db } from '../../database/db';
import type { LiveClassEvent, LiveClassEventType } from '../../database/types';

export interface CreateEventInput {
  sessionId: string;
  studentId?: string | null;
  groupId?: string | null;
  eventType: LiveClassEventType;
  value?: string | number | boolean | null;
  metadata?: Record<string, unknown> | null;
  reversedEventId?: string | null;
}

export class LiveClassEventService {
  async logEvent(input: CreateEventInput): Promise<LiveClassEvent> {
    const event: LiveClassEvent = {
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      studentId: input.studentId || null,
      groupId: input.groupId || null,
      eventType: input.eventType,
      value: input.value ?? null,
      metadata: input.metadata || null,
      reversedEventId: input.reversedEventId || null,
      createdAt: new Date().toISOString(),
    };

    await db.liveClassEvents.add(event);
    return event;
  }

  async getEvents(sessionId: string): Promise<LiveClassEvent[]> {
    return await db.liveClassEvents
      .where('sessionId')
      .equals(sessionId)
      .sortBy('createdAt');
  }
}

export const liveClassEventService = new LiveClassEventService();
