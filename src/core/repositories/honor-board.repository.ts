import { db } from '../database/db';
import type { HonorTitle, HonorBoard, HonorRecipient } from '../database/types';

export class HonorTitleRepository {
  async getAll(): Promise<HonorTitle[]> {
    const list = await db.honorTitles.filter((t) => !t.deletedAt).toArray();
    const map = new Map<string, HonorTitle>();
    for (const item of list) {
      const key = item.code || item.name || item.id;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getActive(): Promise<HonorTitle[]> {
    const list = await db.honorTitles.filter((t) => !t.deletedAt && t.isActive).toArray();
    const map = new Map<string, HonorTitle>();
    for (const item of list) {
      const key = item.code || item.name || item.id;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findById(id: string): Promise<HonorTitle | undefined> {
    const t = await db.honorTitles.get(id);
    return t && !t.deletedAt ? t : undefined;
  }

  async findByCode(code: string): Promise<HonorTitle | undefined> {
    const t = await db.honorTitles.where('code').equals(code).filter((item) => !item.deletedAt).first();
    return t;
  }

  async create(title: Omit<HonorTitle, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<HonorTitle> {
    const now = new Date().toISOString();
    const newTitle: HonorTitle = {
      ...title,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.honorTitles.add(newTitle);
    return newTitle;
  }

  async update(id: string, updates: Partial<Omit<HonorTitle, 'id' | 'createdAt'>>): Promise<void> {
    await db.honorTitles.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.honorTitles.update(id, {
      deletedAt: now,
      updatedAt: now,
    });
  }
}

export class HonorBoardRepository {
  async findByClass(classId: string): Promise<HonorBoard[]> {
    const list = await db.honorBoards.where('classId').equals(classId).filter((b) => !b.deletedAt).toArray();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findById(id: string): Promise<HonorBoard | undefined> {
    const b = await db.honorBoards.get(id);
    return b && !b.deletedAt ? b : undefined;
  }

  async create(board: Omit<HonorBoard, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<HonorBoard> {
    const now = new Date().toISOString();
    const newBoard: HonorBoard = {
      ...board,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.honorBoards.add(newBoard);
    return newBoard;
  }

  async update(id: string, updates: Partial<Omit<HonorBoard, 'id' | 'createdAt'>>): Promise<void> {
    await db.honorBoards.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.honorBoards.update(id, {
      deletedAt: now,
      updatedAt: now,
    });
  }
}

export class HonorRecipientRepository {
  async findByBoard(boardId: string): Promise<HonorRecipient[]> {
    const list = await db.honorRecipients.where('boardId').equals(boardId).toArray();
    return list.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  }

  async findByStudent(studentId: string): Promise<HonorRecipient[]> {
    const list = await db.honorRecipients.where('studentId').equals(studentId).toArray();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createBatch(recipients: HonorRecipient[]): Promise<void> {
    await db.honorRecipients.bulkAdd(recipients);
  }

  async deleteByBoard(boardId: string): Promise<void> {
    await db.honorRecipients.where('boardId').equals(boardId).delete();
  }

  async update(id: string, updates: Partial<HonorRecipient>): Promise<void> {
    await db.honorRecipients.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.honorRecipients.delete(id);
  }
}

export const honorTitleRepository = new HonorTitleRepository();
export const honorBoardRepository = new HonorBoardRepository();
export const honorRecipientRepository = new HonorRecipientRepository();
