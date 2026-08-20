import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Badge } from '../../shared/components/Badge';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { Modal } from '../../shared/components/Modal';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../shared/components/EmptyState';
import { useToast } from '../../shared/hooks/useToast';
import { liveClassSessionService, liveClassParticipantService, liveClassEventService } from '../../core/services/live-classroom';
import { liveReportService } from '../../core/services/live-classroom/live-report.service';
import { classRepository } from '../../core/repositories/class.repository';
import type { LiveClassSession, ClassRoom, LiveClassParticipant, LiveClassEvent } from '../../core/database/types';
import { formatDateVietnamese } from '../../shared/utilities/date';
import { ArrowLeft, Search, Clock, Users, Eye, Copy, FileSpreadsheet, Printer } from 'lucide-react';

export const LiveClassroomHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [sessions, setSessions] = useState<LiveClassSession[]>([]);
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LiveClassSession | null>(null);
  const [sessionParticipants, setSessionParticipants] = useState<LiveClassParticipant[]>([]);
  const [sessionEvents, setSessionEvents] = useState<LiveClassEvent[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const allSessions = await liveClassSessionService.getAllSessions();
      setSessions(allSessions);

      const classes = await classRepository.findAll();
      setClassList(classes);
    } catch (err) {
      console.error('Error loading live session history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getClassName = (classId: string) => {
    const cls = classList.find((c) => c.id === classId);
    return cls ? cls.name : 'Lớp học';
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSubject = s.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = matchTitle || matchSubject;

      const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
      const matchesStatus = selectedStatusFilter === 'all' || s.status === selectedStatusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [sessions, searchQuery, selectedClassFilter, selectedStatusFilter]);

  const handleOpenDetailModal = async (session: LiveClassSession) => {
    setSelectedSession(session);
    setDetailModalOpen(true);
    try {
      const parts = await liveClassParticipantService.getParticipants(session.id);
      setSessionParticipants(parts);

      const evts = await liveClassEventService.getEvents(session.id);
      setSessionEvents(evts);
    } catch (err) {
      console.error('Error loading session details:', err);
    }
  };

  // Clone Configuration: Creates a new draft copying class, subject, title, platform, URL
  const handleCloneConfig = async (session: LiveClassSession) => {
    try {
      const draft = await liveClassSessionService.createDraft({
        classId: session.classId,
        title: `${session.title} (Bản sao)`,
        subject: session.subject,
        meetingPlatform: session.meetingPlatform,
        meetingUrl: session.meetingUrl || undefined,
      });

      showSuccess('Nhân bản cấu hình thành công', `Đã tạo phiên mới từ "${session.title}" (Không copy điểm/điểm danh cũ).`);
      navigate(`/live-classroom/${draft.id}`);
    } catch (err: unknown) {
      showError('Lỗi nhân bản', (err as Error).message);
    }
  };

  const handleExportExcel = async (session: LiveClassSession) => {
    setExporting(true);
    try {
      await liveReportService.exportSessionExcel(session.id);
      showSuccess('Xuất file thành công', 'Đã tải xuống file báo cáo Excel.');
    } catch (err: unknown) {
      showError('Lỗi xuất báo cáo', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async (session: LiveClassSession) => {
    try {
      await liveReportService.exportSessionPdf(session.id);
    } catch (err: unknown) {
      showError('Lỗi xuất PDF', (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Lịch Sử Phiên Học Trực Tuyến"
        description="Tra cứu tổng quan các tiết dạy trực tuyến đã diễn ra, lịch sử điểm danh và nhân bản cấu hình phiên"
        action={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/live-classroom')}>
            Quay lại bảng điều khiển
          </Button>
        }
      />

      {/* FILTER TOOLBAR */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Tìm kiếm theo tiêu đề, môn học..."
            leftIcon={<Search className="w-4 h-4 text-app-muted" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tất cả Lớp học' },
              ...classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
            ]}
          />
          <Select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'draft', label: 'Bản nháp' },
              { value: 'active', label: 'Đang diễn ra' },
              { value: 'paused', label: 'Đã tạm dừng' },
              { value: 'completed', label: 'Đã hoàn thành' },
            ]}
          />
        </div>
      </Card>

      {/* HISTORY TABLE */}
      {loading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          title="Không tìm thấy lịch sử phiên học"
          description="Chưa có phiên học trực tuyến nào phù hợp với bộ lọc."
          icon={<Clock className="w-8 h-8" />}
        />
      ) : (
        <div className="bg-app-surface border border-app rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-app-surface-hover border-b border-app text-app-muted font-bold">
              <tr>
                <th className="p-3.5">Tiêu đề phiên học</th>
                <th className="p-3.5">Lớp học</th>
                <th className="p-3.5">Môn học</th>
                <th className="p-3.5">Ngày dạy</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app font-medium">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-app-surface-hover/50 transition-colors">
                  <td className="p-3.5 font-bold text-app-main">{session.title}</td>
                  <td className="p-3.5">
                    <Badge variant="neutral">Lớp {getClassName(session.classId)}</Badge>
                  </td>
                  <td className="p-3.5">{session.subject}</td>
                  <td className="p-3.5 text-xs text-app-muted">{formatDateVietnamese(session.sessionDate)}</td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        session.status === 'active' || session.status === 'paused'
                          ? 'success'
                          : session.status === 'completed'
                          ? 'neutral'
                          : 'warning'
                      }
                    >
                      {session.status === 'active'
                        ? 'Đang chạy'
                        : session.status === 'paused'
                        ? 'Tạm dừng'
                        : session.status === 'completed'
                        ? 'Hoàn thành'
                        : 'Bản nháp'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenDetailModal(session)}
                      >
                        Chi tiết
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Copy className="w-3.5 h-3.5" />}
                        onClick={() => handleCloneConfig(session)}
                        title="Tạo phiên mới với cùng cấu hình môn & tên bài"
                      >
                        Nhân bản
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/live-classroom/${session.id}`)}
                      >
                        Vào phiên
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SESSION DETAILS MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Chi Tiết Phiên Học: ${selectedSession?.title}`}
      >
        {selectedSession && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl bg-app-surface-hover border border-app text-xs space-y-1">
              <p>• Lớp học: <strong>Lớp {getClassName(selectedSession.classId)}</strong></p>
              <p>• Môn học: <strong>{selectedSession.subject}</strong></p>
              <p>• Ngày bắt đầu: <strong>{formatDateVietnamese(selectedSession.sessionDate)}</strong></p>
              <p>• Nền tảng: <strong>{selectedSession.meetingPlatform.toUpperCase()}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                <p className="font-semibold">Học sinh trong phiên</p>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">{sessionParticipants.length} em</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                <p className="font-semibold">Sự kiện ghi nhận</p>
                <p className="text-lg font-bold text-blue-700 mt-0.5">{sessionEvents.length} lượt</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-app-main flex items-center gap-1.5">
                <Users className="w-4 h-4 text-app-primary" /> Thống kê điểm danh trong phiên:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                  Có mặt: {sessionParticipants.filter((p) => p.attendanceStatus === 'present').length}
                </div>
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 font-bold">
                  Đi muộn: {sessionParticipants.filter((p) => p.attendanceStatus === 'late').length}
                </div>
                <div className="p-2 rounded-lg bg-red-100 text-red-800 font-bold">
                  Vắng: {sessionParticipants.filter((p) => p.attendanceStatus === 'absent').length}
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800 font-bold">
                  Chưa báo: {sessionParticipants.filter((p) => p.attendanceStatus === 'unchecked').length}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-app gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={exporting}
                  leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                  onClick={() => handleExportExcel(selectedSession)}
                >
                  Xuất Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Printer className="w-4 h-4 text-blue-600" />}
                  onClick={() => handleExportPdf(selectedSession)}
                >
                  Xuất PDF
                </Button>
              </div>
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
