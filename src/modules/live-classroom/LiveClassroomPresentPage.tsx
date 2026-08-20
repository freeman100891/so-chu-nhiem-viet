import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  liveClassSessionService,
  liveClassGroupService,
  liveBroadcastService,
  type BroadcastMessageType,
} from '../../core/services/live-classroom';
import { classRepository } from '../../core/repositories/class.repository';
import type { LiveClassSession, LiveClassParticipant, Student, ClassRoom } from '../../core/database/types';
import type { GroupWithMembers } from '../../core/services/live-classroom';
import type { LevelUpBroadcastPayload } from '../../core/services/live-classroom/live-broadcast';
import { CuteCloudSVG, CuteStarSVG, CuteRainbowSVG } from '../../shared/components/CuteDecorations';
import { StudentAvatar } from '../../shared/components/StudentAvatar';
import { LevelUpCelebrationModal } from './components/LevelUpCelebrationModal';
import { Sparkles, Clock, ArrowLeft, Maximize, ExternalLink } from 'lucide-react';

import type { DirectLevelChangeNotification } from '../../core/types/avatar-theme.types';

export const LiveClassroomPresentPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<LiveClassSession | null>(null);
  const [classRoom, setClassRoom] = useState<ClassRoom | null>(null);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);

  // Presentation State
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; participant: LiveClassParticipant } | null>(null);
  const [pointCelebration, setPointCelebration] = useState<{ studentName: string; points: number; reason: string } | null>(null);

  // Broadcast Tool States
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [activePoll, setActivePoll] = useState<{ question: string; options: string[]; correctAnswerIndex?: number | null; counts: number[] } | null>(null);
  const [activeBreak, setActiveBreak] = useState<{ active: boolean; remainingSeconds: number; message: string } | null>(null);
  const [activeQr, setActiveQr] = useState<{ title: string; url: string } | null>(null);
  const [levelUpData, setLevelUpData] = useState<LevelUpBroadcastPayload | null>(null);
  const [levelChangeNotifications, setLevelChangeNotifications] = useState<DirectLevelChangeNotification[] | null>(null);

  const loadData = React.useCallback(async () => {
    if (!sessionId) return;
    try {
      const sess = await liveClassSessionService.getSessionById(sessionId);
      if (!sess) return;
      setSession(sess);

      const room = await classRepository.findById(sess.classId);
      setClassRoom(room || null);

      const grps = await liveClassGroupService.getGroupsWithMembers(sessionId);
      setGroups(grps);
    } catch (err) {
      console.error('Error loading presentation view:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
    document.documentElement.setAttribute('data-ui-scale', 'presentation');
    return () => {
      document.documentElement.removeAttribute('data-ui-scale');
    };
  }, [loadData]);

  // Listen to BroadcastChannel events from Teacher Console
  useEffect(() => {
    const unsubscribe = liveBroadcastService.onMessage((msg: BroadcastMessageType) => {
      if (msg.type === 'STUDENT_SELECTED') {
        setSelectedStudent(msg.payload);
      } else if (msg.type === 'POINT_AWARDED') {
        setPointCelebration(msg.payload);
        setTimeout(() => setPointCelebration(null), 3500);
      } else if (msg.type === 'LEVEL_CHANGE_SHOW') {
        // FEAT-AVATAR-005 Instant Level Change Direct Presentation
        setLevelChangeNotifications(msg.payload.notifications);
        liveBroadcastService.postMessage({
          type: 'LEVEL_CHANGE_SHOWN_ACK',
          payload: {
            protocolVersion: 3,
            commandId: msg.payload.commandId,
            notificationIds: msg.payload.notifications.map((n) => n.notificationId),
            shownAt: new Date().toISOString(),
          },
        });
      } else if (msg.type === 'LEVEL_CHANGE_DISMISS') {
        setLevelChangeNotifications(null);
      } else if (msg.type === 'LEVEL_UP_SHOW') {
        setLevelUpData(msg.payload);
        // Send STARTED ACK
        liveBroadcastService.postMessage({
          type: 'LEVEL_UP_STARTED',
          payload: {
            protocolVersion: 2,
            commandId: msg.payload.commandId,
            eventId: msg.payload.eventId,
            state: 'STARTED',
          },
        });
      } else if (msg.type === 'LEVEL_UP_DISMISS') {
        if (levelUpData?.eventId === msg.payload.eventId) {
          setLevelUpData(null);
        }
      } else if (msg.type === 'TIMER_UPDATE') {
        setTimerRemaining(msg.payload.seconds);
      } else if (msg.type === 'GROUPS_UPDATE') {
        setGroups(msg.payload.groups);
      } else if (msg.type === 'POLL_STATE') {
        setActivePoll(msg.payload);
      } else if (msg.type === 'BREAK_SCREEN_STATE') {
        setActiveBreak(msg.payload);
      } else if (msg.type === 'PRESENT_QR') {
        setActiveQr(msg.payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [levelUpData]);

  const handleLevelUpComplete = () => {
    if (levelUpData) {
      liveBroadcastService.postMessage({
        type: 'LEVEL_UP_COMPLETED',
        payload: {
          protocolVersion: 2,
          commandId: levelUpData.commandId,
          eventId: levelUpData.eventId,
          state: 'COMPLETED',
        },
      });
      setLevelUpData(null);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  const handleOpenInNewWindow = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 p-6 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* CUTE BACKGROUND WATERMARKS */}
      <CuteCloudSVG className="absolute top-8 left-8 w-40 h-40 opacity-10 pointer-events-none" />
      <CuteRainbowSVG className="absolute bottom-6 right-6 w-56 h-56 opacity-10 pointer-events-none" />

      {/* TOP BAR: CLASS TITLE & STATUS */}
      <div className="flex items-center justify-between z-10 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/live-classroom/${sessionId}`)}
            className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md flex items-center gap-2 text-xs font-black transition-all active:scale-95"
            title="Quay lại Bảng điều khiển giáo viên"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát trình chiếu</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>{session?.title || 'Phiên học trực tuyến'}</span>
              {classRoom && (
                <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 text-xs font-black border border-blue-300 dark:border-blue-700 shadow-2xs">
                  Lớp {classRoom.name}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* CONTROLS & TIMERS */}
        <div className="flex items-center gap-3">
          {timerRemaining !== null && (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-mono text-xl font-black shadow-lg ring-2 ring-amber-300 animate-pulse">
              <Clock className="w-5 h-5" />
              <span>{formatTime(timerRemaining)}</span>
            </div>
          )}

          <button
            onClick={handleToggleFullscreen}
            className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md transition-all active:scale-95"
            title="Toàn màn hình (F11)"
          >
            <Maximize className="w-5 h-5" />
          </button>

          <button
            onClick={handleOpenInNewWindow}
            className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md transition-all active:scale-95"
            title="Mở trong cửa sổ mới"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CELEBRATION POINT BANNER */}
      {pointCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 p-5 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 shadow-2xl border-4 border-white animate-bounce flex items-center gap-4">
          <CuteStarSVG className="w-12 h-12 shrink-0 animate-spin" />
          <div>
            <h3 className="font-black text-xl">Khen thưởng: {pointCelebration.studentName}</h3>
            <p className="text-sm font-black text-slate-900">+{pointCelebration.points} Điểm thi đua • {pointCelebration.reason}</p>
          </div>
        </div>
      )}

      {/* MAIN PRESENTATION BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-auto py-6 relative z-10">
        {/* LEFT / CENTER: RANDOM STUDENT CALLOUT WHEEL OR BROADCAST TOOLS */}
        <div className="lg:col-span-2 space-y-6 text-center flex flex-col justify-center items-center">
          {activeBreak && activeBreak.active ? (
            <div className="w-full max-w-lg p-10 rounded-3xl bg-gradient-to-br from-blue-600 via-teal-600 to-indigo-600 text-white shadow-2xl space-y-5 animate-fadeIn border-4 border-white/30">
              <h2 className="text-3xl font-black">{activeBreak.message}</h2>
              <div className="p-5 rounded-3xl bg-black/20 text-yellow-300 font-mono text-6xl font-black tracking-widest inline-block shadow-inner ring-2 ring-yellow-400/40">
                {formatTime(activeBreak.remainingSeconds)}
              </div>
            </div>
          ) : activePoll ? (
            <div className="w-full max-w-lg p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-4 border-indigo-500 shadow-2xl space-y-5 animate-scaleUp text-left backdrop-blur-md">
              <span className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-900 font-black text-xs uppercase tracking-wider shadow-2xs">
                Bình chọn / Khảo sát nhanh
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{activePoll.question}</h2>
              <div className="space-y-2.5">
                {activePoll.options.map((opt, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-between text-base font-bold text-slate-800 dark:text-slate-200 shadow-xs">
                    <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                    {activePoll.counts[idx] !== undefined && (
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black text-lg">{activePoll.counts[idx]} phiếu</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeQr ? (
            <div className="w-full max-w-lg p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-4 border-teal-500 shadow-2xl space-y-5 animate-scaleUp text-center backdrop-blur-md">
              <span className="px-4 py-1.5 rounded-full bg-teal-100 text-teal-900 font-black text-xs uppercase tracking-wider shadow-2xs">
                Quét mã QR
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{activeQr.title}</h2>
              <p className="text-sm text-slate-500 font-mono break-all bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">{activeQr.url}</p>
            </div>
          ) : selectedStudent ? (
            <div className="w-full max-w-lg p-10 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-4 border-blue-500 shadow-2xl space-y-6 animate-scaleUp backdrop-blur-md">
              <span className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-2xs ring-1 ring-blue-300">
                <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
                Học sinh được chọn phát biểu
              </span>
              <div className="flex justify-center">
                <StudentAvatar
                  student={selectedStudent.student}
                  score={(selectedStudent as any).score ?? (selectedStudent.student as any).totalPoints}
                  size="xl"
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{selectedStudent.student.fullName}</h2>
              <p className="text-base font-bold text-slate-500">Mã học sinh: {selectedStudent.student.studentCode}</p>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-75">
              <CuteCloudSVG className="w-36 h-36 mx-auto animate-bounce" />
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-200">Lớp học đang diễn ra sôi nổi</h3>
              <p className="text-base font-bold text-slate-500">Màn hình tự động cập nhật hoạt động trực tiếp từ thầy/cô giáo</p>
            </div>
          )}
        </div>

        {/* RIGHT: GROUP SUMMARY OR SIDEBAR */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-slate-200 dark:border-slate-800 shadow-lg space-y-4 backdrop-blur-md">
            <h3 className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CuteStarSVG className="w-5 h-5 text-amber-500" />
              Danh sách nhóm học tập
            </h3>
            {groups.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Chưa chia nhóm trong tiết học này</p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {groups.map((grp) => (
                  <div key={grp.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="font-black text-sm text-slate-800 dark:text-slate-200">{grp.name}</p>
                      <p className="text-xs text-slate-500">{grp.members.length} thành viên</p>
                    </div>
                    <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
                      {(grp as any).points || 0} điểm
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5-LEVEL AVATAR LEVEL-UP / LEVEL-CHANGE CELEBRATION MODAL OVERLAY */}
      <LevelUpCelebrationModal
        isOpen={!!levelChangeNotifications || !!levelUpData}
        data={levelUpData}
        notifications={levelChangeNotifications}
        enableSound={levelUpData?.soundEnabled ?? true}
        confettiEnabled={levelUpData?.confettiEnabled ?? true}
        intensity={levelUpData?.intensity ?? 'BALANCED'}
        durationMs={levelUpData?.durationMs ?? 5200}
        onClose={() => {
          setLevelChangeNotifications(null);
          setLevelUpData(null);
        }}
        onComplete={() => {
          setLevelChangeNotifications(null);
          handleLevelUpComplete();
        }}
        isPresentationMode={true}
      />
    </div>
  );
};

