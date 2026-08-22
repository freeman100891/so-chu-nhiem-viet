import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { liveClassGroupService, liveBroadcastService } from '../../core/services/live-classroom';
import type { LiveClassParticipant, Student, LiveClassEvent } from '../../core/database/types';
import type { GroupWithMembers } from '../../core/services/live-classroom';
import type { GlobalAvatarSystemSettings } from '../../core/types/avatar-theme.types';
import { RandomPickerTool } from './tools/RandomPickerTool';
import { HandRaisedQueueTool } from './tools/HandRaisedQueueTool';
import { QuickPollTool } from './tools/QuickPollTool';
import { WhiteboardTool } from './tools/WhiteboardTool';
import { QrGeneratorTool } from './tools/QrGeneratorTool';
import { BreakScreenTool } from './tools/BreakScreenTool';
import {
  Sparkles,
  Clock,
  Users,
  Hand,
  HelpCircle,
  Edit3,
  QrCode,
  Coffee,
  Activity,
  Maximize,
  Minimize,
  Sliders,
  X,
  Play,
  Pause,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../shared/utilities/cn';

export type ClassroomToolId =
  | 'random'
  | 'timer'
  | 'groups'
  | 'handQueue'
  | 'quickPoll'
  | 'whiteboard'
  | 'qrCode'
  | 'breakScreen'
  | 'events';

export interface FloatingClassroomToolboxProps {
  sessionId: string;
  classId: string;
  participants: LiveClassParticipant[];
  studentMap: Map<string, Student>;
  groups: GroupWithMembers[];
  events: LiveClassEvent[];
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
  studentTotalPointsMap?: Map<string, number>;
  onParticipantsUpdated: () => void;
  onGroupsUpdated: () => void;
  onQuickAwardPoints: (studentId: string, points: number, reason: string) => Promise<void>;
  onOpenDeductModal?: (studentId: string) => void;
  onIncrementTalk?: (studentId: string) => Promise<void>;
  onOpenGroupPointModal?: (groupId: string) => void;
  onSelectStudentCard?: (studentId: string) => void;
  enableSound?: boolean;
}

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const FloatingClassroomToolbox: React.FC<FloatingClassroomToolboxProps> = ({
  sessionId,
  participants,
  studentMap,
  groups,
  events,
  globalSettings,
  uploadedAssetUrls,
  studentTotalPointsMap,
  onParticipantsUpdated,
  onGroupsUpdated,
  onQuickAwardPoints,
  onOpenDeductModal = () => {},
  onIncrementTalk = async () => {},
  onOpenGroupPointModal,
  onSelectStudentCard,
  enableSound = true,
}) => {
  // isToolbarOpen controls opening/closing the ENTIRE toolbox bar
  const [isToolbarOpen, setIsToolbarOpen] = useState<boolean>(() => {
    return localStorage.getItem('live_toolbox_visible') !== 'false';
  });

  const [activeTool, setActiveTool] = useState<ClassroomToolId>(() => {
    return (localStorage.getItem('live_toolbox_active_tool') as ClassroomToolId) || 'random';
  });

  // Modal visibility states for heavy overlay tools
  const [modalTool, setModalTool] = useState<ClassroomToolId | null>(null);

  // Group creation state
  const [autoGroupCount, setAutoGroupCount] = useState(4);
  const [autoGrouping, setAutoGrouping] = useState(false);

  // Countdown Timer State (preserves timer counting when panel is collapsed)
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Hand raised queue count
  const handQueueCount = participants.filter((p) => p.handRaised).length;

  // Persist open/close state of the ENTIRE toolbar
  const toggleToolbar = useCallback((open?: boolean) => {
    setIsToolbarOpen((prev) => {
      const next = open !== undefined ? open : !prev;
      localStorage.setItem('live_toolbox_visible', String(next));
      return next;
    });
  }, []);

  const selectTool = useCallback(
    (toolId: ClassroomToolId) => {
      setActiveTool(toolId);
      localStorage.setItem('live_toolbox_active_tool', toolId);
      if (!isToolbarOpen) {
        toggleToolbar(true);
      }
    },
    [isToolbarOpen, toggleToolbar]
  );

  // Countdown Timer Loop
  useEffect(() => {
    if (!isTimerRunning || timerRemaining === null) return;

    if (timerRemaining <= 0) {
      setIsTimerRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setIsTimerRunning(false);
          liveBroadcastService.postMessage({
            type: 'TIMER_UPDATE',
            payload: { seconds: 0, isRunning: false },
          });
          return 0;
        }
        const next = prev - 1;
        liveBroadcastService.postMessage({
          type: 'TIMER_UPDATE',
          payload: { seconds: next, isRunning: true },
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  // Auto assign groups handler
  const handleAutoAssignGroups = async () => {
    setAutoGrouping(true);
    try {
      await liveClassGroupService.autoAssignGroups(sessionId, autoGroupCount);
      onGroupsUpdated();
    } catch (err) {
      console.error('Error auto assigning groups:', err);
    } finally {
      setAutoGrouping(false);
    }
  };

  // Keyboard Shortcuts Listener (R, T, G, F, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('[role="dialog"]'))
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'r') {
        e.preventDefault();
        selectTool('random');
      } else if (key === 't') {
        e.preventDefault();
        selectTool('timer');
      } else if (key === 'g') {
        e.preventDefault();
        selectTool('groups');
      } else if (key === 'f') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (key === 'escape') {
        if (modalTool) {
          setModalTool(null);
        } else if (isToolbarOpen) {
          toggleToolbar(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectTool, isToolbarOpen, toggleToolbar, modalTool]);

  const toolItems = [
    { id: 'random' as ClassroomToolId, name: 'Gọi tên ngẫu nhiên', shortcut: 'R', icon: Sparkles, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700' },
    { id: 'timer' as ClassroomToolId, name: 'Đồng hồ đếm giờ', shortcut: 'T', icon: Clock, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700' },
    { id: 'groups' as ClassroomToolId, name: 'Chia nhóm học sinh', shortcut: 'G', icon: Users, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700' },
    { id: 'handQueue' as ClassroomToolId, name: 'Hàng đợi giơ tay', shortcut: '', icon: Hand, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700', badge: handQueueCount },
    { id: 'quickPoll' as ClassroomToolId, name: 'Hỏi đáp & Trắc nghiệm', shortcut: '', icon: HelpCircle, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700' },
    { id: 'whiteboard' as ClassroomToolId, name: 'Bảng viết nhanh', shortcut: '', icon: Edit3, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700' },
    { id: 'qrCode' as ClassroomToolId, name: 'Mã QR tài liệu', shortcut: '', icon: QrCode, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700' },
    { id: 'breakScreen' as ClassroomToolId, name: 'Nghỉ giải lao', shortcut: '', icon: Coffee, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-700' },
    { id: 'events' as ClassroomToolId, name: 'Nhật ký tiết học', shortcut: '', icon: Activity, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700' },
  ];

  const currentToolMeta = toolItems.find((t) => t.id === activeTool) || toolItems[0]!;

  return (
    <>
      {/* WHEN ENTIRE TOOLBAR IS CLOSED: SHOW COMPACT FLOATING DOCK LAUNCHER */}
      {!isToolbarOpen && (
        <button
          onClick={() => toggleToolbar(true)}
          className={cn(
            'fixed right-5 bottom-6 z-40 select-none',
            'px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-sky-300 dark:border-slate-700 shadow-2xl backdrop-blur-md',
            'text-slate-800 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 font-black text-xs',
            'flex items-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sky-500/10 cursor-pointer animate-fadeIn'
          )}
          aria-label="Mở toàn bộ thanh công cụ lớp học"
          title="Mở toàn bộ thanh công cụ lớp học"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-400 text-amber-950 flex items-center justify-center font-black shadow-xs">
            <Sliders className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Bàn Giáo Viên</p>
            <p className="font-black text-xs text-slate-900 dark:text-slate-100">Bảng Công Cụ</p>
          </div>
          {handQueueCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center animate-bounce shadow-xs">
              {handQueueCount}
            </span>
          )}
        </button>
      )}

      {/* TABLET / MOBILE BACKDROP OVERLAY */}
      {isToolbarOpen && (
        <div
          onClick={() => toggleToolbar(false)}
          className="xl:hidden fixed inset-0 bg-black/25 backdrop-blur-xs z-30 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* FLOATING CLASSROOM TOOL DOCK ASIDE CONTAINER (ANCHORED BOTTOM RIGHT) */}
      {isToolbarOpen && (
        <aside
          aria-label="Bảng công cụ lớp học"
          className={cn(
            'fixed z-40 transition-all duration-300 ease-out select-none',
            'right-4 sm:right-6 bottom-6',
            'max-h-[calc(100dvh-32px)] flex items-end'
          )}
        >
          <div className="flex items-start gap-2.5 h-full">
            {/* TOOL CONTENT SIDE DRAWER (PRESERVES STUDENT GRID VISIBILITY) */}
            <div
              className={cn(
                'bg-white/95 dark:bg-slate-900/95 border-2 border-sky-200/90 dark:border-slate-700 shadow-2xl rounded-3xl p-4 flex flex-col backdrop-blur-md',
                'w-[calc(100vw-76px)] sm:w-96 md:w-[430px] max-h-[calc(100dvh-56px)] overflow-hidden animate-slideLeft'
              )}
            >
              {/* TOOL HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn('p-2 rounded-2xl border-2 shrink-0 shadow-2xs', currentToolMeta.color)}>
                    <currentToolMeta.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">{currentToolMeta.name}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                      {currentToolMeta.shortcut ? `Phím tắt [${currentToolMeta.shortcut}]` : 'Công cụ tương tác trực quan'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleToolbar(false)}
                  className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  aria-label="Đóng toàn bộ thanh công cụ"
                  title="Đóng toàn bộ thanh công cụ (Escape)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ACTIVE TOOL PANEL BODY */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none text-xs">
                {/* TOOL 1: RANDOM CALLER & CALLED STUDENTS QUEUE */}
                {activeTool === 'random' && (
                  <RandomPickerTool
                    isEmbedded={true}
                    sessionId={sessionId}
                    participants={participants}
                    studentMap={studentMap}
                    globalSettings={globalSettings}
                    uploadedAssetUrls={uploadedAssetUrls}
                    studentTotalPointsMap={studentTotalPointsMap}
                    onParticipantsUpdated={onParticipantsUpdated}
                    enableSound={enableSound}
                    onAwardPoint={onQuickAwardPoints}
                    onOpenDeductModal={onOpenDeductModal}
                    onIncrementTalk={onIncrementTalk}
                    onSelectStudentCard={onSelectStudentCard}
                  />
                )}

                {/* TOOL 2: TIMER */}
                {activeTool === 'timer' && (
                  <div className="space-y-3 text-center py-1">
                    <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-3xl font-extrabold tracking-wider shadow-inner">
                      {formatTime(timerRemaining !== null ? timerRemaining : timerSeconds)}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                      {[60, 180, 300, 600].map((secs) => (
                        <button
                          key={secs}
                          onClick={() => {
                            setTimerSeconds(secs);
                            setTimerRemaining(secs);
                            setIsTimerRunning(false);
                          }}
                          className="py-1.5 rounded-xl border border-app hover:bg-app-surface-hover text-app-main transition-colors"
                        >
                          {secs / 60} phút
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        leftIcon={isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        onClick={() => {
                          if (timerRemaining === null) setTimerRemaining(timerSeconds);
                          setIsTimerRunning(!isTimerRunning);
                        }}
                      >
                        {isTimerRunning ? 'Tạm dừng' : 'Bắt đầu đếm'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsTimerRunning(false);
                          setTimerRemaining(timerSeconds);
                        }}
                      >
                        Đặt lại
                      </Button>
                    </div>
                  </div>
                )}

                {/* TOOL 3: GROUPS */}
                {activeTool === 'groups' && (
                  <div className="space-y-3 py-1">
                    <div className="flex items-center gap-2">
                      <Select
                        value={autoGroupCount}
                        onChange={(e) => setAutoGroupCount(Number(e.target.value))}
                        options={[
                          { value: 2, label: '2 nhóm' },
                          { value: 3, label: '3 nhóm' },
                          { value: 4, label: '4 nhóm' },
                          { value: 5, label: '5 nhóm' },
                        ]}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={autoGrouping}
                        onClick={handleAutoAssignGroups}
                      >
                        Chia ngẫu nhiên
                      </Button>
                    </div>

                    {groups.length === 0 ? (
                      <div className="py-6 text-center text-app-muted font-semibold">
                        Chưa khởi tạo nhóm trong tiết học này.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {groups.map((g) => (
                          <div
                            key={g.id}
                            className="p-2.5 rounded-2xl bg-app-surface-hover border border-app flex items-center justify-between"
                          >
                            <span className="font-bold text-app-main truncate">
                              {g.name} ({g.members.length} em)
                            </span>
                            <button
                              onClick={() => onOpenGroupPointModal?.(g.id)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-[10px] hover:bg-emerald-200 transition-colors shrink-0"
                            >
                              Cộng điểm
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TOOL 4: HAND RAISED QUEUE */}
                {activeTool === 'handQueue' && (
                  <div className="space-y-3 py-1 text-center">
                    <p className="text-app-muted font-semibold">
                      {handQueueCount > 0
                        ? `Hiện có ${handQueueCount} học sinh đang giơ tay phát biểu.`
                        : 'Hiện chưa có học sinh nào giơ tay.'}
                    </p>
                    <Button
                      variant="primary"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold"
                      leftIcon={<Hand className="w-4 h-4" />}
                      onClick={() => setModalTool('handQueue')}
                    >
                      MỞ HÀNG ĐỢI GIƠ TAY ({handQueueCount})
                    </Button>
                  </div>
                )}

                {/* TOOL 5: QUICK POLL */}
                {activeTool === 'quickPoll' && (
                  <div className="space-y-3 py-1 text-center">
                    <p className="text-app-muted font-semibold">
                      Tạo câu hỏi trắc nghiệm nhanh A/B/C/D phát sóng lên màn hình Trình chiếu.
                    </p>
                    <Button
                      variant="primary"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold"
                      leftIcon={<HelpCircle className="w-4 h-4" />}
                      onClick={() => setModalTool('quickPoll')}
                    >
                      MỞ TẠO CÂU HỎI TRẮC NGHIỆM
                    </Button>
                  </div>
                )}

                {/* TOOL 6: WHITEBOARD */}
                {activeTool === 'whiteboard' && (
                  <div className="space-y-3 py-1 text-center">
                    <p className="text-app-muted font-semibold">
                      Bảng vẽ viết tay nhanh hỗ trợ giải bài tập trực tiếp.
                    </p>
                    <Button
                      variant="primary"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
                      leftIcon={<Edit3 className="w-4 h-4" />}
                      onClick={() => setModalTool('whiteboard')}
                    >
                      MỞ BẢNG VIẾT NHANH
                    </Button>
                  </div>
                )}

                {/* TOOL 7: QR CODE */}
                {activeTool === 'qrCode' && (
                  <div className="space-y-3 py-1 text-center">
                    <p className="text-app-muted font-semibold">
                      Tạo mã QR chia sẻ link tài liệu bài giảng cho học sinh.
                    </p>
                    <Button
                      variant="primary"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
                      leftIcon={<QrCode className="w-4 h-4" />}
                      onClick={() => setModalTool('qrCode')}
                    >
                      MỞ TẠO MÃ QR TÀI LIỆU
                    </Button>
                  </div>
                )}

                {/* TOOL 8: BREAK SCREEN */}
                {activeTool === 'breakScreen' && (
                  <div className="space-y-3 py-1 text-center">
                    <p className="text-app-muted font-semibold">
                      Màn hình đếm ngược giờ nghỉ giải lao kèm nhạc nhẹ.
                    </p>
                    <Button
                      variant="primary"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold"
                      leftIcon={<Coffee className="w-4 h-4" />}
                      onClick={() => setModalTool('breakScreen')}
                    >
                      MỞ MÀN HÌNH GIỜ NGHỈ GIẢI LAO
                    </Button>
                  </div>
                )}

                {/* TOOL 9: ACTIVITY LOG EVENTS */}
                {activeTool === 'events' && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {events.length === 0 ? (
                      <div className="py-6 text-center text-app-muted font-semibold">
                        Chưa có sự kiện nào được ghi nhận.
                      </div>
                    ) : (
                      events.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-2.5 rounded-2xl bg-app-surface-hover border border-app flex items-center justify-between text-[11px]"
                        >
                          <span className="font-bold text-app-primary uppercase">{evt.eventType}</span>
                          <span className="text-app-muted font-mono">
                            {new Date(evt.createdAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CLASSROOM TOOL DOCK VERTICAL ICON BAR */}
            <div
              className={cn(
                'bg-white/95 dark:bg-slate-900/95 border-2 border-sky-200/90 dark:border-slate-700 shadow-2xl rounded-3xl p-1.5 flex flex-col items-center gap-1.5 backdrop-blur-md',
                'w-14 sm:w-16 shrink-0'
              )}
            >
              {/* TOGGLE CLOSE ENTIRE TOOLBAR BUTTON */}
              <button
                onClick={() => toggleToolbar(false)}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/60 dark:hover:text-red-400 transition-all min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                aria-label="Đóng toàn bộ thanh công cụ"
                title="Đóng toàn bộ thanh công cụ (Escape)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

              {/* TOOL ICON BUTTONS */}
              {toolItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTool === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => selectTool(item.id)}
                    aria-label={item.name}
                    aria-pressed={isActive}
                    className={cn(
                      'relative p-2.5 rounded-2xl transition-all min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer',
                      isActive
                        ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black shadow-md shadow-sky-500/25 scale-105 ring-2 ring-sky-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 hover:scale-105 active:scale-95'
                    )}
                    title={`${item.name}${item.shortcut ? ` [${item.shortcut}]` : ''}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />

                    {/* BADGE COUNT IF ANY */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center animate-bounce shadow-xs ring-2 ring-white dark:ring-slate-900">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

              {/* FULLSCREEN BUTTON */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="p-2.5 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-all min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="Toàn màn hình [F]"
                title="Toàn màn hình [F]"
              >
                {typeof document !== 'undefined' && document.fullscreenElement ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* RENDER HEAVY OVERLAY TOOL MODALS WHEN ACTIVATED */}
      <RandomPickerTool
        isOpen={modalTool === 'random'}
        onClose={() => setModalTool(null)}
        sessionId={sessionId}
        participants={participants}
        studentMap={studentMap}
        globalSettings={globalSettings}
        uploadedAssetUrls={uploadedAssetUrls}
        studentTotalPointsMap={studentTotalPointsMap}
        onParticipantsUpdated={onParticipantsUpdated}
        enableSound={enableSound}
        onAwardPoint={onQuickAwardPoints}
        onOpenDeductModal={onOpenDeductModal}
        onIncrementTalk={onIncrementTalk}
        onSelectStudentCard={onSelectStudentCard}
      />

      <HandRaisedQueueTool
        isOpen={modalTool === 'handQueue'}
        onClose={() => setModalTool(null)}
        sessionId={sessionId}
        participants={participants}
        studentMap={studentMap}
        globalSettings={globalSettings}
        uploadedAssetUrls={uploadedAssetUrls}
        studentTotalPointsMap={studentTotalPointsMap}
        onParticipantsUpdated={onParticipantsUpdated}
      />

      <QuickPollTool
        isOpen={modalTool === 'quickPoll'}
        onClose={() => setModalTool(null)}
      />

      <WhiteboardTool
        isOpen={modalTool === 'whiteboard'}
        onClose={() => setModalTool(null)}
      />

      <QrGeneratorTool
        isOpen={modalTool === 'qrCode'}
        onClose={() => setModalTool(null)}
      />

      <BreakScreenTool
        isOpen={modalTool === 'breakScreen'}
        onClose={() => setModalTool(null)}
      />
    </>
  );
};
