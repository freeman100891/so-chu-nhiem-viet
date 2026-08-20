export interface EmulationRank {
  level: number; // 1 to 17
  id: string;
  name: string;
  minPoints: number;
  iconType: 'stripes_bronze' | 'stripes_silver' | 'stars_silver' | 'stars_gold' | 'stars_platinum';
  iconCount: number; // 1, 2, 3, or 4
  color: string; // Tailwind color or CSS color class
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface StudentRankInfo {
  studentId: string;
  totalPoints: number;
  currentRank: EmulationRank;
  nextRank: EmulationRank | null;
  pointsToNextRank: number;
  progressPercent: number; // 0 to 100
}

export const DEFAULT_EMULATION_RANKS: EmulationRank[] = [
  {
    level: 1,
    id: 'binh_nhi',
    name: 'Binh nhì',
    minPoints: 0,
    iconType: 'stripes_bronze',
    iconCount: 1,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    description: 'Tân binh khởi đầu hành trình thi đua',
  },
  {
    level: 2,
    id: 'binh_nhat',
    name: 'Binh nhất',
    minPoints: 50,
    iconType: 'stripes_bronze',
    iconCount: 2,
    color: 'text-amber-800',
    bgColor: 'bg-amber-100/60',
    borderColor: 'border-amber-400',
    description: 'Bắt đầu tích lũy điểm thi đua chăm chỉ',
  },
  {
    level: 3,
    id: 'ha_si',
    name: 'Hạ sĩ',
    minPoints: 100,
    iconType: 'stripes_silver',
    iconCount: 1,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    description: 'Tích cực học tập và phát biểu trên lớp',
  },
  {
    level: 4,
    id: 'trung_si',
    name: 'Trung sĩ',
    minPoints: 150,
    iconType: 'stripes_silver',
    iconCount: 2,
    color: 'text-slate-800',
    bgColor: 'bg-slate-200/70',
    borderColor: 'border-slate-400',
    description: 'Nề nếp tốt, hỗ trợ bạn bè trong tổ',
  },
  {
    level: 5,
    id: 'thuong_si',
    name: 'Thượng sĩ',
    minPoints: 200,
    iconType: 'stripes_silver',
    iconCount: 3,
    color: 'text-slate-900',
    bgColor: 'bg-slate-200',
    borderColor: 'border-slate-500',
    description: 'Gương mẫu trong các hoạt động của lớp',
  },
  {
    level: 6,
    id: 'thieu_uy',
    name: 'Thiếu úy',
    minPoints: 250,
    iconType: 'stars_silver',
    iconCount: 1,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    description: 'Đạt danh hiệu Cán bộ Thi đua xuất sắc',
  },
  {
    level: 7,
    id: 'trung_uy',
    name: 'Trung úy',
    minPoints: 300,
    iconType: 'stars_silver',
    iconCount: 2,
    color: 'text-blue-800',
    bgColor: 'bg-blue-100/70',
    borderColor: 'border-blue-400',
    description: 'Thành tích học tập vững vàng, tiến bộ vượt bậc',
  },
  {
    level: 8,
    id: 'thuong_uy',
    name: 'Thượng úy',
    minPoints: 350,
    iconType: 'stars_silver',
    iconCount: 3,
    color: 'text-blue-900',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    description: 'Dẫn đầu phong trào thi đua học tốt',
  },
  {
    level: 9,
    id: 'dai_uy',
    name: 'Đại úy',
    minPoints: 400,
    iconType: 'stars_silver',
    iconCount: 4,
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-400',
    description: 'Chỉ huy thi đua xuất sắc của tập thể',
  },
  {
    level: 10,
    id: 'thieu_ta',
    name: 'Thiếu tá',
    minPoints: 450,
    iconType: 'stars_gold',
    iconCount: 1,
    color: 'text-amber-900 font-extrabold',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-500',
    description: 'Đạt danh mốc Vàng thi đua cấp trường',
  },
  {
    level: 11,
    id: 'trung_ta',
    name: 'Trung tá',
    minPoints: 500,
    iconType: 'stars_gold',
    iconCount: 2,
    color: 'text-amber-950 font-extrabold',
    bgColor: 'bg-amber-200/80',
    borderColor: 'border-amber-600',
    description: 'Thành tích thi đua vô cùng rực rỡ',
  },
  {
    level: 12,
    id: 'thuong_ta',
    name: 'Thượng tá',
    minPoints: 550,
    iconType: 'stars_gold',
    iconCount: 3,
    color: 'text-yellow-900 font-extrabold',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    description: 'Học sinh tiêu biểu hàng đầu của toàn khối',
  },
  {
    level: 13,
    id: 'dai_ta',
    name: 'Đại tá',
    minPoints: 600,
    iconType: 'stars_gold',
    iconCount: 4,
    color: 'text-yellow-950 font-extrabold',
    bgColor: 'bg-yellow-200',
    borderColor: 'border-yellow-600',
    description: 'Ngôi sao sáng trong phong trào học tập',
  },
  {
    level: 14,
    id: 'thieu_tuong',
    name: 'Thiếu tướng',
    minPoints: 650,
    iconType: 'stars_platinum',
    iconCount: 1,
    color: 'text-purple-900 font-extrabold',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-400',
    description: 'Đạt danh hiệu Tướng Lĩnh Thi Đua cao quý',
  },
  {
    level: 15,
    id: 'trung_tuong',
    name: 'Trung tướng',
    minPoints: 700,
    iconType: 'stars_platinum',
    iconCount: 2,
    color: 'text-purple-950 font-extrabold',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-500',
    description: 'Bản lĩnh vững vàng, phong độ đỉnh cao',
  },
  {
    level: 16,
    id: 'thuong_tuong',
    name: 'Thượng tướng',
    minPoints: 750,
    iconType: 'stars_platinum',
    iconCount: 3,
    color: 'text-rose-900 font-extrabold',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-400',
    description: 'Học sinh xuất sắc kiệt xuất của năm học',
  },
  {
    level: 17,
    id: 'dai_tuong',
    name: 'Đại tướng',
    minPoints: 800,
    iconType: 'stars_platinum',
    iconCount: 4,
    color: 'text-emerald-950 font-black',
    bgColor: 'bg-gradient-to-r from-amber-100 via-emerald-100 to-sky-100',
    borderColor: 'border-amber-500',
    description: 'Cấp bậc Thi đua Cao nhất - Đại Tướng Học Tập',
  },
];

export function convertRankLevelToEmulationRank(rank: { level: number; name: string; minPoints: number; description?: string }): EmulationRank {
  const matched = DEFAULT_EMULATION_RANKS.find((r) => r.level === rank.level);
  if (matched) {
    return {
      ...matched,
      name: rank.name,
      minPoints: rank.minPoints,
      description: rank.description || matched.description,
    };
  }
  return DEFAULT_EMULATION_RANKS[0]!;
}
