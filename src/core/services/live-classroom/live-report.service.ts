import ExcelJS from 'exceljs';
import { db } from '../../database/db';
import { liveClassSessionService } from './live-session.service';
import { liveClassParticipantService } from './live-participant.service';
import { classRepository } from '../../repositories/class.repository';
import { formatDateVietnamese } from '../../../shared/utilities/date';

export interface LiveReportFieldOptions {
  includeStudentCode?: boolean;
  includeAttendanceStatus?: boolean;
  includeParticipationCount?: boolean;
  includeSessionPoints?: boolean;
}

class LiveReportService {
  /**
   * Xuất báo cáo Excel chi tiết học sinh trong phiên học trực tuyến
   */
  async exportSessionExcel(sessionId: string, options: LiveReportFieldOptions = {}): Promise<void> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session) throw new Error('Không tìm thấy phiên học.');

    const room = await classRepository.findById(session.classId);
    const participants = await liveClassParticipantService.getParticipants(sessionId);

    // Fetch all student details & point entries in this session
    const studentMap = new Map();
    for (const p of participants) {
      const st = await db.students.get(p.studentId);
      if (st) studentMap.set(p.studentId, st);
    }

    const sessionPointsMap = new Map<string, number>();
    const pointEntries = await db.pointEntries
      .filter((e) => e.sourceId === sessionId && !e.deletedAt)
      .toArray();

    pointEntries.forEach((e) => {
      const curr = sessionPointsMap.get(e.studentId) || 0;
      sessionPointsMap.set(e.studentId, curr + e.points);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sổ Chủ Nhiệm Việt Offline';

    // Sheet 1: Báo cáo chi tiết
    const sheet = workbook.addWorksheet('Chi tiết phiên học');

    // Header title
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `BÁO CÁO PHIÊN HỌC TRỰC TUYẾN: ${session.title.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Meta rows
    sheet.addRow(['Lớp:', room?.name || '', 'Môn học:', session.subject]);
    sheet.addRow(['Ngày dạy:', formatDateVietnamese(session.sessionDate), 'Nền tảng:', session.meetingPlatform.toUpperCase()]);
    sheet.addRow(['Trạng thái:', session.status.toUpperCase(), 'Sĩ số tham gia:', participants.length]);
    sheet.addRow([]);

    // Table Headers
    const headers = ['STT'];
    if (options.includeStudentCode !== false) headers.push('Mã Học Sinh');
    headers.push('Họ và Tên');
    if (options.includeAttendanceStatus !== false) headers.push('Trạng Thái Điểm Danh');
    if (options.includeParticipationCount !== false) headers.push('Lượt Phát Biểu');
    if (options.includeSessionPoints !== false) headers.push('Điểm Thi Đua');

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F8EF7' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Student Data Rows
    participants.forEach((p, idx) => {
      const st = studentMap.get(p.studentId);
      const rowData: (string | number)[] = [idx + 1];

      if (options.includeStudentCode !== false) rowData.push(st?.studentCode || '');
      rowData.push(st?.fullName || 'Học sinh');

      if (options.includeAttendanceStatus !== false) {
        const statusText =
          p.attendanceStatus === 'present'
            ? 'Có mặt'
            : p.attendanceStatus === 'late'
            ? 'Đi muộn'
            : p.attendanceStatus === 'absent'
            ? 'Vắng'
            : p.attendanceStatus === 'left'
            ? 'Rời lớp'
            : 'Chưa báo';
        rowData.push(statusText);
      }

      if (options.includeParticipationCount !== false) rowData.push(p.participationCount);
      if (options.includeSessionPoints !== false) rowData.push(sessionPointsMap.get(p.studentId) || 0);

      sheet.addRow(rowData);
    });

    // Auto-fit column widths
    sheet.columns.forEach((col) => {
      col.width = 22;
    });

    // Generate buffer & trigger browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_PhienHoc_${session.title.replace(/\s+/g, '_')}_${session.sessionDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Xuất báo cáo PDF / In tóm tắt phiên học trực tuyến (100% Offline)
   */
  async exportSessionPdf(sessionId: string): Promise<void> {
    const session = await db.liveClassSessions.get(sessionId);
    if (!session) throw new Error('Không tìm thấy phiên học.');

    const room = await classRepository.findById(session.classId);
    const participants = await liveClassParticipantService.getParticipants(sessionId);

    const elapsedSecs = liveClassSessionService.calculateElapsedSeconds(session);
    const mins = Math.floor(elapsedSecs / 60);

    const presentCount = participants.filter((p) => p.attendanceStatus === 'present').length;
    const lateCount = participants.filter((p) => p.attendanceStatus === 'late').length;
    const absentCount = participants.filter((p) => p.attendanceStatus === 'absent').length;

    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Không thể mở cửa sổ in. Vui lòng cho phép Popup.');

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Báo Cáo Tóm Tắt Phiên Học: ${session.title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #24324A; }
          h1 { color: #4F8EF7; text-align: center; border-bottom: 2px solid #4F8EF7; padding-bottom: 8px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #F5FAFF; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center; margin-bottom: 20px; }
          .stat-card { background: #FFFFFF; border: 1px solid #E2E8F0; padding: 12px; border-radius: 8px; }
          .stat-num { font-size: 20px; font-weight: bold; color: #4F8EF7; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; }
          th { background: #4F8EF7; color: white; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>BÁO CÁO TÓM TẮT PHIÊN HỌC TRỰC TUYẾN</h1>
        <div class="meta">
          <div><strong>Tiêu đề:</strong> ${session.title}</div>
          <div><strong>Lớp:</strong> Lớp ${room?.name || ''}</div>
          <div><strong>Môn học:</strong> ${session.subject}</div>
          <div><strong>Ngày dạy:</strong> ${formatDateVietnamese(session.sessionDate)}</div>
          <div><strong>Thời lượng:</strong> ${mins} phút</div>
          <div><strong>Nền tảng:</strong> ${session.meetingPlatform.toUpperCase()}</div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div>Sĩ số tham gia</div>
            <div class="stat-num">${participants.length}</div>
          </div>
          <div class="stat-card">
            <div>Có mặt</div>
            <div class="stat-num" style="color:#10B981">${presentCount}</div>
          </div>
          <div class="stat-card">
            <div>Đi muộn</div>
            <div class="stat-num" style="color:#F59E0B">${lateCount}</div>
          </div>
          <div class="stat-card">
            <div>Vắng mặt</div>
            <div class="stat-num" style="color:#EF4444">${absentCount}</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4F8EF7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">IN / XUẤT FILE PDF</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export const liveReportService = new LiveReportService();
