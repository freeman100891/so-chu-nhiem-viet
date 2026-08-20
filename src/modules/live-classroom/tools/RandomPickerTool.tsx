import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '../../../shared/components/Modal';
import {
  liveClassParticipantService,
  liveBroadcastService,
  liveClassEventService,
  calledQueueService,
  type CalledStudentItem,
} from '../../../core/services/live-classroom';
import { playStarChime, playTickSound, playRevealSound, playPositiveChime } from '../../../shared/utilities/sound';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { avatarThemeRegistry } from '../../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';
import type { LiveClassParticipant, Student } from '../../../core/database/types';
import { CalledStudentsQueue } from '../components/CalledStudentsQueue';
import {
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Play,
  Volume2,
  VolumeX,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export type RandomSpeedMode = 'quick' | 'standard' | 'dramatic';
export type RandomPickerPhase = 'idle' | 'spinning' | 'slowing' | 'revealing' | 'selected' | 'round_completed';

export interface RandomPickerToolProps {
  isOpen?: boolean;
  onClose?: () => void;
  sessionId: string;
  participants: LiveClassParticipant[];
  studentMap: Map<string, Student>;
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
  studentTotalPointsMap?: Map<string, number>;
  onParticipantsUpdated: () => void;
  enableSound?: boolean;
  onAwardPoint?: (studentId: string, points: number, reason: string) => Promise<void>;
  onOpenDeductModal?: (studentId: string) => void;
  onIncrementTalk?: (studentId: string) => Promise<void>;
  onSelectStudentCard?: (studentId: string) => void;
  isEmbedded?: boolean;
}

export const RandomPickerTool: React.FC<RandomPickerToolProps> = ({
  isOpen = false,
  onClose = () => {},
  sessionId,
  participants,
  studentMap,
  globalSettings,
  uploadedAssetUrls,
  studentTotalPointsMap,
  onParticipantsUpdated,
  enableSound: initialEnableSound = true,
  onAwardPoint = async () => {},
  onOpenDeductModal = () => {},
  onIncrementTalk = async () => {},
  onSelectStudentCard,
  isEmbedded = false,
}) => {
  // Sound toggle local state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialEnableSound);

  // Speed mode preference (quick = ~0.8s, standard = ~2.5s, dramatic = ~4.5s)
  const [speedMode, setSpeedMode] = useState<RandomSpeedMode>(() => {
    return (localStorage.getItem('gvcn_random_speed_mode') as RandomSpeedMode) || 'standard';
  });

  // Exclude called students in current round
  const [preventRepeatsInRound, setPreventRepeatsInRound] = useState<boolean>(true);
  const [chosenIdsInRound, setChosenIdsInRound] = useState<Set<string>>(new Set());

  // State Machine Phase
  const [phase, setPhase] = useState<RandomPickerPhase>('idle');
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; participant: LiveClassParticipant } | null>(null);
  const [queueItems, setQueueItems] = useState<CalledStudentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [floatingPointText, setFloatingPointText] = useState<{ text: string; id: string } | null>(null);

  // Collapsible history accordion state (default collapsed on embedded rail)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRoundNumber = useRef<number>(1);

  // Filter present & late students for calling pool
  const presentParticipants = participants.filter(
    (p) => p.attendanceStatus === 'present' || p.attendanceStatus === 'late'
  );

  // Available students in current round
  const availablePool = preventRepeatsInRound
    ? presentParticipants.filter((p) => !chosenIdsInRound.has(p.studentId))
    : presentParticipants;

  // Persist speed mode
  const handleSetSpeedMode = (mode: RandomSpeedMode) => {
    setSpeedMode(mode);
    localStorage.setItem('gvcn_random_speed_mode', mode);
  };

  // Load called queue items
  const loadQueueData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const items = await calledQueueService.getCalledQueue(sessionId, participants, studentMap);
      setQueueItems(items);

      // If no selectedStudent set yet and we are in idle, show the latest called student
      if (!selectedStudent && items.length > 0 && phase === 'idle') {
        const latest = items[0]!;
        setSelectedStudent({ student: latest.student, participant: latest.participant });
      }
    } catch (err) {
      console.error('Error loading called queue:', err);
    }
  }, [sessionId, participants, studentMap, selectedStudent, phase]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  // Keyboard shortcut listener: [R] or [r] to spin / next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (phase === 'idle' || phase === 'selected') {
          handleSpinRandom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Crypto random helper
  const getCryptoRandomIndex = (max: number): number => {
    if (max <= 0) return 0;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] || 0) % max;
  };

  // Main Spin Action with Suspense Sequence
  const handleSpinRandom = async () => {
    if (presentParticipants.length === 0) return;
    if (phase === 'spinning' || phase === 'slowing' || phase === 'revealing') return;

    let pool = availablePool;
    if (preventRepeatsInRound && pool.length === 0) {
      // Start a new round
      pool = presentParticipants;
      setChosenIdsInRound(new Set());
      currentRoundNumber.current += 1;
    }

    setPhase('spinning');

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Config based on speed mode
    const totalTicks = prefersReducedMotion
      ? 1
      : speedMode === 'quick'
      ? 8
      : speedMode === 'dramatic'
      ? 28
      : 18;

    const slowDownThreshold = Math.floor(totalTicks * 0.7);

    // Dynamic tick delay calculation for slowing down suspense
    const runTick = (currentTick: number) => {
      if (currentTick >= totalTicks) {
        // REVEAL PHASE
        setPhase('revealing');
        const finalWinnerPart = pool[getCryptoRandomIndex(pool.length)]!;
        const finalSt = studentMap.get(finalWinnerPart.studentId);

        if (finalSt) {
          setSelectedStudent({ student: finalSt, participant: finalWinnerPart });
          setChosenIdsInRound((prev) => new Set(prev).add(finalWinnerPart.studentId));

          // Log liveClassEvent safely
          liveClassEventService
            .logEvent({
              sessionId,
              studentId: finalWinnerPart.studentId,
              eventType: 'student_selected',
            })
            .catch(() => {});

          // Play Reveal Sound
          playRevealSound(soundEnabled);

          liveClassParticipantService
            .incrementRandomSelection(sessionId, finalWinnerPart.studentId)
            .catch(() => {});

          // Broadcast to Presentation View
          liveBroadcastService.postMessage({
            type: 'STUDENT_SELECTED',
            payload: { student: finalSt, participant: finalWinnerPart },
          });

          onParticipantsUpdated();
          loadQueueData();
        }

        // Transition from revealing to selected
        setTimeout(() => {
          setPhase('selected');
        }, 500);
        return;
      }

      // Select random candidate for cycling preview
      const randomCandidate = pool[getCryptoRandomIndex(pool.length)]!;
      const candidateStudent = studentMap.get(randomCandidate.studentId);
      if (candidateStudent) {
        setSelectedStudent({ student: candidateStudent, participant: randomCandidate });
      }

      // Play tick sound
      playTickSound(soundEnabled);

      if (currentTick >= slowDownThreshold) {
        setPhase('slowing');
      }

      // Ease out delay
      let nextDelay = 70;
      if (speedMode === 'dramatic') {
        const progress = currentTick / totalTicks;
        nextDelay = Math.floor(70 + Math.pow(progress, 2.5) * 350);
      } else if (speedMode === 'standard') {
        const progress = currentTick / totalTicks;
        nextDelay = Math.floor(75 + Math.pow(progress, 2) * 180);
      } else {
        nextDelay = 60 + currentTick * 12;
      }

      spinIntervalRef.current = setTimeout(() => {
        runTick(currentTick + 1);
      }, prefersReducedMotion ? 0 : nextDelay);
    };

    runTick(0);
  };

  const handleResetRound = () => {
    setChosenIdsInRound(new Set());
    setPhase('idle');
  };

  const handleAwardQuickPoint = async (points: number, reason: string) => {
    if (!selectedStudent || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAwardPoint(selectedStudent.student.id, points, reason);
      playPositiveChime(soundEnabled);
      setFloatingPointText({ text: `+${points}đ`, id: crypto.randomUUID() });
      setTimeout(() => setFloatingPointText(null), 1200);
      await loadQueueData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncrementTalkAction = async () => {
    if (!selectedStudent || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onIncrementTalk(selectedStudent.student.id);
      playStarChime(soundEnabled);
      setFloatingPointText({ text: `🗣 +1`, id: crypto.randomUUID() });
      setTimeout(() => setFloatingPointText(null), 1200);
      await loadQueueData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDoneAction = async () => {
    if (!selectedStudent) return;
    await calledQueueService.markAnswered(sessionId, selectedStudent.student.id);
    await loadQueueData();
  };

  const handleCallStudentAgain = async (st: Student, part: LiveClassParticipant) => {
    setSelectedStudent({ student: st, participant: part });
    setPhase('selected');
    try {
      await liveClassEventService.logEvent({
        sessionId,
        studentId: st.id,
        eventType: 'student_selected',
      });
      await liveClassParticipantService.incrementRandomSelection(sessionId, st.id);
    } catch {
      // Non-blocking
    }
    playStarChime(soundEnabled);
    onParticipantsUpdated();
    await loadQueueData();
  };

  // Find queue stats for current selected student
  const currentQueueItem = selectedStudent
    ? queueItems.find((i) => i.studentId === selectedStudent.student.id)
    : null;

  const currentScore = selectedStudent
    ? studentTotalPointsMap?.get(selectedStudent.student.id) || 0
    : 0;

  const currentPresentation = selectedStudent
    ? avatarThemeRegistry.resolveStudentAvatarPresentation({
        student: selectedStudent.student,
        score: currentScore,
        globalSettings,
        uploadedAssetUrls,
      })
    : null;

  const cardTheme = currentPresentation?.cardTheme;
  const progressPercent =
    presentParticipants.length > 0
      ? Math.min(100, Math.round((chosenIdsInRound.size / presentParticipants.length) * 100))
      : 0;

  // Main UI Content
  const content = (
    <div className="space-y-4 text-center select-none animate-fadeIn">
      {/* 1. TOP TELEMETRY & ROUND BAR */}
      <div className="p-3.5 rounded-3xl bg-slate-900 text-white border-2 border-slate-800 shadow-md space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
              Vòng {currentRoundNumber.current}
            </span>
            <span className="font-bold text-slate-300">
              Đã gọi <strong className="text-amber-400 font-black font-mono">{chosenIdsInRound.size}</strong> / {presentParticipants.length} HS
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* SPEED MODE SELECTOR */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => handleSetSpeedMode('quick')}
                className={cn(
                  'px-2 py-1 rounded-lg transition-all',
                  speedMode === 'quick' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
                )}
                title="Tốc độ nhanh (~0.8s)"
              >
                Nhanh
              </button>
              <button
                type="button"
                onClick={() => handleSetSpeedMode('standard')}
                className={cn(
                  'px-2 py-1 rounded-lg transition-all',
                  speedMode === 'standard' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
                )}
                title="Tốc độ tiêu chuẩn (~2.5s)"
              >
                Thường
              </button>
              <button
                type="button"
                onClick={() => handleSetSpeedMode('dramatic')}
                className={cn(
                  'px-2 py-1 rounded-lg transition-all',
                  speedMode === 'dramatic' ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-xs animate-pulse' : 'text-slate-400 hover:text-white'
                )}
                title="Tốc độ kịch tính (~4.5s)"
              >
                Kịch tính
              </button>
            </div>

            {/* SOUND TOGGLE */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={cn(
                'p-1.5 rounded-xl border transition-all min-h-[30px] min-w-[30px] flex items-center justify-center',
                soundEnabled ? 'border-amber-400/60 bg-amber-400/20 text-amber-300' : 'border-slate-700 bg-slate-800 text-slate-500'
              )}
              title={soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* RESET ROUND */}
            <button
              type="button"
              onClick={handleResetRound}
              className="text-slate-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
              title="Đặt lại vòng gọi hiện tại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR & EXCLUSION TOGGLE */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 relative">
            <div
              className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={preventRepeatsInRound}
                onChange={(e) => setPreventRepeatsInRound(e.target.checked)}
                className="w-3 h-3 rounded accent-amber-500 cursor-pointer"
              />
              <span>Không gọi lại trong cùng vòng</span>
            </label>
            <span>Tiến độ: {progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* 2. RANDOM SPOTLIGHT STAGE */}
      <div
        className={cn(
          'p-5 sm:p-6 rounded-3xl border-3 transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]',
          phase === 'spinning' || phase === 'slowing'
            ? 'border-amber-400 bg-gradient-to-b from-amber-50/90 via-yellow-50/80 to-amber-100/90 shadow-xl'
            : phase === 'revealing' || phase === 'selected'
            ? 'border-blue-500 bg-gradient-to-b from-blue-50/90 via-indigo-50/80 to-blue-100/90 shadow-2xl scale-[1.01]'
            : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50'
        )}
      >
        {/* FLOATING POINT OVERLAY */}
        {floatingPointText && (
          <div className="absolute inset-0 z-40 bg-blue-600/90 text-white font-black text-3xl flex flex-col items-center justify-center animate-bounce backdrop-blur-xs rounded-3xl">
            <Sparkles className="w-10 h-10 text-yellow-300 animate-spin mb-1" />
            <span>{floatingPointText.text}</span>
          </div>
        )}

        {/* STAGE STATE A: IDLE (WAITING FOR FIRST SPIN) */}
        {phase === 'idle' && (
          <div className="space-y-4 py-4 max-w-sm mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg ring-4 ring-amber-300/40 animate-pulse">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                AI SẼ LÀ NGƯỜI TIẾP THEO?
              </h3>
              <p className="text-xs font-bold text-slate-500">
                <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm font-black">{availablePool.length}</strong> học sinh đang sẵn sàng trong vòng gọi
              </p>
            </div>
          </div>
        )}

        {/* STAGE STATE B: SPINNING / SLOWING (SUSPENSE SEQUENCE) */}
        {(phase === 'spinning' || phase === 'slowing') && selectedStudent && (
          <div className="space-y-3 py-2 w-full max-w-md mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest inline-flex items-center gap-1.5 shadow-md animate-pulse">
              <Zap className="w-4 h-4 fill-slate-950" />
              {phase === 'slowing' ? 'CHUẨN BỊ XƯỚNG TÊN...' : 'ĐANG CHỌN HỌC SINH...'}
            </span>

            {/* CYCLING AVATAR WITH SUSPENSE HALO */}
            <div className="relative my-2 flex justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-400 p-1 bg-white shadow-xl flex items-center justify-center overflow-hidden animate-pulse">
                {currentPresentation?.avatarAsset.assetUrl ? (
                  <img
                    src={currentPresentation.avatarAsset.assetUrl}
                    alt={selectedStudent.student.fullName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <StudentAvatar student={selectedStudent.student} score={currentScore} size="xl" />
                )}
              </div>
            </div>

            {/* CYCLING NAME */}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight line-clamp-1 filter blur-[0.3px] transition-all">
              {selectedStudent.student.fullName}
            </h2>
          </div>
        )}

        {/* STAGE STATE C: REVEALING / SELECTED (SPOTLIGHT HERO) */}
        {(phase === 'revealing' || phase === 'selected') && selectedStudent && (
          <div className="space-y-3 py-1 w-full max-w-md mx-auto">
            {/* SPOTLIGHT BANNER */}
            <div className="flex items-center justify-center gap-2">
              <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-md inline-flex items-center gap-1.5 ring-2 ring-white">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                HÔM NAY ĐẾN LƯỢT BẠN!
              </span>
              {currentQueueItem && currentQueueItem.callCount > 1 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                  ×{currentQueueItem.callCount} Lần gọi
                </span>
              )}
            </div>

            {/* LARGE SPOTLIGHT AVATAR */}
            <div className="relative my-1 flex justify-center group/spotlight">
              <div
                style={{ borderColor: cardTheme?.avatarRing || '#3b82f6' }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 bg-white p-1 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover/spotlight:scale-105"
              >
                {currentPresentation?.avatarAsset.assetUrl ? (
                  <img
                    src={currentPresentation.avatarAsset.assetUrl}
                    alt={selectedStudent.student.fullName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <StudentAvatar student={selectedStudent.student} score={currentScore} size="xl" />
                )}
              </div>
            </div>

            {/* STUDENT FULL NAME (2 Lines support, no truncation) */}
            <div className="space-y-0.5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight line-clamp-2">
                {selectedStudent.student.fullName}
              </h2>
              <p className="text-xs font-mono font-bold text-slate-500">
                STT: {selectedStudent.student.studentCode || '-'}
              </p>
            </div>

            {/* TELEMETRY STATS PILLS */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-bold pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300">
                {selectedStudent.participant.attendanceStatus === 'present' ? '🟢 Có mặt' : '🟡 Đi muộn'}
              </span>
              <span
                style={{
                  backgroundColor: cardTheme?.badgeBackground,
                  color: cardTheme?.badgeText,
                  borderColor: cardTheme?.badgeBorder,
                }}
                className="px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider shadow-2xs"
              >
                🎖 {currentPresentation?.levelShortLabel || 'Cấp 1'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono font-extrabold border border-blue-300">
                ⭐ {currentScore}đ
              </span>
              {currentQueueItem && currentQueueItem.sessionPoints !== 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-mono font-extrabold border border-purple-300">
                  ⚡ Tiết này: {currentQueueItem.sessionPoints > 0 ? `+${currentQueueItem.sessionPoints}` : currentQueueItem.sessionPoints}đ
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. HERO ACTION CTA & ACTION DOCK */}
      <div className="space-y-2.5">
        {/* PRIMARY SPIN HERO CTA BUTTON (Height 56px, high tactile) */}
        {phase !== 'revealing' && phase !== 'selected' ? (
          <button
            type="button"
            disabled={presentParticipants.length === 0 || phase === 'spinning' || phase === 'slowing'}
            onClick={handleSpinRandom}
            className={cn(
              'w-full py-3.5 px-6 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 shadow-lg',
              phase === 'spinning' || phase === 'slowing'
                ? 'bg-amber-400/80 text-slate-900 opacity-80 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 hover:shadow-xl scale-[1.01] active:scale-95'
            )}
          >
            <Sparkles className={cn('w-5 h-5', (phase === 'spinning' || phase === 'slowing') && 'animate-spin')} />
            <span>
              {phase === 'spinning' || phase === 'slowing'
                ? 'ĐANG QUAY SỐ NGẪU NHIÊN...'
                : '🎲 BẮT ĐẦU QUAY NGẪU NHIÊN [R]'}
            </span>
          </button>
        ) : (
          /* ACTION DOCK (AFTER REVEAL) */
          <div className="space-y-2 pt-1 animate-slideUp">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs font-black">
              {/* +1 POINT */}
              <button
                type="button"
                onClick={() => handleAwardQuickPoint(1, 'Tích cực phát biểu')}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-800 hover:from-emerald-600 hover:to-emerald-700 hover:text-white font-black transition-all border border-emerald-300 shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                title="Cộng nhanh +1 điểm"
              >
                <Plus className="w-3.5 h-3.5" /> +1
              </button>

              {/* +2 POINTS */}
              <button
                type="button"
                onClick={() => handleAwardQuickPoint(2, 'Xuất sắc câu trả lời')}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100 text-amber-900 hover:from-amber-500 hover:to-amber-600 hover:text-white font-black transition-all border border-amber-300 shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                title="Cộng nhanh +2 điểm"
              >
                <Plus className="w-3.5 h-3.5" /> +2
              </button>

              {/* +5 POINTS */}
              <button
                type="button"
                onClick={() => handleAwardQuickPoint(5, 'Thành tích vượt trội')}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-gradient-to-b from-purple-50 to-purple-100 text-purple-900 hover:from-purple-600 hover:to-purple-700 hover:text-white font-black transition-all border border-purple-300 shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                title="Cộng nhanh +5 điểm"
              >
                <Sparkles className="w-3.5 h-3.5" /> +5
              </button>

              {/* DEDUCT */}
              <button
                type="button"
                onClick={() => selectedStudent && onOpenDeductModal(selectedStudent.student.id)}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-gradient-to-b from-rose-50 to-rose-100 text-rose-800 hover:from-rose-600 hover:to-rose-700 hover:text-white font-black transition-all border border-rose-300 shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                title="Trừ điểm nề nếp"
              >
                <Minus className="w-3.5 h-3.5" /> Trừ
              </button>

              {/* TALK +1 */}
              <button
                type="button"
                onClick={handleIncrementTalkAction}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-gradient-to-b from-blue-50 to-blue-100 text-blue-800 hover:from-blue-600 hover:to-blue-700 hover:text-white font-black transition-all border border-blue-300 shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                title="Ghi nhận +1 lượt phát biểu"
              >
                🗣 +1
              </button>

              {/* MARK COMPLETED */}
              <button
                type="button"
                onClick={handleMarkDoneAction}
                className="py-2 px-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black transition-all border border-emerald-400 shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                title="Đánh dấu đã hoàn thành trả lời"
              >
                <Check className="w-3.5 h-3.5" /> Đã xong
              </button>
            </div>

            {/* CALL NEXT STUDENT CTA */}
            <button
              type="button"
              onClick={handleSpinRandom}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 scale-[1.01]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>GỌI BẠN TIẾP THEO (Phím R)</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. COMPACT COLLAPSIBLE CALLED HISTORY QUEUE */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded((prev) => !prev)}
          className="w-full p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-between transition-all"
        >
          <span className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>Danh sách đã gọi ({queueItems.length} HS) • Còn {availablePool.length} HS</span>
          </span>
          {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isHistoryExpanded && (
          <div className="mt-3 animate-fadeIn">
            <CalledStudentsQueue
              sessionId={sessionId}
              queueItems={queueItems}
              globalSettings={globalSettings}
              uploadedAssetUrls={uploadedAssetUrls}
              studentTotalPointsMap={studentTotalPointsMap}
              onAwardPoint={onAwardPoint}
              onOpenDeductModal={onOpenDeductModal}
              onIncrementTalk={onIncrementTalk}
              onQueueUpdated={loadQueueData}
              onSelectStudentCard={onSelectStudentCard}
              onCallStudentAgain={handleCallStudentAgain}
              onSpinNext={handleSpinRandom}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gọi Tên Học Sinh Ngẫu Nhiên (Random Spotlight)">
      {content}
    </Modal>
  );
};
