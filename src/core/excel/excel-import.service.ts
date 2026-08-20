import ExcelJS from 'exceljs';
import { db } from '../database/db';
import { studentRepository } from '../repositories/student.repository';
import { parseExcelDate, sanitizeCellText, validateVietnamesePhone } from './excel.sanitizer';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';
import { getTodayDateString } from '../../shared/utilities/date';
import type { Student, ClassEnrollment, ParentContact, Gender, ClassRoom } from '../database/types';

export interface ImportRowData {
  rowIndex: number;
  rollNumber?: number;
  studentCode?: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  className?: string; // Tên lớp được chỉ định cho học sinh
  ethnicity?: string;
  address?: string;
  parentName?: string;
  relationship?: string;
  parentPhone?: string;
  medicalNote?: string;
  isValid: boolean;
  errors: string[];
}

export interface ImportPreviewResult {
  sheetNames: string[];
  selectedSheet: string;
  totalRows: number;
  validRows: ImportRowData[];
  errorRows: ImportRowData[];
  detectedClassName?: string;
  classSummary: Record<string, number>;
}

interface ColumnMapping {
  stt?: number;
  studentCode?: number;
  fullName?: number;
  lastName?: number; // Họ đệm
  firstName?: number; // Tên
  className?: number; // Lớp
  gender?: number;
  dateOfBirth?: number;
  ethnicity?: number;
  address?: number;
  parentName?: number;
  relationship?: number;
  parentPhone?: number;
  medicalNote?: number;
}

export function extractClassNameFromText(text?: string | null): string | undefined {
  if (!text || typeof text !== 'string') return undefined;
  const clean = text.trim();
  // Regex to match "Lớp 1A1", "Lớp: 1A2", "Lớp 10A1", "12A3", "Khối 1 - Lớp 1A2"
  const match = clean.match(/(?:lớp|lop|khối|khoi|class)[\s:]*([0-9]{1,2}\s*[a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1].replace(/\s+/g, '').toUpperCase();
  }
  // Direct class code pattern: e.g. "1A1", "1A2", "10A1", "12B", "6A"
  const directMatch = clean.match(/^([0-9]{1,2}[a-zA-Z][a-zA-Z0-9_-]*)$/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1].toUpperCase();
  }
  return undefined;
}

export function detectColumnMapping(row: ExcelJS.Row): ColumnMapping {
  const mapping: ColumnMapping = {};
  const maxCol = Math.max(row.cellCount + 5, 30);

  for (let c = 1; c <= maxCol; c++) {
    const rawVal = sanitizeCellText(row.getCell(c).value).toLowerCase();
    if (!rawVal) continue;

    if (!mapping.stt && (rawVal === 'stt' || rawVal.includes('số tt') || rawVal.includes('số thứ tự') || rawVal === 'no.' || rawVal === 'no')) {
      mapping.stt = c;
    } else if (!mapping.studentCode && (rawVal.includes('mã học sinh') || rawVal.includes('mã hs') || rawVal.includes('mã định danh') || rawVal.includes('mã số') || rawVal === 'mã' || rawVal.includes('student code') || rawVal === 'code')) {
      mapping.studentCode = c;
    } else if (!mapping.fullName && (rawVal.includes('họ và tên') || rawVal.includes('họ tên') || rawVal.includes('họ và tên học sinh') || rawVal.includes('tên học sinh') || rawVal === 'full name' || rawVal.includes('họ tên (*)'))) {
      mapping.fullName = c;
    } else if (!mapping.lastName && (rawVal.includes('họ và chữ lót') || rawVal.includes('họ đệm') || rawVal.includes('họ lót') || rawVal === 'họ')) {
      mapping.lastName = c;
    } else if (!mapping.firstName && (rawVal === 'tên' || rawVal === 'tên hs' || rawVal === 'first name')) {
      mapping.firstName = c;
    } else if (!mapping.className && (rawVal === 'lớp' || rawVal.includes('lớp học') || rawVal.includes('tên lớp') || rawVal.includes('khối/lớp') || rawVal.includes('khối lớp') || rawVal === 'class' || rawVal === 'grade')) {
      mapping.className = c;
    } else if (!mapping.gender && (rawVal.includes('giới tính') || rawVal.includes('phái') || rawVal.includes('nam/nữ') || rawVal === 'gender' || rawVal === 'sex' || rawVal === 'nữ')) {
      mapping.gender = c;
    } else if (!mapping.dateOfBirth && (rawVal.includes('ngày sinh') || rawVal.includes('ngày, tháng, năm sinh') || rawVal.includes('ngày tháng năm sinh') || rawVal.includes('ngaysinh') || rawVal.includes('dob') || rawVal.includes('birth'))) {
      mapping.dateOfBirth = c;
    } else if (!mapping.ethnicity && (rawVal.includes('dân tộc') || rawVal.includes('ethnicity'))) {
      mapping.ethnicity = c;
    } else if (!mapping.address && (rawVal.includes('địa chỉ') || rawVal.includes('nơi ở') || rawVal.includes('hộ khẩu') || rawVal.includes('thường trú') || rawVal.includes('chỗ ở') || rawVal.includes('address'))) {
      mapping.address = c;
    } else if (!mapping.parentName && (rawVal.includes('họ tên phụ huynh') || rawVal.includes('họ tên cha') || rawVal.includes('họ tên mẹ') || rawVal.includes('họ tên cha/mẹ') || rawVal.includes('phụ huynh') || rawVal.includes('người giám hộ') || rawVal.includes('cha/mẹ') || rawVal === 'parent')) {
      mapping.parentName = c;
    } else if (!mapping.relationship && (rawVal.includes('quan hệ') || rawVal.includes('mối quan hệ') || rawVal.includes('relation'))) {
      mapping.relationship = c;
    } else if (!mapping.parentPhone && (rawVal.includes('số điện thoại') || rawVal.includes('điện thoại') || rawVal.includes('sđt') || rawVal.includes('phone') || rawVal.includes('sđt phụ huynh'))) {
      mapping.parentPhone = c;
    } else if (!mapping.medicalNote && (rawVal.includes('ghi chú') || rawVal.includes('sức khỏe') || rawVal.includes('medical') || rawVal.includes('note'))) {
      mapping.medicalNote = c;
    }
  }

  // Fallback defaults if template had no standard header mapping detected
  if (!mapping.fullName && !mapping.firstName) {
    mapping.stt = 1;
    mapping.studentCode = 2;
    mapping.fullName = 3;
    mapping.gender = 4;
    mapping.dateOfBirth = 5;
    mapping.ethnicity = 6;
    mapping.address = 7;
    mapping.parentName = 8;
    mapping.relationship = 9;
    mapping.parentPhone = 10;
    mapping.medicalNote = 11;
  }

  return mapping;
}

export class ExcelImportService {
  /**
   * Xuất file mẫu Excel Mau_Nhap_Hoc_Sinh.xlsx
   */
  async generateImportTemplate(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Danh sách học sinh', {
      views: [{ showGridLines: true }],
    });

    // Style Header Title Row
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BẢNG NHẬP DỮ LIỆU HỌC SINH MẪU (SỔ CHỦ NHIỆM VIỆT OFFLINE)';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Subtitle Instructions
    sheet.mergeCells('A2:L2');
    const subCell = sheet.getCell('A2');
    subCell.value = 'Lưu ý: Các cột đánh dấu (*) là bắt buộc. Ngày sinh dạng DD/MM/YYYY. Số điện thoại 10 chữ số. Cột Lớp có thể để trống (sẽ lấy lớp chọn tại giao diện).';
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // Column Headers
    const headers = [
      'STT',
      'Mã học sinh',
      'Họ và tên (*)',
      'Lớp',
      'Giới tính (*)',
      'Ngày sinh (*)',
      'Dân tộc',
      'Địa chỉ',
      'Họ tên phụ huynh',
      'Quan hệ',
      'Số điện thoại',
      'Ghi chú sức khỏe',
    ];

    const headerRow = sheet.getRow(3);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 24;

    // Sample Rows
    const sampleRows = [
      [1, 'HS20260001', 'Nguyễn Văn An', '1A1', 'Nam', '15/05/2008', 'Kinh', 'Quận 1, TP.HCM', 'Nguyễn Văn Bình', 'Cha', '0912345678', 'Sức khỏe tốt'],
      [2, 'HS20260002', 'Trần Thị Thu Thảo', '1A2', 'Nữ', '20/03/2008', 'Kinh', 'Quận 3, TP.HCM', 'Trần Văn Cường', 'Cha', '0987654321', 'Dị ứng đậu phụ'],
    ];

    sampleRows.forEach((row, idx) => {
      const r = sheet.getRow(4 + idx);
      row.forEach((val, colIdx) => {
        r.getCell(colIdx + 1).value = val;
      });
    });

    // Auto Column Widths
    sheet.columns.forEach((col) => {
      col.width = 18;
    });
    sheet.getColumn(3).width = 24; // Họ tên
    sheet.getColumn(4).width = 12; // Lớp
    sheet.getColumn(8).width = 28; // Địa chỉ

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Đọc và Validate toàn bộ dòng trong file Excel. KHÔNG ghi vào database ở bước này!
   */
  async parseAndValidateImportFile(buffer: ArrayBuffer): Promise<ImportPreviewResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheetNames = workbook.worksheets.map((w) => w.name);
    const activeSheet = workbook.worksheets[0];
    if (!activeSheet) {
      throw new Error('File Excel không có dữ liệu sheet.');
    }

    const rows: ImportRowData[] = [];
    const seenCodes = new Set<string>();
    const classSummary: Record<string, number> = {};

    // 1. Detect Class from Sheet Name
    let detectedClassName = extractClassNameFromText(activeSheet.name);

    // 2. Scan first few rows for Sheet Title and Header Row
    let headerRowIdx = 1;
    for (let r = 1; r <= Math.min(6, activeSheet.rowCount); r++) {
      const row = activeSheet.getRow(r);

      // Check title for class name (e.g., "DANH SÁCH LỚP 1A2")
      if (!detectedClassName) {
        for (let c = 1; c <= Math.min(row.cellCount, 5); c++) {
          const val = sanitizeCellText(row.getCell(c).value);
          const foundClass = extractClassNameFromText(val);
          if (foundClass) {
            detectedClassName = foundClass;
            break;
          }
        }
      }

      const c1 = sanitizeCellText(row.getCell(1).value).toLowerCase();
      const c2 = sanitizeCellText(row.getCell(2).value).toLowerCase();
      const c3 = sanitizeCellText(row.getCell(3).value).toLowerCase();
      const c4 = sanitizeCellText(row.getCell(4).value).toLowerCase();
      const c5 = sanitizeCellText(row.getCell(5).value).toLowerCase();

      if (
        c1.includes('stt') ||
        c2.includes('mã') ||
        c3.includes('họ') ||
        c3.includes('tên') ||
        c4.includes('giới') ||
        c4.includes('lớp') ||
        c5.includes('giới')
      ) {
        headerRowIdx = r;
        break;
      }
    }

    const headerRow = activeSheet.getRow(headerRowIdx);
    const colMap = detectColumnMapping(headerRow);

    for (let r = headerRowIdx + 1; r <= activeSheet.rowCount; r++) {
      const row = activeSheet.getRow(r);
      const sttRaw = colMap.stt ? row.getCell(colMap.stt).value : undefined;
      const codeRaw = colMap.studentCode ? sanitizeCellText(row.getCell(colMap.studentCode).value) : '';

      let nameRaw = '';
      if (colMap.fullName) {
        nameRaw = sanitizeCellText(row.getCell(colMap.fullName).value);
      } else if (colMap.lastName && colMap.firstName) {
        const last = sanitizeCellText(row.getCell(colMap.lastName).value);
        const first = sanitizeCellText(row.getCell(colMap.firstName).value);
        nameRaw = `${last} ${first}`.trim();
      }

      const genderRaw = colMap.gender ? sanitizeCellText(row.getCell(colMap.gender).value) : '';
      const dobRaw = colMap.dateOfBirth ? row.getCell(colMap.dateOfBirth).value : undefined;
      const ethRaw = colMap.ethnicity ? sanitizeCellText(row.getCell(colMap.ethnicity).value) : '';
      const addrRaw = colMap.address ? sanitizeCellText(row.getCell(colMap.address).value) : '';
      const parentNameRaw = colMap.parentName ? sanitizeCellText(row.getCell(colMap.parentName).value) : '';
      const relRaw = colMap.relationship ? sanitizeCellText(row.getCell(colMap.relationship).value) : '';
      const phoneRaw = colMap.parentPhone ? sanitizeCellText(row.getCell(colMap.parentPhone).value) : '';
      const medRaw = colMap.medicalNote ? sanitizeCellText(row.getCell(colMap.medicalNote).value) : '';

      // Extract row-level class name if column exists
      let rowClassName: string | undefined = undefined;
      if (colMap.className) {
        const classCellRaw = sanitizeCellText(row.getCell(colMap.className).value);
        if (classCellRaw) {
          const parsed = extractClassNameFromText(classCellRaw) || classCellRaw.trim();
          if (parsed) {
            rowClassName = parsed;
          }
        }
      }
      if (!rowClassName && detectedClassName) {
        rowClassName = detectedClassName;
      }

      // Skip completely empty rows or repeated header rows
      const nameLower = nameRaw.toLowerCase();
      if (!nameRaw && !codeRaw && !genderRaw && !dobRaw) {
        continue;
      }
      if (nameLower.includes('họ và tên') || nameLower.includes('giới tính') || nameLower.includes('ngày sinh')) {
        continue;
      }

      const rowErrors: string[] = [];

      // 1. Full name check
      if (!nameRaw || nameRaw.length < 2) {
        rowErrors.push('Họ và tên bắt buộc nhập (tối thiểu 2 ký tự).');
      }

      // 2. Gender check
      let normalizedGender: Gender = 'Nam';
      const gLower = genderRaw.toLowerCase();
      if (gLower === 'nữ' || gLower === 'nu' || gLower === 'female' || gLower === 'f') {
        normalizedGender = 'Nữ';
      } else if (gLower === 'khác' || gLower === 'khac' || gLower === 'other') {
        normalizedGender = 'Khác';
      } else if (gLower !== 'nam' && gLower !== 'male' && gLower !== 'm' && gLower !== '') {
        rowErrors.push(`Giới tính "${genderRaw}" không hợp lệ (chỉ chấp nhận: Nam, Nữ, Khác).`);
      }

      // 3. Date of birth check
      const parsedDob = parseExcelDate(dobRaw);
      if (!parsedDob) {
        rowErrors.push('Ngày sinh không hợp lệ (định dạng chuẩn: DD/MM/YYYY).');
      }

      // 4. Student code checks (file duplicate & database duplicate)
      const studentCode = codeRaw ? codeRaw.trim() : undefined;
      if (studentCode) {
        if (seenCodes.has(studentCode.toLowerCase())) {
          rowErrors.push(`Mã học sinh "${studentCode}" bị trùng lặp trong chính file Excel này.`);
        } else {
          seenCodes.add(studentCode.toLowerCase());
          const existing = await studentRepository.findByStudentCode(studentCode);
          if (existing) {
            rowErrors.push(`Mã học sinh "${studentCode}" đã tồn tại trên hệ thống.`);
          }
        }
      }

      // 5. Parent phone check
      if (phoneRaw && !validateVietnamesePhone(phoneRaw)) {
        rowErrors.push(`Số điện thoại phụ huynh "${phoneRaw}" không đúng định dạng SĐT Việt Nam.`);
      }

      const rollNum = typeof sttRaw === 'number' ? sttRaw : undefined;

      const isRowValid = rowErrors.length === 0;

      if (isRowValid && rowClassName) {
        classSummary[rowClassName] = (classSummary[rowClassName] || 0) + 1;
      }

      rows.push({
        rowIndex: r,
        rollNumber: rollNum,
        studentCode,
        fullName: nameRaw,
        gender: normalizedGender,
        dateOfBirth: parsedDob || '2008-01-01',
        className: rowClassName,
        ethnicity: ethRaw || 'Kinh',
        address: addrRaw,
        parentName: parentNameRaw,
        relationship: relRaw || 'Phụ huynh',
        parentPhone: phoneRaw,
        medicalNote: medRaw,
        isValid: isRowValid,
        errors: rowErrors,
      });
    }

    const validRows = rows.filter((r) => r.isValid);
    const errorRows = rows.filter((r) => !r.isValid);

    // If single class discovered across rows, refine detectedClassName
    const summaryKeys = Object.keys(classSummary);
    if (!detectedClassName && summaryKeys.length === 1) {
      detectedClassName = summaryKeys[0];
    }

    return {
      sheetNames,
      selectedSheet: activeSheet.name,
      totalRows: rows.length,
      validRows,
      errorRows,
      detectedClassName,
      classSummary,
    };
  }

  /**
   * Thực thi Nhập danh sách học sinh vào IndexedDB trong Dexie Transaction
   */
  async executeImport(
    preview: ImportPreviewResult,
    defaultClassId: string,
    onProgress?: (percent: number) => void
  ): Promise<{ importedCount: number }> {
    if (preview.validRows.length === 0) {
      throw new Error('Không có dòng dữ liệu hợp lệ để nhập vào hệ thống.');
    }

    const nowISO = new Date().toISOString();
    const today = getTodayDateString();
    let count = 0;

    // Pre-calculate code counter & set outside transaction to avoid Dexie transaction timeouts
    const yearPrefix = new Date().getFullYear();
    const codePrefix = `HS${yearPrefix}`;
    let codeCount = await db.students.count();

    const existingStudents = await db.students.toArray();
    const existingCodesSet = new Set(existingStudents.map((s) => s.studentCode.toLowerCase()));

    // Preload existing classes to match by name
    const existingClasses = await db.classes.toArray();
    const classMapByName = new Map<string, ClassRoom>();
    for (const c of existingClasses) {
      if (!c.deletedAt) {
        classMapByName.set(c.name.trim().toLowerCase(), c);
        classMapByName.set(`lớp ${c.name}`.trim().toLowerCase(), c);
        classMapByName.set(`lop ${c.name}`.trim().toLowerCase(), c);
      }
    }

    // Default class for academicYearId resolution
    const defaultClass = defaultClassId ? await db.classes.get(defaultClassId) : null;
    let targetAcademicYearId = defaultClass?.academicYearId;
    if (!targetAcademicYearId) {
      const activeYear = await db.academicYears.filter((y) => !y.deletedAt && y.isActive).first();
      targetAcademicYearId = activeYear?.id || (await db.academicYears.toCollection().first())?.id || 'default-year';
    }

    await db.runTransaction(
      'rw',
      [db.students, db.classEnrollments, db.parentContacts, db.classes, db.auditLogs],
      async () => {
        for (let i = 0; i < preview.validRows.length; i++) {
          const row = preview.validRows[i]!;

          // Determine target class for this student
          let targetClassIdForStudent = defaultClassId;
          const rowClass = row.className?.trim();
          if (rowClass) {
            const normalizedClassKey = rowClass.toLowerCase();
            const existingClass = classMapByName.get(normalizedClassKey);
            if (existingClass) {
              targetClassIdForStudent = existingClass.id;
            } else {
              // Auto-create the class so students are accurately enrolled in their class!
              const newClassId = crypto.randomUUID();
              const cleanName = rowClass.replace(/^(?:lớp|lop)\s*/i, '').trim();
              const gradeMatch = cleanName.match(/^([0-9]{1,2})/);
              const gradeNum = gradeMatch ? parseInt(gradeMatch[1]!, 10) : undefined;

              const newClass: ClassRoom = {
                id: newClassId,
                academicYearId: targetAcademicYearId!,
                name: cleanName,
                grade: gradeNum || 1,
                status: 'Active',
                createdAt: nowISO,
                updatedAt: nowISO,
                deletedAt: null,
              };
              await db.classes.add(newClass);
              classMapByName.set(normalizedClassKey, newClass);
              classMapByName.set(cleanName.toLowerCase(), newClass);
              classMapByName.set(`lớp ${cleanName}`.toLowerCase(), newClass);
              targetClassIdForStudent = newClassId;
            }
          }

          // Generate student code synchronously in-memory
          let code = row.studentCode?.trim();
          if (!code) {
            while (true) {
              codeCount++;
              const candidate = `${codePrefix}${String(codeCount).padStart(4, '0')}`;
              if (!existingCodesSet.has(candidate.toLowerCase())) {
                code = candidate;
                existingCodesSet.add(candidate.toLowerCase());
                break;
              }
            }
          }

          const studentId = crypto.randomUUID();
          const normalizedName = normalizeVietnameseText(row.fullName);

          const student: Student = {
            id: studentId,
            studentCode: code,
            fullName: row.fullName,
            normalizedName,
            gender: row.gender,
            dateOfBirth: row.dateOfBirth,
            ethnicity: row.ethnicity,
            address: row.address,
            medicalNote: row.medicalNote,
            createdAt: nowISO,
            updatedAt: nowISO,
            deletedAt: null,
          };
          await db.students.add(student);

          // Add Class Enrollment
          const enrollment: ClassEnrollment = {
            id: crypto.randomUUID(),
            classId: targetClassIdForStudent,
            studentId,
            rollNumber: row.rollNumber || i + 1,
            joinedAt: today,
            leftAt: null,
            status: 'Active',
            createdAt: nowISO,
            updatedAt: nowISO,
            deletedAt: null,
          };
          await db.classEnrollments.add(enrollment);

          // Add Parent Contact if provided
          if (row.parentName || row.parentPhone) {
            const parentContact: ParentContact = {
              id: crypto.randomUUID(),
              studentId,
              fullName: row.parentName || 'Chưa cập nhật',
              relation: row.relationship || 'Phụ huynh',
              phone: row.parentPhone || '',
              isPrimary: true,
              createdAt: nowISO,
              updatedAt: nowISO,
              deletedAt: null,
            };
            await db.parentContacts.add(parentContact);
          }

          count++;
          if (onProgress) {
            onProgress(Math.round(((i + 1) / preview.validRows.length) * 100));
          }
        }

        // Audit Log
        await db.auditLogs.add({
          id: crypto.randomUUID(),
          entityName: 'Student',
          recordId: defaultClassId,
          action: 'IMPORT_EXCEL',
          timestamp: nowISO,
          details: `Nhập thành công ${count} học sinh từ file Excel vào hệ thống`,
        });
      }
    );

    return { importedCount: count };
  }

  /**
   * Tạo file Excel chứa báo cáo danh sách các dòng bị lỗi
   */
  async generateErrorReportExcel(errorRows: ImportRowData[]): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Danh sách dòng lỗi', { views: [{ showGridLines: true }] });

    sheet.addRow(['Số dòng Excel', 'Họ và tên', 'Mã HS', 'Chi tiết lỗi gặp phải']);
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCDC2626' } };

    errorRows.forEach((r) => {
      sheet.addRow([r.rowIndex, r.fullName, r.studentCode || '', r.errors.join('; ')]);
    });

    sheet.columns.forEach((col) => {
      col.width = 20;
    });
    sheet.getColumn(4).width = 50;

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

export const excelImportService = new ExcelImportService();
