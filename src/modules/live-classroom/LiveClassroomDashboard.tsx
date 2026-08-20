import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Badge } from '../../shared/components/Badge';
import { StatCard } from '../../shared/components/StatCard';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { EmptyState } from '../../shared/components/EmptyState';
import { liveClassSessionService } from '../../core/services/live-classroom/live-session.service';
import { classRepository } from '../../core/repositories/class.repository';
import type { LiveClassSession, ClassRoom } from '../../core/database/types';
import { formatDateVietnamese } from '../../shared/utilities/date';
import {
  Monitor,
  Plus,
  History,
  Play,
  ExternalLink,
  Users,
  Video,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const LiveClassroomDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState<LiveClassSession | null>(null);
  const [activeClass, setActiveClass] = useState<ClassRoom | null>(null);
  const [sessions, setSessions] = useState<LiveClassSession[]>([]);
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const allSessions = await liveClassSessionService.getAllSessions();
      setSessions(allSessions);

      const ongoing = allSessions.find((s) => s.status === 'active' || s.status === 'paused');
      setActiveSession(ongoing || null);

      if (ongoing) {
        const cls = await classRepository.findById(ongoing.classId);
        setActiveClass(cls || null);
      }

      const classes = await classRepository.findAll();
      setClassList(classes);
    } catch (err) {
      console.error('Error loading live classroom dashboard:', err);
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

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'meet':
        return 'Google Meet';
      case 'zoom':
        return 'Zoom Workplace';
      case 'teams':
        return 'Microsoft Teams';
      case 'other':
        return 'Nền tảng khác';
      default:
        return 'Không có';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Lớp Học Trực Tuyến"
        description="Bảng điều khiển hỗ trợ giáo viên điều hành tiết học qua Google Meet, Zoom, MS Teams"
        badgeText="100% Cục bộ & Bảo mật"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<History className="w-4 h-4" />}
              onClick={() => navigate('/live-classroom/history')}
            >
              Lịch sử phiên học
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/live-classroom/new')}
            >
              Tạo phiên học mới
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : (
        <>
          {/* ONGOING ACTIVE / PAUSED SESSION BANNER */}
          {activeSession ? (
            <Card className="border-2 border-emerald-500 bg-emerald-50/40 p-5 shadow-md animate-pulse-subtle">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="success" className="animate-pulse">
                      ● PHIÊN ĐANG HOẠT ĐỘNG
                    </Badge>
                    <Badge variant="neutral">Lớp {activeClass?.name || getClassName(activeSession.classId)}</Badge>
                    <Badge variant="primary">{getPlatformLabel(activeSession.meetingPlatform)}</Badge>
                  </div>
                  <h2 className="text-xl font-extrabold text-app-main leading-snug">
                    {activeSession.title}
                  </h2>
                  <p className="text-xs text-app-muted flex items-center gap-3 flex-wrap">
                    <span>Môn học: <strong>{activeSession.subject}</strong></span>
                    <span>•</span>
                    <span>Ngày dạy: {formatDateVietnamese(activeSession.sessionDate)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeSession.meetingUrl && (
                    <a
                      href={activeSession.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      <Video className="w-4 h-4" />
                      Mở phòng học ({getPlatformLabel(activeSession.meetingPlatform)})
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                    </a>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/live-classroom/${activeSession.id}/present`)}
                  >
                    Màn hình chiếu
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (window.confirm('Bạn có chắc chắn muốn hoàn thành phiên học này?')) {
                        await liveClassSessionService.completeSession(activeSession.id);
                        loadData();
                      }
                    }}
                  >
                    Hoàn thành phiên
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Play className="w-4 h-4" />}
                    onClick={() => navigate(`/live-classroom/${activeSession.id}`)}
                  >
                    Tiếp Tục Phiên
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="p-4 rounded-2xl bg-app-primary-light/30 border border-app flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-app-primary text-app-primary-fg rounded-xl">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-app-main">Chưa có phiên học nào đang chạy</h3>
                  <p className="text-xs text-app-muted">Hãy tạo một phiên học mới để điểm danh, phát biểu và gọi tên ngẫu nhiên.</p>
                </div>
              </div>
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/live-classroom/new')}>
                Bắt đầu phiên học ngay
              </Button>
            </div>
          )}

          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Phiên học đang mở"
              value={activeSession ? '1 phiên' : '0 phiên'}
              icon={<Monitor className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Tổng phiên đã tổ chức"
              value={`${sessions.length} phiên`}
              icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Lớp học sẵn sàng"
              value={`${classList.length} lớp`}
              icon={<Users className="w-5 h-5 text-purple-600" />}
            />
          </div>

          {/* RECENT SESSIONS LIST */}
          <Card title="Các phiên học gần đây">
            {sessions.length === 0 ? (
              <EmptyState
                title="Chưa có phiên học nào"
                description="Bắt đầu tạo phiên học trực tuyến đầu tiên của bạn để hỗ trợ giảng dạy từ xa."
                actionText="Tạo phiên học mới"
                onAction={() => navigate('/live-classroom/new')}
                icon={<Monitor className="w-8 h-8" />}
              />
            ) : (
              <div className="divide-y divide-app">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-app-main">{session.title}</span>
                        <Badge variant="neutral">Lớp {getClassName(session.classId)}</Badge>
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
                            ? 'Đang hoạt động'
                            : session.status === 'paused'
                            ? 'Tạm dừng'
                            : session.status === 'completed'
                            ? 'Hoàn thành'
                            : 'Bản nháp'}
                        </Badge>
                      </div>
                      <p className="text-xs text-app-muted flex items-center gap-2">
                        <span>Môn: {session.subject}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-app-muted inline" />
                        <span>{formatDateVietnamese(session.sessionDate)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/live-classroom/${session.id}`)}
                      >
                        {session.status === 'completed' ? 'Xem lại' : 'Điều hành'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
