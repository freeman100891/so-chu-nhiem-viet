import React from 'react';
import type { MetricWithDelta, ReportKpiData } from '../../../core/services/report-aggregation.service';
import {
  Users,
  CalendarCheck,
  PlusCircle,
  MinusCircle,
  Award,
  MessageSquare,
  Sparkles,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';

export interface ReportKpiCardProps {
  title: string;
  metric: MetricWithDelta;
  unit?: string;
  icon: React.ReactNode;
  colorClass: string;
  tooltipText: string;
  isPositiveGood?: boolean;
}

export const ReportKpiCard: React.FC<ReportKpiCardProps> = ({
  title,
  metric,
  unit = '',
  icon,
  colorClass,
  tooltipText,
  isPositiveGood = true,
}) => {
  const hasComparison = metric.previous !== undefined;
  const delta = metric.delta ?? 0;
  const isUp = delta > 0;
  const isDown = delta < 0;
  const isZero = delta === 0;

  // Good or bad delta
  const isGood = isPositiveGood ? isUp : isDown;
  const isBad = isPositiveGood ? isDown : isUp;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-app-surface border border-app shadow-2xs hover:shadow-xs transition-all space-y-2 flex flex-col justify-between">
      {/* HEADER: ICON + TITLE + TOOLTIP */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('p-2 rounded-2xl shrink-0', colorClass)}>
            {icon}
          </div>
          <span className="text-xs font-bold text-app-muted truncate" title={title}>
            {title}
          </span>
        </div>
        <div className="group relative shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
          <div className="absolute right-0 top-5 w-48 p-2 rounded-xl bg-slate-900 text-white text-[10px] leading-tight shadow-xl hidden group-hover:block z-30 pointer-events-none">
            {tooltipText}
          </div>
        </div>
      </div>

      {/* VALUE & UNIT */}
      <div className="flex items-baseline gap-1 pt-1">
        <span className="text-2xl sm:text-3xl font-black font-mono text-app-main tracking-tight">
          {metric.current}
        </span>
        {unit && <span className="text-xs font-bold text-app-muted">{unit}</span>}
      </div>

      {/* DELTA BADGE / COMPARISON */}
      <div className="pt-1 border-t border-app/60 flex items-center justify-between text-[11px]">
        {hasComparison ? (
          <div className="flex items-center gap-1.5 font-bold">
            {isZero ? (
              <span className="inline-flex items-center text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px]">
                <Minus className="w-3 h-3 mr-0.5" /> Không đổi
              </span>
            ) : isGood ? (
              <span className="inline-flex items-center text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md text-[10px]">
                <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-600" />
                +{Math.abs(delta)}
                {metric.percentChange !== null && ` (+${metric.percentChange}%)`}
              </span>
            ) : isBad ? (
              <span className="inline-flex items-center text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-950/60 px-1.5 py-0.5 rounded-md text-[10px]">
                <ArrowDownRight className="w-3 h-3 mr-0.5 text-red-600" />
                {delta}
                {metric.percentChange !== null && ` (${metric.percentChange}%)`}
              </span>
            ) : null}
            <span className="text-app-muted text-[10px]">so với kỳ trước</span>
          </div>
        ) : (
          <span className="text-app-muted text-[10px]">Kỳ xét hiện tại</span>
        )}
      </div>
    </div>
  );
};

export interface ReportKpiSectionProps {
  kpis: ReportKpiData;
}

export const ReportKpiSection: React.FC<ReportKpiSectionProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. SĨ SỐ HỌC SINH */}
      <ReportKpiCard
        title="Sĩ số lớp"
        metric={kpis.activeStudentsCount}
        unit="học sinh"
        icon={<Users className="w-4 h-4 text-blue-600" />}
        colorClass="bg-blue-100 dark:bg-blue-950/80"
        tooltipText="Tổng số học sinh đang hoạt động (Active) trong lớp học."
      />

      {/* 2. CHUYÊN CẦN */}
      <ReportKpiCard
        title="Tỷ lệ chuyên cần"
        metric={kpis.attendanceRate}
        unit="%"
        icon={<CalendarCheck className="w-4 h-4 text-emerald-600" />}
        colorClass="bg-emerald-100 dark:bg-emerald-950/80"
        tooltipText="Tỷ lệ có mặt và đi muộn trên tổng số lượt điểm danh đã thực hiện."
      />

      {/* 3. ĐIỂM CỘNG */}
      <ReportKpiCard
        title="Tổng điểm cộng"
        metric={kpis.meritPoints}
        unit="điểm"
        icon={<PlusCircle className="w-4 h-4 text-emerald-600" />}
        colorClass="bg-emerald-100 dark:bg-emerald-950/80"
        tooltipText="Tổng số điểm thi đua tích cực được cộng trong kỳ."
      />

      {/* 4. ĐIỂM TRỪ */}
      <ReportKpiCard
        title="Tổng điểm trừ"
        metric={kpis.demeritPoints}
        unit="điểm"
        icon={<MinusCircle className="w-4 h-4 text-red-600" />}
        colorClass="bg-red-100 dark:bg-red-950/80"
        tooltipText="Tổng số điểm trừ nhắc nhở nề nếp trong kỳ."
        isPositiveGood={false}
      />

      {/* 5. ĐIỂM THI ĐUA RÒNG */}
      <ReportKpiCard
        title="Điểm thi đua ròng"
        metric={kpis.netPoints}
        unit="điểm"
        icon={<Award className="w-4 h-4 text-amber-600" />}
        colorClass="bg-amber-100 dark:bg-amber-950/80"
        tooltipText="Điểm cộng trừ đi điểm trừ trong khoảng thời gian xét."
      />

      {/* 6. TƯƠNG TÁC LỚP HỌC */}
      <ReportKpiCard
        title="Tỷ lệ tương tác"
        metric={kpis.engagementRate}
        unit="%"
        icon={<MessageSquare className="w-4 h-4 text-pink-600" />}
        colorClass="bg-pink-100 dark:bg-pink-950/80"
        tooltipText="Tỷ lệ học sinh có ít nhất một lượt phát biểu hoặc tham gia tương tác trong lớp."
      />

      {/* 7. HỌC SINH THĂNG CẤP */}
      <ReportKpiCard
        title="Học sinh thăng cấp"
        metric={kpis.promotedStudentsCount}
        unit="em"
        icon={<Sparkles className="w-4 h-4 text-purple-600" />}
        colorClass="bg-purple-100 dark:bg-purple-950/80"
        tooltipText="Số học sinh duy nhất có sự kiện tăng cấp bậc thi đua trong kỳ."
      />

      {/* 8. DANH HIỆU TRAO */}
      <ReportKpiCard
        title="Danh hiệu Bảng vàng"
        metric={kpis.honorsCount}
        unit="danh hiệu"
        icon={<Trophy className="w-4 h-4 text-amber-600" />}
        colorClass="bg-amber-100 dark:bg-amber-950/80"
        tooltipText="Tổng số danh hiệu vinh danh đã trao qua các đợt Bảng Vàng đã công bố."
      />
    </div>
  );
};
