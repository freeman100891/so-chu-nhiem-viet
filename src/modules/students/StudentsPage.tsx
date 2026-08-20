import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { Modal } from '../../shared/components/Modal';
import { ConfirmModal } from '../../shared/components/ConfirmModal';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { PageHeader } from '../../shared/components/PageHeader';
import { useToast } from '../../shared/hooks/useToast';
import { normalizeVietnameseText } from '../../shared/utilities/normalize';
import { validateImageFile, resizeImageFile } from '../../shared/utilities/image';
import { formatDateVietnamese } from '../../shared/utilities/date';
import { studentService } from '../../core/services/student.service';
import { classRepository } from '../../core/repositories/class.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import type { Student, ClassRoom, Gender, ClassEnrollment } from '../../core/database/types';
import type {
  AvatarProgressLevel,
  StudentAvatarPresentation,
  GlobalAvatarSystemSettings,
} from '../../core/types/avatar-theme.types';
import {
  avatarThemeRegistry,
  DEFAULT_AVATAR_THEME_ID,
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
} from '../../core/services/avatar-theme-registry';
import { avatarAssetService } from '../../core/services/avatar-asset.service';
import { StudentAvatar } from '../../shared/components/StudentAvatar';
import { db } from '../../core/database/db';
import { excelExportService } from '../../core/excel/excel-export.service';
import { ExcelImportModal } from '../excel/ExcelImportModal';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  ArrowRightLeft,
  Calendar,
  Phone,
  Eye,
  Sparkles,
} from 'lucide-react';

export interface StudentListItemPresentation extends Student {
  currentClassId?: string;
  currentClassName: string;
  rollNumber?: number;
  enrollmentStatus?: string;
  totalPoints: number;
  avatarLevel: AvatarProgressLevel;
  presentation: StudentAvatarPresentation;
}

export const StudentsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<StudentListItemPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalAvatarSettings, setGlobalAvatarSettings] = useState<GlobalAvatarSystemSettings>(
    DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS
  );

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rollNumber' | 'dateOfBirth' | 'points' | 'level'>('rollNumber');

  // Multi-select for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentListItemPresentation | null>(null);
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('Nam');
  const [dateOfBirth, setDateOfBirth] = useState('2008-01-01');
  const [ethnicity, setEthnicity] = useState('Kinh');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [medicalNote, setMedicalNote] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [rollNumber, setRollNumber] = useState<number | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Class Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState<StudentListItemPresentation | null>(null);
  const [newClassId, setNewClassId] = useState('');
  const [newRollNumber, setNewRollNumber] = useState<number | undefined>(undefined);
  const [transferring, setTransferring] = useState(false);

  // Delete Confirm State
  const [deletingStudent, setDeletingStudent] = useState<StudentListItemPresentation | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Bulk Delete State
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Excel Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // =========================================================================
  // LOAD DATA & SINGLE BULK PRESENTATION SELECTOR (0 N+1 Query)
  // =========================================================================
  const loadData = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const settings = await settingsRepository.getSettings();
        let yearId = settings?.activeAcademicYearId;
        if (!yearId) {
          const year = await academicYearRepository.getCurrentYear();
          yearId = year?.id;
        }

        let classes: ClassRoom[] = [];
        if (yearId) {
          classes = await classRepository.findByAcademicYear(yearId);
          setClassList(classes);

          let defaultClsId = classes[0]?.id || '';
          if (settings?.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
            defaultClsId = settings.activeClassId;
          }
          setTargetClassId((prev) => prev || defaultClsId);
        }

        const activeSysSettings = settings?.avatarSystemSettings || DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;
        setGlobalAvatarSettings(activeSysSettings);

        // Preload uploaded assets URLs
        const uploadedIds = activeSysSettings.levels
          .filter((l) => l.image.kind === 'UPLOADED')
          .map((l) => (l.image as { kind: 'UPLOADED'; assetId: string }).assetId);
        let urlMap = new Map<string, string>();
        if (uploadedIds.length > 0) {
          urlMap = await avatarAssetService.preloadAssetUrls(uploadedIds);
        }

        // 1. Batch load points map: studentId -> totalPoints
        const allPointEntries = await db.pointEntries.toArray();
        const pointEntries = allPointEntries.filter((pe) => !pe.deletedAt);
        const pointsMap = new Map<string, number>();
        for (const pe of pointEntries) {
          pointsMap.set(pe.studentId, (pointsMap.get(pe.studentId) || 0) + pe.points);
        }

        // 2. Batch load enrollments and class map
        const allEnrollments = await db.classEnrollments.toArray();
        const enrollments = allEnrollments.filter((e) => e.status === 'Active' && !e.deletedAt);
        const enrollmentMap = new Map<string, ClassEnrollment>();
        for (const en of enrollments) {
          enrollmentMap.set(en.studentId, en);
        }

        const classMap = new Map<string, string>();
        for (const c of classes) {
          classMap.set(c.id, c.name);
        }

        // 3. Batch load active students
        const allStudents = await db.students.toArray();
        const activeStudents = allStudents.filter((s) => !s.deletedAt);

        // 4. Resolve presentation view model atomically for every student
        const items: StudentListItemPresentation[] = activeStudents.map((st) => {
          const activeEnrollment = enrollmentMap.get(st.id);
          const clsId = activeEnrollment?.classId;
          const clsName = clsId && classMap.has(clsId) ? `Lớp ${classMap.get(clsId)}` : 'Chưa phân lớp';
          const pts = pointsMap.get(st.id) || 0;

          // Single Resolver Call: Ensures avatar, label, and cardTheme are 100% matched
          const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
            student: st,
            score: pts,
            globalSettings: activeSysSettings,
            uploadedAssetUrls: urlMap,
          });

          return {
            ...st,
            currentClassId: clsId,
            currentClassName: clsName,
            rollNumber: activeEnrollment?.rollNumber,
            enrollmentStatus: activeEnrollment?.status || 'Unenrolled',
            totalPoints: pts,
            avatarLevel: presentation.level,
            presentation,
          };
        });

        setStudents(items);
      } catch (err) {
        console.error('Error loading students:', err);
        showError('Lỗi tải dữ liệu', 'Không thể kết nối cơ sở dữ liệu IndexedDB.');
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  // Initial load on mount & listen to database change events
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = () => {
      loadData(false);
    };
    window.addEventListener('point_entries_changed', handleRefresh);
    window.addEventListener('gvcn_data_changed', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    return () => {
      window.removeEventListener('point_entries_changed', handleRefresh);
      window.removeEventListener('gvcn_data_changed', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [loadData]);

  // Sync with query parameter ?classId=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qClassId = params.get('classId');
    if (qClassId) {
      setSelectedClassFilter(qClassId);
      setTargetClassId(qClassId);
    }
  }, [location.search]);

  // =========================================================================
  // FILTERING, SEARCHING & SORTING
  // =========================================================================
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // 1. Filter by Class
    if (selectedClassFilter !== 'all') {
      result = result.filter((s) => s.currentClassId === selectedClassFilter);
    }

    // 2. Filter by Gender
    if (selectedGenderFilter !== 'all') {
      result = result.filter((s) => s.gender === selectedGenderFilter);
    }

    // 3. Filter by Derived 5-Level Avatar
    if (selectedLevelFilter !== 'all') {
      const targetLvl = parseInt(selectedLevelFilter, 10);
      result = result.filter((s) => s.avatarLevel === targetLvl);
    }

    // 4. Accent-insensitive Search by Name or StudentCode
    if (searchQuery.trim()) {
      const normSearch = normalizeVietnameseText(searchQuery);
      result = result.filter(
        (s) =>
          s.normalizedName.includes(normSearch) ||
          s.studentCode.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'rollNumber') {
        const rollA = a.rollNumber ?? 999;
        const rollB = b.rollNumber ?? 999;
        if (rollA !== rollB) return rollA - rollB;
        return a.fullName.localeCompare(b.fullName, 'vi');
      }
      if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName, 'vi');
      }
      if (sortBy === 'dateOfBirth') {
        return a.dateOfBirth.localeCompare(b.dateOfBirth);
      }
      if (sortBy === 'points') {
        return b.totalPoints - a.totalPoints;
      }
      if (sortBy === 'level') {
        return b.avatarLevel - a.avatarLevel;
      }
      return 0;
    });

    return result;
  }, [students, selectedClassFilter, selectedGenderFilter, selectedLevelFilter, searchQuery, sortBy]);

  // =========================================================================
  // FORM & ACTION HANDLERS
  // =========================================================================
  const handleOpenAddModal = (defaultClassId?: string) => {
    setEditingStudent(null);
    setStudentCode('');
    setFullName('');
    setGender('Nam');
    setDateOfBirth('2008-01-01');
    setEthnicity('Kinh');
    setAddress('');
    setAvatar('');
    setMedicalNote('');
    setTargetClassId(defaultClassId || classList[0]?.id || '');
    setRollNumber(students.length + 1);
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (st: StudentListItemPresentation) => {
    setEditingStudent(st);
    setStudentCode(st.studentCode);
    setFullName(st.fullName);
    setGender(st.gender);
    setDateOfBirth(st.dateOfBirth);
    setEthnicity(st.ethnicity || 'Kinh');
    setAddress(st.address || '');
    setAvatar(st.avatar || '');
    setMedicalNote(st.medicalNote || '');
    setTargetClassId(st.currentClassId || classList[0]?.id || '');
    setRollNumber(st.rollNumber);
    setErrors({});
    setShowModal(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, avatar: validation.error || 'File không hợp lệ' }));
      return;
    }

    try {
      const resized = await resizeImageFile(file, 512, 512, 0.85);
      setAvatar(resized);
      setErrors((prev) => ({ ...prev, avatar: '' }));
    } catch {
      setErrors((prev) => ({ ...prev, avatar: 'Không thể nén xử lý ảnh' }));
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!fullName.trim()) {
      setErrors((prev) => ({ ...prev, fullName: 'Họ tên không được để trống' }));
      return;
    }
    if (!targetClassId) {
      setErrors((prev) => ({ ...prev, classId: 'Vui lòng chọn lớp học' }));
      return;
    }

    setSubmitting(true);
    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, {
          studentCode,
          fullName,
          gender,
          dateOfBirth,
          ethnicity,
          address,
          avatar,
          medicalNote,
          classId: targetClassId,
          rollNumber,
        });
        showSuccess('Cập nhật thành công', `Hồ sơ học sinh ${fullName} đã được cập nhật.`);
      } else {
        await studentService.createStudent({
          studentCode,
          fullName,
          gender,
          dateOfBirth,
          ethnicity,
          address,
          avatar,
          medicalNote,
          classId: targetClassId,
          rollNumber,
        });
        showSuccess('Thêm học sinh thành công', `Đã thêm học sinh ${fullName} vào lớp học.`);
      }
      setShowModal(false);
      await loadData(false);
    } catch (err: unknown) {
      showError('Lỗi lưu học sinh', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTransferModal = (st: StudentListItemPresentation) => {
    setTransferringStudent(st);
    setNewClassId(classList.find((c) => c.id !== st.currentClassId)?.id || '');
    setNewRollNumber(undefined);
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = async () => {
    if (!transferringStudent || !newClassId || !transferringStudent.currentClassId) return;

    setTransferring(true);
    try {
      await studentService.transferStudent(
        transferringStudent.id,
        transferringStudent.currentClassId,
        newClassId,
        newRollNumber
      );
      showSuccess(
        'Chuyển lớp thành công',
        `Đã chuyển học sinh ${transferringStudent.fullName} sang lớp mới.`
      );
      setShowTransferModal(false);
      await loadData(false);
    } catch (err: unknown) {
      showError('Lỗi chuyển lớp', (err as Error).message);
    } finally {
      setTransferring(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      await studentService.softDeleteStudent(deletingStudent.id);
      showSuccess('Đã chuyển vào Thùng rác', `Học sinh ${deletingStudent.fullName} đã được chuyển vào Thùng rác.`);
      setShowDeleteModal(false);
      await loadData(false);
    } catch (err: unknown) {
      showError('Lỗi xóa học sinh', (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const { successCount } = await studentService.softDeleteStudents(selectedIds);
      showSuccess(
        'Đã chuyển vào Thùng rác',
        `Đã chuyển ${successCount} học sinh được chọn vào Thùng rác an toàn.`
      );
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      await loadData(false);
    } catch (err: unknown) {
      showError('Lỗi xóa học sinh hàng loạt', (err as Error).message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const clsId = selectedClassFilter !== 'all' ? selectedClassFilter : classList[0]?.id;
      if (!clsId) {
        showError('Không thể xuất file', 'Vui lòng tạo hoặc chọn một lớp học để xuất Excel.');
        return;
      }
      const { blob, filename } = await excelExportService.exportClassToExcel(clsId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Xuất file thành công', 'File Excel danh sách học sinh đã được tải về.');
    } catch (err: unknown) {
      showError('Lỗi xuất Excel', (err as Error).message);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* PAGE HEADER */}
      <PageHeader
        title="Quản Lý Danh Sách Học Sinh"
        description={`Quản lý hồ sơ, phân lớp, avatar 5 cấp và điểm thi đua (${filteredStudents.length} học sinh)`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4 text-app-primary" />}
              onClick={() => navigate('/settings')}
              title="Đi đến cấu hình 5 cấp avatar và màu thẻ toàn trường"
            >
              Cấu hình Avatar & Cấp độ
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setShowImportModal(true)}
            >
              Nhập Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportExcel}
              isLoading={exportingExcel}
            >
              Xuất Excel
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenAddModal(selectedClassFilter !== 'all' ? selectedClassFilter : undefined)}
            >
              Thêm Học Sinh
            </Button>
          </div>
        }
      />

      {/* FILTER & SEARCH TOOLBAR */}
      <Card className="p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* 1. Search Box */}
          <div className="sm:col-span-2">
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã HS (không dấu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-app-muted" />}
            />
          </div>

          {/* 2. Class Filter */}
          <Select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tất cả các lớp' },
              ...classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
            ]}
          />

          {/* 3. Avatar Level Filter (1..5) */}
          <Select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tất cả cấp avatar (1-5)' },
              ...globalAvatarSettings.levels.map((l) => ({
                value: String(l.level),
                label: `Cấp ${l.level}: ${l.name} (≥${l.minPoints}đ)`,
              })),
            ]}
          />

          {/* 4. Sort Options */}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            options={[
              { value: 'rollNumber', label: 'Sắp xếp theo STT' },
              { value: 'name', label: 'Sắp xếp theo Họ tên' },
              { value: 'dateOfBirth', label: 'Sắp xếp theo Ngày sinh' },
              { value: 'points', label: 'Sắp xếp theo Điểm cao → thấp' },
              { value: 'level', label: 'Sắp xếp theo Cấp độ cao → thấp' },
            ]}
          />
        </div>

        {/* Optional Gender Filter Pill */}
        <div className="flex items-center gap-2 pt-2 border-t border-app text-xs text-app-muted">
          <span>Giới tính:</span>
          {(['all', 'Nam', 'Nữ', 'Khác'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenderFilter(g)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedGenderFilter === g
                  ? 'bg-app-primary text-app-primary-fg font-bold'
                  : 'bg-app-surface-hover/60 hover:bg-app-surface-hover text-app-main'
              }`}
            >
              {g === 'all' ? 'Tất cả' : g}
            </button>
          ))}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* BULK ACTION FLOATING TOOLBAR */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (
        <div
          data-testid="bulk-action-bar"
          className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white shadow-2xl border border-slate-700/60 animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-app-primary text-app-primary-fg text-xs font-black shadow-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              Đã chọn <span className="text-app-primary font-black">{selectedIds.length}</span> / {filteredStudents.length} học sinh
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedIds.length === filteredStudents.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(filteredStudents.map((s) => s.id));
                }
              }}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
            >
              {selectedIds.length === filteredStudents.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4 text-red-400" />}
              onClick={() => setShowBulkDeleteModal(true)}
              className="bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white font-bold text-xs shadow-xs"
              data-testid="bulk-delete-btn"
            >
              Xóa {selectedIds.length} học sinh
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DATA PRESENTATION: TABLE (Desktop) & CARDS (Mobile) */}
      {/* ========================================================================= */}
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : filteredStudents.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Không tìm thấy học sinh"
            description={
              searchQuery
                ? 'Không có học sinh nào phù hợp với bộ lọc và từ khóa tìm kiếm.'
                : 'Chưa có học sinh nào trong danh sách lớp học này.'
            }
            actionText="Thêm Học Sinh Đầu Tiên"
            onAction={() => handleOpenAddModal(selectedClassFilter !== 'all' ? selectedClassFilter : undefined)}
          />
        </Card>
      ) : (
        <>
          {/* ===================================================================== */}
          {/* 1. DESKTOP TABLE VIEW (>= 768px) */}
          {/* ===================================================================== */}
          <div className="hidden md:block bg-app-surface rounded-2xl shadow-2xs border border-app overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-app-surface-hover/60 text-app-muted text-xs uppercase font-bold border-b border-app">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length}
                      onChange={() => {
                        if (selectedIds.length === filteredStudents.length) setSelectedIds([]);
                        else setSelectedIds(filteredStudents.map((s) => s.id));
                      }}
                      className="w-4 h-4 rounded text-app-primary cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-12 text-center">STT</th>
                  <th className="p-3.5">Học sinh</th>
                  <th className="p-3.5">Mã HS</th>
                  <th className="p-3.5">Điểm cấp bậc</th>
                  <th className="p-3.5">Giới tính</th>
                  <th className="p-3.5">Ngày sinh</th>
                  <th className="p-3.5">Lớp hiện tại</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app font-medium">
                {filteredStudents.map((st) => {
                  const theme = st.presentation.cardTheme;
                  return (
                    <tr
                      key={st.id}
                      data-testid={`student-row-${st.id}`}
                      style={{
                        background: `linear-gradient(90deg, ${theme.surfaceStart} 0%, transparent 40%)`,
                      }}
                      className="hover:bg-app-surface-hover/60 transition-colors"
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(st.id)}
                          onChange={() => handleToggleSelect(st.id)}
                          className="w-4 h-4 rounded text-app-primary"
                        />
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-app-muted">
                        {st.rollNumber || '-'}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ borderColor: theme.avatarRing }}
                            className="w-10 h-10 rounded-full border-2 bg-white p-0.5 shadow-2xs overflow-hidden flex items-center justify-center shrink-0"
                          >
                            <img
                              src={st.presentation.avatarAsset.assetUrl}
                              alt={st.presentation.avatarAsset.altText}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>

                          <div>
                            <p
                              style={{ color: theme.textPrimary }}
                              className="font-extrabold hover:underline cursor-pointer"
                              onClick={() => navigate(`/students/${st.id}`)}
                              title={st.fullName}
                            >
                              {st.fullName}
                            </p>
                            <p className="text-xs text-app-muted">{st.ethnicity || 'Kinh'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-xs font-semibold">{st.studentCode}</td>

                      <td className="p-3.5">
                        <span
                          style={{
                            backgroundColor: theme.badgeBackground,
                            color: theme.badgeText,
                            borderColor: theme.badgeBorder,
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border tracking-wide uppercase shadow-2xs"
                          title={`Cấp ${st.avatarLevel}: ${st.presentation.levelName} (Tối thiểu ≥${st.presentation.minPoints}đ)`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          {st.totalPoints}đ
                        </span>
                      </td>

                      <td className="p-3.5">{st.gender}</td>
                      <td className="p-3.5 text-xs text-app-muted">{formatDateVietnamese(st.dateOfBirth)}</td>
                      <td className="p-3.5">
                        <Badge variant="primary">{st.currentClassName}</Badge>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/students/${st.id}`)}
                            className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-surface-hover rounded-lg min-h-[34px] min-w-[34px] flex items-center justify-center transition-colors"
                            title="Xem hồ sơ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenTransferModal(st)}
                            className="p-1.5 text-app-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg min-h-[34px] min-w-[34px] flex items-center justify-center transition-colors"
                            title="Chuyển lớp"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-surface-hover rounded-lg min-h-[34px] min-w-[34px] flex items-center justify-center transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingStudent(st);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-app-muted hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[34px] min-w-[34px] flex items-center justify-center transition-colors"
                            title="Chuyển vào Thùng rác"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ===================================================================== */}
          {/* 2. MOBILE CARD VIEW (< 768px) */}
          {/* ===================================================================== */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((st) => {
              const theme = st.presentation.cardTheme;
              return (
                <div
                  key={st.id}
                  data-testid={`student-card-mobile-${st.id}`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.surfaceStart} 0%, ${theme.surfaceEnd} 100%)`,
                    borderColor: theme.border,
                    boxShadow: `0 2px 8px ${theme.shadow}`,
                  }}
                  className="p-4 rounded-2xl border-2 space-y-3 select-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(st.id)}
                        onChange={() => handleToggleSelect(st.id)}
                        className="w-4 h-4 rounded text-app-primary cursor-pointer shrink-0"
                      />
                      <div
                        style={{ borderColor: theme.avatarRing }}
                        className="w-12 h-12 rounded-full border-2 bg-white p-0.5 shadow-xs overflow-hidden flex items-center justify-center shrink-0"
                      >
                        <img
                          src={st.presentation.avatarAsset.assetUrl}
                          alt={st.presentation.avatarAsset.altText}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      <div>
                        <h4
                          style={{ color: theme.textPrimary }}
                          className="font-extrabold text-base"
                        >
                          {st.fullName}
                        </h4>
                        <p style={{ color: theme.textSecondary }} className="text-xs font-mono">
                          {st.studentCode} • STT: {st.rollNumber || '-'}
                        </p>

                        <div className="mt-1">
                          <span
                            style={{
                              backgroundColor: theme.badgeBackground,
                              color: theme.badgeText,
                              borderColor: theme.badgeBorder,
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase shadow-2xs"
                            title={`Cấp ${st.avatarLevel}: ${st.presentation.levelName} (Tối thiểu ≥${st.presentation.minPoints}đ)`}
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            {st.totalPoints}đ
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="primary">{st.currentClassName}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-app-muted border-t border-black/5 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-app-primary shrink-0" />
                      <span>{formatDateVietnamese(st.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-app-primary shrink-0" />
                      <span>Giới tính: {st.gender}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => navigate(`/students/${st.id}`)}
                    >
                      Xem hồ sơ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenTransferModal(st)}
                      title="Chuyển lớp"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditModal(st)}
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT STUDENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStudent ? `Chỉnh sửa Hồ sơ ${editingStudent.fullName}` : 'Thêm Học sinh Mới'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-2 py-2">
            <StudentAvatar
              customAvatar={avatar}
              name={fullName || 'Học sinh'}
              globalActiveThemeId={globalAvatarSettings.presetThemeId || DEFAULT_AVATAR_THEME_ID}
              size="2xl"
              shape="circle"
              className="border-2 border-app-primary shadow-md ring-4 ring-blue-50"
            />
            <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
              <label className="cursor-pointer">
                <Button type="button" size="sm" variant="outline" leftIcon={<Upload className="w-3.5 h-3.5" />}>
                  Tải ảnh chân dung
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              {avatar && (
                <Button type="button" size="sm" variant="outline" onClick={() => setAvatar('')}>
                  Xóa ảnh tải lên
                </Button>
              )}
            </div>
            <p className="text-[11px] text-app-muted text-center max-w-sm">
              💡 Học sinh sẽ tự động nhận Avatar và màu thẻ theo Cấp độ 1–5 của toàn trường dựa trên điểm thi đua.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Mã Học Sinh (Để trống để tự tạo)"
              placeholder="VD: HS20260001"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              error={errors.studentCode}
            />
            <Input
              label="Họ và Tên Học Sinh"
              required
              placeholder="Ví dụ: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Giới tính"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              options={[
                { value: 'Nam', label: 'Nam' },
                { value: 'Nữ', label: 'Nữ' },
                { value: 'Khác', label: 'Khác' },
              ]}
            />
            <Input
              label="Ngày tháng năm sinh"
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Lớp học"
              required
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
              error={errors.classId}
            />
            <Input
              label="Số thứ tự (STT)"
              type="number"
              placeholder="Ví dụ: 1"
              value={rollNumber || ''}
              onChange={(e) => setRollNumber(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Dân tộc"
              placeholder="Ví dụ: Kinh"
              value={ethnicity}
              onChange={(e) => setEthnicity(e.target.value)}
            />
            <Input
              label="Địa chỉ thường trú"
              placeholder="Ví dụ: Phường Bến Nghé, Q1, TP.HCM"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <Input
            label="Ghi chú sức khỏe / Đặc điểm cần lưu ý"
            placeholder="Ví dụ: Cận thị 2 độ / Dị ứng đậu phụ"
            value={medicalNote}
            onChange={(e) => setMedicalNote(e.target.value)}
          />

          <div className="flex items-center gap-3 pt-3 border-t border-app">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={submitting}
              data-testid="submit-student-btn"
            >
              {editingStudent ? 'Lưu Thay Đổi' : 'Thêm Học Sinh'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: CLASS TRANSFER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={`Chuyển Lớp cho ${transferringStudent?.fullName}`}
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-app-muted">
            Lịch sử phân lớp cũ sẽ được đóng trạng thái "Chuyển lớp" và bảo lưu đầy đủ trong hồ sơ cá nhân.
          </p>

          <Select
            label="Chọn Lớp học mới"
            value={newClassId}
            onChange={(e) => setNewClassId(e.target.value)}
            options={classList
              .filter((c) => c.id !== transferringStudent?.currentClassId)
              .map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
          />

          <Input
            label="Số thứ tự mới trong lớp (STT)"
            type="number"
            placeholder="Nhập STT mới"
            value={newRollNumber || ''}
            onChange={(e) => setNewRollNumber(e.target.value ? Number(e.target.value) : undefined)}
          />

          <div className="flex items-center gap-3 pt-3 border-t border-app">
            <Button variant="secondary" className="flex-1" onClick={() => setShowTransferModal(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" className="flex-1" isLoading={transferring} onClick={handleExecuteTransfer}>
              Xác nhận Chuyển Lớp
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRM DELETE SINGLE */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteStudent}
        isLoading={deleting}
        title={`Chuyển Học sinh ${deletingStudent?.fullName} vào Thùng rác?`}
        message="Học sinh sẽ được chuyển vào Thùng rác. Toàn bộ lịch sử điểm danh và đánh giá vẫn được bảo lưu an toàn."
        confirmText="Chuyển vào Thùng rác"
      />

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRM BULK DELETE */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        isLoading={bulkDeleting}
        title={`Chuyển ${selectedIds.length} học sinh vào Thùng rác?`}
        message={`Bạn có chắc chắn muốn chuyển ${selectedIds.length} học sinh đã chọn vào Thùng rác? Toàn bộ lịch sử điểm danh và đánh giá thi đua vẫn được bảo lưu an toàn và có thể khôi phục trong mục Thùng rác.`}
        confirmText="Xác nhận chuyển vào Thùng rác"
        variant="danger"
      />

      {/* ========================================================================= */}
      {/* MODAL 5: EXCEL IMPORT */}
      {/* ========================================================================= */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        classList={classList}
        defaultClassId={selectedClassFilter !== 'all' ? selectedClassFilter : targetClassId}
        onImportSuccess={() => {
          showSuccess('Nhập dữ liệu thành công', 'Danh sách học sinh đã được nạp vào hệ thống.');
          loadData(false);
        }}
      />
    </div>
  );
};
