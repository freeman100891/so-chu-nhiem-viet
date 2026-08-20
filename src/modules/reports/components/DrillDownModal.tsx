import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import type { Student } from '../../../core/database/types';
import { ChevronRight, Users } from 'lucide-react';

export interface DrillDownStudentItem {
  student: Student;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  points?: number;
}

export interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  students: DrillDownStudentItem[];
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  students,
}) => {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
      <div className="space-y-4 py-1">
        {description && <p className="text-xs text-app-muted">{description}</p>}

        {students.length === 0 ? (
          <div className="py-8 text-center text-xs text-app-muted space-y-1">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Không có học sinh nào trong nhóm này</p>
          </div>
        ) : (
          <div className="divide-y divide-app max-h-96 overflow-y-auto pr-1">
            {students.map(({ student, subtitle, badge, badgeColor, points }) => (
              <div
                key={student.id}
                onClick={() => {
                  onClose();
                  navigate(`/students/${student.id}`);
                }}
                className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StudentAvatar
                    student={student}
                    size="sm"
                    className="border border-app shrink-0"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-app-main truncate">{student.fullName}</p>
                    <p className="text-[11px] text-app-muted truncate">
                      {subtitle || `Mã HS: ${student.studentCode}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {badge && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: badgeColor || '#3b82f6' }}
                    >
                      {badge}
                    </span>
                  )}
                  {points !== undefined && (
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      {points} đ
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-app-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-app">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
