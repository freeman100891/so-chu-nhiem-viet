import React from 'react';
import { type EmulationRank, convertRankLevelToEmulationRank } from '../../core/types/emulation-rank.types';
import { cn } from '../utilities/cn';

export interface EmulationRankBadgeProps {
  rank: EmulationRank | { level: number; name: string; minPoints: number; description?: string };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showPoints?: boolean;
  className?: string;
}

/**
 * Pure Vector Educational Rank Insignia (SVG)
 * No internet assets, fully responsive, compatible with all 3 themes.
 */
export const EmulationRankInsignia: React.FC<{
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ level, size = 'md', className }) => {
  const pixelSize = size === 'sm' ? 18 : size === 'md' ? 24 : size === 'lg' ? 44 : 80;

  // Group 1: Levels 1-5 (Hạ sĩ quan và Binh sĩ)
  // Group 2: Levels 6-9 (Cấp Úy)
  // Group 3: Levels 10-13 (Cấp Tá)
  // Group 4: Levels 14-17 (Cấp Tướng)
  const isGroup1 = level <= 5;
  const isGroup2 = level >= 6 && level <= 9;
  const isGroup3 = level >= 10 && level <= 13;
  const isGroup4 = level >= 14;

  // Compute stars or chevrons count
  let count = 1;
  if (level === 2 || level === 4 || level === 7 || level === 11 || level === 15) count = 2;
  if (level === 5 || level === 8 || level === 12 || level === 16) count = 3;
  if (level === 9 || level === 13 || level === 17) count = 4;

  // Theme-safe SVG Insignia Colors
  const shieldFill = isGroup4
    ? 'url(#gradGeneral)'
    : isGroup3
    ? 'url(#gradOfficerField)'
    : isGroup2
    ? 'url(#gradOfficerCompany)'
    : level <= 2
    ? 'url(#gradSoldierBronze)'
    : 'url(#gradSoldierSilver)';

  const shieldStroke = isGroup4
    ? '#9333ea'
    : isGroup3
    ? '#d97706'
    : isGroup2
    ? '#2563eb'
    : level <= 2
    ? '#b45309'
    : '#64748b';

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none drop-shadow-xs transition-transform', className)}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="gradSoldierBronze" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>

        <linearGradient id="gradSoldierSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id="gradOfficerCompany" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>

        <linearGradient id="gradOfficerField" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>

        <linearGradient id="gradGeneral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#faf5ff" />
          <stop offset="50%" stopColor="#f3e8ff" />
          <stop offset="100%" stopColor="#e9d5ff" />
        </linearGradient>

        <linearGradient id="goldStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <linearGradient id="silverStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="platinumStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* LAUREL WREATH (VÒNG NGUYỆT QUẾ) for Field Officers (Tá) & Generals (Tướng) */}
      {(isGroup3 || isGroup4) && (
        <g stroke={isGroup4 ? '#a855f7' : '#d97706'} strokeWidth="3" fill="none" opacity="0.85">
          {/* Left Branch */}
          <path d="M 22 75 C 10 55 12 30 32 15" strokeLinecap="round" />
          <circle cx="18" cy="62" r="3" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />
          <circle cx="14" cy="46" r="3.5" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />
          <circle cx="18" cy="30" r="3.5" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />
          <circle cx="27" cy="18" r="3" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />

          {/* Right Branch */}
          <path d="M 78 75 C 90 55 88 30 68 15" strokeLinecap="round" />
          <circle cx="82" cy="62" r="3" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />
          <circle cx="86" cy="46" r="3.5" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />
          <circle cx="82" cy="30" r="3.5" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />
          <circle cx="73" cy="18" r="3" fill={isGroup4 ? '#c084fc' : '#fbbf24'} />
        </g>
      )}

      {/* SUPREME CROWN (Level 17: Đại Tướng) */}
      {level === 17 && (
        <path
          d="M 30 18 L 36 28 L 50 14 L 64 28 L 70 18 L 66 32 L 34 32 Z"
          fill="url(#goldStar)"
          stroke="#b45309"
          strokeWidth="2"
        />
      )}

      {/* BASE SHIELD (KHIÊN DANH DỰ) */}
      <path
        d="M 50 18 C 72 18 78 28 78 48 C 78 68 56 84 50 88 C 44 84 22 68 22 48 C 22 28 28 18 50 18 Z"
        fill={shieldFill}
        stroke={shieldStroke}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* INNER SHIELD BORDER */}
      <path
        d="M 50 24 C 66 24 71 32 71 48 C 71 63 54 76 50 80 C 46 76 29 63 29 48 C 29 32 34 24 50 24 Z"
        fill="none"
        stroke={shieldStroke}
        strokeWidth="1.5"
        opacity="0.4"
      />

      {/* EMBLEMS: CHEVRONS (GROUP 1) OR STARS (GROUPS 2, 3, 4) */}
      {isGroup1 && (
        <g stroke={level <= 2 ? '#b45309' : '#475569'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {count >= 1 && <path d="M 38 48 L 50 56 L 62 48" />}
          {count >= 2 && <path d="M 38 40 L 50 48 L 62 40" />}
          {count >= 3 && <path d="M 38 32 L 50 40 L 62 32" />}
        </g>
      )}

      {!isGroup1 && (
        <g fill={isGroup4 ? 'url(#platinumStar)' : isGroup3 ? 'url(#goldStar)' : 'url(#silverStar)'}>
          {count === 1 && (
            <polygon
              points="50,34 54,44 65,44 56,51 59,62 50,55 41,62 44,51 35,44 46,44"
              stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
              strokeWidth="1.5"
            />
          )}

          {count === 2 && (
            <>
              <polygon
                points="40,42 43,49 51,49 45,54 47,62 40,57 33,62 35,54 29,49 37,49"
                transform="scale(0.85) translate(4, 5)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
              <polygon
                points="60,42 63,49 71,49 65,54 67,62 60,57 53,62 55,54 49,49 57,49"
                transform="scale(0.85) translate(14, 5)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
            </>
          )}

          {count === 3 && (
            <>
              <polygon
                points="50,30 53,38 62,38 55,43 57,51 50,46 43,51 45,43 38,38 47,38"
                transform="scale(0.8) translate(12, 4)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
              <polygon
                points="36,46 39,54 48,54 41,59 43,67 36,62 29,67 31,59 24,54 33,54"
                transform="scale(0.8) translate(3, 14)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
              <polygon
                points="64,46 67,54 76,54 69,59 71,67 64,62 57,67 59,59 52,54 61,54"
                transform="scale(0.8) translate(21, 14)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
            </>
          )}

          {count === 4 && (
            <>
              <polygon
                points="50,26 53,34 62,34 55,39 57,47 50,42 43,47 45,39 38,34 47,34"
                transform="scale(0.72) translate(19, 4)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
              <polygon
                points="33,40 36,48 45,48 38,53 40,61 33,56 26,61 28,53 21,48 30,48"
                transform="scale(0.72) translate(6, 14)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
              <polygon
                points="67,40 70,48 79,48 72,53 74,61 67,56 60,61 62,53 55,48 64,48"
                transform="scale(0.72) translate(32, 14)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
              <polygon
                points="50,54 53,62 62,62 55,67 57,75 50,70 43,75 45,67 38,62 47,62"
                transform="scale(0.72) translate(19, 24)"
                stroke={isGroup4 ? '#581c87' : isGroup3 ? '#78350f' : '#1e3a8a'}
                strokeWidth="1.5"
              />
            </>
          )}
        </g>
      )}
    </svg>
  );
};

export const EmulationRankBadge: React.FC<EmulationRankBadgeProps> = ({
  rank: rawRank,
  size = 'md',
  showName = true,
  showPoints = false,
  className,
}) => {
  const rank = 'iconType' in rawRank ? (rawRank as EmulationRank) : convertRankLevelToEmulationRank(rawRank);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shadow-xs select-none transition-all',
        rank.bgColor,
        rank.borderColor,
        rank.color,
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : size === 'lg'
          ? 'px-3.5 py-1.5 text-sm'
          : size === 'xl'
          ? 'px-5 py-2.5 text-base'
          : 'px-2.5 py-1 text-xs',
        className
      )}
      title={`${rank.name} (${rank.minPoints} điểm) - ${rank.description}`}
    >
      <EmulationRankInsignia level={rank.level} size={size === 'xl' ? 'lg' : size} />
      {showName && <span className="font-extrabold tracking-tight">{rank.name}</span>}
      {showPoints && <span className="text-[10px] font-bold opacity-80">({rank.minPoints}đ)</span>}
    </div>
  );
};
