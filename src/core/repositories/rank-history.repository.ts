import { db } from '../database/db';
import type { StudentRankHistory } from '../database/types';

export class RankHistoryRepository {
  async addHistory(input: Omit<StudentRankHistory, 'id' | 'createdAt'>): Promise<StudentRankHistory> {
    const record: StudentRankHistory = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };

    await db.studentRankHistory.add(record);
    return record;
  }

  async getHighestAchievedHistory(studentId: string, rankSystemId: string): Promise<StudentRankHistory | undefined> {
    const historyList = await db.studentRankHistory
      .where('studentId')
      .equals(studentId)
      .filter((h) => h.rankSystemId === rankSystemId)
      .toArray();

    if (historyList.length === 0) return undefined;

    return historyList.sort((a, b) => b.toLevel - a.toLevel)[0];
  }

  async getStudentHistory(studentId: string, rankSystemId: string): Promise<StudentRankHistory[]> {
    const historyList = await db.studentRankHistory
      .where('studentId')
      .equals(studentId)
      .filter((h) => h.rankSystemId === rankSystemId)
      .toArray();

    return historyList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getClassHistory(classId: string, rankSystemId: string): Promise<StudentRankHistory[]> {
    const historyList = await db.studentRankHistory
      .where('classId')
      .equals(classId)
      .filter((h) => h.rankSystemId === rankSystemId)
      .toArray();

    return historyList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const rankHistoryRepository = new RankHistoryRepository();
