import { db } from '../../database/db';
import type { LiveClassGroup, LiveClassGroupMember, PointEntry } from '../../database/types';
import { getTodayDateString } from '../../../shared/utilities/date';
import { liveClassEventService } from './live-event.service';

export interface GroupWithMembers extends LiveClassGroup {
  members: LiveClassGroupMember[];
}

export class LiveClassGroupService {
  async createGroup(sessionId: string, name: string, color?: string, icon?: string): Promise<LiveClassGroup> {
    const existingGroups = await db.liveClassGroups.where('sessionId').equals(sessionId).toArray();
    const nowISO = new Date().toISOString();

    const group: LiveClassGroup = {
      id: crypto.randomUUID(),
      sessionId,
      name: name.trim(),
      color: color || '#2D5A27',
      icon: icon || 'Users',
      sortOrder: existingGroups.length + 1,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    await db.liveClassGroups.add(group);
    return group;
  }

  async updateGroup(groupId: string, name: string, color?: string, icon?: string): Promise<LiveClassGroup> {
    const nowISO = new Date().toISOString();
    await db.liveClassGroups.update(groupId, {
      name: name.trim(),
      color,
      icon,
      updatedAt: nowISO,
    });
    return (await db.liveClassGroups.get(groupId))!;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await db.runTransaction('rw', [db.liveClassGroups, db.liveClassGroupMembers], async () => {
      const members = await db.liveClassGroupMembers.where('groupId').equals(groupId).toArray();
      for (const m of members) {
        await db.liveClassGroupMembers.delete(m.id);
      }
      await db.liveClassGroups.delete(groupId);
    });
  }

  async getGroupsWithMembers(sessionId: string): Promise<GroupWithMembers[]> {
    const groups = await db.liveClassGroups.where('sessionId').equals(sessionId).sortBy('sortOrder');
    const result: GroupWithMembers[] = [];

    for (const group of groups) {
      const members = await db.liveClassGroupMembers.where('groupId').equals(group.id).toArray();
      result.push({
        ...group,
        members,
      });
    }

    return result;
  }

  async addMemberToGroup(groupId: string, studentId: string): Promise<LiveClassGroupMember> {
    const existing = await db.liveClassGroupMembers
      .where('[groupId+studentId]')
      .equals([groupId, studentId])
      .first();

    if (existing) return existing;

    const member: LiveClassGroupMember = {
      id: crypto.randomUUID(),
      groupId,
      studentId,
      createdAt: new Date().toISOString(),
    };

    await db.liveClassGroupMembers.add(member);
    return member;
  }

  async removeMemberFromGroup(groupId: string, studentId: string): Promise<void> {
    const member = await db.liveClassGroupMembers
      .where('[groupId+studentId]')
      .equals([groupId, studentId])
      .first();

    if (member) {
      await db.liveClassGroupMembers.delete(member.id);
    }
  }

  /**
   * Chia nhóm tự động ngẫu nhiên cho toàn bộ học sinh trong phiên
   */
  async autoAssignGroups(sessionId: string, groupCount: number): Promise<GroupWithMembers[]> {
    if (groupCount < 1) throw new Error('Số lượng nhóm phải từ 1 trở lên.');

    const participants = await db.liveClassParticipants.where('sessionId').equals(sessionId).toArray();
    if (participants.length === 0) {
      throw new Error('Chưa có học sinh nào trong phiên học.');
    }

    // Shuffle participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    const colors = ['#2D5A27', '#1E3A8A', '#D97706', '#991B1B', '#7C3AED', '#059669', '#DB2777'];
    const icons = ['Star', 'Shield', 'Crown', 'Flame', 'Zap', 'Target', 'Award'];

    await db.runTransaction('rw', [db.liveClassGroups, db.liveClassGroupMembers], async () => {
      // Clear existing groups for this session
      const oldGroups = await db.liveClassGroups.where('sessionId').equals(sessionId).toArray();
      for (const og of oldGroups) {
        const oldMembers = await db.liveClassGroupMembers.where('groupId').equals(og.id).toArray();
        for (const om of oldMembers) {
          await db.liveClassGroupMembers.delete(om.id);
        }
        await db.liveClassGroups.delete(og.id);
      }

      // Create new N groups
      const createdGroups: LiveClassGroup[] = [];
      const nowISO = new Date().toISOString();

      for (let g = 0; g < groupCount; g++) {
        const group: LiveClassGroup = {
          id: crypto.randomUUID(),
          sessionId,
          name: `Nhóm ${g + 1}`,
          color: colors[g % colors.length] || '#2D5A27',
          icon: icons[g % icons.length] || 'Users',
          sortOrder: g + 1,
          createdAt: nowISO,
          updatedAt: nowISO,
        };
        await db.liveClassGroups.add(group);
        createdGroups.push(group);
      }

      // Distribute members evenly
      for (let i = 0; i < shuffled.length; i++) {
        const p = shuffled[i]!;
        const assignedGroup = createdGroups[i % groupCount]!;
        await db.liveClassGroupMembers.add({
          id: crypto.randomUUID(),
          groupId: assignedGroup.id,
          studentId: p.studentId,
          createdAt: nowISO,
        });
      }
    });

    return await this.getGroupsWithMembers(sessionId);
  }

  /**
   * Cộng/Trừ điểm thi đua cho TOÀN BỘ thành viên trong nhóm
   */
  async awardGroupPoint(
    sessionId: string,
    groupId: string,
    classId: string,
    categoryId: string,
    points: number,
    reason: string
  ): Promise<PointEntry[]> {
    const group = await db.liveClassGroups.get(groupId);
    if (!group) throw new Error('Không tìm thấy nhóm.');

    const members = await db.liveClassGroupMembers.where('groupId').equals(groupId).toArray();
    if (members.length === 0) {
      throw new Error(`Nhóm "${group.name}" hiện không có thành viên nào.`);
    }

    const nowISO = new Date().toISOString();
    const today = getTodayDateString();
    const entries: PointEntry[] = [];

    await db.runTransaction('rw', [db.pointEntries, db.auditLogs], async () => {
      for (const m of members) {
        const entry: PointEntry = {
          id: crypto.randomUUID(),
          classId,
          studentId: m.studentId,
          categoryId,
          points,
          reason: `[${group.name}] ${reason}`,
          occurredAt: today,
          recordedBy: 'Phiên học trực tuyến (Cộng nhóm)',
          source: 'live_classroom',
          sourceId: sessionId,
          createdAt: nowISO,
          updatedAt: nowISO,
          deletedAt: null,
        };
        await db.pointEntries.add(entry);
        entries.push(entry);
      }

      await db.auditLogs.add({
        id: crypto.randomUUID(),
        entityName: 'PointEntry',
        recordId: groupId,
        action: 'CREATE',
        timestamp: nowISO,
        details: `Cộng điểm nhóm (${group.name}): ${points > 0 ? '+' : ''}${points} điểm cho ${members.length} thành viên`,
      });
    });

    await liveClassEventService.logEvent({
      sessionId,
      groupId,
      eventType: 'group_point',
      value: points,
      metadata: { groupName: group.name, memberCount: members.length, points, reason },
    });

    return entries;
  }
}

export const liveClassGroupService = new LiveClassGroupService();
