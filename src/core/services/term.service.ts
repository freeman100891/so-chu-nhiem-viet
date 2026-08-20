import { db } from '../database/db';
import type { AcademicYear, Term } from '../database/types';
import { TermSchema } from '../validation/schemas';
import { getTodayDateString } from '../../shared/utilities/date';

export interface TermInput {
  name: string;
  startDate: string;
  endDate: string;
}

export class TermService {
  validateTermsForAcademicYear(year: AcademicYear, terms: TermInput[]): void {
    if (!terms || terms.length === 0) {
      throw new Error('Cần tạo ít nhất 1 học kỳ cho năm học.');
    }

    // Sort terms by startDate
    const sorted = [...terms].sort((a, b) => a.startDate.localeCompare(b.startDate));

    for (let i = 0; i < sorted.length; i++) {
      const term = sorted[i]!;

      // Zod validation
      TermSchema.parse({
        academicYearId: year.id,
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
        isActive: false,
      });

      // Term startDate < endDate
      if (term.startDate >= term.endDate) {
        throw new Error(`Học kỳ "${term.name}": Ngày kết thúc phải lớn hơn ngày bắt đầu.`);
      }

      // Range check within academic year
      if (term.startDate < year.startDate || term.endDate > year.endDate) {
        throw new Error(
          `Học kỳ "${term.name}" (${term.startDate} - ${term.endDate}) phải nằm trong khoảng thời gian của năm học (${year.startDate} - ${year.endDate}).`
        );
      }

      // Check overlap with next term
      if (i < sorted.length - 1) {
        const nextTerm = sorted[i + 1]!;
        if (term.endDate >= nextTerm.startDate) {
          throw new Error(
            `Thời gian của học kỳ "${term.name}" và "${nextTerm.name}" bị chồng lấn nhau.`
          );
        }
      }
    }
  }

  async createTermsForAcademicYear(yearId: string, terms: TermInput[]): Promise<Term[]> {
    const today = getTodayDateString();
    const createdTerms: Term[] = [];

    await db.transaction('rw', [db.terms, db.auditLogs], async () => {
      for (const t of terms) {
        const isActive = today >= t.startDate && today <= t.endDate;
        const newTerm: Term = {
          id: crypto.randomUUID(),
          academicYearId: yearId,
          name: t.name,
          startDate: t.startDate,
          endDate: t.endDate,
          isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        };
        await db.terms.add(newTerm);
        createdTerms.push(newTerm);
      }
    });

    return createdTerms;
  }

  /**
   * Tự động xác định Học kỳ hiện tại dựa trên ngày hệ thống YYYY-MM-DD
   */
  async getCurrentTermForYear(academicYearId: string): Promise<Term | null> {
    const terms = await db.terms
      .where('academicYearId')
      .equals(academicYearId)
      .filter((t) => !t.deletedAt)
      .toArray();

    const today = getTodayDateString();
    const active = terms.find((t) => today >= t.startDate && today <= t.endDate);
    return active || null;
  }
}

export const termService = new TermService();
