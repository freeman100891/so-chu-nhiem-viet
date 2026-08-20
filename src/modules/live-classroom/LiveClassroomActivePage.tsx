import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Badge } from '../../shared/components/Badge';
import { Modal } from '../../shared/components/Modal';
import { Select } from '../../shared/components/Select';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/hooks/useToast';
import { useUiScale } from '../../shared/hooks/useUiScale';
import {
  liveClassSessionService,
  liveClassParticipantService,
  liveClassGroupService,
  liveClassEventService,
  liveBroadcastService,
} from '../../core/services/live-classroom';
import { classRepository } from '../../core/repositories/class.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { conductService } from '../../core/services/conduct.service';
import { StudentAvatar } from '../../shared/components/StudentAvatar';
import {
  avatarThemeRegistry,
  DEFAULT_AVATAR_THEME_ID,
} from '../../core/services/avatar-theme-registry';
import { avatarAssetService } from '../../core/services/avatar-asset.service';
import type {
  GlobalAvatarSystemSettings,
  AvatarLevelDefinition,
} from '../../core/types/avatar-theme.types';
import { db } from '../../core/database/db';
import type {
  LiveClassSession,
  LiveClassParticipant,
  Student,
  ClassRoom,
  PointCategory,
  LiveAttendanceStatus,
  LiveClassEvent,
  PointEntry,
} from '../../core/database/types';
import type { GroupWithMembers } from '../../core/services/live-classroom';
import { playPositiveChime, playStarChime } from '../../shared/utilities/sound';
import { CuteCloudSVG } from '../../shared/components/CuteDecorations';
import {
  Play,
  Pause,
  CheckCircle,
  Video,
  ExternalLink,
  Award,
  Clock,
  Hand,
  Search,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  RotateCcw,
  Settings,
  RefreshCw,
  Tv,
  Sparkles,
} from 'lucide-react';
import { StudentCard } from './StudentCard';
import { SessionSummaryModal } from './SessionSummaryModal';
import { FloatingClassroomToolbox } from './FloatingClassroomToolbox';
import { useLevelChangeOverlay } from './hooks/useLevelChangeOverlay';
import { LevelUpCelebrationModal } from './components/LevelUpCelebrationModal';
import { LevelUpCelebrationSettingsModal } from './components/LevelUpCelebrationSettingsModal';
import { levelUpCelebrationService } from '../../core/services/level-up-celebration/level-up-celebration.service';
import {
  type LevelUpCelebrationSettings,
  type DirectLevelChangeNotification,
  DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS,
} from '../../core/types/avatar-theme.types';

const FALLBACK_POINT_CATEGORIES: PointCategory[] = [
  { id: 'cat-merit-1', name: 'Học tập tốt', type: 'Merit', defaultPoints: 10, description: 'Đạt điểm tốt, hăng hái phát biểu', createdAt: '', updatedAt: '', deletedAt: null },
  { id: 'cat-merit-2', name: 'Giúp đỡ bạn', type: 'Merit', defaultPoints: 10, description: 'Hỗ trợ bạn bè trong học tập', createdAt: '', updatedAt: '', deletedAt: null },
  { id: 'cat-merit-3', name: 'Chuẩn bị bài đầy đủ', type: 'Merit', defaultPoints: 5, description: 'Làm bài tập về nhà đầy đủ', createdAt: '', updatedAt: '', deletedAt: null },
  { id: 'cat-merit-4', name: 'Thành tích nổi bật trong giờ', type: 'Merit', defaultPoints: 10, description: 'Có đóng góp xuất sắc', createdAt: '', updatedAt: '', deletedAt: null },
  { id: 'cat-demerit-1', name: 'Chưa chú ý trong giờ học', type: 'Demerit', defaultPoints: -5, description: 'Nói chuyện riêng hoặc thiếu tập trung', createdAt: '', updatedAt: '', deletedAt: null },
];

export const LiveClassroomActivePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [session, setSession] = useState<LiveClassSession | null>(null);
  const [classRoom, setClassRoom] = useState<ClassRoom | null>(null);
  const [participants, setParticipants] = useState<LiveClassParticipant[]>([]);
  const [studentMap, setStudentMap] = useState<Map<string, Student>>(new Map());
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [events, setEvents] = useState<LiveClassEvent[]>([]);
  const [pointCategories, setPointCategories] = useState<PointCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Teacher Preferences / Settings
  const [enableSound, setEnableSound] = useState(true);
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [confirmBeforeDeducting, setConfirmBeforeDeducting] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  // FEAT-AVATAR-005 Instant Level Change Overlay Coordinator
  const [levelUpSettings, setLevelUpSettings] = useState<LevelUpCelebrationSettings>(DEFAULT_LEVEL_UP_CELEBRATION_SETTINGS);
  const [levelUpSettingsOpen, setLevelUpSettingsOpen] = useState(false);
  const [demoLevelChangeData, setDemoLevelChangeData] = useState<any>(null);

  const levelChangeOverlay = useLevelChangeOverlay({
    defaultDurationMs: levelUpSettings.durationMs,
  });

  useEffect(() => {
    levelUpCelebrationService.getSettings().then(setLevelUpSettings);
  }, []);

  // Sync & Points Tracking State
  const [attendanceSynced, setAttendanceSynced] = useState(false);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);

  // UI Scale & Density Controller
  const {
    density: cardDensity,
    setDensity: setCardDensity,
    isPresentationMode,
    togglePresentationMode,
    exitPresentationMode,
  } = useUiScale();

  // Keyboard Shortcuts Listener (F, R, T, G, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        togglePresentationMode();
      } else if (e.key === 'Escape') {
        if (isPresentationMode) {
          exitPresentationMode();
        }
        setSettingsModalOpen(false);
        setFocusStudent(null);
        setDeductModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePresentationMode, isPresentationMode, exitPresentationMode]);

  // Realtime Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Search & Filter & Pagination (50 students can comfortably fit on modern screens)
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = cardDensity === 'compact' ? 36 : cardDensity === 'medium' ? 24 : cardDensity === 'large' ? 16 : 50;

  // Multi-Select Students State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Floating Badge Animation Overlay State per student
  const [floatingBadges, setFloatingBadges] = useState<Map<string, { text: string; id: string; type: 'point' | 'star' }>>(new Map());

  // Double Click Transaction Protection Lock State
  const [submittingStudentId, setSubmittingStudentId] = useState<string | null>(null);

  // Undo Toast Banner State (10 seconds timeout)
  const [lastAction, setLastAction] = useState<{
    id: string;
    type: 'individual_point' | 'participation';
    studentId: string;
    studentName: string;
    pointEntryId?: string;
    timestamp: number;
    description: string;
  } | null>(null);

  // Deduct Point Modal State
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [deductTargetStudentId, setDeductTargetStudentId] = useState<string | null>(null);
  const [deductCategoryId, setDeductCategoryId] = useState('');
  const [deductReason, setDeductReason] = useState('Chưa chú ý trong giờ học');
  const [deductPoints, setDeductPoints] = useState(-1);
  const [submittingDeduct, setSubmittingDeduct] = useState(false);

  // Custom Point Modal State
  const [customPointModalOpen, setCustomPointModalOpen] = useState(false);
  const [customTargetStudentId, setCustomTargetStudentId] = useState<string | null>(null);
  const [customCategoryId, setCustomCategoryId] = useState('');
  const [customPointsVal, setCustomPointsVal] = useState(3);
  const [customReasonVal, setCustomReasonVal] = useState('Thành tích nổi bật trong giờ');

  // Global Active Theme & 5-Level Settings (FEAT-AVATAR-001)
  const [globalAvatarThemeId, setGlobalAvatarThemeId] = useState<string>(DEFAULT_AVATAR_THEME_ID);
  const [globalAvatarSettings, setGlobalAvatarSettings] = useState<GlobalAvatarSystemSettings | null>(null);
  const [uploadedAssetUrls, setUploadedAssetUrls] = useState<Map<string, string>>(new Map());
  const [studentTotalPointsMap, setStudentTotalPointsMap] = useState<Map<string, number>>(new Map());

  // Attendance Sync Modal State
  const [attendanceSyncModalOpen, setAttendanceSyncModalOpen] = useState(false);
  const [overwriteNotesCheck, setOverwriteNotesCheck] = useState(false);
  const [submittingSync, setSubmittingSync] = useState(false);

  // Student Focus Mode Modal (Click student card)
  const [focusStudent, setFocusStudent] = useState<{ student: Student; participant: LiveClassParticipant } | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  // Group Point Action Modal State
  const [groupPointModalOpen, setGroupPointModalOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [groupPointMode, setGroupPointMode] = useState<'individual' | 'event_only'>('individual');
  const [groupPointsVal, setGroupPointsVal] = useState(5);
  const [groupPointReason, setGroupPointReason] = useState('Nhóm hoàn thành xuất sắc nhiệm vụ');




  const loadSessionData = React.useCallback(async (isInitial = false) => {
    if (!sessionId) return;
    if (isInitial) setLoading(true);
    try {
      const sess = await liveClassSessionService.getSessionById(sessionId);
      if (!sess) {
        showError('Không tìm thấy', 'Phiên học không tồn tại.');
        navigate('/live-classroom');
        return;
      }
      setSession(sess);

      const room = await classRepository.findById(sess.classId);
      setClassRoom(room || null);

      const parts = await liveClassParticipantService.getParticipants(sessionId);
      setParticipants(parts);

      const sMap = new Map<string, Student>();
      for (const p of parts) {
        const st = await db.students.get(p.studentId);
        if (st) sMap.set(st.id, st);
      }
      setStudentMap(sMap);

      const grps = await liveClassGroupService.getGroupsWithMembers(sessionId);
      setGroups(grps);

      const evts = await liveClassEventService.getEvents(sessionId);
      setEvents(evts);

      const entries = await db.pointEntries.filter((e) => e.sourceId === sessionId && !e.deletedAt).toArray();
      setPointEntries(entries);

      const cats = await conductService.seedDefaultCategories();
      const activeCats = cats.length > 0 ? cats : FALLBACK_POINT_CATEGORIES;
      setPointCategories(activeCats);
      if (activeCats.length > 0) {
        setDeductCategoryId((prev) => prev || activeCats[0]!.id);
        setCustomCategoryId((prev) => prev || activeCats[0]!.id);
      }

      // Load global avatar system settings & assets
      try {
        const settings = await settingsRepository.getSettings();
        if (settings?.avatarSystemSettings) {
          setGlobalAvatarSettings(settings.avatarSystemSettings);
          const uploadedIds = settings.avatarSystemSettings.levels
            .filter((l: AvatarLevelDefinition) => l.image.kind === 'UPLOADED')
            .map((l: AvatarLevelDefinition) => (l.image as { kind: 'UPLOADED'; assetId: string }).assetId);
          if (uploadedIds.length > 0) {
            const urls = await avatarAssetService.preloadAssetUrls(uploadedIds);
            setUploadedAssetUrls(urls);
          }
        }
        if (settings?.activeAvatarThemeId) {
          setGlobalAvatarThemeId(settings.activeAvatarThemeId);
        }
      } catch (sErr) {
        console.warn('Failed to load global avatar theme setting:', sErr);
      }

      // Load all point entries to compute cumulative points for presentation
      const allEntries = await db.pointEntries.filter((e) => !e.deletedAt).toArray();
      const pMap = new Map<string, number>();
      for (const pe of allEntries) {
        const cur = pMap.get(pe.studentId) || 0;
        pMap.set(pe.studentId, cur + pe.points);
      }
      setStudentTotalPointsMap(pMap);

      // Broadcast session state to presentation view
      liveBroadcastService.postMessage({
        type: 'SESSION_STATE',
        payload: { session: sess, participantsCount: parts.length },
      });
    } catch (err) {
      console.error('Error loading live session:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [sessionId, navigate, showError]);

  useEffect(() => {
    loadSessionData(true);
  }, [loadSessionData]);

  // Realtime session elapsed timer loop
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const interval = setInterval(() => {
      setElapsedSeconds(liveClassSessionService.calculateElapsedSeconds(session));
    }, 1000);

    setElapsedSeconds(liveClassSessionService.calculateElapsedSeconds(session));
    return () => clearInterval(interval);
  }, [session]);


  // 10-Second Undo Timer Auto-Dismiss
  useEffect(() => {
    if (!lastAction) return;

    const timer = setTimeout(() => {
      setLastAction((current) => {
        if (current && Date.now() - current.timestamp >= 9900) {
          return null;
        }
        return current;
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, [lastAction]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // Trigger floating animation on card
  const triggerFloatingBadge = (studentId: string, text: string, type: 'point' | 'star') => {
    if (!enableAnimation) return;
    const badgeId = crypto.randomUUID();
    setFloatingBadges((prev) => {
      const next = new Map(prev);
      next.set(studentId, { text, id: badgeId, type });
      return next;
    });

    setTimeout(() => {
      setFloatingBadges((prev) => {
        const next = new Map(prev);
        if (next.get(studentId)?.id === badgeId) {
          next.delete(studentId);
        }
        return next;
      });
    }, 1500);
  };

  // Handlers for Session Actions
  const handleStartSession = async () => {
    if (!session) return;
    try {
      const updated = await liveClassSessionService.startSession(session.id);
      setSession(updated);
      showSuccess('Đã bắt đầu phiên', `Phiên học "${updated.title}" đang hoạt động.`);
      loadSessionData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handlePauseSession = async () => {
    if (!session) return;
    try {
      const updated = await liveClassSessionService.pauseSession(session.id);
      setSession(updated);
      showSuccess('Tạm dừng phiên học', 'Đồng hồ thời gian thực đã tạm dừng.');
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleResumeSession = async () => {
    if (!session) return;
    try {
      const updated = await liveClassSessionService.resumeSession(session.id);
      setSession(updated);
      showSuccess('Tiếp tục phiên học', 'Đồng hồ thời gian thực đã chạy lại.');
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;
    let warningMsg = 'Bạn có chắc chắn muốn hoàn thành phiên học trực tuyến này?';
    if (!attendanceSynced) {
      warningMsg = '⚠️ CẢNH BÁO: Bạn CHƯA ĐỒNG BỘ SỔ ĐIỂM DANH CHÍNH!\n\nBạn vẫn muốn hoàn thành phiên ngay bây giờ?';
    }

    if (window.confirm(warningMsg)) {
      try {
        const updated = await liveClassSessionService.completeSession(session.id);
        setSession(updated);
        showSuccess('Hoàn thành phiên học', 'Đã lưu thời gian kết thúc và hoàn tất tiết dạy.');
        setSummaryModalOpen(true);
      } catch (err: unknown) {
        showError('Lỗi', (err as Error).message);
      }
    }
  };

  // Participant Handlers
  const handleUpdateAttendance = async (studentId: string, status: LiveAttendanceStatus) => {
    if (!session) return;
    try {
      await liveClassParticipantService.updateAttendance(session.id, studentId, status);
      const updatedParts = await liveClassParticipantService.getParticipants(session.id);
      setParticipants(updatedParts);
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleToggleHandRaised = async (studentId: string) => {
    if (!session) return;
    try {
      await liveClassParticipantService.toggleHandRaised(session.id, studentId);
      const updatedParts = await liveClassParticipantService.getParticipants(session.id);
      setParticipants(updatedParts);
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  // Increment Participation (+1 Lượt phát biểu)
  const handleIncrementParticipation = async (studentId: string) => {
    if (!session || submittingStudentId) return;

    setSubmittingStudentId(studentId);
    try {
      const updatedPart = await liveClassParticipantService.incrementParticipation(session.id, studentId);
      const st = studentMap.get(studentId);

      // Play star sound & trigger floating animation
      playStarChime(enableSound);
      triggerFloatingBadge(studentId, '+1 ⭐', 'star');

      // Update participants state locally
      setParticipants((prev) => prev.map((p) => (p.studentId === studentId ? updatedPart : p)));

      // Set Undo Toast
      setLastAction({
        id: crypto.randomUUID(),
        type: 'participation',
        studentId,
        studentName: st?.fullName || 'Học sinh',
        timestamp: Date.now(),
        description: `Ghi nhận 1 lượt phát biểu cho ${st?.fullName}`,
      });
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    } finally {
      setSubmittingStudentId(null);
    }
  };

  // Quick Award Points (+1, +2, +5) with Double Click Lock & Sound & Animation
  const handleQuickAwardPoints = async (studentId: string, points: number, reason: string) => {
    if (!session || submittingStudentId) return;

    setSubmittingStudentId(studentId);
    try {
      const defaultCat = pointCategories[0]?.id || 'cat-1';
      const st = studentMap.get(studentId);

      const entry = await liveClassParticipantService.awardIndividualPoint(
        session.id,
        studentId,
        session.classId,
        defaultCat,
        points,
        reason
      );

      // FEAT-AVATAR-005: Direct Level Change Dispatch (<100ms)
      if (entry.notifications && entry.notifications.length > 0) {
        levelChangeOverlay.show(entry.notifications);
        const presentationEligible = entry.notifications.filter(
          (n: DirectLevelChangeNotification) => n.preferredTarget === 'PRESENTATION'
        );
        if (presentationEligible.length > 0) {
          liveBroadcastService.postMessage({
            type: 'LEVEL_CHANGE_SHOW',
            payload: {
              protocolVersion: 3,
              commandId: crypto.randomUUID(),
              classId: session.classId,
              liveSessionId: session.id,
              notifications: presentationEligible,
              sentAt: new Date().toISOString(),
            },
          });
        }
      }

      // Play pleasant sound & floating badge ONLY AFTER database write succeeds
      if (points > 0) {
        playPositiveChime(enableSound);
        triggerFloatingBadge(studentId, `+${points}đ`, 'point');

        // Broadcast point award to presentation view
        if (st) {
          liveBroadcastService.postMessage({
            type: 'POINT_AWARDED',
            payload: { studentName: st.fullName, points, reason },
          });
        }
      }

      // Set 10-Second Undo Toast
      setLastAction({
        id: crypto.randomUUID(),
        type: 'individual_point',
        studentId,
        studentName: st?.fullName || 'Học sinh',
        pointEntryId: entry.id,
        timestamp: Date.now(),
        description: `Đã ${points > 0 ? '+' : ''}${points} điểm cho ${st?.fullName}`,
      });

      loadSessionData();
    } catch (err: unknown) {
      showError('Lỗi ghi điểm', (err as Error).message);
    } finally {
      setSubmittingStudentId(null);
    }
  };

  // Handle Undo Last Action (10s window)
  const handleUndoLastAction = async () => {
    if (!session || !lastAction) return;

    try {
      if (lastAction.type === 'individual_point' && lastAction.pointEntryId) {
        const reversal = await liveClassParticipantService.undoIndividualPoint(session.id, lastAction.pointEntryId);
        if (reversal.notifications && reversal.notifications.length > 0) {
          levelChangeOverlay.show(reversal.notifications);
        }
        showSuccess('Hoàn tác thành công', `Đã hoàn tác điểm của ${lastAction.studentName}`);
      } else if (lastAction.type === 'participation') {
        await liveClassParticipantService.undoParticipation(session.id, lastAction.studentId);
        showSuccess('Hoàn tác thành công', `Đã hoàn tác lượt phát biểu của ${lastAction.studentName}`);
      }
      setLastAction(null);
      loadSessionData();
    } catch (err: unknown) {
      showError('Lỗi hoàn tác', (err as Error).message);
    }
  };

  // Open Deduct Point Popover/Modal (NEVER single click subtract)
  const handleOpenDeductModal = (studentId: string) => {
    setDeductTargetStudentId(studentId);
    setDeductPoints(-1);
    setDeductReason('Chưa tập trung trong tiết dạy');
    setDeductModalOpen(true);
  };

  const handleExecuteDeductPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !deductTargetStudentId) return;

    setSubmittingDeduct(true);
    try {
      const pts = deductPoints > 0 ? -deductPoints : deductPoints;
      const entry = await liveClassParticipantService.awardIndividualPoint(
        session.id,
        deductTargetStudentId,
        session.classId,
        deductCategoryId,
        pts,
        deductReason
      );

      // FEAT-AVATAR-005: Direct Level Change Dispatch on Deduct
      if (entry.notifications && entry.notifications.length > 0) {
        levelChangeOverlay.show(entry.notifications);
        const presentationEligible = entry.notifications.filter(
          (n: DirectLevelChangeNotification) => n.preferredTarget === 'PRESENTATION'
        );
        if (presentationEligible.length > 0) {
          liveBroadcastService.postMessage({
            type: 'LEVEL_CHANGE_SHOW',
            payload: {
              protocolVersion: 3,
              commandId: crypto.randomUUID(),
              classId: session.classId,
              liveSessionId: session.id,
              notifications: presentationEligible,
              sentAt: new Date().toISOString(),
            },
          });
        }
      }

      showSuccess('Ghi nhận điểm trừ', `Đã ghi nhận ${pts} điểm (Lý do: ${deductReason}).`);
      setDeductModalOpen(false);
      loadSessionData();
    } catch (err: unknown) {
      showError('Lỗi ghi điểm trừ', (err as Error).message);
    } finally {
      setSubmittingDeduct(false);
    }
  };

  // Open Custom Point Modal
  const handleOpenCustomPointModal = (studentId: string) => {
    setCustomTargetStudentId(studentId);
    setCustomPointsVal(3);
    setCustomReasonVal('Thành tích nổi bật trong giờ');
    setCustomPointModalOpen(true);
  };

  const handleExecuteCustomPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !customTargetStudentId) return;

    try {
      await handleQuickAwardPoints(customTargetStudentId, customPointsVal, customReasonVal);
      setCustomPointModalOpen(false);
    } catch (err: unknown) {
      showError('Lỗi ghi điểm', (err as Error).message);
    }
  };

  // Multi-Select Toggle & Batch Actions
  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleSelectAllStudents = () => {
    const allIds = filteredParticipants.map((p) => p.studentId);
    setSelectedStudentIds(new Set(allIds));
  };

  const handleDeselectAllStudents = () => {
    setSelectedStudentIds(new Set());
  };

  const handleBatchAwardPoints = async (points: number, reason: string) => {
    if (!session || selectedStudentIds.size === 0) return;

    const ids = Array.from(selectedStudentIds);
    try {
      const defaultCat = pointCategories[0]?.id || 'cat-1';
      const entries = await liveClassParticipantService.batchAwardPoints(session.id, ids, session.classId, defaultCat, points, reason);

      // FEAT-AVATAR-005: Combined Batch Modal Dispatch
      if (entries.notifications && entries.notifications.length > 0) {
        levelChangeOverlay.show(entries.notifications);
        const presentationEligible = entries.notifications.filter(
          (n: DirectLevelChangeNotification) => n.preferredTarget === 'PRESENTATION'
        );
        if (presentationEligible.length > 0) {
          liveBroadcastService.postMessage({
            type: 'LEVEL_CHANGE_SHOW',
            payload: {
              protocolVersion: 3,
              commandId: crypto.randomUUID(),
              classId: session.classId,
              liveSessionId: session.id,
              notifications: presentationEligible,
              sentAt: new Date().toISOString(),
            },
          });
        }
      }

      playPositiveChime(enableSound);
      showSuccess('Cộng điểm hàng loạt', `Đã cộng +${points} điểm cho ${ids.length} học sinh được chọn.`);
      setSelectedStudentIds(new Set());
      loadSessionData();
    } catch (err: unknown) {
      showError('Lỗi cộng điểm hàng loạt', (err as Error).message);
    }
  };

  // Group Point Action Execution (Individual vs Event-Only)
  const handleExecuteGroupPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !targetGroupId) return;

    try {
      const grp = groups.find((g) => g.id === targetGroupId);
      if (!grp) return;

      if (groupPointMode === 'individual') {
        const memberStudentIds = grp.members.map((m) => m.studentId);
        const defaultCat = pointCategories[0]?.id || 'cat-1';
        const entries = await liveClassParticipantService.batchAwardPoints(
          session.id,
          memberStudentIds,
          session.classId,
          defaultCat,
          groupPointsVal,
          groupPointReason
        );

        if (entries.notifications && entries.notifications.length > 0) {
          levelChangeOverlay.show(entries.notifications);
          const presentationEligible = entries.notifications.filter(
            (n: DirectLevelChangeNotification) => n.preferredTarget === 'PRESENTATION'
          );
          if (presentationEligible.length > 0) {
            liveBroadcastService.postMessage({
              type: 'LEVEL_CHANGE_SHOW',
              payload: {
                protocolVersion: 3,
                commandId: crypto.randomUUID(),
                classId: session.classId,
                liveSessionId: session.id,
                notifications: presentationEligible,
                sentAt: new Date().toISOString(),
              },
            });
          }
        }

        showSuccess('Cộng điểm thành viên nhóm', `Đã cộng ${groupPointsVal > 0 ? '+' : ''}${groupPointsVal} điểm cho ${memberStudentIds.length} học sinh nhóm ${grp.name}.`);
      } else {
        await liveClassGroupService.awardGroupPoint(
          session.id,
          targetGroupId,
          session.classId,
          pointCategories[0]?.id || 'cat-1',
          groupPointsVal,
          groupPointReason
        );
        showSuccess('Ghi nhận điểm nhóm', `Đã lưu điểm nhóm ${grp.name} vào nhật ký tiết học.`);
      }

      setGroupPointModalOpen(false);
      loadSessionData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  // Execute Attendance Sync to Main Book
  const handleExecuteAttendanceSync = async () => {
    if (!session) return;
    setSubmittingSync(true);
    try {
      const res = await liveClassSessionService.syncAttendanceToMainBook(session.id, overwriteNotesCheck);
      showSuccess(
        'Đồng bộ sổ điểm danh thành công',
        res.created
          ? 'Đã khởi tạo phiên điểm danh mới trong sổ điểm danh chính.'
          : 'Đã cập nhật bổ sung vào sổ điểm danh chính ngày hôm nay.'
      );
      setAttendanceSynced(true);
      setAttendanceSyncModalOpen(false);
    } catch (err: unknown) {
      showError('Lỗi đồng bộ', (err as Error).message);
    } finally {
      setSubmittingSync(false);
    }
  };

  // Import Attendance from Main Book into Live Session
  const handleImportAttendanceFromMainBook = async () => {
    if (!session) return;
    try {
      const count = await liveClassSessionService.importAttendanceFromMainBook(session.id);
      showSuccess('Nạp điểm danh thành công', `Đã nạp kết quả điểm danh từ Sổ chính cho ${count} học sinh.`);
      loadSessionData();
    } catch (err: unknown) {
      showError('Không thể nạp điểm danh', (err as Error).message);
    }
  };


  // Filtered & Paginated Participants
  const filteredParticipants = participants.filter((p) => {
    const st = studentMap.get(p.studentId);
    if (!st) return false;
    const matchName = st.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCode = st.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuery = matchName || matchCode;

    const matchesAttendance = attendanceFilter === 'all' || p.attendanceStatus === attendanceFilter;
    return matchesQuery && matchesAttendance;
  });

  const totalPages = Math.ceil(filteredParticipants.length / pageSize) || 1;
  const paginatedParticipants = filteredParticipants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Grid layout class mapping
  const gridColClass =
    cardDensity === 'auto'
      ? 'student-grid-fluid'
      : cardDensity === 'large'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[var(--space-3)]'
      : cardDensity === 'medium'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[var(--space-3)]'
      : 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-[var(--space-2)]';

  return (
    <div className="space-y-4 animate-fadeIn min-h-screen bg-live-bg p-[var(--space-2)] sm:p-[var(--space-3)] md:p-[var(--space-4)] pb-36 text-live-text rounded-3xl relative">
      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : !session ? (
        <div>Phiên học không tồn tại</div>
      ) : (
        <>
          {/* TOPBAR HERO COMMAND CENTER HEADER */}
          <div className="px-4 sm:px-6 py-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border-2 border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-4 sticky top-2 z-30 transition-all">
            {/* LEFT: SESSION IDENTITY & TELEMETRY */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0 ring-2 ring-white/60">
                <CuteCloudSVG className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <h1 className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-xl tracking-tight truncate max-w-full sm:max-w-md" title={session.title}>
                    {session.title}
                  </h1>
                  <span className="shrink-0 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs">
                    Lớp {classRoom?.name}
                  </span>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black whitespace-nowrap shadow-2xs ${
                      session.status === 'active'
                        ? 'bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-amber-100/90 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        session.status === 'active' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                      }`}
                    />
                    {session.status === 'active' ? 'Đang diễn ra' : 'Đã tạm dừng'}
                  </span>
                  {isPresentationMode && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 animate-pulse whitespace-nowrap shadow-2xs">
                      📺 Fullscreen
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                  <span>
                    Môn: <strong className="text-slate-800 dark:text-slate-200 font-bold">{session.subject}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Bắt đầu:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {session.startedAt
                        ? new Date(session.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : 'Vừa xong'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Sĩ số: <strong className="text-slate-800 dark:text-slate-200 font-bold">{participants.length} HS</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: LIVE TIMER & ACTION CONTROLS */}
            <div className="flex items-center gap-2.5 flex-wrap xl:flex-nowrap justify-start xl:justify-end shrink-0 w-full xl:w-auto pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800">
              {/* Glowing Live Digital Timer Pill */}
              <div
                className="px-4 py-2 rounded-2xl bg-slate-950 text-emerald-400 font-mono font-black text-sm sm:text-base border border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-inner flex items-center gap-2 shrink-0 select-none"
                title="Thời gian diễn ra phiên học"
              >
                <Clock className="w-4.5 h-4.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="tracking-wider">{formatTime(elapsedSeconds)}</span>
              </div>

              {/* Online Meeting Room */}
              {session.meetingUrl && !isPresentationMode && (
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-xs shrink-0 min-h-[40px] active:scale-95"
                  title="Mở liên kết phòng họp trực tuyến"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Phòng họp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Sync Attendance */}
              {!isPresentationMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[40px] border-2 border-emerald-600/50 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => setAttendanceSyncModalOpen(true)}
                  title="Đồng bộ điểm danh vào sổ chính"
                >
                  <span className="hidden sm:inline">Đồng bộ </span>Điểm danh
                </Button>
              )}

              {/* Play / Pause / Resume Controls */}
              {session.status === 'draft' ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs rounded-xl active:scale-95"
                  leftIcon={<Play className="w-4 h-4" />}
                  onClick={handleStartSession}
                >
                  Bắt đầu
                </Button>
              ) : session.status === 'active' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[40px] border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs rounded-xl active:scale-95"
                  leftIcon={<Pause className="w-4 h-4" />}
                  onClick={handlePauseSession}
                >
                  Tạm dừng
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs rounded-xl active:scale-95"
                  leftIcon={<Play className="w-4 h-4" />}
                  onClick={handleResumeSession}
                >
                  Tiếp tục
                </Button>
              )}

              {/* Primary Hero CTA: In-place Fullscreen Presentation Toggle */}
              <button
                type="button"
                onClick={togglePresentationMode}
                className={`min-h-[40px] px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md active:scale-95 ${
                  isPresentationMode
                    ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 hover:bg-amber-200'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 hover:shadow-lg scale-[1.02]'
                }`}
                title={isPresentationMode ? 'Thu nhỏ về chế độ thường (Esc)' : 'Trình chiếu toàn màn hình (Phím F)'}
              >
                {isPresentationMode ? <Minimize2 className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                <span>{isPresentationMode ? 'Thoát Trình Chiếu' : 'Trình Chiếu (F)'}</span>
              </button>

              {/* Projector Tab */}
              {!isPresentationMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[40px] border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs hidden md:inline-flex rounded-xl"
                  leftIcon={<Tv className="w-4 h-4" />}
                  onClick={() => navigate(`/live-classroom/${session.id}/present`)}
                  title="Mở tab trình chiếu máy chiếu phụ"
                >
                  <span className="hidden lg:inline">Tab </span>Máy chiếu
                </Button>
              )}

              {/* End Session */}
              <Button
                variant="outline"
                size="sm"
                className="min-h-[40px] border-2 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-300 font-bold text-xs rounded-xl active:scale-95"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={handleCompleteSession}
                title="Kết thúc và hoàn thành phiên học"
              >
                Kết thúc
              </Button>

              {/* Settings Gear */}
              {!isPresentationMode && (
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  className="p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 min-h-[40px] min-w-[40px] flex items-center justify-center transition-all shadow-2xs active:scale-95"
                  title="Cấu hình phiên học"
                  aria-label="Cài đặt phiên học"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          </div>

          {/* MULTI-SELECT BATCH ACTION BAR (Shown when 1 or more students checked) */}
          {selectedStudentIds.size > 0 && (
            <Card className="p-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn shadow-xl border-2 border-blue-400/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Badge variant="primary" className="bg-white text-blue-900 font-black text-xs px-3 py-1 shadow-xs">
                  Đã chọn {selectedStudentIds.size} học sinh
                </Badge>
                <button onClick={handleSelectAllStudents} className="text-xs font-black underline hover:text-blue-100 transition-colors">
                  Chọn tất cả ({filteredParticipants.length})
                </button>
                <button onClick={handleDeselectAllStudents} className="text-xs font-black underline hover:text-blue-100 transition-colors">
                  Bỏ chọn tất cả
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-blue-700 font-black hover:bg-blue-50 rounded-xl shadow-xs active:scale-95"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => handleBatchAwardPoints(1, 'Tích cực phát biểu cùng lúc')}
                >
                  +1 Điểm tất cả
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-gradient-to-r from-amber-300 to-yellow-300 text-amber-950 font-black hover:from-amber-400 hover:to-yellow-400 rounded-xl shadow-xs active:scale-95"
                  leftIcon={<Award className="w-4 h-4" />}
                  onClick={() => handleBatchAwardPoints(2, 'Cùng hoàn thành xuất sắc bài tập')}
                >
                  +2 Điểm tất cả
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-gradient-to-r from-purple-300 to-fuchsia-300 text-purple-950 font-black hover:from-purple-400 hover:to-fuchsia-400 rounded-xl shadow-xs active:scale-95"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={() => handleBatchAwardPoints(5, 'Cùng đạt thành tích xuất sắc')}
                >
                  +5 Điểm tất cả
                </Button>
              </div>
            </Card>
          )}

          {/* MAIN LAYOUT: FULL-WIDTH STUDENT GRID */}
          <div className="w-full space-y-4">
            {/* DENSITY & SEARCH COMMAND BAR */}
            <Card className="p-3.5 sm:p-4 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
                  <Input
                    placeholder="Tìm tên học sinh, STT..."
                    leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-64 rounded-xl"
                  />

                  <Select
                    value={attendanceFilter}
                    onChange={(e) => {
                      setAttendanceFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'Tất cả trạng thái' },
                      { value: 'present', label: 'Có mặt' },
                      { value: 'late', label: 'Đi muộn' },
                      { value: 'absent', label: 'Vắng' },
                      { value: 'left', label: 'Rời lớp' },
                    ]}
                  />
                </div>

                {/* DENSITY SWITCHER 4 MODES: Tự động | Lớn | Vừa | Gọn */}
                <div className="flex items-center gap-3 justify-between w-full sm:w-auto">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-black shadow-inner border border-slate-200/80 dark:border-slate-700">
                    <button
                      onClick={() => setCardDensity('auto')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        cardDensity === 'auto'
                          ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Tự động co giãn theo kích thước màn hình"
                    >
                      Tự động
                    </button>
                    <button
                      onClick={() => setCardDensity('large')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        cardDensity === 'large'
                          ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Hiển thị thẻ to, chữ to, avatar lớn"
                    >
                      Lớn
                    </button>
                    <button
                      onClick={() => setCardDensity('medium')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        cardDensity === 'medium'
                          ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Cân bằng giữa kích thước và số lượng thẻ"
                    >
                      Vừa
                    </button>
                    <button
                      onClick={() => setCardDensity('compact')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        cardDensity === 'compact'
                          ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Hiển thị nhiều thẻ học sinh hơn"
                    >
                      Gọn
                    </button>
                  </div>

                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 shrink-0 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    {filteredParticipants.length} học sinh
                  </span>
                </div>
              </div>
            </Card>

            {/* EMPTY SEARCH STATE */}
            {filteredParticipants.length === 0 && (
              <div className="py-16 px-4 text-center rounded-3xl bg-white/80 dark:bg-slate-900/80 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                  Không tìm thấy học sinh nào
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Không có học sinh nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng thái hiện tại.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setAttendanceFilter('all');
                  }}
                  className="mt-2 font-bold"
                >
                  Xóa bộ lọc tìm kiếm
                </Button>
              </div>
            )}

            {/* STUDENT CARDS GRID (Fluid Responsive Grid + Container Queries) */}
            {filteredParticipants.length > 0 && (
              <div className={gridColClass}>
                {paginatedParticipants.map((p, idx) => {
                  const st = studentMap.get(p.studentId);
                  if (!st) return null;

                  const score = studentTotalPointsMap.get(p.studentId) || 0;
                  const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
                    student: st,
                    score,
                    globalSettings: globalAvatarSettings,
                    uploadedAssetUrls,
                  });

                  return (
                    <StudentCard
                      key={p.id}
                      participant={p}
                      student={st}
                      rollNumber={idx + 1}
                      points={score}
                      presentation={presentation}
                      globalActiveThemeId={globalAvatarThemeId}
                      cardDensity={cardDensity}
                      isSelected={focusStudent?.student.id === p.studentId}
                      isChecked={selectedStudentIds.has(p.studentId)}
                      isSubmitting={submittingStudentId === p.studentId}
                      floatingBadge={floatingBadges.get(p.studentId)}
                      onSelectCard={(student, participant) => setFocusStudent({ student, participant })}
                      onToggleCheck={toggleSelectStudent}
                      onQuickAward={handleQuickAwardPoints}
                      onIncrementTalk={handleIncrementParticipation}
                      onOpenDeduct={handleOpenDeductModal}
                      onOpenCustomPoint={handleOpenCustomPointModal}
                    />
                  );
                })}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex justify-center my-6">
                <div className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-slate-200 shadow-md flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage === 1}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="font-extrabold"
                  >
                    Trang trước
                  </Button>
                  <span className="text-xs font-extrabold text-slate-700 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage === totalPages}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="font-extrabold"
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 10-SECOND UNDO TOAST BANNER */}
          {lastAction && (
            <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border-2 border-amber-400 flex items-center gap-4 animate-slideRight">
              <div>
                <p className="text-xs font-bold text-amber-300">Ghi nhận thao tác thành công</p>
                <p className="text-xs font-semibold">{lastAction.description}</p>
              </div>
              <Button
                size="sm"
                className="bg-amber-400 text-amber-950 hover:bg-amber-300 font-extrabold"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={handleUndoLastAction}
              >
                HOÀN TÁC (10s)
              </Button>
            </div>
          )}

          {/* DEDUCT POINT POPOVER/MODAL (NEVER SINGLE CLICK SUBTRACT) */}
          <Modal
            isOpen={deductModalOpen}
            onClose={() => setDeductModalOpen(false)}
            title="Trừ Điểm Thi Đua (Yêu cầu chọn lý do)"
          >
            <form onSubmit={handleExecuteDeductPoint} className="space-y-4 py-2">
              <Select
                label="Danh mục vi phạm / nhắc nhở"
                value={deductCategoryId || (pointCategories.length > 0 ? pointCategories[0]?.id : FALLBACK_POINT_CATEGORIES[0]!.id)}
                onChange={(e) => setDeductCategoryId(e.target.value)}
                options={(pointCategories.length > 0 ? pointCategories : FALLBACK_POINT_CATEGORIES).map((c) => ({ value: c.id, label: c.name }))}
              />

              <Input
                label="Số điểm trừ"
                type="number"
                required
                value={Math.abs(deductPoints)}
                onChange={(e) => setDeductPoints(-Math.abs(Number(e.target.value)))}
              />

              <Input
                label="Lý do trừ điểm (Bắt buộc)"
                required
                placeholder="Ví dụ: Không tập trung nghe giảng"
                value={deductReason}
                onChange={(e) => setDeductReason(e.target.value)}
              />

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" className="flex-1" onClick={() => setDeductModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" className="flex-1 bg-red-600 hover:bg-red-700" isLoading={submittingDeduct}>
                  Xác nhận trừ điểm
                </Button>
              </div>
            </form>
          </Modal>

          {/* CUSTOM POINT MODAL */}
          <Modal
            isOpen={customPointModalOpen}
            onClose={() => setCustomPointModalOpen(false)}
            title="Ghi Nhận Mức Điểm Khác"
          >
            <form onSubmit={handleExecuteCustomPoint} className="space-y-4 py-2">
              <Select
                label="Danh mục điểm"
                value={customCategoryId || (pointCategories.length > 0 ? pointCategories[0]?.id : FALLBACK_POINT_CATEGORIES[0]!.id)}
                onChange={(e) => setCustomCategoryId(e.target.value)}
                options={(pointCategories.length > 0 ? pointCategories : FALLBACK_POINT_CATEGORIES).map((c) => ({ value: c.id, label: c.name }))}
              />

              <Input
                label="Mức điểm (+ hoặc -)"
                type="number"
                required
                value={customPointsVal}
                onChange={(e) => setCustomPointsVal(Number(e.target.value))}
              />

              <Input
                label="Lý do ghi điểm"
                required
                value={customReasonVal}
                onChange={(e) => setCustomReasonVal(e.target.value)}
              />

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" className="flex-1" onClick={() => setCustomPointModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Lưu điểm
                </Button>
              </div>
            </form>
          </Modal>

          {/* GROUP POINT MODAL (Clear choice: Individual vs Event-Only) */}
          <Modal
            isOpen={groupPointModalOpen}
            onClose={() => setGroupPointModalOpen(false)}
            title="Cộng/Trừ Điểm Nhóm"
          >
            <form onSubmit={handleExecuteGroupPoint} className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Hình thức ghi nhận điểm nhóm:</label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer bg-slate-50">
                    <input
                      type="radio"
                      name="grp-mode"
                      value="individual"
                      checked={groupPointMode === 'individual'}
                      onChange={() => setGroupPointMode('individual')}
                      className="text-blue-600"
                    />
                    <span>Cộng/trừ điểm trực tiếp vào hồ sơ từng thành viên trong nhóm (<code>pointEntries</code>)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer bg-slate-50">
                    <input
                      type="radio"
                      name="grp-mode"
                      value="event_only"
                      checked={groupPointMode === 'event_only'}
                      onChange={() => setGroupPointMode('event_only')}
                      className="text-blue-600"
                    />
                    <span>Chỉ ghi nhận điểm nhóm vào nhật ký tiết học (<code>liveClassEvents</code>)</span>
                  </label>
                </div>
              </div>

              <Input
                label="Số điểm nhóm"
                type="number"
                required
                value={groupPointsVal}
                onChange={(e) => setGroupPointsVal(Number(e.target.value))}
              />

              <Input
                label="Lý do cộng điểm nhóm"
                required
                value={groupPointReason}
                onChange={(e) => setGroupPointReason(e.target.value)}
              />

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" className="flex-1" onClick={() => setGroupPointModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Thực hiện
                </Button>
              </div>
            </form>
          </Modal>

          {/* ATTENDANCE SYNC MODAL */}
          <Modal
            isOpen={attendanceSyncModalOpen}
            onClose={() => setAttendanceSyncModalOpen(false)}
            title="Đồng Bộ Sổ Điểm Danh Chính"
          >
            <div className="space-y-4 py-2 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-blue-900">Bản xem trước thống kê điểm danh:</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white text-blue-700 font-extrabold hover:bg-blue-100"
                    onClick={handleImportAttendanceFromMainBook}
                  >
                    📥 Nạp từ Sổ điểm danh chính
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center font-bold">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                    Có mặt: {participants.filter((p) => p.attendanceStatus === 'present').length}
                  </div>
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                    Đi muộn: {participants.filter((p) => p.attendanceStatus === 'late').length}
                  </div>
                  <div className="p-2 rounded-lg bg-red-100 text-red-800">
                    Vắng: {participants.filter((p) => p.attendanceStatus === 'absent').length}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                    Rời lớp: {participants.filter((p) => p.attendanceStatus === 'left').length}
                  </div>
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                    Chưa báo: {participants.filter((p) => p.attendanceStatus === 'unchecked').length}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="chk-overwrite-notes"
                  checked={overwriteNotesCheck}
                  onChange={(e) => setOverwriteNotesCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="chk-overwrite-notes" className="font-semibold text-slate-700 cursor-pointer">
                  Cho phép cập nhật lại ghi chú điểm danh cũ (nếu có)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Button variant="secondary" className="flex-1" onClick={() => setAttendanceSyncModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" className="flex-1 bg-emerald-600 hover:bg-emerald-700" isLoading={submittingSync} onClick={handleExecuteAttendanceSync}>
                  Xác nhận đồng bộ sang Sổ chính
                </Button>
              </div>
            </div>
          </Modal>

          {/* SETTINGS MODAL */}
          <Modal
            isOpen={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            title="Cấu Hình Tiết Học Trực Tuyến"
          >
            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Âm thanh khen thưởng (Web Audio Synth)</h4>
                  <p className="text-[11px] text-slate-500">Phát âm thanh tích cực 100% offline khi cộng điểm.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableSound}
                  onChange={(e) => setEnableSound(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Hiệu ứng chuyển động (Animations)</h4>
                  <p className="text-[11px] text-slate-500">Bong bóng nổ điểm (+1, +2, ⭐) trên thẻ học sinh.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableAnimation}
                  onChange={(e) => setEnableAnimation(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Xác nhận trước khi trừ điểm</h4>
                  <p className="text-[11px] text-slate-500">Yêu cầu chọn lý do trước khi ghi nhận trừ điểm.</p>
                </div>
                <input
                  type="checkbox"
                  checked={confirmBeforeDeducting}
                  onChange={(e) => setConfirmBeforeDeducting(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <Button variant="primary" onClick={() => setSettingsModalOpen(false)}>
                  Hoàn tất
                </Button>
              </div>
            </div>
          </Modal>

          {/* STUDENT FOCUS MODE MODAL */}
          <Modal
            isOpen={!!focusStudent}
            onClose={() => setFocusStudent(null)}
            title="Thao Tác Nhanh Học Sinh"
            maxWidth="md"
          >
            {focusStudent && (() => {
              const focusScore = studentTotalPointsMap.get(focusStudent.student.id) || 0;
              const focusPresentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
                student: focusStudent.student,
                score: focusScore,
                globalSettings: globalAvatarSettings,
                uploadedAssetUrls,
              });
              const theme = focusPresentation.cardTheme;
              const sessionPoints = pointEntries
                .filter((pe) => pe.studentId === focusStudent.student.id)
                .reduce((sum, pe) => sum + pe.points, 0);

              return (
                <div className="space-y-4 py-2 text-center">
                  {/* HERO BANNER: 5-LEVEL AVATAR, IDENTITY BADGE & NAME */}
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${theme.surfaceStart} 0%, ${theme.surfaceEnd} 100%)`,
                      borderColor: theme.border,
                      boxShadow: `0 4px 14px ${theme.shadow}`,
                    }}
                    className="p-5 rounded-3xl border-2 space-y-3 flex flex-col items-center relative overflow-hidden"
                  >
                    {/* AVATAR WITH LEVEL RING */}
                    <div className="relative">
                      <div
                        style={{ borderColor: theme.avatarRing }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 bg-white/90 p-1 shadow-md overflow-hidden flex items-center justify-center transition-transform hover:scale-105"
                      >
                        {focusPresentation.avatarAsset.assetUrl ? (
                          <img
                            src={focusPresentation.avatarAsset.assetUrl}
                            alt={focusPresentation.avatarAsset.altText}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <StudentAvatar
                            student={focusStudent.student}
                            score={focusScore}
                            globalActiveThemeId={globalAvatarThemeId}
                            size="2xl"
                          />
                        )}
                      </div>

                      {/* Attendance badge on avatar */}
                      {focusStudent.participant.attendanceStatus === 'absent' && (
                        <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded-full shadow-xs">
                          Vắng
                        </span>
                      )}
                      {focusStudent.participant.attendanceStatus === 'late' && (
                        <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded-full shadow-xs">
                          Muộn
                        </span>
                      )}
                    </div>

                    {/* LEVEL BADGE & STUDENT NAME */}
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          style={{
                            backgroundColor: theme.badgeBackground,
                            color: theme.badgeText,
                            borderColor: theme.badgeBorder,
                          }}
                          className="px-3 py-1 rounded-full text-xs font-black border tracking-wide uppercase shadow-2xs"
                        >
                          {focusPresentation.levelShortLabel} • {focusPresentation.levelName}
                        </span>
                      </div>

                      <h3 style={{ color: theme.textPrimary }} className="text-xl font-extrabold truncate px-2">
                        {focusStudent.student.fullName}
                      </h3>

                      <div
                        style={{ color: theme.textSecondary }}
                        className="flex items-center justify-center gap-2.5 text-xs font-mono font-bold flex-wrap"
                      >
                        <span>Mã HS: {focusStudent.student.studentCode || 'N/A'}</span>
                        <span>•</span>
                        <span>Tổng: <strong className="text-blue-600 font-black">{focusScore}đ</strong></span>
                        <span>•</span>
                        <span>Điểm tiết: <strong className={sessionPoints >= 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>{sessionPoints > 0 ? `+${sessionPoints}` : sessionPoints}đ</strong></span>
                        <span>•</span>
                        <span>Phát biểu: {focusStudent.participant.participationCount || 0} lần</span>
                      </div>
                    </div>
                  </div>

                  {/* ATTENDANCE QUICK STATUS */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Trạng thái điểm danh</p>
                    <div className="grid grid-cols-4 gap-1 font-bold text-[11px]">
                      {[
                        { status: 'present', label: 'Có mặt' },
                        { status: 'late', label: 'Muộn' },
                        { status: 'absent', label: 'Vắng' },
                        { status: 'left', label: 'Rời lớp' },
                      ].map((item) => (
                        <button
                          key={item.status}
                          onClick={() => {
                            handleUpdateAttendance(focusStudent.student.id, item.status as LiveAttendanceStatus);
                            setFocusStudent((prev) => prev ? { ...prev, participant: { ...prev.participant, attendanceStatus: item.status as LiveAttendanceStatus } } : null);
                          }}
                          className={`py-1 rounded-lg border transition-all ${
                            focusStudent.participant.attendanceStatus === item.status
                              ? 'bg-blue-600 text-white font-extrabold border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QUICK SCORING BUTTONS (+1, +2, -1) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cộng / Trừ điểm thi đua nhanh</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => handleQuickAwardPoints(focusStudent.student.id, 1, 'Tích cực phát biểu')}
                      >
                        +1 Điểm
                      </Button>
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        leftIcon={<Award className="w-4 h-4" />}
                        onClick={() => handleQuickAwardPoints(focusStudent.student.id, 2, 'Xuất sắc bài tập')}
                      >
                        +2 Điểm
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        leftIcon={<Minus className="w-4 h-4" />}
                        onClick={() => handleOpenDeductModal(focusStudent.student.id)}
                      >
                        Trừ điểm...
                      </Button>
                    </div>
                  </div>

                  {/* QUICK ACTIONS: +1 TALK, TOGGLE HAND */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleIncrementParticipation(focusStudent.student.id)}
                    >
                      🗣 +1 Lượt phát biểu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Hand className="w-4 h-4" />}
                      onClick={() => handleToggleHandRaised(focusStudent.student.id)}
                    >
                      {focusStudent.participant.handRaised ? 'Hạ tay xuống' : 'Giơ tay'}
                    </Button>
                  </div>

                  {/* QUICK NOTE INPUT */}
                  <div className="space-y-1 text-left">
                    <Input
                      label="Ghi chú nhanh tiết học"
                      placeholder="Ví dụ: Cần nhắc nhở ôn bài tập số 3..."
                      value={quickNoteText}
                      onChange={(e) => setQuickNoteText(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full mt-1"
                      onClick={() => {
                        liveClassParticipantService.updateQuickNote(sessionId!, focusStudent.student.id, quickNoteText);
                        showSuccess('Đã lưu ghi chú', 'Đã cập nhật ghi chú nhanh.');
                        setFocusStudent(null);
                      }}
                    >
                      Lưu ghi chú
                    </Button>
                  </div>
                </div>
              );
            })()}
          </Modal>

          {/* SINGLE FLOATING CLASSROOM TOOLBOX AT PAGE LEVEL */}
          {session && (
            <FloatingClassroomToolbox
              sessionId={session.id}
              classId={session.classId}
              participants={participants}
              studentMap={studentMap}
              groups={groups}
              events={events}
              globalSettings={globalAvatarSettings}
              uploadedAssetUrls={uploadedAssetUrls}
              studentTotalPointsMap={studentTotalPointsMap}
              onParticipantsUpdated={loadSessionData}
              onGroupsUpdated={loadSessionData}
              onQuickAwardPoints={handleQuickAwardPoints}
              onOpenDeductModal={(stId) => {
                setDeductTargetStudentId(stId);
                setDeductModalOpen(true);
              }}
              onIncrementTalk={async (stId) => {
                await liveClassParticipantService.incrementParticipation(session.id, stId);
                loadSessionData();
              }}
              onSelectStudentCard={(stId) => {
                const part = participants.find((p) => p.studentId === stId);
                const st = studentMap.get(stId);
                if (st && part) {
                  setFocusStudent({ student: st, participant: part });
                }
              }}
              onOpenGroupPointModal={(groupId) => {
                setTargetGroupId(groupId);
                setGroupPointModalOpen(true);
              }}
              enableSound={enableSound}
            />
          )}

          {session && (
            <SessionSummaryModal
              isOpen={summaryModalOpen}
              onClose={() => setSummaryModalOpen(false)}
              session={session}
              classRoom={classRoom}
              participants={participants}
              pointEntries={pointEntries}
              groups={groups}
              elapsedSeconds={elapsedSeconds}
              onFinishAndNavigate={() => navigate('/live-classroom')}
            />
          )}

          {/* FEAT-AVATAR-005: DIRECT LEVEL CHANGE CELEBRATION MODAL (UP & DOWN) */}
          <LevelUpCelebrationModal
            isOpen={levelChangeOverlay.isOpen || !!demoLevelChangeData}
            data={demoLevelChangeData}
            notifications={levelChangeOverlay.notifications}
            enableSound={levelUpSettings.soundEnabled}
            confettiEnabled={levelUpSettings.confettiEnabled}
            intensity={levelUpSettings.intensity}
            durationMs={levelUpSettings.durationMs}
            onClose={() => {
              if (demoLevelChangeData) {
                setDemoLevelChangeData(null);
              } else {
                levelChangeOverlay.dismiss('USER');
              }
            }}
            onComplete={() => {
              if (demoLevelChangeData) {
                setDemoLevelChangeData(null);
              } else {
                levelChangeOverlay.dismiss('AUTO');
              }
            }}
            isPresentationMode={false}
          />

          {/* FEAT-AVATAR-005: LEVEL CHANGE SETTINGS MODAL */}
          <LevelUpCelebrationSettingsModal
            isOpen={levelUpSettingsOpen}
            onClose={() => setLevelUpSettingsOpen(false)}
            settings={levelUpSettings}
            onSave={async (newSettings) => {
              const updated = await levelUpCelebrationService.updateSettings(newSettings);
              setLevelUpSettings(updated);
            }}
            onPreviewDemo={(direction) => {
              setLevelUpSettingsOpen(false);
              const fromId = direction === 'UP' ? 2 : 3;
              const toId = direction === 'UP' ? 3 : 2;
              const demoStudent: Student = {
                id: 'demo-student-preview',
                fullName: direction === 'UP' ? 'Nguyễn Minh Quân (Demo Thăng Cấp)' : 'Trần Hoàng Bảo (Demo Giảm Cấp)',
                normalizedName: direction === 'UP' ? 'nguyen minh quan' : 'tran hoang bao',
                studentCode: 'HS2026',
                gender: 'Nam',
                dateOfBirth: '2010-01-01',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
              };
              const fromPres = avatarThemeRegistry.resolveStudentAvatarPresentation({
                student: demoStudent,
                avatarLevel: fromId,
                globalSettings: globalAvatarSettings,
                uploadedAssetUrls,
              });
              const toPres = avatarThemeRegistry.resolveStudentAvatarPresentation({
                student: demoStudent,
                avatarLevel: toId,
                globalSettings: globalAvatarSettings,
                uploadedAssetUrls,
              });
              setDemoLevelChangeData({
                notificationId: 'demo-preview-' + direction,
                mutationId: 'demo-mut',
                studentId: demoStudent.id,
                studentDisplayName: demoStudent.fullName,
                studentCode: demoStudent.studentCode,
                classId: session?.classId || 'demo-class',
                direction,
                previousScore: direction === 'UP' ? 150 : 350,
                currentScore: direction === 'UP' ? 320 : 190,
                fromLevelId: fromId,
                toLevelId: toId,
                previousLevel: {
                  levelId: fromId,
                  levelName: fromPres.levelName,
                  levelShortLabel: fromPres.levelShortLabel,
                  levelDescription: fromPres.levelDescription,
                  avatarAssetUrl: fromPres.avatarAsset.assetUrl,
                  cardBaseColor: fromPres.cardTheme.baseColor,
                  cardTheme: fromPres.cardTheme,
                },
                currentLevel: {
                  levelId: toId,
                  levelName: toPres.levelName,
                  levelShortLabel: toPres.levelShortLabel,
                  levelDescription: toPres.levelDescription,
                  avatarAssetUrl: toPres.avatarAsset.assetUrl,
                  cardBaseColor: toPres.cardTheme.baseColor,
                  cardTheme: toPres.cardTheme,
                },
                levelsChanged: 1,
                settingsRevision: globalAvatarSettings?.revision || 1,
                createdAt: new Date().toISOString(),
                preferredTarget: 'PRESENTATION',
              });
            }}
          />
        </>
      )}
    </div>
  );
};
