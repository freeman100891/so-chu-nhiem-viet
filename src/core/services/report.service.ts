import ExcelJS from 'exceljs';
import { db } from '../database/db';
import { getTodayDateString, formatDateVietnamese } from '../../shared/utilities/date';
import type { Student, ParentInteraction } from '../database/types';

export interface DashboardOverviewData {
  totalClassesCount: number;
  totalStudentsCount: number;
  presentTodayCount: number;
  absentTodayCount: number;
  needingAttentionCount: number;
  daysSinceLastBackup: number | null;
  upcomingBirthdays: { student: Student; daysLeft: number; dateStr: string }[];
  pendingInteractions: { interaction: ParentInteraction; studentName: string }[];
}

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
}

export class ReportService {
  /**
   * Tính toán các chỉ số KPI cho Dashboard thực dụng
   */
  async getDashboardOverview(classId?: string): Promise<DashboardOverviewData> {
    const today = getTodayDateString();

    // 1. Total active classes
    const classes = await db.classes.filter((c) => !c.deletedAt && c.status === 'Active').toArray();
    const totalClassesCount = classes.length;

    // 2. Active class ID
    const activeClsId = classId || classes[0]?.id || '';

    // 3. Students count for class
    let enrollments = await db.classEnrollments
      .filter((e) => !e.deletedAt && e.status === 'Active')
      .toArray();
    if (activeClsId) {
      enrollments = enrollments.filter((e) => e.classId === activeClsId);
    }
    const totalStudentsCount = enrollments.length;

    // 4. Attendance Today
    let presentTodayCount = 0;
    let absentTodayCount = 0;

    if (activeClsId) {
      const session = await db.attendanceSessions
        .where('[classId+sessionDate]')
        .equals([activeClsId, today])
        .first();

      if (session) {
        const records = await db.attendanceRecords
          .where('sessionId')
          .equals(session.id)
          .filter((r) => !r.deletedAt)
          .toArray();

        records.forEach((r) => {
          if (r.status === 'Present' || r.status === 'Late' || r.status === 'EarlyLeave') {
            presentTodayCount++;
          } else {
            absentTodayCount++;
          }
        });
      }
    }

    // 5. Days since last backup
    const lastBackup = await db.backupHistory.reverse().sortBy('createdAt');
    let daysSinceLastBackup: number | null = null;
    if (lastBackup.length > 0 && lastBackup[0]?.createdAt) {
      const backupDate = new Date(lastBackup[0].createdAt);
      const now = new Date();
      const diffMs = now.getTime() - backupDate.getTime();
      daysSinceLastBackup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // 6. Upcoming Birthdays in next 30 days
    const studentIds = enrollments.map((e) => e.studentId);
    const upcomingBirthdays: { student: Student; daysLeft: number; dateStr: string }[] = [];

    const nowObj = new Date();
    const currentMonth = nowObj.getMonth() + 1;
    const currentDay = nowObj.getDate();

    for (const stId of studentIds) {
      const st = await db.students.get(stId);
      if (st && !st.deletedAt && st.dateOfBirth) {
        const parts = st.dateOfBirth.split('-');
        if (parts.length === 3) {
          const dobMonth = parseInt(parts[1]!, 10);
          const dobDay = parseInt(parts[2]!, 10);

          // Calculate day difference within year
          let diffDays = (dobMonth - currentMonth) * 30 + (dobDay - currentDay);
          if (diffDays < 0) diffDays += 365; // Next year birthday

          if (diffDays >= 0 && diffDays <= 30) {
            upcomingBirthdays.push({
              student: st,
              daysLeft: diffDays,
              dateStr: `${dobDay}/${dobMonth}`,
            });
          }
        }
      }
    }
    upcomingBirthdays.sort((a, b) => a.daysLeft - b.daysLeft);

    // 7. Pending Parent Interactions
    const pendingInteractions: { interaction: ParentInteraction; studentName: string }[] = [];
    const interactions = await db.parentInteractions
      .filter((i) => !i.deletedAt && i.status === 'Pending')
      .toArray();

    for (const inter of interactions) {
      const st = await db.students.get(inter.studentId);
      pendingInteractions.push({
        interaction: inter,
        studentName: st ? st.fullName : 'Học sinh',
      });
    }

    const needingAttentionCount = absentTodayCount + pendingInteractions.length;

    return {
      totalClassesCount,
      totalStudentsCount,
      presentTodayCount,
      absentTodayCount,
      needingAttentionCount,
      daysSinceLastBackup,
      upcomingBirthdays: upcomingBirthdays.slice(0, 5),
      pendingInteractions: pendingInteractions.slice(0, 5),
    };
  }

  /**
   * Xuất Báo Cáo định dạng ExcelJS đẹp mắt với tiêu đề Trường, Giáo viên, Lớp
   */
  async exportReportToExcel(
    title: string,
    columns: ReportColumn[],
    rows: Record<string, unknown>[],
    metadata?: { schoolName?: string; teacherName?: string; className?: string }
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bao_Cao');

    // Title Block
    worksheet.mergeCells('A1', 'F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = metadata?.schoolName ? `${metadata.schoolName.toUpperCase()} - ${title.toUpperCase()}` : title.toUpperCase();
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Subheader info
    worksheet.mergeCells('A2', 'F2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `Lớp: ${metadata?.className || 'Tất cả'} | Giáo viên: ${metadata?.teacherName || 'GVCN'} | Ngày xuất báo cáo: ${formatDateVietnamese(getTodayDateString())}`;
    subCell.font = { name: 'Arial', size: 10, italic: true };
    subCell.alignment = { horizontal: 'center' };

    worksheet.addRow([]); // Blank row 3

    // Header Row
    const headerRow = worksheet.addRow(columns.map((c) => c.header));
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Data Rows
    rows.forEach((r, idx) => {
      const rowVals = columns.map((c) => r[c.key] ?? '');
      const row = worksheet.addRow(rowVals);
      row.height = 20;

      // Striped row background
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    // Auto Column Widths
    worksheet.columns.forEach((col, idx) => {
      const minWidth = columns[idx]?.width || 15;
      col.width = minWidth;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}

export const reportService = new ReportService();
