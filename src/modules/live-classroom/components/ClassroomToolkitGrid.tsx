import React from 'react';
import {
  Sparkles,
  Vote,
  Hand,
  PenTool,
  Coffee,
  Trophy,
  Gift,
  QrCode,
  ArrowRight,
} from 'lucide-react';

export interface ToolTile {
  id: string;
  name: string;
  subTitle: string;
  icon: React.ReactNode;
  accentGradient: string;
  badge?: string;
  badgeColor?: string;
}

interface ClassroomToolkitGridProps {
  onSelectTool: (toolId: string) => void;
  handRaisedCount?: number;
  className?: string;
}

export const ClassroomToolkitGrid: React.FC<ClassroomToolkitGridProps> = ({
  onSelectTool,
  handRaisedCount = 0,
  className = '',
}) => {
  const tools: ToolTile[] = [
    {
      id: 'random_picker',
      name: 'Gọi Tên Ngẫu Nhiên',
      subTitle: 'Quay số & bốc thăm may mắn',
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      accentGradient: 'from-amber-500/10 to-orange-500/10 hover:border-amber-400',
    },
    {
      id: 'quick_poll',
      name: 'Bình Chọn Nhanh',
      subTitle: 'Trắc nghiệm A/B/C/D tức thì',
      icon: <Vote className="w-6 h-6 text-sky-500" />,
      accentGradient: 'from-sky-500/10 to-blue-500/10 hover:border-sky-400',
    },
    {
      id: 'hand_raised',
      name: 'Giơ Tay Phát Biểu',
      subTitle: 'Hàng đợi học sinh xung phong',
      icon: <Hand className="w-6 h-6 text-rose-500" />,
      accentGradient: 'from-rose-500/10 to-pink-500/10 hover:border-rose-400',
      badge: handRaisedCount > 0 ? `+${handRaisedCount} em` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'whiteboard',
      name: 'Bảng Trắng Vẽ Nhanh',
      subTitle: 'Viết vẽ và giải thích bài',
      icon: <PenTool className="w-6 h-6 text-indigo-500" />,
      accentGradient: 'from-indigo-500/10 to-purple-500/10 hover:border-indigo-400',
    },
    {
      id: 'break_screen',
      name: 'Giờ Nghỉ Giải Lao',
      subTitle: 'Đếm lùi 5 phút & thư giãn',
      icon: <Coffee className="w-6 h-6 text-emerald-500" />,
      accentGradient: 'from-emerald-500/10 to-teal-500/10 hover:border-emerald-400',
    },
    {
      id: 'podium',
      name: 'Bục Vinh Danh',
      subTitle: 'Tuyên dương Top 3 học sinh',
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      accentGradient: 'from-yellow-500/10 to-amber-500/10 hover:border-yellow-400',
      badge: 'Bảng Vàng',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300',
    },
    {
      id: 'rewards',
      name: 'Đổi Quà Thưởng',
      subTitle: 'Mở rương quà thi đua',
      icon: <Gift className="w-6 h-6 text-purple-500" />,
      accentGradient: 'from-purple-500/10 to-pink-500/10 hover:border-purple-400',
    },
    {
      id: 'qr_generator',
      name: 'Mã QR Tài Liệu',
      subTitle: 'Chia sẻ tài liệu & link',
      icon: <QrCode className="w-6 h-6 text-cyan-500" />,
      accentGradient: 'from-cyan-500/10 to-teal-500/10 hover:border-cyan-400',
    },
  ];

  return (
    <div className={`p-5 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
            Bộ Công Cụ Lớp Học (Interactive Toolkit)
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Kích hoạt 1-click
        </span>
      </div>

      {/* Grid of 8 Bento Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`group relative p-4 rounded-2xl bg-gradient-to-br ${tool.accentGradient} bg-white dark:bg-slate-900/60 border-2 border-slate-200/80 dark:border-slate-700/80 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none flex flex-col justify-between min-h-[120px] cursor-pointer`}
          >
            {/* Top row: Icon & optional Badge */}
            <div className="flex items-start justify-between w-full">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              {tool.badge && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs ${
                    tool.badgeColor || 'bg-sky-500 text-white'
                  }`}
                >
                  {tool.badge}
                </span>
              )}
            </div>

            {/* Bottom row: Name & Subtitle */}
            <div className="mt-3">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
                <span>{tool.name}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                {tool.subTitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
