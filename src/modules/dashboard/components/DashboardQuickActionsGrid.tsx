import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import {
  CalendarCheck2,
  UserPlus,
  Award,
  ShieldCheck,
  Dices,
  PenTool,
  FileSpreadsheet,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export const DashboardQuickActionsGrid: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Điểm danh',
      desc: 'Sĩ số & chuyên cần',
      icon: <CalendarCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bgGradient: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30',
      borderHover: 'hover:border-emerald-300',
      route: '/attendance',
    },
    {
      label: 'Thêm học sinh',
      desc: 'Hồ sơ & danh sách',
      icon: <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bgGradient: 'hover:bg-blue-50/60 dark:hover:bg-blue-950/30',
      borderHover: 'hover:border-blue-300',
      route: '/students',
    },
    {
      label: 'Ghi điểm thi đua',
      desc: 'Khen thưởng & nhắc nhở',
      icon: <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bgGradient: 'hover:bg-amber-50/60 dark:hover:bg-amber-950/30',
      borderHover: 'hover:border-amber-300',
      route: '/conduct',
    },
    {
      label: 'Cấp bậc 17 cấp',
      desc: 'Hệ thống vinh danh',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bgGradient: 'hover:bg-purple-50/60 dark:hover:bg-purple-950/30',
      borderHover: 'hover:border-purple-300',
      route: '/conduct/ranks',
    },
    {
      label: 'Lớp học trực tuyến',
      desc: 'Gọi tên ngẫu nhiên',
      icon: <Dices className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bgGradient: 'hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30',
      borderHover: 'hover:border-indigo-300',
      route: '/live-classroom',
    },
    {
      label: 'Sổ nhận xét',
      desc: 'Đánh giá & rèn luyện',
      icon: <PenTool className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bgGradient: 'hover:bg-teal-50/60 dark:hover:bg-teal-950/30',
      borderHover: 'hover:border-teal-300',
      route: '/evaluations',
    },
    {
      label: 'Báo cáo thống kê',
      desc: 'Xuất sổ Excel chuẩn',
      icon: <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />,
      bgGradient: 'hover:bg-green-50/60 dark:hover:bg-green-950/30',
      borderHover: 'hover:border-green-300',
      route: '/reports',
    },
    {
      label: 'Sao lưu dữ liệu',
      desc: 'An toàn & khôi phục',
      icon: <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
      bgGradient: 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50',
      borderHover: 'hover:border-slate-400',
      route: '/backup',
    },
  ];

  return (
    <Card title="Phím Tắt Thao Tác Nhanh">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => navigate(action.route)}
            className={cn(
              'group relative p-3 rounded-2xl border border-app bg-slate-50/50 dark:bg-slate-800/30 text-left transition-all hover:shadow-sm hover:-translate-y-0.5 focus:outline-hidden focus:ring-2 focus:ring-app-primary flex items-start gap-2.5 min-h-[58px]',
              action.bgGradient,
              action.borderHover
            )}
            title={`Mở module ${action.label}`}
          >
            <div className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-2xs shrink-0 transition-transform group-hover:scale-110">
              {action.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-app-main truncate group-hover:text-app-primary transition-colors">
                {action.label}
              </p>
              <p className="text-[10px] text-app-muted truncate font-medium">
                {action.desc}
              </p>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-app-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ))}
      </div>
    </Card>
  );
};
