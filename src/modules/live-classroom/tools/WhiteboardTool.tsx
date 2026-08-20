import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Download, RotateCcw, Trash2, Edit3, Eraser, Sparkles } from 'lucide-react';

interface WhiteboardToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhiteboardTool: React.FC<WhiteboardToolProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [toolMode, setToolMode] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#24324A');
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  // Undo / Redo history stack
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  const saveState = React.useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const next = prev.slice(0, historyStep + 1);
      next.push(imageData);
      setHistoryStep(next.length - 1);
      return next;
    });
  }, [historyStep]);

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background on init
    if (historyStep === -1) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState(ctx, canvas);
    }
  }, [isOpen, historyStep, saveState]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (toolMode === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth * 4;
      ctx.globalAlpha = 1.0;
    } else if (toolMode === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * 3;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 1.0;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 1.0;
        saveState(ctx, canvas);
      }
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const nextStep = historyStep - 1;
      ctx.putImageData(history[nextStep]!, 0, 0);
      setHistoryStep(nextStep);
    }
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng viết?')) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState(ctx, canvas);
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `BangViet_LiveClassroom_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bảng Viết Trực Quan Dành Cho Tiết Học">
      <div className="space-y-3 py-1 text-xs">
        {/* DRAWING TOOLBAR */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-100 flex-wrap">
          {/* TOOLS */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setToolMode('pen')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold ${toolMode === 'pen' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
            >
              <Edit3 className="w-4 h-4" /> Bút viết
            </button>
            <button
              onClick={() => setToolMode('highlighter')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold ${toolMode === 'highlighter' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600'}`}
            >
              <Sparkles className="w-4 h-4" /> Bút nhớ
            </button>
            <button
              onClick={() => setToolMode('eraser')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold ${toolMode === 'eraser' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600'}`}
            >
              <Eraser className="w-4 h-4" /> Tẩy
            </button>
          </div>

          {/* COLORS */}
          <div className="flex items-center gap-1.5">
            {['#24324A', '#4F8EF7', '#FF7B7B', '#70D7C4', '#FFD166', '#9B8AFB'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-slate-800 ring-2 ring-slate-300' : 'border-white'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* LINE WIDTH & ACTIONS */}
          <div className="flex items-center gap-2">
            <select
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="p-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700"
            >
              <option value={2}>Nét mỏng</option>
              <option value={4}>Nét vừa</option>
              <option value={8}>Nét dày</option>
            </select>

            <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 rounded-xl bg-white text-slate-700 disabled:opacity-40" title="Hoàn tác">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={handleClear} className="p-2 rounded-xl bg-white text-red-600" title="Xóa bảng">
              <Trash2 className="w-4 h-4" />
            </button>
            <Button size="sm" variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportPNG}>
              Xuất PNG
            </Button>
          </div>
        </div>

        {/* CANVAS BOARD */}
        <div className="border-2 border-slate-200 rounded-3xl overflow-hidden shadow-inner bg-white cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={720}
            height={400}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-auto touch-none"
          />
        </div>
      </div>
    </Modal>
  );
};
