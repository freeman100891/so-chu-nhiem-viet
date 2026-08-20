import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import type { DashboardUpcomingBirthday } from '../../../core/services/dashboard-overview.service';
import {
  Cake,
  Sparkles,
  PartyPopper,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface DashboardBirthdayEventsCardProps {
  birthdays: {
    todayCount: number;
    items: DashboardUpcomingBirthday[];
  };
  loading?: boolean;
}

export const DashboardBirthdayEventsCard: React.FC<DashboardBirthdayEventsCardProps> = ({
  birthdays,
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      title="Sinh Nhật Sắp Tới"
      action={
        <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
          <Cake className="w-4 h-4" />
          <span className="text-xs font-bold font-mono">
            {birthdays.items.length} em (30 ngày)
          </span>
        </div>
      }
    >
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : birthdays.items.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-app text-app-muted space-y-1">
            <Info className="w-6 h-6 opacity-40 mx-auto" />
            <p className="text-xs font-bold">Không có sinh nhật nào trong 30 ngày tới.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* TODAY'S BIRTHDAY HERO BANNER IF ANY */}
            {birthdays.todayCount > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-amber-500/15 border border-pink-300 dark:border-pink-800/60 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <PartyPopper className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-pink-900 dark:text-pink-200">
                        🎉 Chúc mừng sinh nhật hôm nay!
                      </span>
                    </div>
                    <p className="text-xs text-pink-800/80 dark:text-pink-300 truncate font-bold">
                      {birthdays.items.filter((b) => b.isToday).map((b) => b.student.fullName).join(', ')}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shrink-0 rounded-xl"
                  onClick={() => {
                    const todayB = birthdays.items.find((b) => b.isToday);
                    if (todayB) navigate(`/students/${todayB.student.id}`);
                  }}
                >
                  <Sparkles className="w-3 h-3 mr-1 inline" /> Xem hồ sơ
                </Button>
              </div>
            )}

            {/* UPCOMING BIRTHDAYS LIST */}
            <div className="divide-y divide-app max-h-56 overflow-y-auto pr-1">
              {birthdays.items.map((item) => (
                <div
                  key={item.student.id}
                  onClick={() => navigate(`/students/${item.student.id}`)}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-pink-200 dark:border-pink-800">
                      {item.student.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-app-main truncate">{item.student.fullName}</p>
                      <p className="text-[11px] text-app-muted">Sinh ngày: {item.dateStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono',
                        item.isToday
                          ? 'bg-pink-500 text-white animate-pulse'
                          : item.daysLeft <= 7
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-black'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {item.isToday ? 'Hôm nay!' : `Còn ${item.daysLeft} ngày`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-app-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
