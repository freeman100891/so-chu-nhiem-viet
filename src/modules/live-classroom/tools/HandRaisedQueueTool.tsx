import React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { avatarThemeRegistry } from '../../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../../core/types/avatar-theme.types';
import { liveClassParticipantService } from '../../../core/services/live-classroom';
import type { LiveClassParticipant, Student } from '../../../core/database/types';
import { Hand, ArrowRight } from 'lucide-react';

interface HandRaisedQueueToolProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  participants: LiveClassParticipant[];
  studentMap: Map<string, Student>;
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
  studentTotalPointsMap?: Map<string, number>;
  onParticipantsUpdated: () => void;
}

export const HandRaisedQueueTool: React.FC<HandRaisedQueueToolProps> = ({
  isOpen,
  onClose,
  sessionId,
  participants,
  studentMap,
  globalSettings,
  uploadedAssetUrls,
  studentTotalPointsMap,
  onParticipantsUpdated,
}) => {
  // Sorted queue of students currently having handRaised === true
  const handRaisedQueue = participants
    .filter((p) => p.handRaised)
    .sort((a, b) => {
      const timeA = a.handRaisedAt ? new Date(a.handRaisedAt).getTime() : 0;
      const timeB = b.handRaisedAt ? new Date(b.handRaisedAt).getTime() : 0;
      return timeA - timeB;
    });

  const handleCallNextStudent = async () => {
    if (handRaisedQueue.length === 0) return;
    const nextParticipant = handRaisedQueue[0]!;

    try {
      // Lower hand and increment participation
      await liveClassParticipantService.toggleHandRaised(sessionId, nextParticipant.studentId, false);
      await liveClassParticipantService.incrementParticipation(sessionId, nextParticipant.studentId);
      onParticipantsUpdated();
    } catch (err) {
      console.error('Error calling next student:', err);
    }
  };

  const handleLowerHand = async (studentId: string) => {
    try {
      await liveClassParticipantService.toggleHandRaised(sessionId, studentId, false);
      onParticipantsUpdated();
    } catch (err) {
      console.error('Error lowering hand:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hàng Đợi Học Sinh Giơ Tay Phát Biểu">
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold">
          <span className="flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-amber-600" /> Hiện có {handRaisedQueue.length} em đang giơ tay
          </span>
          <Button
            size="sm"
            variant="primary"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            disabled={handRaisedQueue.length === 0}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={handleCallNextStudent}
          >
            Mời em tiếp theo phát biểu
          </Button>
        </div>

        {handRaisedQueue.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-bold space-y-1">
            <Hand className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
            <p>Chưa có học sinh nào giơ tay trong danh sách.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {handRaisedQueue.map((p, idx) => {
              const st = studentMap.get(p.studentId);
              if (!st) return null;

              const score = studentTotalPointsMap?.get(p.studentId) ?? 0;
              const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
                student: st,
                score,
                globalSettings,
                uploadedAssetUrls,
              });
              const theme = presentation.cardTheme;

              return (
                <div key={p.id} className="p-3 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-extrabold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    <div
                      style={{ borderColor: theme.avatarRing }}
                      className="w-9 h-9 rounded-full border-2 bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      {presentation.avatarAsset.assetUrl ? (
                        <img
                          src={presentation.avatarAsset.assetUrl}
                          alt={presentation.avatarAsset.altText}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <StudentAvatar
                          student={st}
                          score={score}
                          size="sm"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-800">{st.fullName}</h4>
                        <span
                          style={{
                            backgroundColor: theme.badgeBackground,
                            color: theme.badgeText,
                            borderColor: theme.badgeBorder,
                          }}
                          className="px-1.5 py-0.2 rounded-full text-[9px] font-black border uppercase tracking-wide"
                        >
                          {presentation.levelShortLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Giơ tay lúc: {p.handRaisedAt ? new Date(p.handRaisedAt).toLocaleTimeString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="bg-amber-100 text-amber-800 font-bold text-[10px]">
                      🗣 {p.participationCount} phát biểu
                    </Badge>
                    <button
                      onClick={() => handleLowerHand(p.studentId)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Hạ tay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
