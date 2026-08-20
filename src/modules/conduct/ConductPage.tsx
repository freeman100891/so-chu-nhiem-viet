import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { Modal } from '../../shared/components/Modal';
import { Badge } from '../../shared/components/Badge';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/hooks/useToast';
import { conductService } from '../../core/services/conduct.service';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { classRepository } from '../../core/repositories/class.repository';
import {
  avatarThemeRegistry,
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
} from '../../core/services/avatar-theme-registry';
import type { GlobalAvatarSystemSettings } from '../../core/types/avatar-theme.types';
import { db } from '../../core/database/db';
import { getTodayDateString, formatDateVietnamese } from '../../shared/utilities/date';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';
import type { ClassRoom, Student, PointCategory, PointEntry, PointCategoryType } from '../../core/database/types';
import {
  Award,
  Plus,
  Search,
  AlertTriangle,
  History,
  Shield,
  Edit,
  Trash2,
  Zap,
  Sparkles,
} from 'lucide-react';

export interface StudentScoreItem {
  student: Student;
  totalPoints: number;
  rollNumber?: number;
}

export interface DetailedEntryItem extends PointEntry {
  studentName: string;
  categoryName: string;
}

export interface ConductPageProps {
  initialTab?: 'score' | 'leaderboard' | 'history' | 'categories';
}

export const ConductPage: React.FC<ConductPageProps> = ({ initialTab = 'score' }) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'score' | 'leaderboard' | 'history' | 'categories'>(initialTab);

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [studentScores, setStudentScores] = useState<StudentScoreItem[]>([]);
  const [globalAvatarSettings, setGlobalAvatarSettings] = useState<GlobalAvatarSystemSettings>(
    DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS
  );
  const [loading, setLoading] = useState(true);

  // Score Entry Form State
  const [selectedCategory, setSelectedCategory] = useState<PointCategory | null>(null);
  const [points, setPoints] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [occurredAt, setOccurredAt] = useState<string>(getTodayDateString());
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [historyEntries, setHistoryEntries] = useState<DetailedEntryItem[]>([]);

  // Edit Entry State
  const [editingEntry, setEditingEntry] = useState<DetailedEntryItem | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Category Edit State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<PointCategoryType>('Merit');
  const [catDefaultPoints, setCatDefaultPoints] = useState(10);
  const [catDesc, setCatDesc] = useState('');

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = React.useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const settings = await settingsRepository.getSettings();
      if (!isMountedRef.current) return;
      if (settings?.avatarSystemSettings) {
        setGlobalAvatarSettings(settings.avatarSystemSettings);
      }
      let yearId = settings.activeAcademicYearId;
      if (!yearId) {
        const year = await academicYearRepository.getCurrentYear();
        yearId = year?.id;
      }

      if (yearId) {
        const classes = await classRepository.findByAcademicYear(yearId);
        if (!isMountedRef.current) return;
        setClassList(classes);

        let activeClsId = classes[0]?.id || '';
        if (settings.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
          activeClsId = settings.activeClassId;
        }
        setSelectedClassId(activeClsId);
      }

      // Seed categories
      const cats = await conductService.seedDefaultCategories();
      if (!isMountedRef.current) return;
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0]!);
        setPoints(cats[0]!.defaultPoints);
      }
    } catch (err) {
      console.error('Error loading conduct metadata:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedCategory]);

  const loadStudentScoresAndHistory = React.useCallback(async () => {
    if (!selectedClassId || !isMountedRef.current) return;
    setLoading(true);
    try {
      // Fetch enrollments for class
      const enrollments = await db.classEnrollments
        .where('classId')
        .equals(selectedClassId)
        .filter((e) => e.status === 'Active' && !e.deletedAt)
        .toArray();

      const scores: StudentScoreItem[] = [];
      for (const enr of enrollments) {
        const st = await db.students.get(enr.studentId);
        if (st && !st.deletedAt) {
          const total = await conductService.calculateStudentTotalPoints(st.id, selectedClassId);
          scores.push({ student: st, totalPoints: total, rollNumber: enr.rollNumber });
        }
      }

      if (!isMountedRef.current) return;
      scores.sort((a, b) => b.totalPoints - a.totalPoints);
      setStudentScores(scores);

      // Load History Entries
      const entries = await db.pointEntries
        .where('classId')
        .equals(selectedClassId)
        .filter((e) => !e.deletedAt)
        .reverse()
        .sortBy('createdAt');

      const historyItems: DetailedEntryItem[] = [];
      for (const entry of entries) {
        const st = await db.students.get(entry.studentId);
        const cat = await db.pointCategories.get(entry.categoryId);
        historyItems.push({
          ...entry,
          studentName: st ? st.fullName : 'Học sinh',
          categoryName: cat ? cat.name : 'Danh mục',
        });
      }
      if (!isMountedRef.current) return;
      setHistoryEntries(historyItems);
    } catch (err) {
      console.error('Error loading scores:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedClassId) {
      loadStudentScoresAndHistory();
    }
  }, [selectedClassId, loadStudentScoresAndHistory]);

  useEffect(() => {
    const handleRefresh = () => {
      loadData();
      if (selectedClassId) {
        loadStudentScoresAndHistory();
      }
    };
    window.addEventListener('point_entries_changed', handleRefresh);
    window.addEventListener('gvcn_settings_changed', handleRefresh);
    window.addEventListener('gvcn_data_changed', handleRefresh);
    return () => {
      window.removeEventListener('point_entries_changed', handleRefresh);
      window.removeEventListener('gvcn_settings_changed', handleRefresh);
      window.removeEventListener('gvcn_data_changed', handleRefresh);
    };
  }, [loadData, selectedClassId, loadStudentScoresAndHistory]);

  // Search Student for Scoring
  const filteredStudents = useMemo(() => {
    const q = normalizeVietnameseText(searchStudentQuery);
    return studentScores.filter(
      (s) =>
        s.student.normalizedName.includes(q) ||
        s.student.studentCode.toLowerCase().includes(searchStudentQuery.toLowerCase())
    );
  }, [studentScores, searchStudentQuery]);

  const handleCategorySelect = (cat: PointCategory) => {
    setSelectedCategory(cat);
    setPoints(cat.defaultPoints);
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.student.id));
    }
  };

  // Record Points Submit
  const handleOpenPreview = () => {
    if (selectedStudentIds.length === 0) {
      showError('Chưa chọn học sinh', 'Vui lòng chọn ít nhất 1 học sinh để ghi điểm.');
      return;
    }
    if (!selectedCategory) {
      showError('Chưa chọn danh mục', 'Vui lòng chọn danh mục điểm.');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleExecuteRecord = async () => {
    if (!selectedClassId || !selectedCategory) return;
    setSubmitting(true);
    try {
      await conductService.recordBulkPoints({
        classId: selectedClassId,
        studentIds: selectedStudentIds,
        categoryId: selectedCategory.id,
        points,
        reason,
        occurredAt,
      });
      showSuccess(
        'Ghi điểm thành công',
        `Đã ghi ${points > 0 ? '+' : ''}${points} điểm cho ${selectedStudentIds.length} học sinh.`
      );
      setShowPreviewModal(false);
      setSelectedStudentIds([]);
      setReason('');
      loadStudentScoresAndHistory();
    } catch (err: unknown) {
      showError('Lỗi ghi điểm', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit History Entry
  const handleOpenEditEntry = (entry: DetailedEntryItem) => {
    setEditingEntry(entry);
    setEditPoints(entry.points);
    setEditReason(entry.reason || '');
    setShowEditModal(true);
  };

  const handleSaveEditedEntry = async () => {
    if (!editingEntry) return;
    try {
      await conductService.updatePointEntry(editingEntry.id, editPoints, editReason);
      showSuccess('Cập nhật thành công', 'Đã lưu thay đổi và lưu vết Audit Log.');
      setShowEditModal(false);
      setEditingEntry(null);
      loadStudentScoresAndHistory();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await conductService.deletePointEntry(id);
      showSuccess('Đã xóa bản ghi', 'Đã chuyển bản ghi vào lịch sử xóa.');
      loadStudentScoresAndHistory();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const nowISO = new Date().toISOString();
      await db.pointCategories.add({
        id: crypto.randomUUID(),
        name: catName,
        type: catType,
        defaultPoints: catDefaultPoints,
        description: catDesc,
        createdAt: nowISO,
        updatedAt: nowISO,
        deletedAt: null,
      });
      showSuccess('Tạo danh mục thành công', `Đã thêm danh mục "${catName}"`);
      setShowCategoryModal(false);
      setCatName('');
      loadData();
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Thi đua & Nề nếp Khen thưởng"
        description="Ghi nhận điểm thi đua tích cực, tuyên dương học sinh tiến bộ, tính tổng điểm động minh bạch"
        badgeText={`${studentScores.length} học sinh`}
      />

      {/* Class Selector Header */}
      <Card>
        <div className="max-w-xs">
          <Select
            label="Chọn Lớp học"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
          />
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-app overflow-x-auto">
        <button
          onClick={() => setActiveTab('score')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'score'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Zap className="w-4 h-4" /> Ghi điểm Thi đua
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'leaderboard'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Award className="w-4 h-4" /> Bảng Vàng Khen Thưởng (5 Cấp)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'history'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <History className="w-4 h-4" /> Lịch sử & Nhật ký
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'categories'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Shield className="w-4 h-4" /> Danh mục Điểm
        </button>
      </div>

      {/* TAB 1: RECORD SCORE */}
      {activeTab === 'score' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Category & Point Inputs */}
            <Card title="1. Chọn Danh mục Điểm" className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between min-h-[48px] ${
                      selectedCategory?.id === cat.id
                        ? 'border-2 border-app-primary bg-app-primary-light/50 font-bold'
                        : 'border-app hover:bg-app-surface-hover'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-app-main">{cat.name}</h4>
                      <p className="text-xs text-app-muted">{cat.description || 'Danh mục thi đua'}</p>
                    </div>
                    <Badge variant={cat.type === 'Merit' ? 'success' : 'danger'}>
                      {cat.defaultPoints > 0 ? `+${cat.defaultPoints}` : cat.defaultPoints} đ
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-3 border-t border-app">
                <Input
                  label="Số điểm cộng / trừ"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
                <Input
                  label="Lý do ghi nhận điểm"
                  placeholder="Ví dụ: Đạt điểm 10 môn Toán / Hăng hái phát biểu"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Input
                  label="Ngày ghi nhận"
                  type="date"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                />
              </div>
            </Card>

            {/* Right: Select Students */}
            <Card
              title={`2. Chọn Học sinh (${selectedStudentIds.length} học sinh đã chọn)`}
              className="lg:col-span-2 space-y-4"
              action={
                <Button size="sm" variant="outline" onClick={handleSelectAllStudents}>
                  {selectedStudentIds.length === filteredStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              }
            >
              <Input
                placeholder="Tìm kiếm học sinh theo tên, STT..."
                leftIcon={<Search className="w-4 h-4 text-app-muted" />}
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
              />

              {loading ? (
                <LoadingSkeleton type="table" count={4} />
              ) : (
                <div className="max-h-80 overflow-y-auto border border-app rounded-xl divide-y divide-app bg-app-surface p-2">
                  {filteredStudents.map(({ student, totalPoints, rollNumber }) => (
                    <label
                      key={student.id}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-app-surface-hover/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleSelectStudent(student.id)}
                          className="w-4 h-4 rounded text-app-primary focus:ring-amber-500"
                        />
                        <span className="w-7 h-7 rounded-full bg-app-primary-light text-app-primary font-bold text-xs flex items-center justify-center">
                          {rollNumber || '#'}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-app-main">{student.fullName}</p>
                          <p className="text-xs text-app-muted">{student.studentCode}</p>
                        </div>
                      </div>
                      <Badge variant="primary">{totalPoints} điểm</Badge>
                    </label>
                  ))}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-2"
                disabled={selectedStudentIds.length === 0}
                onClick={handleOpenPreview}
              >
                Xem trước & Ghi điểm ({selectedStudentIds.length} HS)
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD & 5-LEVEL AVATAR SYSTEM */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <Card title="Hệ Thống 5 Cấp Độ Avatar & Huy Hiệu Toàn Trường">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {globalAvatarSettings.levels.map((lvl) => (
                <div
                  key={lvl.level}
                  style={{ borderTopColor: lvl.cardBaseColor, borderTopWidth: '4px' }}
                  className="p-3.5 rounded-2xl border border-app bg-app-surface shadow-2xs space-y-2 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="font-black text-sm text-app-main">{lvl.name}</h4>
                  </div>
                  <p className="text-[11px] font-semibold text-app-muted">
                    {lvl.shortLabel} • Từ {lvl.minPoints}đ
                  </p>
                  <p className="text-[10px] text-app-muted line-clamp-2 leading-relaxed">
                    {lvl.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Bảng Vàng Tuyên Dương Học Sinh (Xếp Theo Điểm Thi Đua)">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentScores.map(({ student, totalPoints, rollNumber }) => {
                const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
                  student,
                  score: totalPoints,
                  globalSettings: globalAvatarSettings,
                });
                const theme = presentation.cardTheme;

                return (
                  <div
                    key={student.id}
                    style={{
                      background: `linear-gradient(135deg, ${theme.surfaceStart} 0%, ${theme.surfaceEnd} 100%)`,
                      borderColor: theme.border,
                      boxShadow: `0 2px 10px ${theme.shadow}`,
                    }}
                    className="p-4 rounded-2xl border-2 space-y-3 shadow-xs transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-white/80 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {rollNumber || '#'}
                        </span>
                        <div
                          style={{ borderColor: theme.avatarRing }}
                          className="w-10 h-10 rounded-full border-2 bg-white p-0.5 shadow-2xs overflow-hidden flex items-center justify-center shrink-0"
                        >
                          <img
                            src={presentation.avatarAsset.assetUrl}
                            alt={presentation.avatarAsset.altText}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 style={{ color: theme.textPrimary }} className="font-black text-sm truncate">
                            {student.fullName}
                          </h4>
                          <p style={{ color: theme.textSecondary }} className="text-[11px] font-mono">
                            {student.studentCode}
                          </p>
                        </div>
                      </div>

                      <span
                        style={{
                          backgroundColor: theme.badgeBackground,
                          color: theme.badgeText,
                          borderColor: theme.badgeBorder,
                        }}
                        className="px-2 py-0.5 rounded-full text-xs font-black border uppercase shrink-0 shadow-2xs"
                      >
                        {totalPoints} đ
                      </span>
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.badgeBackground,
                        color: theme.badgeText,
                        borderColor: theme.badgeBorder,
                      }}
                      className="p-2 rounded-xl border text-xs font-bold flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {presentation.levelName} ({presentation.levelShortLabel})
                      </span>
                      {presentation.pointsToNextLevel !== undefined && (
                        <span className="text-[10px] opacity-80 shrink-0">
                          Còn {presentation.pointsToNextLevel}đ lên Cấp {presentation.level + 1}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: HISTORY & AUDIT LOG */}
      {activeTab === 'history' && (
        <Card title="Lịch sử Thi đua & Nhật ký Điều chỉnh (Audit Log)">
          <div className="space-y-3">
            {historyEntries.length === 0 ? (
              <div className="py-8 text-center text-app-muted">Chưa có lịch sử ghi điểm thi đua nào.</div>
            ) : (
              <div className="divide-y divide-app">
                {historyEntries.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-app-main">{item.studentName}</h4>
                        <Badge variant={item.points > 0 ? 'success' : 'danger'}>
                          {item.points > 0 ? `+${item.points}` : item.points} đ
                        </Badge>
                        <span className="text-xs text-app-muted">({item.categoryName})</span>
                      </div>
                      <p className="text-xs text-app-muted mt-0.5">
                        Lý do: {item.reason || 'Khen thưởng/Nề nếp'} • Ngày: {formatDateVietnamese(item.occurredAt)} • Người ghi: {item.recordedBy || 'GVCN'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditEntry(item)}
                        className="p-1.5 text-app-muted hover:text-app-primary rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Chỉnh sửa (Lưu vết Audit Log)"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(item.id)}
                        className="p-1.5 text-app-muted hover:text-red-600 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <Card
          title="Quản lý Danh mục Điểm Thi Đua"
          action={
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCategoryModal(true)}>
              Tạo Danh Mục Mới
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-xl border border-app bg-app-surface space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-app-main">{cat.name}</h4>
                  <Badge variant={cat.type === 'Merit' ? 'success' : 'danger'}>
                    {cat.defaultPoints > 0 ? `+${cat.defaultPoints}` : cat.defaultPoints} điểm
                  </Badge>
                </div>
                <p className="text-xs text-app-muted">{cat.description || 'Chưa có mô tả chi tiết.'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL 1: PREVIEW BEFORE RECORD */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Xác nhận Ghi điểm Thi đua">
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-app-surface-hover border border-app space-y-2 text-xs">
            <p><strong>Danh mục:</strong> {selectedCategory?.name}</p>
            <p><strong>Điểm số:</strong> {points > 0 ? `+${points}` : points} điểm / học sinh</p>
            <p><strong>Lý do:</strong> {reason || 'Khen thưởng / Nề nếp'}</p>
            <p><strong>Ngày thực hiện:</strong> {formatDateVietnamese(occurredAt)}</p>
            <p><strong>Số lượng học sinh nhận điểm:</strong> {selectedStudentIds.length} học sinh</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPreviewModal(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" className="flex-1" isLoading={submitting} onClick={handleExecuteRecord}>
              Xác nhận Ghi điểm
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: EDIT ENTRY WITH AUDIT LOG */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa Bản ghi (Lưu vết Audit Log)">
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Thao tác chỉnh sửa sẽ được lưu lại giá trị cũ (oldValue) và giá trị mới (newValue) trong nhật ký hệ thống.</span>
          </div>

          <Input
            label="Số điểm mới"
            type="number"
            value={editPoints}
            onChange={(e) => setEditPoints(Number(e.target.value))}
          />
          <Input
            label="Lý do điều chỉnh"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveEditedEntry}>
              Lưu & Ghi Nhật ký
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: ADD CATEGORY */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Tạo Danh Mục Điểm Mới">
        <form onSubmit={handleSaveCategory} className="space-y-4 py-2">
          <Input
            label="Tên Danh mục"
            required
            placeholder="Ví dụ: Tham gia phong trào xuất sắc"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <Select
            label="Loại Điểm"
            value={catType}
            onChange={(e) => setCatType(e.target.value as PointCategoryType)}
            options={[
              { value: 'Merit', label: 'Điểm Cộng (+)' },
              { value: 'Demerit', label: 'Điểm Trừ (-)' },
            ]}
          />
          <Input
            label="Số điểm mặc định"
            type="number"
            value={catDefaultPoints}
            onChange={(e) => setCatDefaultPoints(Number(e.target.value))}
          />
          <Input
            label="Mô tả danh mục"
            placeholder="Ví dụ: Áp dụng cho các hoạt động ngoại khóa"
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCategoryModal(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Tạo Danh Mục
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
