import React, { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { liveReportService } from '../../core/services/live-classroom/live-report.service';
import { formatDateVietnamese } from '../../shared/utilities/date';
import type { LiveClassSession, LiveClassParticipant, ClassRoom, PointEntry } from '../../core/database/types';
import type { GroupWithMembers } from '../../core/services/live-classroom';
import { CuteCloudSVG, CuteStarSVG } from '../../shared/components/CuteDecorations';
import { FileSpreadsheet, Printer, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: LiveClassSession;
  classRoom: ClassRoom | null;
  participants: LiveClassParticipant[];
  pointEntries: PointEntry[];
  groups: GroupWithMembers[];
  elapsedSeconds: number;
  onFinishAndNavigate: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  isOpen,
  onClose,
  session,
  classRoom,
  participants,
  pointEntries,
  groups,
  elapsedSeconds,
  onFinishAndNavigate,
}) => {
  const [exporting, setExporting] = useState(false);

  const mins = Math.floor(elapsedSeconds / 60);

  const presentCount = participants.filter((p) => p.attendanceStatus === 'present').length;
  const lateCount = participants.filter((p) => p.attendanceStatus === 'late').length;
  const absentCount = participants.filter((p) => p.attendanceStatus === 'absent').length;
  const leftCount = participants.filter((p) => p.attendanceStatus === 'left').length;

  const totalTalks = participants.reduce((sum, p) => sum + p.participationCount, 0);
  const totalPositivePoints = pointEntries.filter((e) => e.points > 0).reduce((sum, e) => sum + e.points, 0);
  const totalNegativePoints = pointEntries.filter((e) => e.points < 0).reduce((sum, e) => sum + Math.abs(e.points), 0);

  const topGroup = groups.length > 0 ? groups[0] : null;

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await liveReportService.exportSessionExcel(session.id, {
        includeStudentCode: true,
        includeAttendanceStatus: true,
        includeParticipationCount: true,
        includeSessionPoints: true,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      await liveReportService.exportSessionPdf(session.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Báo Cáo Tổng Kết Phiên Học: ${session.title}`}>
      <div className="space-y-4 py-2 text-xs">
        {/* HEADER META CARD */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-50 via-teal-50 to-purple-50 border-2 border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <CuteCloudSVG className="w-5 h-5" /> Lớp {classRoom?.name} • Môn {session.subject}
            </h3>
            <Badge variant="success" className="bg-emerald-600 text-white">
              ✓ Đã hoàn thành
            </Badge>
          </div>
          <p className="text-slate-600">
            • Ngày dạy: <strong>{formatDateVietnamese(session.sessionDate)}</strong> • Thời lượng: <strong>{mins} phút</strong>
          </p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-bold">Sĩ số tham gia</p>
            <p className="text-lg font-extrabold text-slate-800">{participants.length} em</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <p className="font-bold">Có mặt / Đi muộn</p>
            <p className="text-lg font-extrabold text-emerald-700">{presentCount + lateCount} em</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <p className="font-bold">Tổng phát biểu</p>
            <p className="text-lg font-extrabold text-amber-700">{totalTalks} lượt</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
            <p className="font-bold">Tổng điểm cộng</p>
            <p className="text-lg font-extrabold text-blue-700">+{totalPositivePoints} điểm</p>
          </div>
        </div>

        {/* ATTENDANCE & NEGATIVE POINTS BREAKDOWN */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
          <h4 className="font-bold text-slate-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-blue-600" /> Thống kê chi tiết tiết dạy:
          </h4>
          <p>• Đi muộn: <strong>{lateCount} em</strong> | Vắng mặt: <strong>{absentCount} em</strong> | Rời lớp: <strong>{leftCount} em</strong></p>
          <p>• Tổng điểm trừ thi đua: <strong className="text-red-600">-{totalNegativePoints} điểm</strong></p>
          {topGroup && (
            <p className="flex items-center gap-1 text-amber-700 font-bold">
              <CuteStarSVG className="w-4 h-4" /> Nhóm tuyên dương xuất sắc: {topGroup.name} ({topGroup.members.length} em)
            </p>
          )}
        </div>

        {/* ACTIONS & EXPORTS */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="secondary"
            className="w-full sm:w-auto flex-1"
            isLoading={exporting}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={handleExportExcel}
          >
            Xuất Excel chi tiết
          </Button>

          <Button
            variant="outline"
            className="w-full sm:w-auto flex-1"
            leftIcon={<Printer className="w-4 h-4 text-blue-600" />}
            onClick={handleExportPdf}
          >
            In / Xuất PDF tóm tắt
          </Button>

          <Button
            variant="primary"
            className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={onFinishAndNavigate}
          >
            Về Trang Chủ
          </Button>
        </div>
      </div>
    </Modal>
  );
};
