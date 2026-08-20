import React, { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Badge } from '../../../shared/components/Badge';
import { Select } from '../../../shared/components/Select';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { avatarThemeRegistry } from '../../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';
import {
  calledQueueService,
  type CalledStudentItem,
  type QueueFilterOption,
  type QueueSortOption,
} from '../../../core/services/live-classroom/called-queue.service';
import type { Student, LiveClassParticipant } from '../../../core/database/types';
import {
  Users,
  Plus,
  Minus,
  Check,
  MoreVertical,
  RotateCcw,
  HelpCircle,
  SkipForward,
  Search,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface CalledStudentsQueueProps {
  sessionId: string;
  queueItems: CalledStudentItem[];
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
  studentTotalPointsMap?: Map<string, number>;
  onAwardPoint: (studentId: string, points: number, reason: string) => Promise<void>;
  onOpenDeductModal: (studentId: string) => void;
  onIncrementTalk: (studentId: string) => Promise<void>;
  onQueueUpdated: () => void;
  onSelectStudentCard?: (studentId: string) => void;
  onCallStudentAgain?: (student: Student, participant: LiveClassParticipant) => void;
  onSpinNext?: () => void;
}

export const CalledStudentsQueue: React.FC<CalledStudentsQueueProps> = ({
  sessionId,
  queueItems,
  globalSettings,
  uploadedAssetUrls,
  studentTotalPointsMap,
  onAwardPoint,
  onOpenDeductModal,
  onIncrementTalk,
  onQueueUpdated,
  onSelectStudentCard,
  onCallStudentAgain,
  onSpinNext,
}) => {
  const [filterBy, setFilterBy] = useState<QueueFilterOption>('all');
  const [sortBy, setSortBy] = useState<QueueSortOption>('newest');
  const [submittingStudentId, setSubmittingStudentId] = useState<string | null>(null);
  const [activeMenuStudentId, setActiveMenuStudentId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Compute summary stats
  const totalCount = queueItems.filter((i) => !i.isRemoved).length;
  const pendingCount = queueItems.filter((i) => !i.isRemoved && i.interactionStatus === 'pending').length;

  // Filter & Sort queue
  const filteredQueue = calledQueueService.filterQueue(queueItems, filterBy);
  const sortedQueue = calledQueueService.sortQueue(filteredQueue, sortBy);

  // Quick Point Award Handler with anti-spam double-click protection
  const handlePointAction = async (studentId: string, points: number, reason: string) => {
    if (submittingStudentId === studentId) return;
    setSubmittingStudentId(studentId);
    try {
      await onAwardPoint(studentId, points, reason);
      onQueueUpdated();
    } catch (err) {
      console.error('Error awarding points:', err);
    } finally {
      setSubmittingStudentId(null);
    }
  };

  // Participation +1 handler
  const handleTalkAction = async (studentId: string) => {
    if (submittingStudentId === studentId) return;
    setSubmittingStudentId(studentId);
    try {
      await onIncrementTalk(studentId);
      onQueueUpdated();
    } catch (err) {
      console.error('Error incrementing talk:', err);
    } finally {
      setSubmittingStudentId(null);
    }
  };

  // Status Update Handlers
  const handleStatusChange = async (studentId: string, action: 'answered' | 'needs_support' | 'skipped' | 'reopen' | 'remove') => {
    setActiveMenuStudentId(null);
    try {
      if (action === 'answered') await calledQueueService.markAnswered(sessionId, studentId);
      else if (action === 'needs_support') await calledQueueService.markNeedsSupport(sessionId, studentId);
      else if (action === 'skipped') await calledQueueService.markSkipped(sessionId, studentId);
      else if (action === 'reopen') await calledQueueService.reopenStudent(sessionId, studentId);
      else if (action === 'remove') await calledQueueService.removeFromQueue(sessionId, studentId);
      onQueueUpdated();
    } catch (err) {
      console.error('Error updating queue status:', err);
    }
  };

  // Confirm Reset Queue Handler
  const handleConfirmReset = async () => {
    setResetConfirmOpen(false);
    try {
      await calledQueueService.resetQueue(sessionId);
      onQueueUpdated();
    } catch (err) {
      console.error('Error resetting queue:', err);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* QUEUE HEADER */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-app">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="font-extrabold text-xs text-app-main uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Users className="w-4 h-4 text-blue-500" /> Đã gọi ({totalCount})
          </h4>

          {pendingCount > 0 ? (
            <Badge variant="primary" className="bg-amber-100 text-amber-800 font-extrabold text-[10px] shrink-0">
              Còn {pendingCount} chưa xử lý
            </Badge>
          ) : (
            totalCount > 0 && (
              <Badge variant="success" className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] shrink-0">
                ✓ Hoàn thành
              </Badge>
            )
          )}
        </div>

        {totalCount > 0 && (
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="text-[11px] font-bold text-app-muted hover:text-red-600 transition-colors flex items-center gap-1 shrink-0"
            title="Làm mới danh sách làm việc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        )}
      </div>

      {/* FILTER & SORT BAR */}
      {totalCount > 0 && (
        <div className="space-y-2">
          {/* FILTER PILLS */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 text-[11px] font-bold">
            {[
              { key: 'all', label: `Tất cả (${totalCount})` },
              { key: 'pending', label: `Chưa xử lý (${pendingCount})` },
              { key: 'answered', label: 'Đã trả lời' },
              { key: 'needs_support', label: 'Cần hỗ trợ' },
              { key: 'has_points', label: 'Có điểm' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterBy(tab.key as QueueFilterOption)}
                className={cn(
                  'px-2.5 py-1 rounded-xl transition-all shrink-0',
                  filterBy === tab.key
                    ? 'bg-app-primary text-app-primary-fg font-extrabold shadow-xs'
                    : 'bg-app-surface-hover text-app-muted hover:text-app-main border border-app'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SORT DROPDOWN */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-app-muted font-semibold">Sắp xếp:</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as QueueSortOption)}
              options={[
                { value: 'newest', label: 'Mới gọi lên đầu' },
                { value: 'oldest', label: 'Gọi trước lên đầu' },
                { value: 'pending_first', label: 'Chưa xử lý lên đầu' },
                { value: 'highest_points', label: 'Điểm cao lên đầu' },
              ]}
              className="w-40 text-[11px] py-1"
            />
          </div>
        </div>
      )}

      {/* CALLED STUDENT LIST */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-none">
        {totalCount === 0 ? (
          <div className="py-8 text-center space-y-2 bg-app-surface-hover/50 rounded-2xl border border-dashed border-app p-4">
            <Users className="w-8 h-8 text-app-muted opacity-40 mx-auto" />
            <p className="text-xs font-bold text-app-muted">Chưa có học sinh nào được gọi tên.</p>
            {onSpinNext && (
              <Button
                size="sm"
                variant="primary"
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold mx-auto mt-1"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={onSpinNext}
              >
                Gọi tên đầu tiên [R]
              </Button>
            )}
          </div>
        ) : sortedQueue.length === 0 ? (
          <div className="py-6 text-center text-xs text-app-muted font-semibold">
            Không có học sinh phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          sortedQueue.map((item, idx) => {
            const isSubmitting = submittingStudentId === item.studentId;
            const isMenuOpen = activeMenuStudentId === item.studentId;

            return (
              <div
                key={item.studentId}
                className={cn(
                  'p-2.5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs',
                  item.interactionStatus === 'answered'
                    ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                    : item.interactionStatus === 'needs_support'
                    ? 'bg-rose-50/60 border-rose-300'
                    : item.interactionStatus === 'skipped'
                    ? 'bg-slate-50 border-slate-200 opacity-70'
                    : 'bg-app-surface border-app hover:border-blue-300'
                )}
              >
                {/* ROW LEFT: AVATAR & NAME & BADGES */}
                {(() => {
                  const score = studentTotalPointsMap?.get(item.student.id) ?? 0;
                  const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
                    student: item.student,
                    score,
                    globalSettings,
                    uploadedAssetUrls,
                  });
                  const theme = presentation.cardTheme;

                  return (
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>

                      <div
                        style={{ borderColor: theme.avatarRing }}
                        className="w-8 h-8 rounded-full border bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs"
                      >
                        {presentation.avatarAsset.assetUrl ? (
                          <img
                            src={presentation.avatarAsset.assetUrl}
                            alt={presentation.avatarAsset.altText}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <StudentAvatar
                            student={item.student}
                            score={score}
                            size="sm"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-extrabold text-xs text-app-main truncate max-w-[140px]" title={item.student.fullName}>
                            {item.student.fullName}
                          </h5>

                          <span
                            style={{
                              backgroundColor: theme.badgeBackground,
                              color: theme.badgeText,
                              borderColor: theme.badgeBorder,
                            }}
                            className="px-1.5 py-0.2 rounded-full text-[9px] font-black border uppercase tracking-wide"
                            title={`Cấp avatar: ${presentation.levelName}`}
                          >
                            {presentation.levelShortLabel}
                          </span>

                          {/* JUST PROMOTED BADGE */}
                          {item.justPromoted && (
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px] animate-pulse shrink-0 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Thăng cấp!
                            </span>
                          )}

                          {/* CALL COUNT BADGE IF > 1 */}
                          {item.callCount > 1 && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] shrink-0">
                              ×{item.callCount}
                            </span>
                          )}

                          {/* SESSION POINTS BADGE */}
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded-md font-mono text-[10px] font-extrabold shrink-0',
                              item.sessionPoints > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.sessionPoints < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {item.sessionPoints > 0 ? `+${item.sessionPoints}` : item.sessionPoints} đ
                          </span>
                        </div>

                        {/* STATUS TEXT */}
                        <div className="flex items-center gap-2 text-[10px] text-app-muted">
                          <span>STT: {item.student.studentCode}</span>
                          <span>•</span>
                          {item.interactionStatus === 'answered' && <span className="text-emerald-600 font-bold">✓ Đã trả lời</span>}
                          {item.interactionStatus === 'needs_support' && <span className="text-rose-600 font-bold">🆘 Cần hỗ trợ</span>}
                          {item.interactionStatus === 'skipped' && <span className="text-slate-500 font-bold">Bỏ qua</span>}
                          {item.interactionStatus === 'pending' && <span className="text-amber-600 font-bold">Chờ tương tác</span>}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ROW RIGHT: QUICK ACTION BUTTONS */}
                <div className="flex items-center gap-1 justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-app/50">
                  {/* +1 POINT */}
                  <button
                    onClick={() => handlePointAction(item.studentId, 1, 'Tích cực phát biểu')}
                    disabled={isSubmitting}
                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] transition-colors disabled:opacity-50 min-h-[32px] flex items-center gap-0.5"
                    aria-label={`Cộng 1 điểm cho ${item.student.fullName}`}
                    title={`Cộng 1 điểm cho ${item.student.fullName}`}
                  >
                    <Plus className="w-3 h-3" />1
                  </button>

                  {/* +2 POINTS */}
                  <button
                    onClick={() => handlePointAction(item.studentId, 2, 'Xuất sắc bài tập')}
                    disabled={isSubmitting}
                    className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] transition-colors disabled:opacity-50 min-h-[32px] flex items-center gap-0.5"
                    aria-label={`Cộng 2 điểm cho ${item.student.fullName}`}
                    title={`Cộng 2 điểm cho ${item.student.fullName}`}
                  >
                    <Plus className="w-3 h-3" />2
                  </button>

                  {/* DEDUCT POINT */}
                  <button
                    onClick={() => onOpenDeductModal(item.studentId)}
                    disabled={isSubmitting}
                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition-colors disabled:opacity-50 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    aria-label={`Trừ điểm ${item.student.fullName}`}
                    title={`Trừ điểm ${item.student.fullName}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  {/* TALK +1 */}
                  <button
                    onClick={() => handleTalkAction(item.studentId)}
                    disabled={isSubmitting}
                    className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[10px] transition-colors disabled:opacity-50 min-h-[32px] flex items-center gap-0.5"
                    aria-label={`Ghi nhận phát biểu cho ${item.student.fullName}`}
                    title={`Ghi nhận phát biểu cho ${item.student.fullName}`}
                  >
                    🗣 <span className="font-extrabold">{item.participant.participationCount}</span>
                  </button>

                  {/* MARK ANSWERED */}
                  <button
                    onClick={() => handleStatusChange(item.studentId, item.interactionStatus === 'answered' ? 'reopen' : 'answered')}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center',
                      item.interactionStatus === 'answered'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'border border-app hover:bg-app-surface-hover text-app-muted'
                    )}
                    aria-label={`Đánh dấu ${item.student.fullName} đã trả lời`}
                    title={item.interactionStatus === 'answered' ? 'Hạ trạng thái đã trả lời' : 'Đánh dấu đã trả lời'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  {/* MORE ACTIONS DROPDOWN TOGGLE */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuStudentId(isMenuOpen ? null : item.studentId)}
                      className="p-1.5 rounded-lg border border-app hover:bg-app-surface-hover text-app-muted min-h-[32px] min-w-[32px] flex items-center justify-center"
                      aria-label="Thao tác mở rộng"
                      title="Tùy chọn bổ sung"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* EXPANDED DROPDOWN MENU */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-9 z-50 w-48 rounded-2xl bg-app-surface border-2 border-app shadow-2xl p-1 space-y-0.5 text-[11px] font-bold animate-fadeIn">
                        {onCallStudentAgain && (
                          <button
                            onClick={() => {
                              setActiveMenuStudentId(null);
                              onCallStudentAgain(item.student, item.participant);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-app-surface-hover text-app-main flex items-center gap-2 text-left"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                            <span>Gọi lại học sinh này</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleStatusChange(item.studentId, 'needs_support')}
                          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-2 text-left"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Cần hỗ trợ</span>
                        </button>

                        <button
                          onClick={() => handleStatusChange(item.studentId, 'skipped')}
                          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 text-left"
                        >
                          <SkipForward className="w-3.5 h-3.5 text-slate-500" />
                          <span>Bỏ qua lượt này</span>
                        </button>

                        {onSelectStudentCard && (
                          <button
                            onClick={() => {
                              setActiveMenuStudentId(null);
                              onSelectStudentCard(item.studentId);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl hover:bg-app-surface-hover text-app-main flex items-center gap-2 text-left"
                          >
                            <Search className="w-3.5 h-3.5 text-purple-500" />
                            <span>Xem trên sơ đồ lớp</span>
                          </button>
                        )}

                        <div className="h-px bg-app my-0.5" />

                        <button
                          onClick={() => handleStatusChange(item.studentId, 'remove')}
                          className="w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-100 text-rose-800 flex items-center gap-2 text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Loại khỏi danh sách</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RESET QUEUE CONFIRMATION MODAL */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Làm mới danh sách làm việc?"
      >
        <div className="space-y-4 py-2 text-xs">
          <p className="text-app-main font-medium">
            Danh sách làm việc hiện tại sẽ được làm mới kể từ thời điểm này.
          </p>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold space-y-1">
            <p>✓ Điểm thi đua đã cộng/trừ vẫn được bảo toàn 100%.</p>
            <p>✓ Lượt phát biểu và lịch sử tiết học vẫn được giữ nguyên.</p>
            <p>✓ Báo cáo cuối phiên vẫn tổng hợp đầy đủ tất cả lượt gọi tên.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setResetConfirmOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700 text-white font-extrabold" onClick={handleConfirmReset}>
              Xác nhận làm mới
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
