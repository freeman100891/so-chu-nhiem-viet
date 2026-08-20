import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import type { DashboardBackupHealthData } from '../../../core/services/dashboard-overview.service';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Database,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface DashboardDataHealthCardProps {
  health: DashboardBackupHealthData;
  loading?: boolean;
}

export const DashboardDataHealthCard: React.FC<DashboardDataHealthCardProps> = ({
  health,
  loading = false,
}) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (health.status) {
      case 'safe':
        return {
          label: 'An toàn',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
          desc: 'Dữ liệu đã được sao lưu định kỳ gần đây.',
        };
      case 'warning':
        return {
          label: 'Nên sao lưu',
          icon: <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
          desc: 'Đã hơn một tuần chưa sao lưu tệp dữ liệu.',
        };
      case 'danger':
        return {
          label: 'Cần sao lưu ngay',
          icon: <ShieldX className="w-4 h-4 text-red-600 dark:text-red-400" />,
          colorClass: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300',
          desc: 'Chưa có bản sao lưu hoặc đã quá 14 ngày chưa sao lưu.',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <Card title="An Toàn Dữ Liệu & Sao Lưu">
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-app rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-2xs shrink-0">
                  {statusInfo.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-black px-2 py-0.5 rounded-full', statusInfo.colorClass)}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-app-muted font-bold">
                      {health.daysSinceLastBackup === null
                        ? 'Chưa sao lưu'
                        : health.daysSinceLastBackup === 0
                        ? 'Hôm nay'
                        : `${health.daysSinceLastBackup} ngày trước`}
                    </span>
                  </div>
                  <p className="text-[11px] text-app-muted mt-1">{statusInfo.desc}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-app bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-[10px] font-bold text-app-muted uppercase">Lần sao lưu cuối</span>
                <p className="font-bold text-app-main mt-0.5 truncate">
                  {health.lastBackupDate
                    ? formatDateVietnamese(health.lastBackupDate.split('T')[0]!)
                    : 'Chưa có'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-app bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-[10px] font-bold text-app-muted uppercase">Dữ liệu hiện hành</span>
                <p className="font-bold text-app-main mt-0.5 font-mono">
                  {health.totalRecordsCount.toLocaleString('vi-VN')} bản ghi
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center font-bold rounded-xl"
              leftIcon={<Database className="w-4 h-4" />}
              onClick={() => navigate('/backup')}
            >
              Sao lưu ngay bây giờ <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
