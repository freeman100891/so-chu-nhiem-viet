import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { Modal } from '../../shared/components/Modal';
import { Badge } from '../../shared/components/Badge';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/hooks/useToast';
import { studentProfileService, type TimelineEventItem } from '../../core/services/student-profile.service';
import { conductService } from '../../core/services/conduct.service';
import { honorBoardService } from '../../core/services/honor-board.service';
import { settingsRepository } from '../../core/repositories/settings.repository';
import {
  avatarThemeRegistry,
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
} from '../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../core/types/avatar-theme.types';
import { db } from '../../core/database/db';
import { formatDateVietnamese, getTodayDateString } from '../../shared/utilities/date';
import type {
  Student,
  ClassRoom,
  ParentContact,
  StudentNote,
  StudentNoteCategory,
  InteractionMethod,
  HonorRecipient,
  HonorBoard,
} from '../../core/database/types';
import {
  User,
  Phone,
  Pin,
  Plus,
  Clock,
  MessageSquare,
  ArrowLeft,
  Trash2,
  History,
  Sparkles,
  Award,
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [parentContacts, setParentContacts] = useState<ParentContact[]>([]);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventItem[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [studentHonors, setStudentHonors] = useState<{ recipient: HonorRecipient; board: HonorBoard }[]>([]);
  const [globalAvatarSettings, setGlobalAvatarSettings] = useState<GlobalAvatarSystemSettings>(
    DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS
  );
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'evaluations' | 'parents' | 'honors'>('overview');

  // Add Note Modal State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteCategory, setNoteCategory] = useState<StudentNoteCategory>('HocTap');
  const [noteContent, setNoteContent] = useState('');
  const [notePinned, setNotePinned] = useState(false);

  // Add Parent Contact Modal State
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentRelation, setParentRelation] = useState('Cha');
  const [parentPhone, setParentPhone] = useState('');
  const [parentZalo, setParentZalo] = useState('');
  const [parentIsPrimary, setParentIsPrimary] = useState(false);

  // Add Parent Interaction Modal State
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionMethod, setInteractionMethod] = useState<InteractionMethod>('GoiDien');
  const [interactionTopic, setInteractionTopic] = useState('');
  const [interactionContent, setInteractionContent] = useState('');
  const [interactionResult, setInteractionResult] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const loadData = React.useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const settings = await settingsRepository.getSettings();
      if (settings?.avatarSystemSettings) {
        setGlobalAvatarSettings(settings.avatarSystemSettings);
      }

      const st = await db.students.get(studentId);
      if (!st || st.deletedAt) {
        showError('Không tìm thấy', 'Học sinh không tồn tại hoặc đã bị xóa.');
        navigate('/students');
        return;
      }
      setStudent(st);

      // Fetch Active Class Enrollment
      const enr = await db.classEnrollments
        .where('studentId')
        .equals(studentId)
        .filter((e) => e.status === 'Active' && !e.deletedAt)
        .first();

      if (enr) {
        const cls = await db.classes.get(enr.classId);
        setCurrentClass(cls || null);

        // Calculate dynamic total points
        const points = await conductService.calculateStudentTotalPoints(studentId, enr.classId);
        setTotalPoints(points);

        // Fetch Attendance Rate
        const attRecords = await db.attendanceRecords
          .where('studentId')
          .equals(studentId)
          .filter((r) => !r.deletedAt)
          .toArray();

        if (attRecords.length > 0) {
          const attended = attRecords.filter((r) => r.status === 'Present' || r.status === 'Late' || r.status === 'EarlyLeave').length;
          setAttendanceRate(Math.round((attended / attRecords.length) * 100));
        } else {
          setAttendanceRate(100);
        }

        // Fetch Timeline
        const events = await studentProfileService.getStudentTimeline(studentId, enr.classId);
        setTimelineEvents(events);
      }

      // Fetch Parent Contacts
      const contacts = await db.parentContacts
        .where('studentId')
        .equals(studentId)
        .filter((c) => !c.deletedAt)
        .toArray();
      setParentContacts(contacts);

      // Fetch Notes
      const noteList = await studentProfileService.getStudentNotes(studentId);
      setNotes(noteList);

      // Fetch Student Honor History
      const honors = await honorBoardService.getStudentHonorHistory(studentId);
      setStudentHonors(honors);
    } catch (err) {
      console.error('Error loading student profile:', err);
      showError('Lỗi', 'Không thể tải hồ sơ học sinh');
    } finally {
      setLoading(false);
    }
  }, [studentId, navigate, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = () => loadData();
    window.addEventListener('point_entries_changed', handleRefresh);
    window.addEventListener('gvcn_settings_changed', handleRefresh);
    return () => {
      window.removeEventListener('point_entries_changed', handleRefresh);
      window.removeEventListener('gvcn_settings_changed', handleRefresh);
    };
  }, [loadData]);

  const presentation = useMemo(() => {
    if (!student) return null;
    return avatarThemeRegistry.resolveStudentAvatarPresentation({
      student,
      score: totalPoints,
      globalSettings: globalAvatarSettings,
    });
  }, [student, totalPoints, globalAvatarSettings]);

  const primaryContact = useMemo(() => {
    return parentContacts.find((c) => c.isPrimary) || parentContacts[0];
  }, [parentContacts]);

  // Add Note Handler
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !currentClass || !noteContent.trim()) return;
    try {
      await studentProfileService.addStudentNote({
        classId: currentClass.id,
        studentId: student.id,
        category: noteCategory,
        content: noteContent,
        isPinned: notePinned,
      });
      showSuccess('Thêm ghi chú thành công', 'Đã lưu ghi chú vào hồ sơ học sinh.');
      setShowNoteModal(false);
      setNoteContent('');
      setNotePinned(false);
      loadData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      const isPinned = await studentProfileService.togglePinNote(noteId);
      showSuccess(isPinned ? 'Đã ghim ghi chú' : 'Đã bỏ ghim ghi chú', 'Ưu tiên hiển thị trên đầu timeline.');
      loadData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await studentProfileService.deleteStudentNote(noteId);
      showSuccess('Đã xóa ghi chú', 'Ghi chú có thể phục hồi từ Thùng rác.');
      loadData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  // Add Parent Contact Handler
  const handleSaveParentContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !parentName.trim()) return;
    try {
      await studentProfileService.saveParentContact({
        studentId: student.id,
        fullName: parentName,
        relation: parentRelation,
        phone: parentPhone,
        zalo: parentZalo,
        isPrimary: parentIsPrimary,
      });
      showSuccess('Lưu liên hệ phụ huynh thành công', `Đã cập nhật phụ huynh ${parentName}`);
      setShowParentModal(false);
      setParentName('');
      setParentPhone('');
      setParentZalo('');
      loadData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleDeleteParentContact = async (contactId: string) => {
    try {
      await db.parentContacts.update(contactId, { deletedAt: new Date().toISOString() });
      showSuccess('Đã xóa liên hệ', 'Có thể khôi phục từ Thùng rác.');
      loadData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  // Add Parent Interaction Handler
  const handleSaveInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !currentClass || !interactionTopic.trim() || !interactionContent.trim()) return;
    try {
      await studentProfileService.addParentInteraction({
        classId: currentClass.id,
        studentId: student.id,
        interactionDate: getTodayDateString(),
        method: interactionMethod,
        topic: interactionTopic,
        content: interactionContent,
        result: interactionResult,
        followUpDate,
        status: followUpDate ? 'Pending' : 'Resolved',
      });
      showSuccess('Đã lưu nhật ký liên hệ', 'Ghi nhận trao đổi phụ huynh thành công.');
      setShowInteractionModal(false);
      setInteractionTopic('');
      setInteractionContent('');
      loadData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  if (loading || !student) {
    return <LoadingSkeleton type="card" count={3} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Button
        size="sm"
        variant="outline"
        leftIcon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate('/students')}
      >
        Quay lại danh sách học sinh
      </Button>

      {/* Header Profile Card */}
      <div
        style={{
          background: presentation
            ? `linear-gradient(135deg, ${presentation.cardTheme.surfaceStart} 0%, ${presentation.cardTheme.surfaceEnd} 100%)`
            : undefined,
          borderColor: presentation?.cardTheme.border,
          boxShadow: presentation ? `0 4px 16px ${presentation.cardTheme.shadow}` : undefined,
        }}
        className="bg-app-surface border-app rounded-xl p-6 border-2"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              style={{ borderColor: presentation?.cardTheme.avatarRing }}
              className="w-20 h-20 rounded-full border-2 bg-white p-1 shadow-md overflow-hidden flex items-center justify-center shrink-0"
            >
              <img
                src={presentation?.avatarAsset.assetUrl}
                alt={presentation?.avatarAsset.altText || student.fullName}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  style={{ color: presentation?.cardTheme.textPrimary }}
                  className="text-xl font-black text-app-main"
                >
                  {student.fullName}
                </h2>
                <Badge variant="primary">{student.gender}</Badge>
                {currentClass && <Badge variant="neutral">Lớp {currentClass.name}</Badge>}
                {presentation && (
                  <span
                    style={{
                      backgroundColor: presentation.cardTheme.badgeBackground,
                      color: presentation.cardTheme.badgeText,
                      borderColor: presentation.cardTheme.badgeBorder,
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border uppercase shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {presentation.levelShortLabel} • {totalPoints}đ
                  </span>
                )}
              </div>
              <p
                style={{ color: presentation?.cardTheme.textSecondary }}
                className="text-xs text-app-muted mt-1 font-mono"
              >
                Mã HS: {student.studentCode} • Ngày sinh: {formatDateVietnamese(student.dateOfBirth)}
              </p>
              {primaryContact && (
                <p className="text-xs text-app-main mt-1 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-app-primary" /> PH: {primaryContact.fullName} ({primaryContact.relation}) - <a href={`tel:${primaryContact.phone}`} className="text-app-primary underline">{primaryContact.phone}</a>
                </p>
              )}
            </div>
          </div>

          {presentation && (
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: presentation.cardTheme.badgeBackground,
                  borderColor: presentation.cardTheme.badgeBorder,
                }}
                className="p-3.5 rounded-2xl border shadow-xs flex items-center gap-3"
              >
                <div
                  style={{ borderColor: presentation.cardTheme.avatarRing }}
                  className="w-12 h-12 rounded-xl border-2 bg-white p-1 overflow-hidden flex items-center justify-center shrink-0"
                >
                  <img
                    src={presentation.avatarAsset.assetUrl}
                    alt={presentation.avatarAsset.altText}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Cấp Độ Avatar Toàn Trường
                  </p>
                  <p
                    style={{ color: presentation.cardTheme.textPrimary }}
                    className="text-sm font-extrabold text-app-main"
                  >
                    {presentation.levelName} · <span className="font-mono">Cấp {presentation.level}/5</span>
                  </p>
                  <p
                    style={{ color: presentation.cardTheme.textSecondary }}
                    className="text-[11px] text-app-muted font-medium mt-0.5"
                  >
                    {totalPoints} điểm thi đua
                    {presentation.pointsToNextLevel !== undefined && ` · Còn ${presentation.pointsToNextLevel}đ lên Cấp ${presentation.level + 1}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-app overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'overview' ? 'border-app-primary text-app-primary' : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <User className="w-4 h-4" /> Tổng Quan & KPI
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'notes' ? 'border-app-primary text-app-primary' : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Clock className="w-4 h-4" /> Timeline Ghi Chú ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('parents')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'parents' ? 'border-app-primary text-app-primary' : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Phone className="w-4 h-4" /> Sổ Liên Lạc Phụ Huynh ({parentContacts.length})
        </button>
        <button
          onClick={() => setActiveTab('honors')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'honors' ? 'border-app-primary text-app-primary' : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <History className="w-4 h-4" /> Danh Hiệu Đã Đạt ({studentHonors.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center bg-blue-50/60 border-blue-200">
              <p className="text-xs font-medium text-blue-800">Tỷ lệ Chuyên cần</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{attendanceRate}%</p>
            </Card>
            <Card className="p-4 text-center bg-emerald-50/60 border-emerald-200">
              <p className="text-xs font-medium text-emerald-800">Điểm Thi đua Tích lũy</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{totalPoints > 0 ? `+${totalPoints}` : totalPoints} đ</p>
            </Card>
            <Card className="p-4 text-center bg-purple-50/60 border-purple-200">
              <p className="text-xs font-medium text-purple-800">Cấp Tiến Trình Avatar</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">Cấp {presentation?.level || 1}/5</p>
            </Card>
          </div>

          <Card title="Ghi chú sức khỏe & Đặc điểm cá nhân">
            <p className="text-sm text-app-main leading-relaxed">
              {student.medicalNote || 'Chưa có ghi chú đặc biệt về sức khỏe hoặc thể chất.'}
            </p>
            <div className="mt-4 pt-3 border-t border-app flex flex-wrap gap-4 text-xs text-app-muted">
              <span>Địa chỉ thường trú: <strong className="text-app-main">{student.address || 'Chưa cập nhật'}</strong></span>
              <span>Dân tộc: <strong className="text-app-main">{student.ethnicity || 'Kinh'}</strong></span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: NOTES & TIMELINE */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-app-main">Timeline Sự Kiện & Ghi Chú Cá Nhân</h3>
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowNoteModal(true)}>
              Thêm Ghi Chú Mới
            </Button>
          </div>

          {timelineEvents.length === 0 ? (
            <Card className="p-8 text-center text-app-muted">
              Chưa có sự kiện hoặc ghi chú nào được ghi nhận cho học sinh này.
            </Card>
          ) : (
            <div className="relative border-l-2 border-app-primary/30 ml-4 space-y-6 py-2">
              {timelineEvents.map((ev) => (
                <div key={ev.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-app-primary border-4 border-app-surface" />
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-app-primary uppercase tracking-wider">{ev.title}</span>
                      <span className="text-xs text-app-muted">{formatDateVietnamese(ev.date)}</span>
                    </div>
                    <p className="text-sm text-app-main leading-relaxed">{ev.description}</p>
                    {ev.type === 'Note' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-app">
                        <button onClick={() => handleTogglePin(ev.id)} className="text-xs font-semibold text-app-primary hover:underline flex items-center gap-1">
                          <Pin className="w-3.5 h-3.5 text-amber-500" /> {ev.isPinned ? 'Bỏ ghim' : 'Ghim'}
                        </button>
                        <button onClick={() => handleDeleteNote(ev.id)} className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PARENT CONTACTS */}
      {activeTab === 'parents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-app-main">Danh Sách Liên Hệ Phụ Huynh</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" leftIcon={<MessageSquare className="w-4 h-4" />} onClick={() => setShowInteractionModal(true)}>
                Ghi Nhật Ký Trao Đổi
              </Button>
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowParentModal(true)}>
                Thêm Phụ Huynh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parentContacts.map((c) => (
              <Card key={c.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-app-main">{c.fullName}</h4>
                    <Badge variant={c.isPrimary ? 'primary' : 'neutral'}>{c.relation}</Badge>
                  </div>
                  <button onClick={() => handleDeleteParentContact(c.id)} className="text-app-muted hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm space-y-1 text-app-muted">
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-app-primary" /> SĐT: <a href={`tel:${c.phone}`} className="text-app-primary font-bold underline">{c.phone}</a>
                  </p>
                  {c.zalo && <p>Zalo: {c.zalo}</p>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HONORS */}
      {activeTab === 'honors' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-app-main">Lịch Sử Vinh Danh Bảng Vàng</h3>
          {studentHonors.length === 0 ? (
            <Card className="p-8 text-center text-app-muted">
              Học sinh chưa có danh hiệu bảng vàng nào được lưu trong hệ thống.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentHonors.map(({ recipient, board }) => (
                <Card key={recipient.id} className="p-4 space-y-2 border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-amber-700 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-600" />
                      {recipient.titleNameAtAward}
                    </h4>
                    <Badge variant="primary">{board.title}</Badge>
                  </div>
                  <p className="text-xs text-app-muted">Kỳ: {board.periodType}</p>
                  {recipient.reason && (
                    <p className="text-sm text-app-main italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      "{recipient.reason}"
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Add Note */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Thêm Ghi Chú Học Sinh">
        <form onSubmit={handleSaveNote} className="space-y-4 py-2">
          <Select
            label="Danh mục ghi chú"
            value={noteCategory}
            onChange={(e) => setNoteCategory(e.target.value as StudentNoteCategory)}
            options={[
              { value: 'HocTap', label: 'Học tập & Tiến bộ' },
              { value: 'KyLuat', label: 'Nề nếp & Kỷ luật' },
              { value: 'TamLy', label: 'Tâm lý & Tình cảm' },
              { value: 'SucKhoe', label: 'Sức khỏe & Thể chất' },
              { value: 'GiaDinh', label: 'Hoàn cảnh gia đình' },
              { value: 'Khac', label: 'Khác' },
            ]}
          />
          <div>
            <label className="block text-xs font-bold text-app-main mb-1">Nội dung ghi chú *</label>
            <textarea
              required
              rows={4}
              placeholder="Nhập nội dung chi tiết..."
              className="w-full p-2.5 rounded-lg border border-app bg-app-surface text-app-main text-sm focus:outline-none focus:ring-2 focus:ring-app-primary"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinNote"
              checked={notePinned}
              onChange={(e) => setNotePinned(e.target.checked)}
              className="w-4 h-4 rounded text-app-primary"
            />
            <label htmlFor="pinNote" className="text-xs font-bold text-app-main cursor-pointer flex items-center gap-1">
              <Pin className="w-3.5 h-3.5 text-amber-500" /> Ghim ghi chú quan trọng lên đầu
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowNoteModal(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Lưu Ghi Chú
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Add Parent Contact */}
      <Modal isOpen={showParentModal} onClose={() => setShowParentModal(false)} title="Thêm Liên Hệ Phụ Huynh">
        <form onSubmit={handleSaveParentContact} className="space-y-4 py-2">
          <Input
            label="Họ và tên Phụ huynh *"
            required
            placeholder="Ví dụ: Nguyễn Văn Ba"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />
          <Select
            label="Quan hệ với học sinh"
            value={parentRelation}
            onChange={(e) => setParentRelation(e.target.value)}
            options={[
              { value: 'Cha', label: 'Cha (Bố)' },
              { value: 'Mẹ', label: 'Mẹ' },
              { value: 'Ông', label: 'Ông' },
              { value: 'Bà', label: 'Bà' },
              { value: 'Người giám hộ', label: 'Người giám hộ hợp pháp' },
            ]}
          />
          <Input
            label="Số điện thoại di động *"
            required
            placeholder="Ví dụ: 0987654321"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
          />
          <Input
            label="Số Zalo (Nếu có)"
            placeholder="Ví dụ: 0987654321"
            value={parentZalo}
            onChange={(e) => setParentZalo(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimaryContact"
              checked={parentIsPrimary}
              onChange={(e) => setParentIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded text-app-primary"
            />
            <label htmlFor="isPrimaryContact" className="text-xs font-bold text-app-main cursor-pointer">
              Đặt làm người liên hệ chính khi có việc khẩn cấp
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowParentModal(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Lưu Liên Hệ
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Record Parent Interaction */}
      <Modal isOpen={showInteractionModal} onClose={() => setShowInteractionModal(false)} title="Ghi Nhật Ký Trao Đổi Phụ Huynh">
        <form onSubmit={handleSaveInteraction} className="space-y-4 py-2">
          <Select
            label="Hình thức trao đổi"
            value={interactionMethod}
            onChange={(e) => setInteractionMethod(e.target.value as InteractionMethod)}
            options={[
              { value: 'GoiDien', label: 'Gọi điện thoại' },
              { value: 'Zalo', label: 'Nhắn tin Zalo / Tin nhắn' },
              { value: 'TrucTiep', label: 'Gặp trực tiếp tại trường' },
              { value: 'HopPhuHuynh', label: 'Họp phụ huynh định kỳ' },
              { value: 'Khac', label: 'Khác' },
            ]}
          />
          <Input
            label="Chủ đề trao đổi *"
            required
            placeholder="Ví dụ: Nhắc nhở chuyên cần / Trao đổi kết quả học tập"
            value={interactionTopic}
            onChange={(e) => setInteractionTopic(e.target.value)}
          />
          <div>
            <label className="block text-xs font-bold text-app-main mb-1">Nội dung chi tiết *</label>
            <textarea
              required
              rows={3}
              placeholder="Nội dung đã trao đổi với phụ huynh..."
              className="w-full p-2.5 rounded-lg border border-app bg-app-surface text-app-main text-sm focus:outline-none focus:ring-2 focus:ring-app-primary"
              value={interactionContent}
              onChange={(e) => setInteractionContent(e.target.value)}
            />
          </div>
          <Input
            label="Kết quả thống nhất (Tùy chọn)"
            placeholder="Ví dụ: Phụ huynh hứa nhắc nhở con đi học đúng giờ"
            value={interactionResult}
            onChange={(e) => setInteractionResult(e.target.value)}
          />
          <Input
            label="Hẹn ngày theo dõi lại (Tùy chọn)"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowInteractionModal(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Ghi Nhật Ký
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
