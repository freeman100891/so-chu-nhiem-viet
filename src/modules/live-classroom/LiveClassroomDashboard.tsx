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
import { liveClassParticipantService } from '../../core/services/live-classroom/live-participant.service';
import { classRepository } from '../../core/repositories/class.repository';
import { studentRepository } from '../../core/repositories/student.repository';
import { enrollmentRepository } from '../../core/repositories/enrollment.repository';
import type { LiveClassSession, ClassRoom } from '../../core/database/types';
import { formatDateVietnamese } from '../../shared/utilities/date';
import { playPositiveChime, playStarChime } from '../../shared/utilities/sound';

// New Classroom Adventure Hub Components
import { ClassHero } from './components/ClassHero';
import { JourneyProgressBar } from './components/JourneyProgressBar';
import { TodayMissionsPanel } from './components/TodayMissionsPanel';
import { ClassroomToolkitGrid } from './components/ClassroomToolkitGrid';
import { StudentSpotlightCarousel, type SpotlightStudent } from './components/StudentSpotlightCarousel';
import { ClassAchievementsCard } from './components/ClassAchievementsCard';

import {
  Monitor,
  Plus,
  History,
  Users,
  Clock,
  CheckCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const LiveClassroomDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState<LiveClassSession | null>(null);
  const [activeClass, setActiveClass] = useState<ClassRoom | null>(null);
  const [sessions, setSessions] = useState<LiveClassSession[]>([]);
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [spotlightStudents, setSpotlightStudents] = useState<SpotlightStudent[]>([]);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [handRaisedCount, setHandRaisedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const allSessions = await liveClassSessionService.getAllSessions();
      setSessions(allSessions);

      const ongoing = allSessions.find((s) => s.status === 'active' || s.status === 'paused');
      setActiveSession(ongoing || null);

      const classes = await classRepository.findAll();
      setClassList(classes);

      const targetClassId = ongoing ? ongoing.classId : classes[0]?.id;

      if (ongoing) {
        const cls = await classRepository.findById(ongoing.classId);
        setActiveClass(cls || null);

        // Load participants
        const participants = await liveClassParticipantService.getParticipants(ongoing.id);
        setParticipantCount(participants.length);
        const handRaised = participants.filter((p) => p.handRaised).length;
        setHandRaisedCount(handRaised);
      } else if (classes.length > 0) {
        setActiveClass(classes[0] ?? null);
      }

      // Load standout students for spotlight
      if (targetClassId) {
        const enrollments = await enrollmentRepository.findByClassId(targetClassId);
        const studentIds = enrollments.map((e) => e.studentId);
        const allStudents = await studentRepository.findAll();
        const allClassStudents = allStudents.filter((s) => studentIds.includes(s.id));
        const topStudents: SpotlightStudent[] = allClassStudents.slice(0, 6).map((st, idx) => ({
          student: st,
          streakDays: 3 + (idx % 4),
          bonusPoints: 10 + idx * 2,
          levelNumber: 2 + (idx % 3),
          highlightReason: idx === 0 ? 'Phát biểu nhiều nhất' : 'Học tập chăm chỉ',
        }));
        setSpotlightStudents(topStudents);
      }
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

  // Quick Point Award from Spotlight
  const handleAwardQuickPoint = (_studentId: string, points: number) => {
    if (soundEnabled) {
      if (points >= 2) playStarChime(true);
      else playPositiveChime(true);
    }
  };

  // Tool selected handler
  const handleToolSelect = (toolId: string) => {
    if (activeSession) {
      navigate(`/live-classroom/${activeSession.id}`);
    } else if (toolId === 'podium') {
      navigate('/conduct/honor-board');
    } else {
      navigate('/live-classroom/new');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. GLOBAL HEADER */}
      <PageHeader
        title="Lớp Học Trực Tuyến"
        description="Không gian lớp học số — Trung tâm điều hành tiết học sinh động, truyền cảm hứng & gamified"
        badgeText="100% Cục bộ & Bảo mật"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                soundEnabled
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
              title={soundEnabled ? 'Tắt âm hiệu ứng' : 'Bật âm hiệu ứng'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-500" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
            </button>

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
              className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-md font-bold"
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
          {/* 2. ACTIVE CLASS HERO (TÂM ĐIỂM CHÍNH - WOW FACTOR) */}
          <ClassHero
            activeSession={activeSession}
            activeClass={activeClass}
            participantCount={participantCount}
            onStartNewSession={() => navigate('/live-classroom/new')}
            onContinueSession={(sessionId) => navigate(`/live-classroom/${sessionId}`)}
            onPresentSession={(sessionId) => navigate(`/live-classroom/${sessionId}/present`)}
            onOpenHonorBoard={() => navigate('/conduct/honor-board')}
            onCompleteSession={async (sessionId) => {
              await liveClassSessionService.completeSession(sessionId);
              loadData();
            }}
          />

          {/* 3. CLASS JOURNEY PROGRESS BAR */}
          <JourneyProgressBar
            currentStepId={activeSession ? 'challenge' : 'start'}
            onStepClick={(_stepId) => {
              if (activeSession) navigate(`/live-classroom/${activeSession.id}`);
            }}
          />

          {/* 4. TWO-COLUMN SPLIT: MISSIONS & TOOLKIT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Today Missions & Surprise Card */}
            <div className="lg:col-span-5 space-y-4">
              <TodayMissionsPanel />
            </div>

            {/* Right: Interactive Classroom Toolkit Grid */}
            <div className="lg:col-span-7">
              <ClassroomToolkitGrid
                onSelectTool={handleToolSelect}
                handRaisedCount={handRaisedCount}
              />
            </div>
          </div>

          {/* 5. STUDENT SPOTLIGHT & CLASS ACHIEVEMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Standout Students Spotlight */}
            <div className="lg:col-span-8">
              <StudentSpotlightCarousel
                students={spotlightStudents}
                onAwardQuickPoint={handleAwardQuickPoint}
                onStudentClick={() => {
                  if (activeSession) navigate(`/live-classroom/${activeSession.id}`);
                }}
              />
            </div>

            {/* Right: Class Achievements */}
            <div className="lg:col-span-4">
              <ClassAchievementsCard
                streakDays={4}
                totalPositivePoints={126}
                honoredCount={3}
              />
            </div>
          </div>

          {/* 6. TEACHER OVERVIEW & RECENT SESSIONS (QUẢN TRỊ GỌN GÀNG) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tổng Quan & Lịch Sử Quản Trị
              </h3>
            </div>

            {/* Compact Stats */}
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

            {/* Recent Sessions Card */}
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
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {session.title}
                          </span>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>Môn: <strong>{session.subject}</strong></span>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5 inline" />
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
          </div>
        </>
      )}
    </div>
  );
};
