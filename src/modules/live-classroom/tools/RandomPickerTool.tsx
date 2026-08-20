import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import {
  liveClassParticipantService,
  liveBroadcastService,
  liveClassEventService,
  calledQueueService,
  type CalledStudentItem,
} from '../../../core/services/live-classroom';
import { playStarChime } from '../../../shared/utilities/sound';
import { CuteCloudSVG } from '../../../shared/components/CuteDecorations';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { avatarThemeRegistry } from '../../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';
import type { LiveClassParticipant, Student } from '../../../core/database/types';
import { CalledStudentsQueue } from '../components/CalledStudentsQueue';
import { Sparkles, RotateCcw, Plus, Minus, Check, Play } from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

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
  enableSound = true,
  onAwardPoint = async () => {},
  onOpenDeductModal = () => {},
  onIncrementTalk = async () => {},
  onSelectStudentCard,
  isEmbedded = false,
}) => {
  // Cycle state: set of student IDs already chosen in current round
  const [chosenIdsInRound, setChosenIdsInRound] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; participant: LiveClassParticipant } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [queueItems, setQueueItems] = useState<CalledStudentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter present & late students for calling pool
  const presentParticipants = participants.filter(
    (p) => p.attendanceStatus === 'present' || p.attendanceStatus === 'late'
  );

  // Available students in current round
  const availablePool = presentParticipants.filter((p) => !chosenIdsInRound.has(p.studentId));

  // Load called queue items from calledQueueService
  const loadQueueData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const items = await calledQueueService.getCalledQueue(sessionId, participants, studentMap);
      setQueueItems(items);

      // If no selectedStudent set yet, pick the latest called student
      if (!selectedStudent && items.length > 0) {
        const latest = items[0]!;
        setSelectedStudent({ student: latest.student, participant: latest.participant });
      }
    } catch (err) {
      console.error('Error loading called queue:', err);
    }
  }, [sessionId, participants, studentMap, selectedStudent]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Reset round if all present students have been called
  useEffect(() => {
    if (presentParticipants.length > 0 && availablePool.length === 0 && chosenIdsInRound.size > 0) {
      setChosenIdsInRound(new Set());
    }
  }, [availablePool.length, presentParticipants.length, chosenIdsInRound.size]);

  // Crypto random picker helper using window.crypto.getRandomValues
  const getCryptoRandomIndex = (max: number): number => {
    if (max <= 0) return 0;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] || 0) % max;
  };

  const handleSpinRandom = async () => {
    if (presentParticipants.length === 0 || isSpinning) return;

    let pool = availablePool;
    if (pool.length === 0) {
      // Auto-reset cycle for new round
      pool = presentParticipants;
      setChosenIdsInRound(new Set());
    }

    setIsSpinning(true);
    let counter = 0;

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spinTicks = prefersReducedMotion ? 1 : 15;
    const intervalMs = prefersReducedMotion ? 0 : 100;

    const interval = setInterval(async () => {
      const randomIdx = getCryptoRandomIndex(pool.length);
      const chosenPart = pool[randomIdx]!;
      const st = studentMap.get(chosenPart.studentId);
      if (st) {
        setSelectedStudent({ student: st, participant: chosenPart });
      }
      counter++;

      if (counter >= spinTicks) {
        clearInterval(interval);

        const finalPart = pool[getCryptoRandomIndex(pool.length)]!;
        const finalSt = studentMap.get(finalPart.studentId);

        if (finalSt) {
          setSelectedStudent({ student: finalSt, participant: finalPart });
          setChosenIdsInRound((prev) => new Set(prev).add(finalPart.studentId));

          // Log student_selected liveClassEvent
          await liveClassEventService.logEvent({
            sessionId,
            studentId: finalPart.studentId,
            eventType: 'student_selected',
          });

          // Play sound chime & increment randomSelectionCount
          playStarChime(enableSound);
          await liveClassParticipantService.incrementRandomSelection(sessionId, finalPart.studentId);

          // Broadcast to Presentation View
          liveBroadcastService.postMessage({
            type: 'STUDENT_SELECTED',
            payload: { student: finalSt, participant: finalPart },
          });

          onParticipantsUpdated();
          await loadQueueData();
        }
        setIsSpinning(false);
      }
    }, intervalMs);
  };

  const handleCallStudentAgain = async (st: Student, part: LiveClassParticipant) => {
    setSelectedStudent({ student: st, participant: part });
    await liveClassEventService.logEvent({
      sessionId,
      studentId: st.id,
      eventType: 'student_selected',
    });
    await liveClassParticipantService.incrementRandomSelection(sessionId, st.id);
    playStarChime(enableSound);
    onParticipantsUpdated();
    await loadQueueData();
  };

  const handleResetCycle = () => {
    setChosenIdsInRound(new Set());
  };

  // Find queue stats for current selected student
  const currentQueueItem = selectedStudent
    ? queueItems.find((i) => i.studentId === selectedStudent.student.id)
    : null;

  // Main Content Body
  const content = (
    <div className="space-y-4 text-center select-none">
      {/* CYCLE STATS CONTROL BAR */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-app-surface-hover border border-app text-xs">
        <span className="font-bold text-app-main flex items-center gap-1.5 min-w-0 truncate">
          <CuteCloudSVG className="w-4 h-4 shrink-0 text-amber-500" />
          <span className="truncate">Vòng gọi: {chosenIdsInRound.size} / {presentParticipants.length} HS</span>
        </span>
        <button
          onClick={handleResetCycle}
          className="text-blue-600 font-bold hover:underline flex items-center gap-1 shrink-0 text-[11px]"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Đặt lại vòng
        </button>
      </div>

      {/* SPIN TRIGGER BUTTON */}
      <Button
        variant="primary"
        size="lg"
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-md min-h-[48px]"
        isLoading={isSpinning}
        disabled={presentParticipants.length === 0}
        leftIcon={<Sparkles className="w-5 h-5" />}
        onClick={handleSpinRandom}
      >
        {isSpinning ? 'ĐANG QUAY SỐ NGẪU NHIÊN...' : 'QUAY NGẪU NHIÊN NGAY [R]'}
      </Button>

      {/* "VỪA GỌI" CURRENT CALLED STUDENT CARD */}
      <div
        className={cn(
          'p-4 rounded-3xl border-2 transition-all relative overflow-hidden text-left',
          isSpinning
            ? 'border-amber-400 bg-amber-50/80 animate-pulse'
            : selectedStudent
            ? 'border-blue-400 bg-blue-50/50 shadow-md'
            : 'border-dashed border-app bg-app-surface-hover/40 text-center py-6'
        )}
        aria-live="polite"
      >
        {selectedStudent ? (
          <div className="space-y-3">
            {/* TOP ROW: BADGE "VỪA GỌI" & CALL STATS */}
            <div className="flex items-center justify-between gap-2 border-b border-blue-200 pb-2">
              <Badge variant="primary" className="bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider">
                ⚡ Vừa gọi
              </Badge>
              <div className="flex items-center gap-2 text-[11px] font-bold text-app-muted">
                {currentQueueItem && currentQueueItem.callCount > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold">
                    Đã gọi {currentQueueItem.callCount} lần
                  </span>
                )}
                <span>STT: {selectedStudent.student.studentCode}</span>
              </div>
            </div>

            {/* MAIN CARD BODY */}
            {(() => {
              const score = studentTotalPointsMap?.get(selectedStudent.student.id) || 0;
              const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
                student: selectedStudent.student,
                score,
                globalSettings,
                uploadedAssetUrls,
              });
              const theme = presentation.cardTheme;

              return (
                <div className="flex items-center gap-3">
                  <div
                    style={{ borderColor: theme.avatarRing }}
                    className="w-14 h-14 rounded-full border-2 bg-white p-0.5 shadow-xs overflow-hidden flex items-center justify-center shrink-0"
                  >
                    {presentation.avatarAsset.assetUrl ? (
                      <img
                        src={presentation.avatarAsset.assetUrl}
                        alt={presentation.avatarAsset.altText}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <StudentAvatar
                        student={selectedStudent.student}
                        score={score}
                        size="xl"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-app-main truncate">{selectedStudent.student.fullName}</h3>
                      <span
                        style={{
                          backgroundColor: theme.badgeBackground,
                          color: theme.badgeText,
                          borderColor: theme.badgeBorder,
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider shadow-2xs shrink-0"
                      >
                        {presentation.levelShortLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-app-muted flex-wrap mt-0.5">
                      <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md">
                        {selectedStudent.participant.attendanceStatus === 'present' ? 'Có mặt' : 'Đi muộn'}
                      </span>
                      <span className="text-blue-700 font-extrabold bg-blue-100 px-2 py-0.5 rounded-md font-mono">
                        Tổng: {score}đ
                      </span>
                      {currentQueueItem && (
                        <span className="text-purple-700 font-extrabold bg-purple-100 px-2 py-0.5 rounded-md font-mono">
                          Tiết: {currentQueueItem.sessionPoints > 0 ? `+${currentQueueItem.sessionPoints}` : currentQueueItem.sessionPoints}đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CARD QUICK ACTIONS */}
            <div className="pt-2 border-t border-blue-200/60 grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] font-bold">
              {/* +1 POINT */}
              <button
                onClick={async () => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  await onAwardPoint(selectedStudent.student.id, 1, 'Tích cực phát biểu');
                  await loadQueueData();
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs"
                aria-label={`Cộng 1 điểm cho ${selectedStudent.student.fullName}`}
              >
                <Plus className="w-3.5 h-3.5" /> +1
              </button>

              {/* +2 POINTS */}
              <button
                onClick={async () => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  await onAwardPoint(selectedStudent.student.id, 2, 'Xuất sắc bài tập');
                  await loadQueueData();
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs"
                aria-label={`Cộng 2 điểm cho ${selectedStudent.student.fullName}`}
              >
                <Plus className="w-3.5 h-3.5" /> +2
              </button>

              {/* DEDUCT */}
              <button
                onClick={() => onOpenDeductModal(selectedStudent.student.id)}
                className="py-1.5 px-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-extrabold transition-colors flex items-center justify-center gap-1 shadow-xs"
                aria-label={`Trừ điểm ${selectedStudent.student.fullName}`}
              >
                <Minus className="w-3.5 h-3.5" /> Trừ
              </button>

              {/* TALK +1 */}
              <button
                onClick={async () => {
                  if (isSubmitting) return;
                  setIsSubmitting(true);
                  await onIncrementTalk(selectedStudent.student.id);
                  await loadQueueData();
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs"
                aria-label={`Ghi nhận phát biểu cho ${selectedStudent.student.fullName}`}
              >
                🗣 +1
              </button>

              {/* MARK COMPLETED */}
              <button
                onClick={async () => {
                  await calledQueueService.markAnswered(sessionId, selectedStudent.student.id);
                  await loadQueueData();
                }}
                className="py-1.5 px-2 rounded-xl bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 text-emerald-900 font-extrabold transition-colors flex items-center justify-center gap-1 shadow-xs"
                aria-label={`Đánh dấu ${selectedStudent.student.fullName} đã trả lời`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-700" /> Đã xong
              </button>

              {/* SPIN NEXT */}
              <button
                onClick={handleSpinRandom}
                disabled={isSpinning}
                className="py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Tiếp
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-app-muted">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto opacity-60" />
            <p className="text-xs font-bold">Bấm nút quay ngẫu nhiên để gọi học sinh phát biểu.</p>
          </div>
        )}
      </div>

      {/* "ĐÃ GỌI" WORKING QUEUE SECTION */}
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
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gọi Tên Học Sinh Ngẫu Nhiên (Không lặp vòng)">
      {content}
    </Modal>
  );
};
