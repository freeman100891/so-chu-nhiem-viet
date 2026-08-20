import { academicYearRepository } from '../repositories/academic-year.repository';
import type { AcademicYear } from '../database/types';
import { AcademicYearSchema } from '../validation/schemas';

export class AcademicYearService {
  validateAcademicYear(data: { name: string; startDate: string; endDate: string; isActive?: boolean }): void {
    // Zod schema check
    AcademicYearSchema.parse(data);

    // Business rule: startDate < endDate
    if (data.startDate >= data.endDate) {
      throw new Error('Ngày kết thúc năm học phải lớn hơn ngày bắt đầu.');
    }
  }

  async createAcademicYear(data: { name: string; startDate: string; endDate: string; isActive?: boolean }): Promise<AcademicYear> {
    this.validateAcademicYear(data);

    const year = await academicYearRepository.create({
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? true,
    });

    if (year.isActive) {
      await academicYearRepository.setCurrentYear(year.id);
    }

    return year;
  }
}

export const academicYearService = new AcademicYearService();
