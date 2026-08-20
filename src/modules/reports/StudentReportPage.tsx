import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { db } from '../../core/database/db';
import { settingsRepository } from '../../core/repositories/settings.repository';
import {
  avatarThemeRegistry,
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
} from '../../core/services/avatar-theme-registry';
import { honorBoardService } from '../../core/services/honor-board.service';
import { formatDateVietnamese } from '../../shared/utilities/date';
import type {
  Student,
  ClassRoom,
  PointEntry,
  HonorRecipient,
  HonorBoard,
} from '../../core/database/types';
import type { StudentAvatarPresentation, GlobalAvatarSystemSettings } from '../../core/types/avatar-theme.types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  ArrowLeft,
  Printer,
  CalendarCheck,
  Award,
  MessageSquare,
  Trophy,
  Sparkles,
} from 'lucide-react';

export const StudentReportPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalAvatarSystemSettings>(
    DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS
  );
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [honors, setHonors] = useState<{ recipient: HonorRecipient; board: HonorBoard }[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [interactionCount, setInteractionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadStudentReport = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const settings = await settingsRepository.getSettings();
      const avatarSysSettings = settings?.avatarSystemSettings || DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
      setGlobalSettings(avatarSysSettings);

      const st = await db.students.get(studentId);
      if (!st || st.deletedAt) {
        navigate('/reports');
        return;
      }
      setStudent(st);

      // Enrollment & Class
      const enr = await db.classEnrollments
        .where('studentId')
        .equals(studentId)
        .filter((e) => !e.deletedAt && e.status === 'Active')
        .first();

      if (enr) {
        const cls = await db.classes.get(enr.classId);
        setCurrentClass(cls || null);

        // Point entries
        const pts = await db.pointEntries
          .where('studentId')
          .equals(studentId)
          .filter((p) => !p.deletedAt)
          .toArray();
        pts.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
        setPointEntries(pts);

        const sumPoints = pts.reduce((sum, p) => sum + p.points, 0);
        setTotalPoints(sumPoints);

        // Attendance rate
        const attRecords = await db.attendanceRecords
          .where('studentId')
          .equals(studentId)
          .filter((r) => !r.deletedAt)
          .toArray();

        if (attRecords.length > 0) {
          const attended = attRecords.filter(
            (r) => r.status === 'Present' || r.status === 'Late' || r.status === 'EarlyLeave'
          ).length;
          setAttendanceRate(Math.round((attended / attRecords.length) * 100));
        }

        // Live class events
        const liveEvents = await db.liveClassEvents
          .filter((e) => e.studentId === studentId)
          .toArray();
        setInteractionCount(liveEvents.length);

        // Honors
        const studentHonors = await honorBoardService.getStudentHonorHistory(studentId);
        setHonors(studentHonors);
      }
    } catch (err) {
      console.error('Error loading individual student report:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, navigate]);

  useEffect(() => {
    loadStudentReport();
  }, [loadStudentReport]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !student) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  const presentation: StudentAvatarPresentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
    student,
    score: totalPoints,
    globalSettings,
  });
  const theme = presentation.cardTheme;

  // Build weekly progress chart points
  const pointsByDateMap = new Map<string, number>();
  [...pointEntries].reverse().forEach((p) => {
    const cur = pointsByDateMap.get(p.occurredAt) || 0;
    pointsByDateMap.set(p.occurredAt, cur + p.points);
  });

  let runningTotal = 0;
  const progressChartData = Array.from(pointsByDateMap.entries()).map(([dateStr, pts]) => {
    runningTotal += pts;
    return {
      date: dateStr,
      label: formatDateVietnamese(dateStr),
      points: runningTotal,
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-4 print:m-0 print:p-0">
      {/* TOP CONTROLS */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/reports')}
        >
          Quay lại Báo Cáo
        </Button>

        <Button
          variant="primary"
          size="sm"
          className="font-bold"
          leftIcon={<Printer className="w-4 h-4" />}
          onClick={handlePrint}
        >
          In Báo Cáo Cá Nhân (A4)
        </Button>
      </div>

      {/* STUDENT PROFILE BANNER */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.surfaceStart} 0%, ${theme.surfaceEnd} 100%)`,
          borderColor: theme.border,
          boxShadow: `0 4px 16px ${theme.shadow}`,
        }}
        className="p-6 border-2 rounded-2xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              style={{ borderColor: theme.avatarRing }}
              className="w-16 h-16 rounded-full border-2 bg-white p-0.5 shadow-md overflow-hidden flex items-center justify-center shrink-0"
            >
              <img
                src={presentation.avatarAsset.assetUrl}
                alt={presentation.avatarAsset.altText}
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ color: theme.textPrimary }} className="text-xl font-black">{student.fullName}</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Lớp {currentClass?.name}
                </span>
              </div>
              <p style={{ color: theme.textSecondary }} className="text-xs mt-1 font-mono">
                Mã HS: {student.studentCode} • Ngày sinh: {formatDateVietnamese(student.dateOfBirth)}
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: theme.badgeBackground,
              borderColor: theme.badgeBorder,
            }}
            className="p-3 rounded-2xl border shadow-2xs flex items-center gap-3"
          >
            <div
              style={{ borderColor: theme.avatarRing }}
              className="w-10 h-10 rounded-xl border-2 bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0"
            >
              <img
                src={presentation.avatarAsset.assetUrl}
                alt={presentation.avatarAsset.altText}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-app-muted uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Cấp độ hiện tại
              </span>
              <p style={{ color: theme.textPrimary }} className="text-sm font-black">
                {presentation.levelName} · <span className="font-mono">{presentation.levelShortLabel}</span>
              </p>
              {presentation.pointsToNextLevel !== undefined && (
                <p style={{ color: theme.textSecondary }} className="text-[11px] font-medium">
                  Còn {presentation.pointsToNextLevel}đ lên Cấp {presentation.level + 1}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-app bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
          <CalendarCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <span className="text-xs text-app-muted font-bold block">Chuyên cần</span>
          <strong className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
            {attendanceRate}%
          </strong>
        </div>

        <div className="p-4 rounded-2xl border border-app bg-blue-50/50 dark:bg-blue-950/20 text-center">
          <Award className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <span className="text-xs text-app-muted font-bold block">Điểm tích lũy</span>
          <strong className="text-2xl font-black text-blue-700 font-mono mt-1 block">
            {totalPoints} đ
          </strong>
        </div>

        <div className="p-4 rounded-2xl border border-app bg-pink-50/50 dark:bg-pink-950/20 text-center">
          <MessageSquare className="w-5 h-5 text-pink-600 mx-auto mb-1" />
          <span className="text-xs text-app-muted font-bold block">Lượt phát biểu</span>
          <strong className="text-2xl font-black text-pink-700 font-mono mt-1 block">
            {interactionCount}
          </strong>
        </div>

        <div className="p-4 rounded-2xl border border-app bg-amber-50/50 dark:bg-amber-950/20 text-center">
          <Trophy className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <span className="text-xs text-app-muted font-bold block">Danh hiệu đạt</span>
          <strong className="text-2xl font-black text-amber-700 font-mono mt-1 block">
            {honors.length}
          </strong>
        </div>
      </div>

      {/* POINT PROGRESS AREA CHART */}
      {progressChartData.length > 0 && (
        <Card title="Tiến Độ Tích Lũy Điểm Thi Đua">
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressChartData}>
                <defs>
                  <linearGradient id="stProgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" đ" />
                <Tooltip />
                <Area
                  type="monotone"
                  name="Điểm tích lũy"
                  dataKey="points"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#stProgGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* HONORS */}
      <div className="grid grid-cols-1 gap-4">
        <Card title="Danh Hiệu Bảng Vàng Đã Nhận">
          {honors.length === 0 ? (
            <p className="text-xs text-app-muted italic py-4">Chưa có danh hiệu nào.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {honors.map(({ recipient, board }) => (
                <div
                  key={recipient.id}
                  className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/40 text-xs flex items-center justify-between"
                >
                  <span className="font-bold text-slate-800">{board.title}</span>
                  <span className="font-mono text-amber-700 font-bold">{recipient.rankNameAtAward || 'Khen thưởng'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
