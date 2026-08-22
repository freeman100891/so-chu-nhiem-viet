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
import { ClassMascot, type MascotState } from './components/ClassMascot';
import {
  Sparkles,
  Clock,
  ArrowLeft,
  Maximize,
  ExternalLink,
  Users,
} from 'lucide-react';

import type { DirectLevelChangeNotification } from '../../core/types/avatar-theme.types';

export const LiveClassroomPresentPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<LiveClassSession | null>(null);
  const [classRoom, setClassRoom] = useState<ClassRoom | null>(null);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);

  // Mascot Presentation State
  const [mascotState, setMascotState] = useState<MascotState>('learning');
  const [mascotMessage, setMascotMessage] = useState<string>('Chào mừng các bạn nhỏ đến với tiết học! ⭐');

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
        setMascotState('point_awarded');
        setMascotMessage(`Mời bạn ${msg.payload.student.fullName} trả lời câu hỏi! 🎤`);
      } else if (msg.type === 'POINT_AWARDED') {
        setPointCelebration(msg.payload);
        setMascotState('point_awarded');
        setMascotMessage(`Tuyệt vời! +${msg.payload.points} điểm cho bạn ${msg.payload.studentName}! 🎉`);
        setTimeout(() => {
          setPointCelebration(null);
          setMascotState('learning');
          setMascotMessage('Cố lên nào các bạn nhỏ ơi! ⭐');
        }, 4000);
      } else if (msg.type === 'LEVEL_CHANGE_SHOW') {
        setLevelChangeNotifications(msg.payload.notifications);
        setMascotState('rank_up');
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
        setMascotState('learning');
      } else if (msg.type === 'LEVEL_UP_SHOW') {
        setLevelUpData(msg.payload);
        setMascotState('rank_up');
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
          setMascotState('learning');
        }
      } else if (msg.type === 'TIMER_UPDATE') {
        setTimerRemaining(msg.payload.seconds);
      } else if (msg.type === 'GROUPS_UPDATE') {
        setGroups(msg.payload.groups);
      } else if (msg.type === 'POLL_STATE') {
        setActivePoll(msg.payload);
      } else if (msg.type === 'BREAK_SCREEN_STATE') {
        setActiveBreak(msg.payload);
        if (msg.payload?.active) {
          setMascotState('break');
          setMascotMessage('Giờ nghỉ ngơi rồi! Uống nước và vươn vai nhé! ☕');
        } else {
          setMascotState('learning');
        }
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
      setMascotState('learning');
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100/80 via-sky-50 to-emerald-50/80 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* CUTE BACKGROUND WATERMARKS */}
      <CuteCloudSVG className="absolute top-10 left-10 w-48 h-48 opacity-15 pointer-events-none animate-float-soft" />
      <CuteRainbowSVG className="absolute bottom-8 right-8 w-64 h-64 opacity-15 pointer-events-none" />
      <CuteStarSVG className="absolute top-1/3 right-12 w-20 h-20 opacity-20 pointer-events-none animate-pulse" />

      {/* TOP BAR: CLASS TITLE & STATUS */}
      <div className="flex items-center justify-between z-10 flex-wrap gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-3xl border-2 border-sky-200 dark:border-sky-800 shadow-lg">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(`/live-classroom/${sessionId}`)}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-sm flex items-center gap-2 text-xs font-black transition-all active:scale-95 cursor-pointer"
            title="Quay lại Bảng điều khiển giáo viên"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Thoát trình chiếu</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <span>{session?.title || 'Phiên học trực tuyến'}</span>
              {classRoom && (
                <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs sm:text-sm font-black shadow-xs">
                  Lớp {classRoom.name}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* CONTROLS & TIMERS */}
        <div className="flex items-center gap-3">
          {timerRemaining !== null && (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 font-mono text-xl sm:text-2xl font-black shadow-lg ring-2 ring-amber-300 animate-pulse">
              <Clock className="w-6 h-6" />
              <span>{formatTime(timerRemaining)}</span>
            </div>
          )}

          <button
            onClick={handleToggleFullscreen}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Toàn màn hình (F11)"
          >
            <Maximize className="w-5 h-5" />
          </button>

          <button
            onClick={handleOpenInNewWindow}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Mở trong cửa sổ mới"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CELEBRATION POINT POPUP BANNER */}
      {pointCelebration && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 p-6 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 shadow-2xl border-4 border-white animate-point-rise flex items-center gap-4">
          <CuteStarSVG className="w-14 h-14 shrink-0 animate-spin" />
          <div>
            <h3 className="font-black text-2xl">Khen thưởng: {pointCelebration.studentName}</h3>
            <p className="text-base font-black text-slate-900">
              +{pointCelebration.points} Điểm thi đua • {pointCelebration.reason}
            </p>
          </div>
        </div>
      )}

      {/* MAIN PRESENTATION ARENA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 relative z-10 items-center">
        {/* LEFT / CENTER: MASCOT + DYNAMIC INTERACTIVE DISPLAY */}
        <div className="lg:col-span-8 space-y-6 text-center flex flex-col justify-center items-center">
          {activeBreak && activeBreak.active ? (
            <div className="w-full max-w-xl p-10 rounded-3xl bg-gradient-to-br from-blue-600 via-teal-600 to-indigo-600 text-white shadow-2xl space-y-6 animate-scaleUp border-4 border-white/30">
              <ClassMascot state="break" size="lg" showSpeechBubble={false} />
              <h2 className="text-3xl sm:text-4xl font-black">{activeBreak.message}</h2>
              <div className="p-6 rounded-3xl bg-black/25 text-yellow-300 font-mono text-6xl sm:text-7xl font-black tracking-widest inline-block shadow-inner ring-4 ring-yellow-400/40">
                {formatTime(activeBreak.remainingSeconds)}
              </div>
            </div>
          ) : activePoll ? (
            <div className="w-full max-w-2xl p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-4 border-indigo-500 shadow-2xl space-y-6 animate-scaleUp text-left backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-900 font-black text-xs uppercase tracking-wider shadow-2xs">
                  Bình chọn / Khảo sát nhanh
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                {activePoll.question}
              </h2>
              <div className="space-y-3">
                {activePoll.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-between text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 shadow-xs"
                  >
                    <span>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </span>
                    {activePoll.counts[idx] !== undefined && (
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black text-xl sm:text-2xl">
                        {activePoll.counts[idx]} phiếu
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeQr ? (
            <div className="w-full max-w-xl p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-4 border-teal-500 shadow-2xl space-y-6 animate-scaleUp text-center backdrop-blur-md">
              <span className="px-4 py-1.5 rounded-full bg-teal-100 text-teal-900 font-black text-xs uppercase tracking-wider shadow-2xs">
                Quét mã QR
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{activeQr.title}</h2>
              <p className="text-base text-slate-600 font-mono break-all bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl">
                {activeQr.url}
              </p>
            </div>
          ) : selectedStudent ? (
            <div className="w-full max-w-xl p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-4 border-sky-500 shadow-2xl space-y-6 animate-scaleUp backdrop-blur-md text-center">
              <span className="px-5 py-2 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-900 font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 shadow-2xs ring-2 ring-sky-300">
                <Sparkles className="w-5 h-5 text-sky-600 animate-spin" />
                Học sinh được chọn phát biểu
              </span>
              <div className="flex justify-center my-2">
                <StudentAvatar
                  student={selectedStudent.student}
                  score={(selectedStudent as any).score ?? (selectedStudent.student as any).totalPoints}
                  size="xl"
                  className="w-32 h-32 ring-4 ring-sky-400 shadow-xl"
                />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {selectedStudent.student.fullName}
              </h2>
              <p className="text-base font-bold text-slate-500">Mã học sinh: {selectedStudent.student.studentCode}</p>
            </div>
          ) : (
            /* DEFAULT ARENA: MASCOT BÉ BO SCHOLAR STAGE */
            <div className="text-center space-y-6">
              <ClassMascot
                state={mascotState}
                size="presentation"
                showSpeechBubble={true}
                message={mascotMessage}
              />
              <div className="space-y-2">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-200">
                  Lớp Học Đang Diễn Ra Sôi Nổi ✨
                </h3>
                <p className="text-base sm:text-lg font-bold text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Hãy chú ý quan sát câu hỏi và giơ tay phát biểu để nhận những ngôi sao may mắn từ thầy cô nhé!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: GROUPS / LEADERBOARD & STAGE PODIUM */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="font-black text-base text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CuteStarSVG className="w-6 h-6 text-amber-500" />
                Nhóm Học Tập
              </span>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-full border border-sky-200">
                {groups.length} nhóm
              </span>
            </h3>

            {groups.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-xs font-bold">Chưa chia nhóm trong tiết học này</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {groups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs hover:border-sky-300 transition-colors"
                  >
                    <div>
                      <p className="font-black text-base text-slate-800 dark:text-slate-200">{grp.name}</p>
                      <p className="text-xs font-bold text-slate-500">{grp.members.length} bạn thành viên</p>
                    </div>
                    <span className="font-mono text-base font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/70 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800">
                      {(grp as any).points || 0} ⭐
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
