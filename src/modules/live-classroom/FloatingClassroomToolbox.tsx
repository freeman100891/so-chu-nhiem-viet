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
    { id: 'random' as ClassroomToolId, name: 'Gọi tên ngẫu nhiên', shortcut: 'R', icon: Sparkles, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'timer' as ClassroomToolId, name: 'Đồng hồ đếm giờ', shortcut: 'T', icon: Clock, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { id: 'groups' as ClassroomToolId, name: 'Chia nhóm học sinh', shortcut: 'G', icon: Users, color: 'text-teal-500 bg-teal-50 border-teal-200' },
    { id: 'handQueue' as ClassroomToolId, name: 'Hàng đợi giơ tay', shortcut: '', icon: Hand, color: 'text-amber-600 bg-amber-50 border-amber-200', badge: handQueueCount },
    { id: 'quickPoll' as ClassroomToolId, name: 'Câu hỏi A/B/C/D', shortcut: '', icon: HelpCircle, color: 'text-purple-500 bg-purple-50 border-purple-200' },
    { id: 'whiteboard' as ClassroomToolId, name: 'Bảng viết nhanh', shortcut: '', icon: Edit3, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { id: 'qrCode' as ClassroomToolId, name: 'Mã QR tài liệu', shortcut: '', icon: QrCode, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
    { id: 'breakScreen' as ClassroomToolId, name: 'Màn hình giải lao', shortcut: '', icon: Coffee, color: 'text-orange-500 bg-orange-50 border-orange-200' },
    { id: 'events' as ClassroomToolId, name: 'Nhật ký tiết học', shortcut: '', icon: Activity, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];

  const currentToolMeta = toolItems.find((t) => t.id === activeTool) || toolItems[0]!;

  return (
    <>
      {/* WHEN ENTIRE TOOLBAR IS CLOSED: SHOW COMPACT SINGLE TRIGGER BUTTON IN BOTTOM RIGHT CORNER */}
      {!isToolbarOpen && (
        <button
          onClick={() => toggleToolbar(true)}
          className={cn(
            'fixed right-4 bottom-6 z-40 select-none',
            'px-4 py-2.5 rounded-2xl bg-app-surface border-2 border-app shadow-2xl',
            'text-app-main hover:bg-app-primary hover:text-app-primary-fg font-extrabold text-xs',
            'flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 animate-fadeIn'
          )}
          aria-label="Mở toàn bộ thanh công cụ lớp học"
          title="Mở toàn bộ thanh công cụ lớp học"
        >
          <Sliders className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="font-extrabold">Bảng công cụ</span>
          {handQueueCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-bounce">
              {handQueueCount}
            </span>
          )}
        </button>
      )}

      {/* TABLET / MOBILE BACKDROP OVERLAY */}
      {isToolbarOpen && (
        <div
          onClick={() => toggleToolbar(false)}
          className="xl:hidden fixed inset-0 bg-black/20 backdrop-blur-xs z-30 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* FLOATING CLASSROOM TOOLBOX ASIDE CONTAINER (ANCHORED BOTTOM RIGHT) */}
      {isToolbarOpen && (
        <aside
          aria-label="Bảng công cụ lớp học"
          className={cn(
            'fixed z-40 transition-all duration-200 ease-out select-none',
            'right-4 bottom-6',
            'max-h-[calc(100dvh-32px)] flex items-end'
          )}
        >
          <div className="flex items-start gap-2 h-full">
            {/* TOOL CONTENT PANEL */}
            <div
              className={cn(
                'bg-app-surface border-2 border-app shadow-2xl rounded-3xl p-4 flex flex-col',
                'w-[calc(100vw-80px)] sm:w-96 md:w-[420px] max-h-[calc(100dvh-48px)] overflow-hidden animate-slideLeft'
              )}
            >
              {/* TOOL HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-app mb-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('p-2 rounded-xl border shrink-0', currentToolMeta.color)}>
                    <currentToolMeta.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-app-main truncate">{currentToolMeta.name}</h3>
                    <p className="text-[10px] text-app-muted font-medium truncate">
                      {currentToolMeta.shortcut ? `Phím tắt [${currentToolMeta.shortcut}]` : 'Công cụ giảng dạy trực quan'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleToolbar(false)}
                  className="p-1.5 rounded-xl text-app-muted hover:text-app-main hover:bg-app-surface-hover transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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

            {/* TOOL RAIL VERTICAL ICON BAR */}
            <div
              className={cn(
                'bg-app-surface border-2 border-app shadow-xl rounded-3xl p-1.5 flex flex-col items-center gap-1.5',
                'w-14 sm:w-16 shrink-0'
              )}
            >
              {/* TOGGLE CLOSE ENTIRE TOOLBAR BUTTON */}
              <button
                onClick={() => toggleToolbar(false)}
                className="p-2.5 rounded-2xl bg-app-surface-hover text-app-main hover:bg-red-50 hover:text-red-600 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Đóng toàn bộ thanh công cụ"
                title="Đóng toàn bộ thanh công cụ (Escape)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="w-8 h-px bg-app my-0.5" />

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
                      'relative p-2.5 rounded-2xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center',
                      isActive
                        ? 'bg-app-primary text-app-primary-fg font-extrabold shadow-md scale-105 ring-2 ring-blue-400'
                        : 'text-app-main hover:bg-app-surface-hover hover:text-app-primary'
                    )}
                    title={`${item.name}${item.shortcut ? ` [${item.shortcut}]` : ''}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />

                    {/* BADGE COUNT IF ANY */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-bounce shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="w-8 h-px bg-app my-0.5" />

              {/* FULLSCREEN BUTTON */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="p-2.5 rounded-2xl text-app-main hover:bg-app-surface-hover hover:text-app-primary transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
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
