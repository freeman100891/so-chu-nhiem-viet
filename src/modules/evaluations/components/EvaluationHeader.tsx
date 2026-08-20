import React from 'react';
import { Select } from '../../../shared/components/Select';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { evaluationProfileService } from '../../../core/services/evaluation-profile.service';
import type { ClassRoom, AcademicYear, EvaluationPeriodCode, RegulationProfileCode } from '../../../core/database/types';
import type { ClassEvaluationSummary } from '../../../core/services/evaluation.service';
import {
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export interface EvaluationHeaderProps {
  academicYears: AcademicYear[];
  selectedYearId: string;
  onSelectYear: (id: string) => void;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  selectedPeriod: EvaluationPeriodCode;
  onSelectPeriod: (code: EvaluationPeriodCode) => void;
  summary: ClassEvaluationSummary | null;
  onOpenReview: () => void;
  onFinalizeClass: () => void;
  onExportExcel: () => void;
  isFinalizingClass?: boolean;
}

export const EvaluationHeader: React.FC<EvaluationHeaderProps> = ({
  academicYears,
  selectedYearId,
  onSelectYear,
  classes,
  selectedClassId,
  onSelectClass,
  selectedPeriod,
  onSelectPeriod,
  summary,
  onOpenReview,
  onFinalizeClass,
  onExportExcel,
  isFinalizingClass = false,
}) => {
  const regulationCode: RegulationProfileCode = summary?.regulationCode || 'TT27_2020_PRIMARY';
  const profileName = evaluationProfileService.getProfileDisplayName(regulationCode);
  const periods = evaluationProfileService.getEvaluationPeriods(regulationCode);

  const total = summary?.totalStudents || 0;
  const finalized = summary?.finalizedCount || 0;
  const draft = summary?.draftCount || 0;
  const notStarted = summary?.notStartedCount || 0;
  const percent = summary?.completionPercent || 0;

  return (
    <div className="bg-app-surface border border-app rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Tier 1: Selectors & Regulation Profile Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: 3 Selectors with guaranteed comfortable min-widths */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1 max-w-3xl">
          <div className="min-w-0">
            <Select
              label="Năm học"
              value={selectedYearId}
              onChange={(e) => onSelectYear(e.target.value)}
              options={academicYears.map((y) => ({ value: y.id, label: y.name }))}
            />
          </div>
          <div className="min-w-0">
            <Select
              label="Lớp chủ nhiệm"
              value={selectedClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.name} (Khối ${c.grade})` }))}
            />
          </div>
          <div className="min-w-0">
            <Select
              label="Kỳ đánh giá"
              value={selectedPeriod}
              onChange={(e) => onSelectPeriod(e.target.value as EvaluationPeriodCode)}
              options={periods.map((p) => ({ value: p.code, label: p.name }))}
            />
          </div>
        </div>

        {/* Right: Regulation Profile Badge */}
        <div className="flex items-center self-start lg:self-center shrink-0">
          <Badge
            variant={regulationCode === 'TT27_2020_PRIMARY' ? 'primary' : 'success'}
            className="text-xs py-2 px-3.5 font-semibold flex items-center shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5 inline shrink-0" />
            <span>{profileName}</span>
          </Badge>
        </div>
      </div>

      {/* Tier 2: Action Toolbar & Progress Metric Bar */}
      <div className="pt-3.5 border-t border-app/60 flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-xs">
        {/* Left: Progress Stats & Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5 flex-1">
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="font-semibold text-app-main whitespace-nowrap">Tiến độ đánh giá lớp:</span>
            <span className="flex items-center gap-1.5 text-app-muted whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              Chưa nhập: <strong className="text-app-main">{notStarted}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-app-muted whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Bản nháp: <strong className="text-app-main">{draft}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-app-muted whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Đã khóa sổ: <strong className="text-app-main">{finalized}</strong> / {total}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-48 lg:w-56">
            <div className="flex-1 bg-app-surface-hover h-2.5 rounded-full overflow-hidden border border-app">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="font-bold font-mono text-app-main whitespace-nowrap">{percent}%</span>
          </div>
        </div>

        {/* Right: Action Buttons Group */}
        <div className="flex items-center gap-2.5 flex-wrap self-start xl:self-auto shrink-0">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            onClick={onOpenReview}
          >
            Rà soát lỗi & Cảnh báo
          </Button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={onExportExcel}
          >
            Xuất Excel
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Lock className="w-4 h-4" />}
            onClick={onFinalizeClass}
            isLoading={isFinalizingClass}
            disabled={total === 0 || finalized === total}
          >
            Khóa sổ cả lớp ({finalized}/{total})
          </Button>
        </div>
      </div>
    </div>
  );
};
