import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { Input } from '../../shared/components/Input';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/hooks/useToast';
import { reportService, type ReportColumn } from '../../core/services/report.service';
import { classRepository } from '../../core/repositories/class.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { db } from '../../core/database/db';
import { formatDateVietnamese, getTodayDateString } from '../../shared/utilities/date';
import type { ClassRoom, TeacherProfile, AcademicYear } from '../../core/database/types';
import { Download, Printer } from 'lucide-react';

export type ReportType =
  | 'attendance'
  | 'conduct'
  | 'birthdays'
  | 'support'
  | 'parent_logs'
  | 'class_summary';

export const ReportsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);

  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>(getTodayDateString());

  // Generated Data State
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [reportRows, setReportRows] = useState<Record<string, unknown>[]>([]);
  const [reportTitle, setReportTitle] = useState<string>('BÁO CÁO ĐIỂM DANH CHUYÊN CẦN');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadMetadata = React.useCallback(async () => {
    try {
      const profile = await db.teacherProfiles.toCollection().first();
      setTeacher(profile || null);

      const settings = await settingsRepository.getSettings();
      let yearId = settings.activeAcademicYearId;
      if (!yearId) {
        const year = await academicYearRepository.getCurrentYear();
        yearId = year?.id;
      }

      if (yearId) {
        const year = await academicYearRepository.findById(yearId);
        setActiveYear(year || null);

        const classes = await classRepository.findByAcademicYear(yearId);
        setClassList(classes);

        let activeClsId = classes[0]?.id || '';
        if (settings.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
          activeClsId = settings.activeClassId;
        }
        if (!selectedClassId) {
          setSelectedClassId(activeClsId);
        }
      }
    } catch (err) {
      console.error('Error loading report metadata:', err);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const generateReport = React.useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const currentClass = classList.find((c) => c.id === selectedClassId);
      const className = currentClass ? currentClass.name : '10A1';

      if (reportType === 'attendance') {
        setReportTitle(`BÁO CÁO ĐIỂM DANH CHUYÊN CẦN LỚP ${className}`);
        setColumns([
          { header: 'STT', key: 'stt', width: 8 },
          { header: 'Mã HS', key: 'studentCode', width: 15 },
          { header: 'Họ và tên', key: 'fullName', width: 25 },
          { header: 'Có mặt', key: 'present', width: 12 },
          { header: 'Vắng có phép', key: 'excused', width: 15 },
          { header: 'Vắng không phép', key: 'unexcused', width: 15 },
          { header: 'Đi muộn', key: 'late', width: 12 },
        ]);

        const enrollments = await db.classEnrollments
          .where('classId')
          .equals(selectedClassId)
          .filter((e) => e.status === 'Active' && !e.deletedAt)
          .toArray();

        const rows: Record<string, unknown>[] = [];
        let stt = 1;
        for (const enr of enrollments) {
          const st = await db.students.get(enr.studentId);
          if (st && !st.deletedAt) {
            const records = await db.attendanceRecords
              .where('studentId')
              .equals(st.id)
              .filter((r) => !r.deletedAt)
              .toArray();

            let present = 0;
            let excused = 0;
            let unexcused = 0;
            let late = 0;

            records.forEach((r) => {
              if (r.status === 'Present') present++;
              else if (r.status === 'ExcusedAbsence') excused++;
              else if (r.status === 'UnexcusedAbsence') unexcused++;
              else if (r.status === 'Late') late++;
            });

            rows.push({
              stt: stt++,
              studentCode: st.studentCode,
              fullName: st.fullName,
              present,
              excused,
              unexcused,
              late,
            });
          }
        }
        setReportRows(rows);
      } else if (reportType === 'birthdays') {
        setReportTitle(`DANH SÁCH SINH NHẬT HỌC SINH LỚP ${className}`);
        setColumns([
          { header: 'STT', key: 'stt', width: 8 },
          { header: 'Mã HS', key: 'studentCode', width: 15 },
          { header: 'Họ và tên', key: 'fullName', width: 25 },
          { header: 'Giới tính', key: 'gender', width: 12 },
          { header: 'Ngày sinh', key: 'dob', width: 15 },
          { header: 'Địa chỉ', key: 'address', width: 30 },
        ]);

        const enrollments = await db.classEnrollments
          .where('classId')
          .equals(selectedClassId)
          .filter((e) => e.status === 'Active' && !e.deletedAt)
          .toArray();

        const rows: Record<string, unknown>[] = [];
        let stt = 1;
        for (const enr of enrollments) {
          const st = await db.students.get(enr.studentId);
          if (st && !st.deletedAt) {
            rows.push({
              stt: stt++,
              studentCode: st.studentCode,
              fullName: st.fullName,
              gender: st.gender,
              dob: formatDateVietnamese(st.dateOfBirth),
              address: st.address || 'Chưa cập nhật',
            });
          }
        }
        setReportRows(rows);
      } else {
        // Fallback for other report types
        setReportTitle(`BÁO CÁO TỔNG HỢP LỚP ${className}`);
        setColumns([
          { header: 'STT', key: 'stt', width: 8 },
          { header: 'Mã HS', key: 'studentCode', width: 15 },
          { header: 'Họ và tên', key: 'fullName', width: 25 },
          { header: 'Trạng thái', key: 'status', width: 15 },
        ]);

        const enrollments = await db.classEnrollments
          .where('classId')
          .equals(selectedClassId)
          .filter((e) => e.status === 'Active' && !e.deletedAt)
          .toArray();

        const rows: Record<string, unknown>[] = [];
        let stt = 1;
        for (const enr of enrollments) {
          const st = await db.students.get(enr.studentId);
          if (st && !st.deletedAt) {
            rows.push({
              stt: stt++,
              studentCode: st.studentCode,
              fullName: st.fullName,
              status: enr.status,
            });
          }
        }
        setReportRows(rows);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, reportType, classList]);

  useEffect(() => {
    if (selectedClassId) {
      generateReport();
    }
  }, [selectedClassId, reportType, generateReport]);

  // Export Excel
  const handleExportExcel = async () => {
    if (reportRows.length === 0) return;
    setExporting(true);
    try {
      const currentClass = classList.find((c) => c.id === selectedClassId);
      const blob = await reportService.exportReportToExcel(reportTitle, columns, reportRows, {
        schoolName: teacher?.schoolName || 'Trường THPT',
        teacherName: teacher?.fullName || 'Giáo viên Chủ nhiệm',
        className: currentClass ? currentClass.name : '10A1',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle.replace(/\s+/g, '_')}_${getTodayDateString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Xuất Excel thành công', 'File Excel đã được lưu về máy.');
    } catch (err: unknown) {
      showError('Lỗi xuất Excel', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  const currentClass = classList.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Trung Tâm Báo Cáo & In Ấn PDF/Excel"
        description="Tổng hợp báo cáo chuyên cần, thi đua, sinh nhật & in ấn chuẩn khổ giấy A4 hoàn toàn Offline"
        badgeText={activeYear?.name}
      />

      {/* Control Panel (Hidden when printing) */}
      <Card className="print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Select
            label="Chọn Lớp học"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
          />
          <Select
            label="Chọn Loại Báo cáo"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            options={[
              { value: 'attendance', label: '1. Báo cáo Chuyên cần' },
              { value: 'birthdays', label: '2. Danh sách Sinh nhật trong tháng' },
              { value: 'conduct', label: '3. Báo cáo Thi đua & Nề nếp' },
              { value: 'class_summary', label: '4. Báo cáo Tổng hợp Lớp' },
            ]}
          />
          <Input
            label="Từ ngày"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Đến ngày"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-app">
          <Button
            variant="outline"
            isLoading={exporting}
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportExcel}
          >
            Xuất Excel (.xlsx)
          </Button>
          <Button
            variant="primary"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            In Báo Cáo / Lưu PDF (A4)
          </Button>
        </div>
      </Card>

      {/* Printable Preview Document Container */}
      <div id="printable-report-area" className="bg-white text-black p-8 rounded-2xl border border-app shadow-md space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Printable Formal Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 text-xs font-serif">
          <div>
            <p className="font-bold uppercase text-sm">{teacher?.schoolName || 'TRƯỜNG THPT NGUYỄN TRÃI'}</p>
            <p>Lớp: {currentClass ? currentClass.name : '10A1'} • Năm học: {activeYear?.name || '2026-2027'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="italic">Độc lập - Tự do - Hạnh phúc</p>
            <p className="mt-1">Ngày {getTodayDateString().split('-')[2]} tháng {getTodayDateString().split('-')[1]} năm {getTodayDateString().split('-')[0]}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold uppercase font-serif text-black">{reportTitle}</h2>
          <p className="text-xs italic text-gray-700">Giáo viên chủ nhiệm: {teacher?.fullName || 'Thầy/Cô Chủ Nhiệm'}</p>
        </div>

        {/* Table Content */}
        {loading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : reportRows.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm italic">Không có dữ liệu báo cáo cho tiêu chí đã chọn.</div>
        ) : (
          <table className="w-full text-xs border-collapse border border-black font-serif">
            <thead>
              <tr className="bg-gray-100 text-black">
                {columns.map((col) => (
                  <th key={col.key} className="border border-black px-3 py-2 text-center font-bold">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="border border-black px-3 py-2 text-center">
                      {String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Formal Signature Block */}
        <div className="flex justify-between items-start pt-8 text-xs font-serif break-inside-avoid">
          <div className="text-center w-48">
            <p className="font-bold">XÁC NHẬN CỦA BAN GIÁM HIỆU</p>
            <p className="italic text-[10px] text-gray-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
          </div>
          <div className="text-center w-48">
            <p className="font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="italic text-[10px] text-gray-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold text-sm">{teacher?.fullName || 'GVCN'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
