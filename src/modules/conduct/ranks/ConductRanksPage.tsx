import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../../../shared/components/Card';
import { Select } from '../../../shared/components/Select';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import { useToast } from '../../../shared/hooks/useToast';
import { db } from '../../../core/database/db';
import type {
  RankSystem,
  RankLevel,
  ClassRoom,
  AcademicYear,
  StudentRankHistory,
} from '../../../core/database/types';
import { rankSeedService } from '../../../core/services/rank-seed.service';
import { rankCalculationService } from '../../../core/services/rank-calculation.service';
import { RankOverviewTab, type StudentWithRankItem } from './RankOverviewTab';
import { RankStudentsTab } from './RankStudentsTab';
import { ConductRankConfig } from '../components/ConductRankConfig';
import { RankHistoryTab, type EnrichedHistoryItem } from './RankHistoryTab';
import {
  BarChart3,
  Users,
  Sliders,
  History,
  Shield,
} from 'lucide-react';

export interface ConductRanksPageProps {
  initialTab?: 'overview' | 'students' | 'config' | 'history';
}

export const ConductRanksPage: React.FC<ConductRanksPageProps> = ({ initialTab = 'overview' }) => {
  const { showError } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'config' | 'history'>(initialTab);
  const [loading, setLoading] = useState(true);

  // Metadata
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // System & Levels
  const [currentSystem, setCurrentSystem] = useState<RankSystem | null>(null);
  const [rankLevels, setRankLevels] = useState<RankLevel[]>([]);

  // Loaded Data
  const [studentsWithRank, setStudentsWithRank] = useState<StudentWithRankItem[]>([]);
  const [historyList, setHistoryList] = useState<EnrichedHistoryItem[]>([]);
  const [studentHistoriesMap, setStudentHistoriesMap] = useState<Map<string, StudentRankHistory[]>>(new Map());

  // Focus student navigation from overview
  const [selectedStudentFocusId, setSelectedStudentFocusId] = useState<string | null>(null);
  const [presetGroupFilter, setPresetGroupFilter] = useState<string>('all');
  const [presetLevelFilter, setPresetLevelFilter] = useState<string>('all');
  const [presetQuickFilter, setPresetQuickFilter] = useState<'all' | 'near_promo' | 'recent_promo'>('all');

  const handleNavigateToStudentsWithFilter = (options?: {
    group?: string;
    level?: number;
    quickFilter?: 'all' | 'near_promo' | 'recent_promo';
  }) => {
    if (options?.group) setPresetGroupFilter(options.group);
    else setPresetGroupFilter('all');

    if (options?.level !== undefined) setPresetLevelFilter(String(options.level));
    else setPresetLevelFilter('all');

    if (options?.quickFilter) setPresetQuickFilter(options.quickFilter);
    else setPresetQuickFilter('all');

    setActiveTab('students');
  };

  // 1. Load Academic Years & Classes
  const loadInitialMetadata = useCallback(async () => {
    setLoading(true);
    try {
      const years = await db.academicYears.filter((y) => !y.deletedAt).toArray();
      setAcademicYears(years);

      let activeYear = years.find((y) => y.isActive);
      if (!activeYear && years.length > 0) activeYear = years[0];

      if (activeYear) {
        setSelectedAcademicYearId(activeYear.id);
        const classes = await db.classes
          .filter((c) => c.academicYearId === activeYear!.id && !c.deletedAt)
          .toArray();
        setClassList(classes);
      }
    } catch (err) {
      console.error('Error loading ranks metadata:', err);
      showError('Không thể nạp danh sách năm học và lớp.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // 2. Load System & Calculate Data Batch
  const loadRanksData = useCallback(async () => {
    if (!selectedAcademicYearId) return;

    try {
      // Seed / get system for this academic year
      const { system, levels } = await rankSeedService.seedDefaultRankSystem(selectedAcademicYearId);
      setCurrentSystem(system);
      const sortedLevels = [...levels].sort((a, b) => a.level - b.level);
      setRankLevels(sortedLevels);

      // Classes to calculate
      const targetClasses =
        selectedClassId === 'all'
          ? classList
          : classList.filter((c) => c.id === selectedClassId);

      const allStudentsWithRank: StudentWithRankItem[] = [];
      const histMap = new Map<string, StudentRankHistory[]>();

      // Batch recalculate for each class
      for (const cls of targetClasses) {
        const classRanksMap = await rankCalculationService.recalculateClassRanks(cls.id, system.id);
        const enrollments = await db.classEnrollments
          .where('classId')
          .equals(cls.id)
          .filter((e) => e.status === 'Active' && !e.deletedAt)
          .toArray();

        // Batch fetch histories for class
        const classHistories = await db.studentRankHistory
          .where('classId')
          .equals(cls.id)
          .toArray();

        // Build history map
        for (const h of classHistories) {
          const list = histMap.get(h.studentId) || [];
          list.push(h);
          histMap.set(h.studentId, list);
        }

        // Build student items
        for (const enr of enrollments) {
          const st = await db.students.get(enr.studentId);
          if (st && !st.deletedAt) {
            const rankRes = classRanksMap.get(st.id) || {
              studentId: st.id,
              totalPoints: 0,
              effectivePoints: 0,
              currentRank: sortedLevels[0]!,
              nextRank: sortedLevels[1] || null,
              currentLevel: 1,
              nextThreshold: sortedLevels[1]?.minPoints || 50,
              pointsToNextRank: sortedLevels[1]?.minPoints || 50,
              progressPercent: 0,
              isHighestRank: false,
              highestAchievedRank: sortedLevels[0]!,
            };

            const stHist = histMap.get(st.id) || [];
            const lastPromotion = stHist
              .filter((h) => h.changeType === 'promotion')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            allStudentsWithRank.push({
              student: st,
              rankInfo: rankRes,
              className: `Lớp ${cls.name}`,
              lastPromotedAt: lastPromotion ? lastPromotion.createdAt : null,
            });
          }
        }
      }

      setStudentsWithRank(allStudentsWithRank);
      setStudentHistoriesMap(histMap);

      // Load all histories for History Tab
      const rawHistories = await db.studentRankHistory
        .where('rankSystemId')
        .equals(system.id)
        .toArray();

      rawHistories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Enrich history items
      const enriched: EnrichedHistoryItem[] = [];
      for (const h of rawHistories) {
        const st = await db.students.get(h.studentId);
        const cls = classList.find((c) => c.id === h.classId);
        if (st && !st.deletedAt) {
          enriched.push({
            ...h,
            studentName: st.fullName,
            studentCode: st.studentCode,
            className: cls ? `Lớp ${cls.name}` : 'Lớp học',
          });
        }
      }
      setHistoryList(enriched);
    } catch (err) {
      console.error('Error loading rank calculation data:', err);
    }
  }, [selectedAcademicYearId, selectedClassId, classList]);

  useEffect(() => {
    loadInitialMetadata();
  }, [loadInitialMetadata]);

  useEffect(() => {
    if (selectedAcademicYearId && classList.length > 0) {
      loadRanksData();
    }
  }, [selectedAcademicYearId, selectedClassId, classList, loadRanksData]);

  // Extract recent promotions for Overview
  const recentPromotions = useMemo(() => {
    return historyList
      .filter((h) => h.changeType === 'promotion')
      .slice(0, 10);
  }, [historyList]);

  // Navigate to student detail in students tab
  const handleSelectStudentFocus = (studentId: string) => {
    setSelectedStudentFocusId(studentId);
    setActiveTab('students');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <PageHeader
          title="Hệ Thống 17 Cấp Bậc Thi Đua Học Đường"
          description="Đang nạp dữ liệu cấp bậc thi đua..."
        />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* PAGE HEADER */}
      <PageHeader
        title="Hệ Thống 17 Cấp Bậc Thi Đua"
        description="Theo dõi nề nếp, điểm thi đua và tiến độ thăng cấp từ Binh nhì đến Đại tướng"
        badgeText={`${studentsWithRank.length} học sinh`}
      />

      {/* FILTER BAR: CLASS & ACADEMIC YEAR */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* ACADEMIC YEAR */}
            <div className="w-48">
              <Select
                label="Năm học"
                value={selectedAcademicYearId}
                onChange={(e) => {
                  setSelectedAcademicYearId(e.target.value);
                  setSelectedClassId('all');
                }}
                options={academicYears.map((y) => ({ value: y.id, label: `Năm học ${y.name}` }))}
              />
            </div>

            {/* CLASS SELECTOR */}
            <div className="w-48">
              <Select
                label="Phạm vi Lớp học"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                options={[
                  { value: 'all', label: 'Tất cả lớp học' },
                  ...classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 font-bold text-slate-500">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Chế độ: <strong className="text-slate-800">{currentSystem?.rankMode === 'achievement' ? 'Achievement Mode' : 'Dynamic Mode'}</strong></span>
          </div>
        </div>
      </Card>

      {/* 4 TAB BUTTONS NAVIGATION */}
      <div className="flex border-b border-app overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'overview'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> 1. Tổng quan
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'students'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Users className="w-4 h-4" /> 2. Danh sách Học sinh ({studentsWithRank.length})
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'config'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-600" /> 3. Cấu hình 17 Cấp bậc
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'history'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <History className="w-4 h-4" /> 4. Lịch sử Thay đổi ({historyList.length})
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <RankOverviewTab
          studentsWithRank={studentsWithRank}
          rankLevels={rankLevels}
          recentPromotions={recentPromotions}
          rankSystemId={currentSystem?.id}
          filter={{
            academicYearId: selectedAcademicYearId,
            classId: selectedClassId,
          }}
          onSelectStudent={handleSelectStudentFocus}
          onNavigateToStudentsTabWithFilter={handleNavigateToStudentsWithFilter}
        />
      )}

      {/* TAB CONTENT 2: STUDENTS */}
      {activeTab === 'students' && (
        <RankStudentsTab
          studentsWithRank={studentsWithRank}
          rankLevels={rankLevels}
          classList={classList}
          studentHistoriesMap={studentHistoriesMap}
          initialSelectedStudentId={selectedStudentFocusId}
          initialGroupFilter={presetGroupFilter}
          initialLevelFilter={presetLevelFilter}
          initialQuickFilter={presetQuickFilter as 'all' | 'near_promo' | 'recent_promo'}
          onClearInitialStudent={() => setSelectedStudentFocusId(null)}
        />
      )}

      {/* TAB CONTENT 3: CONFIGURATION */}
      {activeTab === 'config' && (
        <ConductRankConfig academicYearId={selectedAcademicYearId} />
      )}

      {/* TAB CONTENT 4: HISTORY */}
      {activeTab === 'history' && (
        <RankHistoryTab
          historyList={historyList}
          rankLevels={rankLevels}
          classList={classList}
        />
      )}
    </div>
  );
};
