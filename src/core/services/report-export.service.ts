import ExcelJS from 'exceljs';
import type { FullReportViewModel } from './report-aggregation.service';
import type { TeacherProfile } from '../database/types';
import { formatDateVietnamese, getTodayDateString } from '../../shared/utilities/date';

export class ReportExportService {
  /**
   * Xuất file Excel (.xlsx) đa sheet chuyên nghiệp với ExcelJS
   */
  async exportFullReportToExcel(
    report: FullReportViewModel,
    teacher?: TeacherProfile | null
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = teacher?.fullName || 'Sổ Chủ Nhiệm Việt Offline';
    workbook.lastModifiedBy = teacher?.fullName || 'Giáo viên';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };

    const titleFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };

    // ==========================================
    // SHEET 1: TỔNG HỢP & KPI
    // ==========================================
    const ws1 = workbook.addWorksheet('Tổng Hợp KPI');
    ws1.views = [{ showGridLines: true }];

    // Header Title
    ws1.mergeCells('A1:F1');
    const titleRow = ws1.getCell('A1');
    titleRow.value = `BÁO CÁO TỔNG HỢP THI ĐUA & CHUYÊN CẦN - ${report.className.toUpperCase()}`;
    titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = titleFill;
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 36;

    // Subtitle Info
    ws1.getCell('A2').value = `Năm học: ${report.academicYearName} | Thời gian: ${formatDateVietnamese(report.filter.startDate)} - ${formatDateVietnamese(report.filter.endDate)}`;
    ws1.getCell('A2').font = { italic: true, size: 10 };
    ws1.getCell('A3').value = `Giáo viên phụ trách: ${teacher?.fullName || 'Giáo viên chủ nhiệm'} | Ngày xuất: ${formatDateVietnamese(getTodayDateString())}`;
    ws1.getCell('A3').font = { italic: true, size: 10 };

    // KPI Section Header
    ws1.getCell('A5').value = 'BẢNG CHỈ SỐ KPI CHÍNH';
    ws1.getCell('A5').font = { bold: true, size: 12, color: { argb: 'FF1E40AF' } };

    const kpiRows = [
      ['Chỉ số thống kê', 'Giá trị hiện tại', 'Kỳ trước', 'Thay đổi (+/-)', 'Tỷ lệ tăng/giảm'],
      ['Sĩ số học sinh hoạt động', report.kpis.activeStudentsCount.current, report.kpis.activeStudentsCount.previous ?? '—', report.kpis.activeStudentsCount.delta ?? '—', report.kpis.activeStudentsCount.percentChange !== null ? `${report.kpis.activeStudentsCount.percentChange}%` : '—'],
      ['Tỷ lệ chuyên cần', `${report.kpis.attendanceRate.current}%`, report.kpis.attendanceRate.previous !== undefined ? `${report.kpis.attendanceRate.previous}%` : '—', report.kpis.attendanceRate.delta !== undefined ? `${report.kpis.attendanceRate.delta}%` : '—', report.kpis.attendanceRate.percentChange !== null ? `${report.kpis.attendanceRate.percentChange}%` : '—'],
      ['Tổng điểm cộng (+)', report.kpis.meritPoints.current, report.kpis.meritPoints.previous ?? '—', report.kpis.meritPoints.delta ?? '—', report.kpis.meritPoints.percentChange !== null ? `${report.kpis.meritPoints.percentChange}%` : '—'],
      ['Tổng điểm trừ (-)', report.kpis.demeritPoints.current, report.kpis.demeritPoints.previous ?? '—', report.kpis.demeritPoints.delta ?? '—', report.kpis.demeritPoints.percentChange !== null ? `${report.kpis.demeritPoints.percentChange}%` : '—'],
      ['Điểm thi đua ròng', report.kpis.netPoints.current, report.kpis.netPoints.previous ?? '—', report.kpis.netPoints.delta ?? '—', report.kpis.netPoints.percentChange !== null ? `${report.kpis.netPoints.percentChange}%` : '—'],
      ['Tỷ lệ tương tác lớp học', `${report.kpis.engagementRate.current}%`, report.kpis.engagementRate.previous !== undefined ? `${report.kpis.engagementRate.previous}%` : '—', report.kpis.engagementRate.delta !== undefined ? `${report.kpis.engagementRate.delta}%` : '—', report.kpis.engagementRate.percentChange !== null ? `${report.kpis.engagementRate.percentChange}%` : '—'],
      ['Học sinh thăng cấp', report.kpis.promotedStudentsCount.current, report.kpis.promotedStudentsCount.previous ?? '—', report.kpis.promotedStudentsCount.delta ?? '—', report.kpis.promotedStudentsCount.percentChange !== null ? `${report.kpis.promotedStudentsCount.percentChange}%` : '—'],
      ['Danh hiệu được trao', report.kpis.honorsCount.current, report.kpis.honorsCount.previous ?? '—', report.kpis.honorsCount.delta ?? '—', report.kpis.honorsCount.percentChange !== null ? `${report.kpis.honorsCount.percentChange}%` : '—'],
    ];

    kpiRows.forEach((r, idx) => {
      const row = ws1.addRow(r);
      if (idx === 0) {
        row.font = { bold: true };
        row.eachCell((cell) => {
          cell.fill = headerFill;
          cell.border = borderStyle;
        });
      } else {
        row.eachCell((cell) => {
          cell.border = borderStyle;
        });
      }
    });

    // Insights Section
    ws1.addRow([]);
    const insTitleRow = ws1.addRow(['NHẬN XÉT & PHÁT HIỆN TỰ ĐỘNG']);
    insTitleRow.font = { bold: true, size: 12, color: { argb: 'FF1E40AF' } };

    report.insights.forEach((ins, idx) => {
      const r = ws1.addRow([`${idx + 1}. [${ins.category}] ${ins.text}`]);
      r.getCell(1).font = { italic: true };
    });

    ws1.columns = [
      { width: 30 },
      { width: 18 },
      { width: 15 },
      { width: 18 },
      { width: 20 },
      { width: 15 },
    ];

    // ==========================================
    // SHEET 2: CHI TIẾT HỌC SINH
    // ==========================================
    const ws2 = workbook.addWorksheet('Danh Sách Học Sinh');
    ws2.views = [{ showGridLines: true }];

    ws2.addRow([`DANH SÁCH CHI TIẾT HỌC SINH - ${report.className.toUpperCase()}`]);
    ws2.getCell('A1').font = { bold: true, size: 14 };

    const studentTableHeaders = [
      'STT',
      'Mã học sinh',
      'Họ và tên',
      'Cấp bậc hiện tại',
      'Tương tác (lượt)',
      'Ghi chú',
    ];
    const sHeaderRow = ws2.addRow(studentTableHeaders);
    sHeaderRow.font = { bold: true };
    sHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.border = borderStyle;
    });

    report.studentsList.forEach((st, idx) => {
      const levelItem = report.rankDistribution.levels.find((l) =>
        l.students.some((s) => s.id === st.id)
      );
      const engItem = report.engagement.studentRanking.find((e) => e.studentId === st.id);

      const r = ws2.addRow([
        idx + 1,
        st.studentCode,
        st.fullName,
        levelItem ? `${levelItem.name} (Cấp ${levelItem.level})` : 'Binh nhì',
        engItem ? engItem.interactionCount : 0,
        '',
      ]);
      r.eachCell((cell) => {
        cell.border = borderStyle;
      });
    });

    ws2.columns = [
      { width: 8 },
      { width: 16 },
      { width: 28 },
      { width: 24 },
      { width: 18 },
      { width: 25 },
    ];

    // ==========================================
    // SHEET 3: CHUYÊN CẦN THEO NGÀY
    // ==========================================
    const ws3 = workbook.addWorksheet('Chuyên Cần Theo Ngày');
    ws3.views = [{ showGridLines: true }];

    ws3.addRow([`BÁO CÁO CHUYÊN CẦN THEO NGÀY - ${report.className.toUpperCase()}`]);
    ws3.getCell('A1').font = { bold: true, size: 14 };

    const attHeaders = ['STT', 'Ngày học', 'Có mặt', 'Đi muộn', 'Nghỉ có phép', 'Nghỉ không phép', 'Tổng sĩ số', 'Tỷ lệ chuyên cần'];
    const attHeaderRow = ws3.addRow(attHeaders);
    attHeaderRow.font = { bold: true };
    attHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.border = borderStyle;
    });

    report.attendanceTrend.forEach((pt, idx) => {
      const r = ws3.addRow([
        idx + 1,
        pt.label,
        pt.present,
        pt.late,
        pt.excused,
        pt.unexcused,
        pt.total,
        `${pt.rate}%`,
      ]);
      r.eachCell((cell) => {
        cell.border = borderStyle;
      });
    });

    ws3.columns = [
      { width: 8 },
      { width: 18 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 18 },
      { width: 14 },
      { width: 20 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Xuất file CSV cho một chuỗi dữ liệu
   */
  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent = [
      '\uFEFF' + headers.join(','), // UTF-8 BOM for Excel Vietnamese Unicode support
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const reportExportService = new ReportExportService();
