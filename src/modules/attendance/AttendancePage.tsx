import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { PageHeader } from '../../shared/components/PageHeader';
import { StudentAvatar } from '../../shared/components/StudentAvatar';
import { useToast } from '../../shared/hooks/useToast';
import { attendanceService, type AttendanceRecordItem, type AttendanceMetrics } from '../../core/services/attendance.service';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { db } from '../../core/database/db';
import { getTodayDateString, formatDateVietnamese } from '../../shared/utilities/date';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';
import type { ClassRoom, AcademicYear, AttendanceRecordStatus, AttendanceSession, PointEntry } from '../../core/database/types';
import {
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Unlock,
  Save,
  Check,
  UserCheck,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(getTodayDateString());
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);

  // Session & Grid State
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [metrics, setMetrics] = useState<AttendanceMetrics>({
    total: 0,
    present: 0,
    excused: 0,
    unexcused: 0,
    late: 0,
    earlyLeave: 0,
    ratePercent: 100,
  });
  const [sessionNote, setSessionNote] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter Search
  const [searchQuery, setSearchQuery] = useState('');

  // Unlock Confirm State
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const loadClassesAndSession = React.useCallback(async () => {
    setLoading(true);
    try {
      const settings = await settingsRepository.getSettings();
      let yearId = settings?.activeAcademicYearId;
      if (!yearId) {
        const year = await academicYearRepository.getCurrentYear();
        yearId = year?.id;
      }

      if (yearId) {
        const year = await academicYearRepository.findById(yearId);
        setActiveYear(year || null);
      }

      const allClasses = await db.classes.filter((c) => !c.deletedAt).toArray();
      let classes = yearId ? allClasses.filter((c) => !c.academicYearId || c.academicYearId === yearId) : allClasses;
      if (classes.length === 0) {
        classes = allClasses;
      }
      setClassList(classes);

      let activeClsId = classes[0]?.id || '';
      if (settings?.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
        activeClsId = settings.activeClassId;
      }
      setSelectedClassId((prev) => (prev && classes.some((c) => c.id === prev) ? prev : activeClsId));
    } catch (err) {
      console.error('Error loading attendance metadata:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [studentPointsMap, setStudentPointsMap] = useState<Map<string, number>>(new Map());

  const loadSessionData = React.useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const data = await attendanceService.getOrInitializeSession(selectedClassId, sessionDate);
      setSession(data.session);
      setRecords(data.records);
      setMetrics(data.metrics);
      setSessionNote(data.session?.note || '');
      setIsLocked(data.session?.isLocked || false);

      // Batch load point entries to resolve avatar levels
      const pointEntries: PointEntry[] = await db.pointEntries
        .where('classId')
        .equals(selectedClassId)
        .filter((p: PointEntry) => !p.deletedAt)
        .toArray();
      const pMap = new Map<string, number>();
      pointEntries.forEach((p: PointEntry) => {
        pMap.set(p.studentId, (pMap.get(p.studentId) || 0) + p.points);
      });
      setStudentPointsMap(pMap);
    } catch (err) {
      console.error('Error loading session data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, sessionDate]);

  useEffect(() => {
    loadClassesAndSession();
  }, [loadClassesAndSession]);

  useEffect(() => {
    if (selectedClassId) {
      loadSessionData();
    }
  }, [selectedClassId, sessionDate, loadSessionData]);

  // Search Filter
  const filteredRecords = useMemo(() => {
    const q = normalizeVietnameseText(searchQuery);
    return records.filter(
      (r) =>
        normalizeVietnameseText(r.fullName).includes(q) ||
        r.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [records, searchQuery]);

  // Status Change Handler
  const handleStatusChange = (studentId: string, newStatus: AttendanceRecordStatus) => {
    if (isLocked) {
      showError('Phiên bị khóa', 'Phiên điểm danh đã được khóa. Vui lòng mở khóa để chỉnh sửa.');
      return;
    }

    setRecords((prev) => {
      const updated = prev.map((item) =>
        item.studentId === studentId ? { ...item, status: newStatus } : item
      );
      setMetrics(attendanceService.calculateMetrics(updated));
      return updated;
    });
  };

  // Note Change Handler
  const handleReasonChange = (studentId: string, reason: string) => {
    if (isLocked) return;
    setRecords((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, reason } : item))
    );
  };

  // Bulk Actions
  const handleBulkStatus = (status: AttendanceRecordStatus) => {
    if (isLocked) return;
    setRecords((prev) => {
      const updated = prev.map((item) => ({ ...item, status }));
      setMetrics(attendanceService.calculateMetrics(updated));
      return updated;
    });
  };

  // Save Session
  const handleSave = async (lock = false) => {
    if (!selectedClassId) return;
    setSaving(true);
    try {
      const savedSession = await attendanceService.saveSession(
        selectedClassId,
        sessionDate,
        records,
        sessionNote,
        lock
      );
      setSession(savedSession);
      setIsLocked(lock);
      showSuccess(
        lock ? 'Đã hoàn tất & khóa phiên' : 'Lưu bản nháp thành công',
        `Điểm danh ngày ${formatDateVietnamese(sessionDate)} (${records.length} học sinh)`
      );
    } catch (err: unknown) {
      console.error('Error saving session:', err);
      showError('Lỗi lưu điểm danh', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Unlock Handler
  const handleUnlockSession = async () => {
    if (!session) return;
    try {
      await attendanceService.unlockSession(session.id);
      setIsLocked(false);
      setShowUnlockModal(false);
      showSuccess('Đã mở khóa phiên', 'Bạn có thể chỉnh sửa lại phiên điểm danh này.');
    } catch (err: unknown) {
      showError('Lỗi mở khóa', (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Sổ Điểm danh Hằng ngày"
        description="Điểm danh 1-touch trực quan, tự động gán mặc định Có mặt, khống chế 1 phiên duy nhất per Lớp/Ngày"
        badgeText={activeYear?.name}
      />

      {/* Class & Date Selector Bar */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Chọn Lớp điểm danh"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
          />
          <Input
            label="Ngày điểm danh"
            type="date"
            leftIcon={<Calendar className="w-4 h-4 text-app-muted" />}
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2">
              <Button
                variant={isLocked ? 'outline' : 'primary'}
                className="flex-1"
                disabled={isLocked || saving}
                isLoading={saving}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={() => handleSave(false)}
              >
                Lưu bản nháp
              </Button>
              <Button
                variant={isLocked ? 'secondary' : 'primary'}
                className="flex-1"
                disabled={isLocked || saving}
                isLoading={saving}
                leftIcon={<Check className="w-4 h-4" />}
                onClick={() => handleSave(true)}
              >
                Khóa phiên
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-app-muted font-medium">Sĩ số lớp</p>
          <p className="text-xl font-bold text-app-main mt-0.5">{metrics.total}</p>
        </Card>
        <Card className="p-3 text-center bg-emerald-50/60 border-emerald-200">
          <p className="text-xs text-emerald-800 font-medium">Có mặt</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{metrics.present}</p>
        </Card>
        <Card className="p-3 text-center bg-amber-50/60 border-amber-200">
          <p className="text-xs text-amber-800 font-medium">Vắng có phép</p>
          <p className="text-xl font-bold text-amber-700 mt-0.5">{metrics.excused}</p>
        </Card>
        <Card className="p-3 text-center bg-red-50/60 border-red-200">
          <p className="text-xs text-red-800 font-medium">Vắng không phép</p>
          <p className="text-xl font-bold text-red-700 mt-0.5">{metrics.unexcused}</p>
        </Card>
        <Card className="p-3 text-center bg-orange-50/60 border-orange-200">
          <p className="text-xs text-orange-800 font-medium">Đi muộn / Về sớm</p>
          <p className="text-xl font-bold text-orange-700 mt-0.5">{metrics.late + metrics.earlyLeave}</p>
        </Card>
        <Card className="p-3 text-center bg-blue-50/60 border-blue-200">
          <p className="text-xs text-blue-800 font-medium">Tỷ lệ chuyên cần</p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">{metrics.ratePercent}%</p>
        </Card>
      </div>

      {/* Locked Status Banner */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Phiên điểm danh ngày <strong>{formatDateVietnamese(sessionDate)}</strong> đã được khóa.</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Unlock className="w-4 h-4" />}
            onClick={() => setShowUnlockModal(true)}
          >
            Mở khóa phiên
          </Button>
        </div>
      )}

      {/* Main Attendance Grid */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-app-primary" />
            <span>Danh sách điểm danh ({filteredRecords.length} học sinh)</span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={isLocked} onClick={() => handleBulkStatus('Present')}>
              Tất cả Có mặt
            </Button>
            <Button size="sm" variant="outline" disabled={isLocked} onClick={() => handleBulkStatus('ExcusedAbsence')}>
              Tất cả Vắng phép
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            placeholder="Tìm kiếm học sinh theo tên, STT..."
            leftIcon={<Search className="w-4 h-4 text-app-muted" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {loading ? (
            <LoadingSkeleton type="table" count={5} />
          ) : filteredRecords.length === 0 ? (
            <div className="py-8 text-center text-app-muted">
              Không có học sinh nào trong danh sách điểm danh ngày này.
            </div>
          ) : (
            <div className="divide-y divide-app">
              {filteredRecords.map((item) => (
                <div
                  key={item.studentId}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-surface-hover/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-app-primary-light text-app-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {item.rollNumber || '#'}
                    </span>
                    <StudentAvatar
                      score={studentPointsMap.get(item.studentId) || 0}
                      name={item.fullName}
                      size="md"
                      className="border border-app shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-app-main">{item.fullName}</h4>
                      <p className="text-xs text-app-muted font-mono">{item.studentCode}</p>
                    </div>
                  </div>

                  {/* 1-Touch Status Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      disabled={isLocked}
                      onClick={() => handleStatusChange(item.studentId, 'Present')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        item.status === 'Present'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-app-surface text-app-main border-app hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Có mặt
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={() => handleStatusChange(item.studentId, 'ExcusedAbsence')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        item.status === 'ExcusedAbsence'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-app-surface text-app-main border-app hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Có phép
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={() => handleStatusChange(item.studentId, 'UnexcusedAbsence')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        item.status === 'UnexcusedAbsence'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-app-surface text-app-main border-app hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Không phép
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={() => handleStatusChange(item.studentId, 'Late')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        item.status === 'Late'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-app-surface text-app-main border-app hover:bg-orange-50 hover:text-orange-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Đi muộn
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={() => handleStatusChange(item.studentId, 'EarlyLeave')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        item.status === 'EarlyLeave'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-app-surface text-app-main border-app hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Về sớm
                    </button>
                  </div>

                  {/* Optional Reason Note */}
                  {item.status !== 'Present' && (
                    <div className="w-full sm:w-48 pt-1 sm:pt-0">
                      <Input
                        placeholder="Lý do vắng / đi muộn..."
                        className="text-xs min-h-[36px] py-1"
                        disabled={isLocked}
                        value={item.reason || ''}
                        onChange={(e) => handleReasonChange(item.studentId, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Session Note */}
          <div className="pt-4 border-t border-app">
            <label className="text-xs font-bold text-app-main block mb-1.5">Ghi chú toàn phiên điểm danh (Tùy chọn)</label>
            <textarea
              rows={2}
              disabled={isLocked}
              placeholder="Nhập ghi chú chung của phiên điểm danh hôm nay..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-app bg-app-surface text-app-main focus:ring-2 focus:ring-amber-500"
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Confirm Unlock Modal */}
      <ConfirmModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={handleUnlockSession}
        title="Mở khóa phiên điểm danh này?"
        message="Mở khóa phiên sẽ cho phép Thầy/Cô chỉnh sửa lại trạng thái điểm danh của học sinh trong phiên ngày hôm nay."
        confirmText="Tôi muốn mở khóa"
      />
    </div>
  );
};
