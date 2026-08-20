import ExcelJS from 'exceljs';
import { db } from '../database/db';
import { evaluationService, type ClassEvaluationSummary } from './evaluation.service';
import { evaluationProfileService } from './evaluation-profile.service';
import { escapeFormulaInjection } from '../excel/excel.sanitizer';
import { formatDateVietnamese, getTodayDateString } from '../../shared/utilities/date';
import type { EvaluationPeriodCode } from '../database/types';

export class EvaluationExportService {
  /**
   * Xuất toàn bộ Bảng Tổng Hợp Đánh Giá của Lớp ra file Excel .xlsx
   */
  async exportEvaluationToExcel(
    classId: string,
    academicYearId: string,
    periodCode: EvaluationPeriodCode
  ): Promise<{ blob: Blob; filename: string }> {
    const summary: ClassEvaluationSummary = await evaluationService.getClassEvaluationSummary(
      classId,
      academicYearId,
      periodCode
    );

    const teacher = await db.teacherProfiles.toCollection().first();
    const schoolName = teacher ? teacher.schoolName : 'Trường Phổ Thông';
    const teacherName = teacher ? teacher.fullName : 'Giáo viên Chủ nhiệm';

    const year = await db.academicYears.get(academicYearId);
    const yearName = year ? year.name : 'Năm học hiện tại';

    const periods = evaluationProfileService.getEvaluationPeriods(summary.regulationCode);
    const currentPeriodObj = periods.find((p) => p.code === periodCode);
    const periodName = currentPeriodObj ? currentPeriodObj.name : periodCode;
    const profileName = evaluationProfileService.getProfileDisplayName(summary.regulationCode);

    const workbook = new ExcelJS.Workbook();
    const sheetName = `DanhGia_${summary.className}_${periodCode}`.substring(0, 31);
    const sheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });

    // 1. School Header
    sheet.getCell('A1').value = schoolName.toUpperCase();
    sheet.getCell('A1').font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell('A2').value = `Lớp: ${summary.className} • Khối: ${summary.grade}`;
    sheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true };

    // 2. Title Row
    sheet.mergeCells('A4:M4');
    const titleCell = sheet.getCell('A4');
    titleCell.value = `BẢNG TỔNG HỢP ĐÁNH GIÁ HỌC SINH — ${periodName.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(4).height = 26;

    // 3. Subtitle Row
    sheet.mergeCells('A5:M5');
    const subCell = sheet.getCell('A5');
    subCell.value = `${profileName} • Năm học: ${yearName} • Sĩ số: ${summary.totalStudents} học sinh`;
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 4. Headers Definition
    const headerRowIdx = 7;
    let headers: string[] = [];

    if (summary.regulationCode === 'TT27_2020_PRIMARY') {
      headers = [
        'STT',
        'Mã học sinh',
        'Họ và tên',
        'Giới tính',
        'Ngày sinh',
        'Môn học & HĐGD',
        'Điểm Tiếng Việt',
        'Điểm Toán',
        'Phẩm chất chủ yếu',
        'Năng lực chung',
        'Năng lực đặc thù',
        'Tổng hợp cuối năm',
        'Trạng thái',
      ];
    } else {
      headers = [
        'STT',
        'Mã học sinh',
        'Họ và tên',
        'Giới tính',
        'Ngày sinh',
        'Môn nhận xét',
        'Kết quả rèn luyện',
        'Kết quả học tập',
        'Nhận xét GVCN',
        'Trạng thái',
      ];
    }

    const headerRow = sheet.getRow(headerRowIdx);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 28;

    // 5. Data Rows
    let currentRowIdx = 8;
    for (let idx = 0; idx < summary.roster.length; idx++) {
      const item = summary.roster[idx]!;
      const row = sheet.getRow(currentRowIdx);

      const stt = item.rollNumber || idx + 1;
      const code = escapeFormulaInjection(item.student.studentCode);
      const name = escapeFormulaInjection(item.student.fullName);
      const gender = item.student.gender;
      const dob = item.student.dateOfBirth ? formatDateVietnamese(item.student.dateOfBirth) : '';
      const statusText = item.status === 'FINALIZED' ? 'Đã khóa sổ' : item.status === 'DRAFT' ? 'Bản nháp' : 'Chưa nhập';

      if (summary.regulationCode === 'TT27_2020_PRIMARY') {
        const ev = item.evaluation;
        const overall = ev?.overallEducationLevel ? evaluationProfileService.getLevelLabel(ev.overallEducationLevel, 'SUMMARY') : '';

        row.getCell(1).value = stt;
        row.getCell(2).value = String(code);
        row.getCell(3).value = String(name);
        row.getCell(4).value = gender;
        row.getCell(5).value = dob;
        row.getCell(6).value = ''; // Chi tiết môn
        row.getCell(7).value = ''; // Điểm TV
        row.getCell(8).value = ''; // Điểm Toán
        row.getCell(9).value = ''; // Phẩm chất
        row.getCell(10).value = ''; // Năng lực chung
        row.getCell(11).value = ''; // Năng lực đặc thù
        row.getCell(12).value = overall;
        row.getCell(13).value = statusText;
      } else {
        const ev = item.evaluation;
        const conduct = ev?.conductLevel ? evaluationProfileService.getLevelLabel(ev.conductLevel, 'CONDUCT') : '';
        const learning = ev?.overallLearningLevel ? evaluationProfileService.getLevelLabel(ev.overallLearningLevel, 'LEARNING') : '';
        const homeroom = ev?.homeroomComment ? escapeFormulaInjection(ev.homeroomComment) : '';

        row.getCell(1).value = stt;
        row.getCell(2).value = String(code);
        row.getCell(3).value = String(name);
        row.getCell(4).value = gender;
        row.getCell(5).value = dob;
        row.getCell(6).value = ''; // Môn nhận xét
        row.getCell(7).value = conduct;
        row.getCell(8).value = learning;
        row.getCell(9).value = String(homeroom);
        row.getCell(10).value = statusText;
      }

      for (let c = 1; c <= headers.length; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (c === 1 || c === 2 || c === 4 || c === 5 || c === headers.length) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle' };
        }
      }

      currentRowIdx++;
    }

    // 6. Signatures Row
    currentRowIdx += 2;
    sheet.getCell(`B${currentRowIdx}`).value = 'HIỆU TRƯỞNG';
    sheet.getCell(`B${currentRowIdx}`).font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell(`B${currentRowIdx}`).alignment = { horizontal: 'center' };

    const signCol = summary.regulationCode === 'TT27_2020_PRIMARY' ? 'K' : 'H';
    const dateStr = formatDateVietnamese(getTodayDateString());
    sheet.getCell(`${signCol}${currentRowIdx - 1}`).value = `Ngày xuất: ${dateStr}`;
    sheet.getCell(`${signCol}${currentRowIdx - 1}`).font = { name: 'Arial', size: 9, italic: true };
    sheet.getCell(`${signCol}${currentRowIdx - 1}`).alignment = { horizontal: 'center' };

    sheet.getCell(`${signCol}${currentRowIdx}`).value = 'GIÁO VIÊN CHỦ NHIỆM';
    sheet.getCell(`${signCol}${currentRowIdx}`).font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell(`${signCol}${currentRowIdx}`).alignment = { horizontal: 'center' };

    sheet.getCell(`${signCol}${currentRowIdx + 4}`).value = teacherName;
    sheet.getCell(`${signCol}${currentRowIdx + 4}`).font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell(`${signCol}${currentRowIdx + 4}`).alignment = { horizontal: 'center' };

    // Auto Column Widths
    sheet.columns.forEach((column) => {
      let maxLen = 10;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const val = cell.value ? String(cell.value) : '';
        if (val.length > maxLen && val.length < 50) maxLen = val.length;
      });
      column.width = maxLen + 3;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const cleanClassName = summary.className.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `DanhGia_${cleanClassName}_${periodCode}_${getTodayDateString()}.xlsx`;

    return { blob, filename };
  }
}

export const evaluationExportService = new EvaluationExportService();
