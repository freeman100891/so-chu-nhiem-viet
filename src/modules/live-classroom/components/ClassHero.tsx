import React, { useState, useEffect } from 'react';
import type { LiveClassSession, ClassRoom } from '../../../core/database/types';
import { formatDateVietnamese } from '../../../shared/utilities/date';
import { ClassMascot } from './ClassMascot';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import {
  Play,
  Tv,
  Trophy,
  Video,
  ExternalLink,
  Plus,
  Clock,
  Users,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface ClassHeroProps {
  activeSession: LiveClassSession | null;
  activeClass: ClassRoom | null;
  participantCount?: number;
  onStartNewSession: () => void;
  onContinueSession: (sessionId: string) => void;
  onPresentSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onOpenHonorBoard?: () => void;
}

export const ClassHero: React.FC<ClassHeroProps> = ({
  activeSession,
  activeClass,
  participantCount = 0,
  onStartNewSession,
  onContinueSession,
  onPresentSession,
  onCompleteSession,
  onOpenHonorBoard,
}) => {
  // Live timer for active session
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!activeSession || !activeSession.startedAt) return;

    const startTimestamp = new Date(activeSession.startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - startTimestamp) / 1000));
      setElapsedSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectTheme = (subject: string = '') => {
    const s = subject.toLowerCase();
    if (s.includes('toán')) {
      return {
        label: 'Toán Học',
        icon: '📐',
        gradient: 'from-emerald-50 via-sky-50 to-indigo-50 dark:from-emerald-950/50 dark:via-sky-950/40 dark:to-indigo-950/50',
        border: 'border-emerald-400 dark:border-emerald-600/60',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
        decorationLabel: '🔢 Số học & Hình khối',
      };
    }
    if (s.includes('tiếng việt') || s.includes('văn') || s.includes('tập đọc')) {
      return {
        label: 'Tiếng Việt',
        icon: '📖',
        gradient: 'from-rose-50 via-amber-50 to-sky-50 dark:from-rose-950/50 dark:via-amber-950/40 dark:to-sky-950/50',
        border: 'border-rose-400 dark:border-rose-600/60',
        badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
        decorationLabel: '✍️ Chữ viết & Đọc hiểu',
      };
    }
    if (s.includes('tự nhiên') || s.includes('xã hội') || s.includes('khoa học') || s.includes('lịch sử')) {
      return {
        label: 'Tự Nhiên & Xã Hội',
        icon: '🔬',
        gradient: 'from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950/50 dark:via-emerald-950/40 dark:to-cyan-950/50',
        border: 'border-teal-400 dark:border-teal-600/60',
        badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
        decorationLabel: '🌱 Khám phá thế giới',
      };
    }
    if (s.includes('âm nhạc') || s.includes('hát')) {
      return {
        label: 'Âm Nhạc',
        icon: '🎵',
        gradient: 'from-purple-50 via-pink-50 to-amber-50 dark:from-purple-950/50 dark:via-pink-950/40 dark:to-amber-950/50',
        border: 'border-purple-400 dark:border-purple-600/60',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
        decorationLabel: '🎼 Giai điệu vui tươi',
      };
    }
    if (s.includes('mỹ thuật') || s.includes('vẽ') || s.includes('thủ công')) {
      return {
        label: 'Mỹ Thuật',
        icon: '🎨',
        gradient: 'from-amber-50 via-orange-50 to-pink-50 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-pink-950/50',
        border: 'border-amber-400 dark:border-amber-600/60',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
        decorationLabel: '🌈 Sáng tạo sắc màu',
      };
    }
    return {
      label: subject || 'Bài Học',
      icon: '🌟',
      gradient: 'from-sky-50 via-indigo-50 to-purple-50 dark:from-sky-950/50 dark:via-indigo-950/40 dark:to-purple-950/50',
      border: 'border-sky-400 dark:border-sky-600/60',
      badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
      decorationLabel: '✨ Tri thức mới',
    };
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'meet':
        return 'Google Meet';
      case 'zoom':
        return 'Zoom Workplace';
      case 'teams':
        return 'MS Teams';
      default:
        return 'Phòng Trực Tuyến';
    }
  };

  if (!activeSession) {
    // SẴN SÀNG CHO TIẾT HỌC MỚI - EMPTY STATE HERO
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 dark:from-sky-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border-2 border-sky-200 dark:border-sky-800 p-6 sm:p-8 shadow-xl">
        {/* Ambient Glows */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
            <ClassMascot state="ready" size="lg" showSpeechBubble={false} />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 text-xs font-black tracking-wide border border-sky-300 dark:border-sky-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                KHÔNG GIAN LỚP HỌC SỐ
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Sẵn Sàng Cho Tiết Học Mới?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg">
                Tạo một phiên học trực tuyến để bắt đầu hành trình điểm danh, gọi tên ngẫu nhiên, vinh danh và phát biểu cùng học sinh.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-5 h-5" />}
              className="w-full sm:w-auto shadow-lg shadow-sky-500/25 px-6 py-3.5 text-base font-bold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700"
              onClick={onStartNewSession}
            >
              Tạo Phiên Học Mới
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const subjectTheme = getSubjectTheme(activeSession.subject);

  // ACTIVE SESSION HERO — BẢNG LỚP ĐIỆN TỬ (DIGITAL CLASS BOARD)
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${subjectTheme.gradient} border-2 ${subjectTheme.border} p-6 sm:p-7 shadow-xl shadow-sky-500/10`}>
      {/* Decorative Radial Lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-sky-300/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Info Suite */}
        <div className="space-y-3.5 max-w-2xl">
          {/* Top Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black tracking-wider shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              ĐANG DIỄN RA
            </span>
            <Badge variant="neutral" className="font-extrabold text-xs px-3 py-1 bg-white/80 dark:bg-slate-800/80 shadow-2xs">
              Lớp {activeClass?.name || 'Chủ nhiệm'}
            </Badge>
            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border shadow-2xs ${subjectTheme.badgeBg}`}>
              {subjectTheme.icon} {subjectTheme.label}
            </span>
            <Badge variant="primary" className="font-extrabold text-xs px-3 py-1 bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
              {getPlatformLabel(activeSession.meetingPlatform)}
            </Badge>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight flex items-center gap-2">
              <span>{activeSession.title}</span>
            </h2>
            <div className="mt-2 flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold">
                <BookOpen className="w-4 h-4 text-sky-500" />
                Môn: <strong className="text-slate-900 dark:text-slate-100">{activeSession.subject}</strong>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4 text-emerald-500" />
                {participantCount > 0 ? `${participantCount} học sinh` : formatDateVietnamese(activeSession.sessionDate)}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                ⏱️ {formatElapsed(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Meeting Room Link */}
          {activeSession.meetingUrl && (
            <div className="pt-1">
              <a
                href={activeSession.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
              >
                <Video className="w-4 h-4" />
                Mở phòng họp {getPlatformLabel(activeSession.meetingPlatform)}
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          )}
        </div>

        {/* Center Mascot with Speech bubble */}
        <div className="hidden xl:flex items-center justify-center">
          <ClassMascot
            state="learning"
            size="md"
            showSpeechBubble={true}
            message="Lớp 1A1 đang học rất chăm chỉ! Cố lên nào! ⭐"
          />
        </div>

        {/* Right Action Suite */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 w-full lg:w-auto shrink-0">
          <button
            onClick={() => onContinueSession(activeSession.id)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>VÀO LỚP NGAY</span>
          </button>

          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Tv className="w-4 h-4 text-indigo-600" />}
              className="flex-1 justify-center bg-white/90 dark:bg-slate-800/90 font-bold border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
              onClick={() => onPresentSession(activeSession.id)}
            >
              Màn hình lớp
            </Button>

            {onOpenHonorBoard && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trophy className="w-4 h-4 text-amber-500" />}
                className="flex-1 justify-center bg-white/90 dark:bg-slate-800/90 font-bold border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                onClick={onOpenHonorBoard}
              >
                Bục vinh danh
              </Button>
            )}
          </div>

          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn hoàn thành phiên học này và lưu báo cáo?')) {
                onCompleteSession(activeSession.id);
              }
            }}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-center mt-1 transition-colors underline decoration-dashed cursor-pointer"
          >
            Hoàn thành tiết học & đóng phiên
          </button>
        </div>
      </div>
    </div>
  );
};
