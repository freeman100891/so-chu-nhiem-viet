import React from 'react';
import { Card } from '../../shared/components/Card';
import { Calendar } from 'lucide-react';

export const AcademicYearsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-app-main">Quản lý Năm học & Lớp học</h2>
          <p className="text-sm text-app-muted">Quản lý danh sách các năm học, học kỳ và danh sách lớp chủ nhiệm.</p>
        </div>
      </div>

      <Card title="Danh sách Năm học">
        <div className="p-4 text-center text-app-muted">
          <Calendar className="w-10 h-10 mx-auto text-app-primary opacity-60 mb-2" />
          <p className="font-semibold text-app-main">Cấu hình Năm học & Lớp học</p>
          <p className="text-xs mt-1">Giai đoạn 1 đã cài đặt sẵn cơ sở dữ liệu và Repositories cho module này.</p>
        </div>
      </Card>
    </div>
  );
};
