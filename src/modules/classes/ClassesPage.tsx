import React, { useState, useEffect } from 'react';
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
import { classService } from '../../core/services/class.service';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { db } from '../../core/database/db';
import type { ClassRoom, AcademicYear, ClassStatus } from '../../core/database/types';
import { School, Plus, Edit, Trash2, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ClassWithCount extends ClassRoom {
  studentCount: number;
}

export const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ClassStatus>('Active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm State
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const settings = await settingsRepository.getSettings();
      let year: AcademicYear | undefined;
      if (settings.activeAcademicYearId) {
        year = await academicYearRepository.findById(settings.activeAcademicYearId);
      }
      if (!year) {
        year = await academicYearRepository.getCurrentYear();
      }

      if (year) {
        setActiveYear(year);
        const list = await db.classes
          .filter((c) => !c.deletedAt && c.academicYearId === year!.id)
          .toArray();

        const withCounts: ClassWithCount[] = [];
        for (const cls of list) {
          const count = await db.classEnrollments
            .where('classId')
            .equals(cls.id)
            .filter((e) => e.status === 'Active')
            .count();
          withCounts.push({ ...cls, studentCount: count });
        }

        setClasses(withCounts);
      } else {
        setActiveYear(null);
        setClasses([]);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setName('');
    setGrade(10);
    setDescription('');
    setStatus('Active');
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (cls: ClassRoom) => {
    setEditingClass(cls);
    setName(cls.name);
    setGrade(cls.grade);
    setDescription(cls.description || '');
    setStatus(cls.status);
    setErrors({});
    setShowModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeYear) {
      showError('Chưa chọn năm học', 'Vui lòng tạo năm học trước khi tạo lớp.');
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      if (editingClass) {
        await classService.updateClass(editingClass.id, {
          name,
          grade,
          description,
          status,
        });
        showSuccess('Thành công', `Đã cập nhật thông tin lớp ${name}`);
      } else {
        await classService.createClass({
          academicYearId: activeYear.id,
          name,
          grade,
          description,
          status,
        });
        showSuccess('Thành công', `Đã khởi tạo lớp ${name}`);
      }

      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      console.error('Error saving class:', err);
      showError('Lỗi', (err as Error).message || 'Không thể lưu thông tin lớp học');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;
    setDeleting(true);
    try {
      await classService.softDeleteClass(deletingClass.id);
      showSuccess('Thành công', `Đã chuyển lớp ${deletingClass.name} vào Thùng rác`);
      setShowDeleteModal(false);
      setDeletingClass(null);
      loadData();
    } catch (err: unknown) {
      showError('Không thể xóa lớp', (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectClassContext = async (cls: ClassRoom) => {
    await settingsRepository.updateSettings({ activeClassId: cls.id });
    showSuccess('Đã chuyển lớp active', `Lớp ${cls.name} hiện là lớp làm việc chính`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Quản lý Lớp học"
        description={activeYear ? `Danh sách các lớp thuộc ${activeYear.name}` : 'Quản lý danh sách lớp học chủ nhiệm'}
        badgeText={activeYear?.name}
        action={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAddModal}>
            Tạo Lớp học Mới
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : classes.length === 0 ? (
        <EmptyState
          title="Chưa có Lớp học nào"
          description="Hiện tại chưa có lớp học nào được tạo trong năm học này."
          actionText="Tạo Lớp học Mới"
          onAction={handleOpenAddModal}
          icon={<School className="w-8 h-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="hover:shadow-md transition-all flex flex-col justify-between"
              title={
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-app-primary-light text-app-primary rounded-lg font-bold text-sm">
                    {cls.name}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-app-main">Lớp {cls.name}</h3>
                    <span className="text-xs text-app-muted">Khối {cls.grade}</span>
                  </div>
                </div>
              }
              action={
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cls)}
                    className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-surface-hover rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingClass(cls);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 text-app-muted hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                    title="Chuyển vào Thùng rác"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                <p className="text-xs text-app-muted min-h-[32px]">
                  {cls.description || 'Chưa có mô tả chi tiết cho lớp học.'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-app">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-app-primary shrink-0" />
                    <span className="text-sm font-bold text-app-main">{cls.studentCount} học sinh</span>
                  </div>
                  <Badge variant={cls.status === 'Active' ? 'success' : 'neutral'}>
                    {cls.status === 'Active' ? 'Đang hoạt động' : cls.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSelectClassContext(cls)}
                  >
                    Chọn làm Lớp active
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/classes/${cls.id}`)}
                  >
                    Chi tiết
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal: Add/Edit Class */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClass ? `Chỉnh sửa Lớp ${editingClass.name}` : 'Tạo Lớp học Mới'}
      >
        <form onSubmit={handleSaveClass} className="space-y-4 py-2">
          <Input
            label="Tên Lớp học"
            required
            placeholder="Ví dụ: 10A1, 11B2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Select
            label="Khối Lớp"
            required
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            options={[
              { value: 1, label: 'Khối 1' },
              { value: 2, label: 'Khối 2' },
              { value: 3, label: 'Khối 3' },
              { value: 4, label: 'Khối 4' },
              { value: 5, label: 'Khối 5' },
              { value: 6, label: 'Khối 6' },
              { value: 7, label: 'Khối 7' },
              { value: 8, label: 'Khối 8' },
              { value: 9, label: 'Khối 9' },
              { value: 10, label: 'Khối 10' },
              { value: 11, label: 'Khối 11' },
              { value: 12, label: 'Khối 12' },
            ]}
          />
          <Input
            label="Mô tả Lớp học (Không bắt buộc)"
            placeholder="Ví dụ: Lớp chuyên Toán / Lớp Chủ nhiệm chính"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Trạng thái Lớp"
            value={status}
            onChange={(e) => setStatus(e.target.value as ClassStatus)}
            options={[
              { value: 'Active', label: 'Đang hoạt động' },
              { value: 'Completed', label: 'Hoàn thành' },
              { value: 'Archived', label: 'Lưu trữ' },
            ]}
          />

          <div className="flex items-center gap-3 pt-3 border-t border-app">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>
              {editingClass ? 'Lưu Thay Đổi' : 'Khởi Tạo Lớp'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteClass}
        isLoading={deleting}
        title={`Chuyển Lớp ${deletingClass?.name} vào Thùng rác?`}
        message="Lớp học sẽ được chuyển vào Thùng rác. Lịch sử phân lớp của học sinh vẫn được giữ nguyên."
        confirmText="Chuyển vào Thùng rác"
      />
    </div>
  );
};
