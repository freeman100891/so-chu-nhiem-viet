import React from 'react';

export type MascotState =
  | 'ready'
  | 'learning'
  | 'attendance_complete'
  | 'point_awarded'
  | 'random_call'
  | 'rank_up'
  | 'honor'
  | 'break'
  | 'completed'
  | 'CLASS_READY'
  | 'CLASS_ACTIVE'
  | 'ATTENDANCE_COMPLETE'
  | 'SCORE_AWARDED'
  | 'RANDOM_CALL'
  | 'RANK_UP'
  | 'HONOR'
  | 'BREAK'
  | 'SESSION_COMPLETE';

interface ClassMascotProps {
  state?: MascotState;
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'presentation';
  message?: string;
  className?: string;
  showSpeechBubble?: boolean;
  onClick?: () => void;
}

const DEFAULT_MESSAGES: Record<string, string> = {
  ready: 'Chào mừng cả lớp! Sẵn sàng khám phá kiến thức mới nào! ✨',
  learning: 'Cả lớp tập trung nhé! Ai sẽ là người tiếp theo xung phong nào? 📖',
  attendance_complete: 'Sĩ số lớp mình đã đủ 100%! Cả lớp tuyệt vời lắm! 👍',
  point_awarded: 'Tuyệt vời quá! + Điểm thưởng xứng đáng! 🌟',
  random_call: 'Ai sẽ là gương mặt may mắn tiếp theo được gọi tên? 🎲',
  rank_up: 'Chúc mừng bạn đã thăng cấp mới! Cố lên nào! 🚀',
  honor: 'Vinh danh những gương mặt xuất sắc nhất tiết học! 🏆',
  break: 'Giờ nghỉ ngơi 5 phút, uống nước và vươn vai thư giãn nhé! ☕',
  completed: 'Tiết học hôm nay thật tuyệt vời! Cảm ơn các bạn nhỏ! 🎉',
};

const normalizeState = (st: MascotState): string => {
  const map: Record<string, string> = {
    CLASS_READY: 'ready',
    CLASS_ACTIVE: 'learning',
    ATTENDANCE_COMPLETE: 'attendance_complete',
    SCORE_AWARDED: 'point_awarded',
    RANDOM_CALL: 'random_call',
    RANK_UP: 'rank_up',
    HONOR: 'honor',
    BREAK: 'break',
    SESSION_COMPLETE: 'completed',
  };
  return map[st] || st.toLowerCase();
};

export const ClassMascot: React.FC<ClassMascotProps> = ({
  state = 'ready',
  size = 'md',
  message,
  className = '',
  showSpeechBubble = false,
  onClick,
}) => {
  const activeState = normalizeState(state);
  const displayMessage = message || DEFAULT_MESSAGES[activeState] || DEFAULT_MESSAGES.ready;

  // Size mapping
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    hero: 'w-32 h-32 sm:w-40 sm:h-40',
    presentation: 'w-44 h-44 sm:w-56 sm:h-56',
  }[size];

  return (
    <div
      className={`inline-flex flex-col items-center select-none relative ${className}`}
      onClick={onClick}
    >
      {/* Speech bubble */}
      {showSpeechBubble && (
        <div className="mb-2 max-w-[280px] sm:max-w-xs px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold shadow-lg border-2 border-sky-200 dark:border-sky-800 text-center relative animate-bounce-subtle">
          <p className="leading-snug">{displayMessage}</p>
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white dark:border-t-slate-800" />
        </div>
      )}

      {/* Mascot Graphic */}
      <div className={`relative ${sizeClasses} animate-float-soft transition-transform duration-300 hover:scale-105 cursor-pointer`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="boBodyGrad" x1="40" y1="20" x2="160" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="0.5" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="boBellyGrad" x1="60" y1="90" x2="140" y2="170" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient id="boEarGrad" x1="30" y1="20" x2="70" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93C5FD" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Left & Right Ears */}
          <circle cx="52" cy="52" r="24" fill="url(#boEarGrad)" stroke="#1D4ED8" strokeWidth="4" />
          <circle cx="52" cy="52" r="14" fill="#F472B6" opacity="0.6" />

          <circle cx="148" cy="52" r="24" fill="url(#boEarGrad)" stroke="#1D4ED8" strokeWidth="4" />
          <circle cx="148" cy="52" r="14" fill="#F472B6" opacity="0.6" />

          {/* Antenna / Star light */}
          <path d="M100 45 L100 24" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="20" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="3" className="animate-pulse" />
          <path d="M96 20 L104 20 M100 16 L100 24" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />

          {/* Head & Body Capsule */}
          <rect
            x="40"
            y="42"
            width="120"
            height="130"
            rx="60"
            fill="url(#boBodyGrad)"
            stroke="#1E40AF"
            strokeWidth="5"
          />

          {/* White Belly */}
          <ellipse cx="100" cy="128" rx="42" ry="34" fill="url(#boBellyGrad)" />

          {/* Screen / Visor Mask */}
          <rect
            x="58"
            y="65"
            width="84"
            height="46"
            rx="23"
            fill="#0F172A"
            stroke="#38BDF8"
            strokeWidth="3"
          />

          {/* Eyes based on state */}
          {activeState === 'point_awarded' || activeState === 'completed' || activeState === 'rank_up' || activeState === 'attendance_complete' ? (
            /* Joyful arched eyes ^_^ */
            <g stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M74 88 Q82 76 90 88" />
              <path d="M110 88 Q118 76 126 88" />
            </g>
          ) : activeState === 'break' ? (
            /* Sleepy / Relaxed curved lines -_- */
            <g stroke="#38BDF8" strokeWidth="4" strokeLinecap="round">
              <line x1="72" y1="88" x2="90" y2="88" />
              <line x1="110" y1="88" x2="128" y2="88" />
            </g>
          ) : (
            /* Friendly big glowing eyes O_O */
            <g>
              <ellipse cx="80" cy="88" rx="8" ry="10" fill="#38BDF8" />
              <circle cx="83" cy="85" r="3.5" fill="#FFFFFF" />
              <ellipse cx="120" cy="88" rx="8" ry="10" fill="#38BDF8" />
              <circle cx="123" cy="85" r="3.5" fill="#FFFFFF" />
            </g>
          )}

          {/* Cheeks blush */}
          <circle cx="68" cy="116" r="8" fill="#FB7185" opacity="0.75" />
          <circle cx="132" cy="116" r="8" fill="#FB7185" opacity="0.75" />

          {/* Smile mouth */}
          <path
            d="M92 120 Q100 128 108 120"
            stroke="#1E3A8A"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* State Specific Accessories */}
          {activeState === 'ready' && (
            /* Waving left hand */
            <g>
              <circle cx="28" cy="85" r="14" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="3.5" />
              <path d="M18 70 Q28 60 38 70" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {activeState === 'attendance_complete' && (
            /* Thumbs up badge */
            <g>
              <circle cx="28" cy="90" r="14" fill="#10B981" stroke="#047857" strokeWidth="3.5" />
              <path d="M24 90 L28 82 L32 90 Z" fill="#FFF" />
              <rect x="25" y="90" width="6" height="8" rx="1" fill="#FFF" />
            </g>
          )}

          {activeState === 'random_call' && (
            /* Raffle Lucky Die */
            <g>
              <rect x="85" y="135" width="30" height="30" rx="6" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
              <circle cx="94" cy="144" r="2.5" fill="#FFF" />
              <circle cx="106" cy="144" r="2.5" fill="#FFF" />
              <circle cx="100" cy="150" r="2.5" fill="#FFF" />
              <circle cx="94" cy="156" r="2.5" fill="#FFF" />
              <circle cx="106" cy="156" r="2.5" fill="#FFF" />
            </g>
          )}

          {activeState === 'learning' && (
            /* Holding a magic book */
            <g>
              <rect x="74" y="132" width="52" height="32" rx="4" fill="#F43F5E" stroke="#881337" strokeWidth="2.5" />
              <rect x="78" y="136" width="20" height="24" rx="2" fill="#FFF" />
              <rect x="102" y="136" width="20" height="24" rx="2" fill="#FFF" />
              <circle cx="86" cy="144" r="2" fill="#FBBF24" />
              <circle cx="112" cy="144" r="2" fill="#FBBF24" />
            </g>
          )}

          {activeState === 'honor' && (
            /* Holding a Golden Trophy */
            <g>
              <path
                d="M84 126 L116 126 L110 148 Q100 156 90 148 Z"
                fill="url(#goldGrad)"
                stroke="#B45309"
                strokeWidth="2.5"
              />
              <rect x="94" y="152" width="12" height="10" fill="#B45309" />
              <rect x="88" y="160" width="24" height="6" rx="2" fill="#78350F" />
              {/* Star on trophy */}
              <circle cx="100" cy="138" r="4" fill="#FFF" />
            </g>
          )}

          {activeState === 'rank_up' && (
            /* Graduation Scholar Cap */
            <g>
              <polygon points="100,5 155,24 100,43 45,24" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
              <rect x="85" y="32" width="30" height="12" rx="4" fill="#0F172A" />
              <path d="M150 25 L162 48" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
              <circle cx="162" cy="50" r="4" fill="#F59E0B" />
            </g>
          )}

          {activeState === 'break' && (
            /* Headphones */
            <g>
              <path d="M40 90 A 60 60 0 0 1 160 90" stroke="#F43F5E" strokeWidth="6" fill="none" strokeLinecap="round" />
              <rect x="34" y="80" width="14" height="24" rx="7" fill="#F43F5E" stroke="#881337" strokeWidth="2" />
              <rect x="152" y="80" width="14" height="24" rx="7" fill="#F43F5E" stroke="#881337" strokeWidth="2" />
            </g>
          )}

          {/* Badge icon on belly */}
          <circle cx="100" cy="120" r="10" fill="#10B981" />
          <path d="M96 120 L99 123 L105 117" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};
