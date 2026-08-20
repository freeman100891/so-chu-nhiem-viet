import React, { useState } from 'react';
import { useReports } from './ReportsContext';
import { AttendanceTrendChart } from './components/AttendanceTrendChart';
import { AttendanceHeatmap } from './components/AttendanceHeatmap';
import { DrillDownModal, type DrillDownStudentItem } from './components/DrillDownModal';
import { db } from '../../core/database/db';

export const AttendanceReportPage: React.FC = () => {
  const { report } = useReports();
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillStudents, setDrillStudents] = useState<DrillDownStudentItem[]>([]);

  if (!report) return null;

  const handleSelectDay = async (dateStr: string) => {
    // Fetch session and records for this date
    const session = await db.attendanceSessions
      .where('[classId+sessionDate]')
      .equals([report.filter.classId, dateStr])
      .first();

    if (!session) return;

    const records = await db.attendanceRecords
      .where('sessionId')
      .equals(session.id)
      .filter((r) => !r.deletedAt)
      .toArray();

    const students: DrillDownStudentItem[] = [];
    for (const r of records) {
      const st = await db.students.get(r.studentId);
      if (st) {
        let badge = 'Có mặt';
        let badgeColor = '#10b981';
        if (r.status === 'Late') {
          badge = 'Đi muộn';
          badgeColor = '#f59e0b';
        } else if (r.status === 'ExcusedAbsence') {
          badge = 'Vắng có phép';
          badgeColor = '#3b82f6';
        } else if (r.status === 'UnexcusedAbsence') {
          badge = 'Vắng không phép';
          badgeColor = '#ef4444';
        } else if (r.status === 'EarlyLeave') {
          badge = 'Về sớm';
          badgeColor = '#f97316';
        }

        students.push({
          student: st,
          subtitle: r.reason || (r.status === 'Present' ? 'Đúng giờ' : 'Ghi nhận điểm danh'),
          badge,
          badgeColor,
        });
      }
    }

    setDrillTitle(`Chi Tiết Điểm Danh Ngày ${dateStr}`);
    setDrillStudents(students);
    setDrillModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. ATTENDANCE TREND CHART */}
      <AttendanceTrendChart
        data={report.attendanceTrend}
        onSelectDate={handleSelectDay}
      />

      {/* 2. HEATMAP CALENDAR */}
      <AttendanceHeatmap
        days={report.attendanceHeatmap}
        onSelectDay={handleSelectDay}
      />

      <DrillDownModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        title={drillTitle}
        students={drillStudents}
      />
    </div>
  );
};
