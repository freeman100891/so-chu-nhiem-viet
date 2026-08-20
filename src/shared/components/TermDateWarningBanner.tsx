import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, X } from 'lucide-react';
import { termService } from '../../core/services/term.service';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { formatDateVietnamese, getTodayDateString } from '../utilities/date';
import type { AcademicYear, Term } from '../../core/database/types';
import { db } from '../../core/database/db';

export const TermDateWarningBanner: React.FC = () => {
  const [warning, setWarning] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const checkDateStatus = async () => {
    try {
      const settings = await settingsRepository.getSettings();
      let year: AcademicYear | undefined;
      if (settings.activeAcademicYearId) {
        year = await academicYearRepository.findById(settings.activeAcademicYearId);
      }
      if (!year) {
        year = await academicYearRepository.getCurrentYear();
      }

      if (!year) {
        setWarning(null);
        return;
      }
      setActiveYear(year);

      const yearTerms = await db.terms
        .where('academicYearId')
        .equals(year.id)
        .filter((t) => !t.deletedAt)
        .toArray();
      setTerms(yearTerms);

      const today = getTodayDateString();
      const currentTerm = await termService.getCurrentTermForYear(year.id);

      if (!currentTerm && yearTerms.length > 0) {
        setWarning(
          `Ngày trên thiết bị (${formatDateVietnamese(today)}) nằm ngoài thời gian các học kỳ đã cấu hình của ${year.name}.`
        );
      } else {
        setWarning(null);
      }
    } catch (err) {
      console.error('Error checking term date status:', err);
    }
  };

  useEffect(() => {
    checkDateStatus();
  }, []);

  if (!warning || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-xs md:text-sm flex items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold">Cảnh báo ngày hệ thống: </span>
          <span>{warning}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {activeYear && terms.length > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
            <Calendar className="w-3.5 h-3.5" />
            Năm học: {activeYear.name}
          </span>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-200/60 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Tắt cảnh báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
