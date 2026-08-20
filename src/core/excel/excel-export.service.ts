import ExcelJS from 'exceljs';
import { db } from '../database/db';
import { escapeFormulaInjection } from './excel.sanitizer';
import { formatDateVietnamese, getTodayDateString } from '../../shared/utilities/date';
import type { Student, ClassEnrollment, ParentContact } from '../database/types';

export class ExcelExportService {
  /**
   * Xuất danh sách học sinh của 1 Lớp học ra file Excel .xlsx
   */
  async exportClassToExcel(classId: string): Promise<{ blob: Blob; filename: string }> {
    const cls = await db.classes.get(classId);
    if (!cls) throw new Error('Không tìm thấy thông tin lớp học.');

    const year = cls.academicYearId ? await db.academicYears.get(cls.academicYearId) : null;
    const yearName = year ? year.name : 'Năm học hiện tại';

    // Fetch active enrollments
    const enrollments = await db.classEnrollments
      .where('classId')
      .equals(classId)
      .filter((e) => e.status === 'Active' && !e.deletedAt)
      .toArray();

    const studentList: { student: Student; enrollment: ClassEnrollment; parent?: ParentContact }[] = [];

    for (const enr of enrollments) {
      const st = await db.students.get(enr.studentId);
      if (st && !st.deletedAt) {
        const parent = await db.parentContacts
          .where('studentId')
          .equals(st.id)
          .filter((p) => !p.deletedAt && p.isPrimary)
          .first();
        studentList.push({ student: st, enrollment: enr, parent });
      }
    }

    // Sort by rollNumber
    studentList.sort((a, b) => (a.enrollment.rollNumber || 999) - (b.enrollment.rollNumber || 999));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Lớp ${cls.name}`, { views: [{ showGridLines: true }] });

    // Title Row
    sheet.mergeCells('A1:K1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `DANH SÁCH HỌC SINH - LỚP ${cls.name.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    // Subtitle Row
    sheet.mergeCells('A2:K2');
    const subCell = sheet.getCell('A2');
    const todayStr = formatDateVietnamese(getTodayDateString());
    subCell.value = `${yearName} • Sĩ số: ${studentList.length} học sinh • Ngày xuất danh sách: ${todayStr}`;
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // Table Headers
    const headers = [
      'STT',
      'Mã học sinh',
      'Họ và tên',
      'Giới tính',
      'Ngày sinh',
      'Dân tộc',
      'Địa chỉ thường trú',
      'Họ tên phụ huynh',
      'Quan hệ',
      'Số điện thoại PH',
      'Ghi chú sức khỏe',
    ];

    const headerRow = sheet.getRow(4);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 24;

    // Data Rows
    studentList.forEach((item, idx) => {
      const row = sheet.getRow(5 + idx);

      const rowValues = [
        item.enrollment.rollNumber || idx + 1,
        escapeFormulaInjection(item.student.studentCode),
        escapeFormulaInjection(item.student.fullName),
        item.student.gender,
        formatDateVietnamese(item.student.dateOfBirth),
        escapeFormulaInjection(item.student.ethnicity || 'Kinh'),
        escapeFormulaInjection(item.student.address || ''),
        escapeFormulaInjection(item.parent?.fullName || ''),
        escapeFormulaInjection(item.parent?.relation || ''),
        escapeFormulaInjection(item.parent?.phone || ''),
        escapeFormulaInjection(item.student.medicalNote || ''),
      ];

      rowValues.forEach((val, colIdx) => {
        row.getCell(colIdx + 1).value = val as ExcelJS.CellValue;
      });

      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(5).alignment = { horizontal: 'center' };
      row.getCell(10).alignment = { horizontal: 'center' };
    });

    // Auto Column Widths
    sheet.columns.forEach((col) => {
      col.width = 18;
    });
    sheet.getColumn(1).width = 8;  // STT
    sheet.getColumn(3).width = 24; // Họ tên
    sheet.getColumn(7).width = 30; // Địa chỉ
    sheet.getColumn(8).width = 24; // Phụ huynh

    const filename = `DanhSachHocSinh_Lop${cls.name}_${getTodayDateString()}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return { blob, filename };
  }
}

export const excelExportService = new ExcelExportService();
