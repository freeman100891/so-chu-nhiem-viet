import React, { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { liveReportService } from '../../core/services/live-classroom/live-report.service';
import { formatDateVietnamese } from '../../shared/utilities/date';
import type { LiveClassSession, LiveClassParticipant, ClassRoom, PointEntry } from '../../core/database/types';
import type { GroupWithMembers } from '../../core/services/live-classroom';
import { CuteStarSVG } from '../../shared/components/CuteDecorations';
import { ClassMascot } from './components/ClassMascot';
import { FileSpreadsheet, Printer, ArrowRight, CheckCircle2, Trophy, Star, Users, MessageSquare } from 'lucide-react';

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

  const mins = Math.max(1, Math.floor(elapsedSeconds / 60));

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 TỔNG KẾT TIẾT HỌC SỐ"
      maxWidth="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        {/* CELEBRATION HERO BANNER WITH MASCOT */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-sky-50 to-indigo-50 dark:from-emerald-950/40 dark:via-sky-950/40 dark:to-indigo-950/40 border-2 border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
          <div className="shrink-0">
            <ClassMascot state="completed" size="md" showSpeechBubble={false} />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-2xs">
                ✓ Tiết Dạy Hoàn Thành Xuất Sắc
              </span>
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Lớp {classRoom?.name} • {session.title}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Môn học: <strong className="text-slate-800 dark:text-slate-200">{session.subject || 'Học tập'}</strong> • Ngày dạy: <strong>{formatDateVietnamese(session.sessionDate)}</strong> • Thời lượng: <strong>{mins} phút</strong>
            </p>
          </div>
        </div>

        {/* 4 CORE HIGHLIGHT STATS TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-slate-500 font-bold text-xs mb-0.5">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>Sĩ số tham gia</span>
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">{participants.length} học sinh</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Có mặt: {presentCount + lateCount} em
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold text-xs mb-0.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Điểm tích cực</span>
            </div>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">+{totalPositivePoints} điểm</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Khích lệ toàn lớp
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-amber-700 dark:text-amber-300 font-bold text-xs mb-0.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Lượt phát biểu</span>
            </div>
            <p className="text-xl font-black text-amber-700 dark:text-amber-300">{totalTalks} lượt</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Tương tác sôi nổi
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-purple-700 dark:text-purple-300 font-bold text-xs mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              <span>Nhóm học tập</span>
            </div>
            <p className="text-xl font-black text-purple-700 dark:text-purple-300">{groups.length} nhóm</p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              {topGroup ? topGroup.name : 'Hoạt động đồng đội'}
            </p>
          </div>
        </div>

        {/* DETAILED ATTENDANCE & CONDUCT BREAKDOWN */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
          <h4 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-sky-600" /> Thống kê chi tiết & Điểm danh:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <p>• Điểm danh: <strong>Có mặt {presentCount}</strong> | <strong>Muộn {lateCount}</strong> | <strong>Vắng {absentCount}</strong> | <strong>Phép {leftCount}</strong></p>
            <p>• Điểm nhắc nhở / trừ thi đua: <strong className={totalNegativePoints > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>-{totalNegativePoints} điểm</strong></p>
          </div>
          {topGroup && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
              <CuteStarSVG className="w-4 h-4" />
              <span>Nhóm xuất sắc tiêu biểu: <strong>{topGroup.name}</strong> ({topGroup.members.length} học sinh)</span>
            </div>
          )}
        </div>

        {/* ACTIONS & EXPORTS */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="secondary"
            className="w-full sm:w-auto flex-1 font-bold rounded-xl cursor-pointer"
            isLoading={exporting}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={handleExportExcel}
          >
            Xuất Excel chi tiết
          </Button>

          <Button
            variant="outline"
            className="w-full sm:w-auto flex-1 font-bold rounded-xl cursor-pointer"
            leftIcon={<Printer className="w-4 h-4 text-blue-600" />}
            onClick={handleExportPdf}
          >
            In / Xuất PDF
          </Button>

          <Button
            variant="primary"
            className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 font-black rounded-xl cursor-pointer shadow-sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={onFinishAndNavigate}
          >
            Hoàn tất & Về Trang Chủ
          </Button>
        </div>
      </div>
    </Modal>
  );
};

