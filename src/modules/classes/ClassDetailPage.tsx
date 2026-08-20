import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { PageHeader } from '../../shared/components/PageHeader';
import { classRepository } from '../../core/repositories/class.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import {
  avatarThemeRegistry,
  DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS,
} from '../../core/services/avatar-theme-registry';
import { db } from '../../core/database/db';
import type { ClassRoom, Student, ClassEnrollment } from '../../core/database/types';
import type { StudentAvatarPresentation } from '../../core/types/avatar-theme.types';
import { ArrowLeft, Users, UserPlus, Sparkles } from 'lucide-react';

export interface EnrolledStudentItem {
  student: Student;
  enrollment: ClassEnrollment;
  totalPoints: number;
  presentation: StudentAvatarPresentation;
}

export const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [cls, setCls] = useState<ClassRoom | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const room = await classRepository.findById(classId);
      if (room) {
        setCls(room);

        const settings = await settingsRepository.getSettings();
        const globalSettings = settings?.avatarSystemSettings || DEFAULT_GLOBAL_AVATAR_SYSTEM_SETTINGS;

        // 1. Batch load active enrollments
        const allEnrollments = await db.classEnrollments.toArray();
        const enrollments = allEnrollments.filter(
          (e) => e.classId === classId && e.status === 'Active' && !e.deletedAt
        );
        const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId));

        // 2. Batch load point entries
        const allPointEntries = await db.pointEntries.toArray();
        const classPoints = allPointEntries.filter(
          (p) => !p.deletedAt && enrolledStudentIds.has(p.studentId)
        );
        const pointsMap = new Map<string, number>();
        for (const pe of classPoints) {
          pointsMap.set(pe.studentId, (pointsMap.get(pe.studentId) || 0) + pe.points);
        }

        // 3. Batch load students
        const allStudents = await db.students.toArray();
        const studentMap = new Map<string, Student>();
        for (const s of allStudents) {
          if (!s.deletedAt && enrolledStudentIds.has(s.id)) {
            studentMap.set(s.id, s);
          }
        }

        const items: EnrolledStudentItem[] = [];
        for (const enr of enrollments) {
          const st = studentMap.get(enr.studentId);
          if (st) {
            const pts = pointsMap.get(st.id) || 0;
            const presentation = avatarThemeRegistry.resolveStudentAvatarPresentation({
              student: st,
              score: pts,
              globalSettings,
            });
            items.push({
              student: st,
              enrollment: enr,
              totalPoints: pts,
              presentation,
            });
          }
        }

        // Sort by rollNumber or name
        items.sort((a, b) => (a.enrollment.rollNumber || 999) - (b.enrollment.rollNumber || 999));
        setEnrolledStudents(items);
      }
    } catch (err) {
      console.error('Error loading class detail:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const handleRefresh = () => loadDetail();
    window.addEventListener('point_entries_changed', handleRefresh);
    window.addEventListener('gvcn_settings_changed', handleRefresh);
    window.addEventListener('gvcn_data_changed', handleRefresh);
    return () => {
      window.removeEventListener('point_entries_changed', handleRefresh);
      window.removeEventListener('gvcn_settings_changed', handleRefresh);
      window.removeEventListener('gvcn_data_changed', handleRefresh);
    };
  }, [loadDetail]);

  if (loading) return <LoadingSkeleton type="card" count={2} />;
  if (!cls) return <div className="p-6 text-center text-app-muted">Không tìm thấy thông tin lớp học.</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => navigate('/classes')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Quay lại danh sách
        </Button>
      </div>

      <PageHeader
        title={`Chi tiết Lớp ${cls.name}`}
        description={`Khối ${cls.grade} - ${cls.description || 'Chưa có mô tả'}`}
        badgeText={`Sĩ số: ${enrolledStudents.length} học sinh`}
        action={
          <Button
            variant="primary"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/students', { state: { openAdd: true, defaultClassId: cls.id } })}
          >
            Thêm Học sinh vào Lớp
          </Button>
        }
      />

      <Card title="Danh sách Học sinh trong Lớp">
        {enrolledStudents.length === 0 ? (
          <div className="text-center py-8 text-app-muted space-y-3">
            <Users className="w-10 h-10 mx-auto text-app-muted/50" />
            <p className="text-sm font-semibold">Lớp học này hiện chưa có học sinh nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-app">
            {enrolledStudents.map(({ student, enrollment, totalPoints, presentation }) => {
              const theme = presentation.cardTheme;
              return (
                <div
                  key={student.id}
                  style={{
                    background: `linear-gradient(90deg, ${theme.surfaceStart} 0%, transparent 40%)`,
                  }}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-app-surface-hover/50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-app-primary-light text-app-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {enrollment.rollNumber || '#'}
                    </span>
                    <div
                      style={{ borderColor: theme.avatarRing }}
                      className="w-10 h-10 rounded-full border-2 bg-white p-0.5 shadow-2xs overflow-hidden flex items-center justify-center shrink-0"
                    >
                      <img
                        src={presentation.avatarAsset.assetUrl}
                        alt={presentation.avatarAsset.altText}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h4
                        style={{ color: theme.textPrimary }}
                        className="font-bold text-sm text-app-main cursor-pointer hover:underline"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        {student.fullName}
                      </h4>
                      <p className="text-xs text-app-muted">
                        Mã HS: {student.studentCode} • Giới tính: {student.gender}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      style={{
                        backgroundColor: theme.badgeBackground,
                        color: theme.badgeText,
                        borderColor: theme.badgeBorder,
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border uppercase shadow-2xs"
                      title={`Cấp ${presentation.level}: ${presentation.levelName}`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {presentation.levelShortLabel} • {totalPoints}đ
                    </span>

                    <Button size="sm" variant="ghost" onClick={() => navigate(`/students/${student.id}`)}>
                      Xem hồ sơ
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
