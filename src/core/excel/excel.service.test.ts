import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/db';
import { parseExcelDate, escapeFormulaInjection, validateVietnamesePhone } from './excel.sanitizer';
import { excelImportService } from './excel-import.service';
import { excelExportService } from './excel-export.service';

import type { Gender } from '../database/types';

describe('Excel Import/Export & Sanitizer Tests', () => {
  beforeEach(async () => {
    await db.students.clear();
    await db.classEnrollments.clear();
    await db.parentContacts.clear();
    await db.classes.clear();
    await db.auditLogs.clear();
  });

  it('1. Should convert Excel Serial Date number to YYYY-MM-DD string', () => {
    const parsed = parseExcelDate(39448);
    expect(parsed).toBe('2008-01-01');

    const parsedDmy = parseExcelDate('15/05/2008');
    expect(parsedDmy).toBe('2008-05-15');
  });

  it('2. Should escape Formula Injection characters to prevent malicious formula execution', () => {
    expect(escapeFormulaInjection('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(escapeFormulaInjection('+12345')).toBe("'+12345");
    expect(escapeFormulaInjection('@eval')).toBe("'@eval");
    expect(escapeFormulaInjection('Bình thường')).toBe('Bình thường');
  });

  it('3. Should validate Vietnamese phone numbers correctly', () => {
    expect(validateVietnamesePhone('0912345678')).toBe(true);
    expect(validateVietnamesePhone('0387654321')).toBe(true);
    expect(validateVietnamesePhone('12345')).toBe(false);
  });

  it('4. Should generate Excel template Blob with ExcelJS', async () => {
    const blob = await excelImportService.generateImportTemplate();
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(500);
  });

  it('5. Should parse and validate 50 imported student rows accurately in Dexie transaction', async () => {
    const classId = 'cls-test-10a1';
    await db.classes.add({
      id: classId,
      academicYearId: 'yr-1',
      name: '10A1',
      grade: 10,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const validRows = [];
    for (let i = 1; i <= 50; i++) {
      validRows.push({
        rowIndex: i + 3,
        rollNumber: i,
        studentCode: `HS2026${String(i).padStart(4, '0')}`,
        fullName: `Học Sinh Thứ ${i}`,
        gender: (i % 2 === 0 ? 'Nữ' : 'Nam') as Gender,
        dateOfBirth: '2008-01-15',
        ethnicity: 'Kinh',
        address: 'Quận 1, TP.HCM',
        parentName: `Phụ Huynh ${i}`,
        relationship: 'Cha',
        parentPhone: '0912345678',
        medicalNote: 'Bình thường',
        isValid: true,
        errors: [],
      });
    }

    const mockPreview = {
      sheetNames: ['Danh sách học sinh'],
      selectedSheet: 'Danh sách học sinh',
      totalRows: 50,
      classSummary: {},
      validRows,
      errorRows: [],
    };

    const res = await excelImportService.executeImport(mockPreview, classId);
    expect(res.importedCount).toBe(50);

    const countStudents = await db.students.count();
    expect(countStudents).toBe(50);

    const countEnrollments = await db.classEnrollments.count();
    expect(countEnrollments).toBe(50);

    const countParents = await db.parentContacts.count();
    expect(countParents).toBe(50);
  });

  it('6. Should export class active students to ExcelJS workbook successfully', async () => {
    const classId = 'cls-test-10a1';
    await db.classes.add({
      id: classId,
      academicYearId: 'yr-1',
      name: '10A1',
      grade: 10,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.students.add({
      id: 'st-1',
      studentCode: 'HS20260001',
      fullName: 'Nguyễn Văn An',
      normalizedName: 'nguyen van an',
      gender: 'Nam',
      dateOfBirth: '2008-05-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    await db.classEnrollments.add({
      id: 'enr-1',
      classId,
      studentId: 'st-1',
      rollNumber: 1,
      joinedAt: '2026-08-14',
      leftAt: null,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const exported = await excelExportService.exportClassToExcel(classId);
    expect(exported.blob).toBeDefined();
    expect(exported.filename).toContain('DanhSachHocSinh_Lop10A1');
    expect(exported.blob.size).toBeGreaterThan(500);
  });

  it('7. Should accurately assign students to their respective class from className in rows rather than defaulting to 1A1', async () => {
    // Seed 1A1 as default class, and 1A2 as secondary class
    const class1A1 = 'cls-1a1';
    const class1A2 = 'cls-1a2';
    await db.classes.bulkAdd([
      {
        id: class1A1,
        academicYearId: 'yr-1',
        name: '1A1',
        grade: 1,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
      {
        id: class1A2,
        academicYearId: 'yr-1',
        name: '1A2',
        grade: 1,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]);

    const mockPreview = {
      sheetNames: ['Danh sách học sinh'],
      selectedSheet: 'Danh sách học sinh',
      totalRows: 2,
      detectedClassName: '1A2',
      classSummary: { '1A2': 2 },
      validRows: [
        {
          rowIndex: 4,
          rollNumber: 1,
          studentCode: 'HS001',
          fullName: 'Nguyễn Văn Hải',
          gender: 'Nam' as Gender,
          dateOfBirth: '2018-02-10',
          className: '1A2',
          isValid: true,
          errors: [],
        },
        {
          rowIndex: 5,
          rollNumber: 2,
          studentCode: 'HS002',
          fullName: 'Lê Thị Mai',
          gender: 'Nữ' as Gender,
          dateOfBirth: '2018-05-15',
          className: '1A2',
          isValid: true,
          errors: [],
        },
      ],
      errorRows: [],
    };

    // Even if defaultClassId is passed as class1A1, rows have className '1A2'
    const res = await excelImportService.executeImport(mockPreview, class1A1);
    expect(res.importedCount).toBe(2);

    const enrollments = await db.classEnrollments.toArray();
    expect(enrollments.length).toBe(2);
    // Both students must be enrolled in class 1A2, NOT 1A1!
    expect(enrollments[0]?.classId).toBe(class1A2);
    expect(enrollments[1]?.classId).toBe(class1A2);
  });

  it('8. Should automatically create class when student row specifies a new class not in DB', async () => {
    const class1A1 = 'cls-1a1';
    await db.classes.add({
      id: class1A1,
      academicYearId: 'yr-1',
      name: '1A1',
      grade: 1,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const mockPreview = {
      sheetNames: ['Danh sách học sinh'],
      selectedSheet: 'Danh sách học sinh',
      totalRows: 1,
      detectedClassName: '2B',
      classSummary: { '2B': 1 },
      validRows: [
        {
          rowIndex: 4,
          rollNumber: 1,
          studentCode: 'HS003',
          fullName: 'Hoàng Anh Tuấn',
          gender: 'Nam' as Gender,
          dateOfBirth: '2017-09-20',
          className: '2B',
          isValid: true,
          errors: [],
        },
      ],
      errorRows: [],
    };

    const res = await excelImportService.executeImport(mockPreview, class1A1);
    expect(res.importedCount).toBe(1);

    const createdClass = await db.classes.where('name').equals('2B').first();
    expect(createdClass).toBeDefined();
    expect(createdClass?.name).toBe('2B');
    expect(createdClass?.grade).toBe(2);

    const enrollments = await db.classEnrollments.toArray();
    expect(enrollments[0]?.classId).toBe(createdClass?.id);
  });
});
