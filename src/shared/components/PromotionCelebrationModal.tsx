import React, { useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { EmulationRankInsignia } from './EmulationRankBadge';
import { playPromotionFanfare } from '../utilities/sound';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';

export interface PromotionCelebrationData {
  studentName: string;
  avatar?: string | null;
  fromLevel?: number | null;
  toLevel: number;
  rankName: string;
  levelsGained?: number;
}

export interface PromotionCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PromotionCelebrationData | null;
  enableSound?: boolean;
}

export const PromotionCelebrationModal: React.FC<PromotionCelebrationModalProps> = ({
  isOpen,
  onClose,
  data,
  enableSound = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play fanfare and trigger gentle confetti on mount
  useEffect(() => {
    if (!isOpen || !data) return;

    // Play fanfare chime
    playPromotionFanfare(enableSound);

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext ? (canvas.getContext('2d') as CanvasRenderingContext2D) : null;
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444'];
    const particleCount = 45;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      rotationSpeed: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2 - 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.7) * 9,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravity
        p.rotation += p.rotationSpeed;
        p.alpha = Math.max(0, 1 - elapsed / 2200);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (elapsed < 2400) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, data, enableSound]);

  if (!isOpen || !data) return null;

  const levelsGained = data.levelsGained || (data.fromLevel ? Math.max(1, data.toLevel - data.fromLevel) : 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vinh Danh Thăng Cấp Thi Đua">
      <div className="relative overflow-hidden py-4 text-center space-y-4 rounded-2xl bg-gradient-to-b from-white via-slate-50/80 to-blue-50/40 p-2">
        {/* TOP RADIAL AMBIENT GLOW */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15)_0%,rgba(245,158,11,0.08)_45%,transparent_70%)]"
        />

        {/* CONFETTI CANVAS OVERLAY */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        />

        {/* STUDENT AVATAR & CELEBRATORY BADGE */}
        <div className="relative flex flex-col items-center justify-center pt-2">
          {/* BACKGROUND GLOW */}
          <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-amber-400/30 via-blue-400/30 to-purple-400/30 blur-2xl -z-0"></div>

          {/* LARGE INSIGNIA */}
          <div className="relative z-10 transition-transform duration-500 hover:scale-105 drop-shadow-xl">
            <EmulationRankInsignia level={data.toLevel} size="xl" />
          </div>

          {/* GAINED LEVEL PILL */}
          <div className="mt-3.5">
            <Badge variant="success" className="px-3.5 py-1 text-xs font-black shadow-md flex items-center gap-1.5 border border-emerald-300/80 bg-emerald-50 text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Thăng +{levelsGained} Cấp Bậc
            </Badge>
          </div>
        </div>

        {/* CONGRATULATION MESSAGE */}
        <div className="space-y-1.5 relative z-10">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
            🎉 Vinh danh thành tích thi đua
          </p>
          <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
            Chúc mừng <span className="text-blue-700">{data.studentName}</span>
          </h3>
          <p className="text-sm font-bold text-slate-700">
            Đã xuất sắc thăng cấp lên <strong className="text-blue-800 text-base">{data.rankName}</strong> (Cấp {data.toLevel}/17)!
          </p>
        </div>

        {/* TRANSITION COMPARISON */}
        <div className="mx-auto max-w-xs p-3 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs flex items-center justify-center gap-3 text-xs font-bold text-slate-600 relative z-10 backdrop-blur-xs">
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/70">Cấp {data.fromLevel || 1}</span>
          <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-blue-700 font-black text-sm px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200">{data.rankName} (Cấp {data.toLevel})</span>
        </div>

        <p className="text-xs text-slate-500 max-w-sm mx-auto italic relative z-10">
          "Sự nỗ lực và tinh thần tích cực của em đã được ghi nhận xứng đáng. Hãy tiếp tục giữ vững phong độ nhé!"
        </p>

        {/* ACTION BUTTON */}
        <div className="pt-2 flex justify-center relative z-10">
          <Button
            variant="primary"
            onClick={onClose}
            className="px-8 py-2.5 font-black shadow-lg hover:shadow-xl flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-white/20 active:scale-95 transition-all"
          >
            <Trophy className="w-4 h-4" /> Tuyệt vời!
          </Button>
        </div>
      </div>
    </Modal>
  );
};
