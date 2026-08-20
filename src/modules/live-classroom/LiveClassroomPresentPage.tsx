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
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/live-classroom/${sessionId}`)}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs flex items-center gap-1.5 text-xs font-extrabold"
            title="Quay lại Bảng điều khiển giáo viên"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát trình chiếu</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>{session?.title || 'Phiên học trực tuyến'}</span>
              {classRoom && (
                <span className="px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                  Lớp {classRoom.name}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* CONTROLS & TIMERS */}
        <div className="flex items-center gap-2.5">
          {timerRemaining !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400 text-amber-950 font-mono text-lg font-black shadow-md animate-pulse">
              <Clock className="w-5 h-5" />
              <span>{formatTime(timerRemaining)}</span>
            </div>
          )}

          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs"
            title="Toàn màn hình (F11)"
          >
            <Maximize className="w-5 h-5" />
          </button>

          <button
            onClick={handleOpenInNewWindow}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs"
            title="Mở trong cửa sổ mới"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CELEBRATION POINT BANNER */}
      {pointCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 p-4 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-900 shadow-2xl border-4 border-white animate-bounce flex items-center gap-3">
          <CuteStarSVG className="w-10 h-10" />
          <div>
            <h3 className="font-extrabold text-lg">Khen thưởng: {pointCelebration.studentName}</h3>
            <p className="text-xs font-bold text-slate-800">+{pointCelebration.points} Điểm thi đua • {pointCelebration.reason}</p>
          </div>
        </div>
      )}

      {/* MAIN PRESENTATION BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-auto py-6 relative z-10">
        {/* LEFT / CENTER: RANDOM STUDENT CALLOUT WHEEL OR BROADCAST TOOLS */}
        <div className="lg:col-span-2 space-y-6 text-center flex flex-col justify-center items-center">
          {activeBreak && activeBreak.active ? (
            <div className="w-full max-w-lg p-8 rounded-3xl bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-2xl space-y-4 animate-fadeIn">
              <h2 className="text-2xl font-extrabold">{activeBreak.message}</h2>
              <div className="p-4 rounded-2xl bg-white/20 text-yellow-300 font-mono text-5xl font-extrabold tracking-widest inline-block shadow-inner">
                {formatTime(activeBreak.remainingSeconds)}
              </div>
            </div>
          ) : activePoll ? (
            <div className="w-full max-w-lg p-8 rounded-3xl bg-white border-4 border-indigo-400 shadow-2xl space-y-4 animate-scaleUp text-left">
              <span className="px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-black text-xs uppercase tracking-wider">
                Bình chọn / Khảo sát nhanh
              </span>
              <h2 className="text-2xl font-black text-slate-900">{activePoll.question}</h2>
              <div className="space-y-2">
                {activePoll.options.map((opt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-sm font-bold text-slate-800">
                    <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                    {activePoll.counts[idx] !== undefined && (
                      <span className="font-mono text-indigo-600 font-extrabold">{activePoll.counts[idx]} phiếu</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeQr ? (
            <div className="w-full max-w-lg p-8 rounded-3xl bg-white border-4 border-teal-400 shadow-2xl space-y-4 animate-scaleUp text-center">
              <span className="px-3.5 py-1 rounded-full bg-teal-100 text-teal-900 font-black text-xs uppercase tracking-wider">
                Quét mã QR
              </span>
              <h2 className="text-2xl font-black text-slate-900">{activeQr.title}</h2>
              <p className="text-sm text-slate-500 font-mono break-all">{activeQr.url}</p>
            </div>
          ) : selectedStudent ? (
            <div className="w-full max-w-lg p-8 rounded-3xl bg-white border-4 border-blue-400 shadow-2xl space-y-4 animate-scaleUp">
              <span className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Học sinh được chọn phát biểu
              </span>
              <div className="flex justify-center">
                <StudentAvatar
                  student={selectedStudent.student}
                  score={(selectedStudent as any).score ?? (selectedStudent.student as any).totalPoints}
                  size="xl"
                />
              </div>
              <h2 className="text-3xl font-black text-slate-900">{selectedStudent.student.fullName}</h2>
              <p className="text-sm font-bold text-slate-500">Mã học sinh: {selectedStudent.student.studentCode}</p>
            </div>
          ) : (
            <div className="text-center space-y-3 opacity-60">
              <CuteCloudSVG className="w-32 h-32 mx-auto" />
              <h3 className="text-2xl font-extrabold text-slate-700">Lớp học đang diễn ra sôi nổi</h3>
              <p className="text-sm font-medium text-slate-500">Màn hình tự động cập nhật hoạt động từ thầy/cô giáo</p>
            </div>
          )}
        </div>

        {/* RIGHT: GROUP SUMMARY OR SIDEBAR */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border-2 border-slate-100 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <CuteStarSVG className="w-5 h-5" />
              Danh sách nhóm học tập
            </h3>
            {groups.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa chia nhóm trong tiết học này</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {groups.map((grp) => (
                  <div key={grp.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-sm text-slate-800">{grp.name}</p>
                      <p className="text-[11px] text-slate-500">{grp.members.length} thành viên</p>
                    </div>
                    <span className="font-mono text-sm font-extrabold text-blue-600">
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
