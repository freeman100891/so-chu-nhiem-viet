import { reportAggregationService, type ReportFilterParams } from './report-aggregation.service';
import { db } from '../database/db';

export interface ClassComparisonItem {
  classId: string;
  className: string;
  totalStudents: number;
  attendanceRate: number;
  meritPoints: number;
  averageMeritPerStudent: number;
  demeritPoints: number;
  netPoints: number;
  averageNetPerStudent: number;
  engagementRate: number;
  promotedStudentsCount: number;
  honorsCount: number;
}

export interface ClassComparisonResult {
  classes: ClassComparisonItem[];
  startDate: string;
  endDate: string;
  academicYearName: string;
}

export class ReportComparisonService {
  /**
   * So sánh đối chiếu từ 2 đến 3 lớp trong cùng một khoảng thời gian
   */
  async compareClasses(
    classIds: string[],
    academicYearId: string,
    startDate: string,
    endDate: string,
    termId?: string | null
  ): Promise<ClassComparisonResult> {
    const selectedClassIds = classIds.slice(0, 3);
    const results: ClassComparisonItem[] = [];

    const academicYear = await db.academicYears.get(academicYearId);
    const academicYearName = academicYear ? academicYear.name : 'Năm học';

    for (const classId of selectedClassIds) {
      const cls = await db.classes.get(classId);
      if (!cls || cls.deletedAt) continue;

      const filter: ReportFilterParams = {
        classId,
        academicYearId,
        termId,
        startDate,
        endDate,
        periodType: 'custom',
        comparePreviousPeriod: false,
      };

      const rep = await reportAggregationService.generateFullReport(filter);
      const totalSt = rep.kpis.activeStudentsCount.current || 1;
      const curMerit = rep.kpis.meritPoints.current;
      const curNet = rep.kpis.netPoints.current;

      results.push({
        classId,
        className: `Lớp ${cls.name}`,
        totalStudents: rep.kpis.activeStudentsCount.current,
        attendanceRate: rep.kpis.attendanceRate.current,
        meritPoints: curMerit,
        averageMeritPerStudent: Math.round((curMerit / totalSt) * 10) / 10,
        demeritPoints: rep.kpis.demeritPoints.current,
        netPoints: curNet,
        averageNetPerStudent: Math.round((curNet / totalSt) * 10) / 10,
        engagementRate: rep.kpis.engagementRate.current,
        promotedStudentsCount: rep.kpis.promotedStudentsCount.current,
        honorsCount: rep.kpis.honorsCount.current,
      });
    }

    return {
      classes: results,
      startDate,
      endDate,
      academicYearName,
    };
  }
}

export const reportComparisonService = new ReportComparisonService();
