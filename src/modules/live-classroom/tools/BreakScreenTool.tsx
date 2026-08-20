import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { CuteCloudSVG, CuteRainbowSVG } from '../../../shared/components/CuteDecorations';
import { liveBroadcastService } from '../../../core/services/live-classroom';
import { Coffee, Play, Pause, ArrowLeft } from 'lucide-react';

interface BreakScreenToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BreakScreenTool: React.FC<BreakScreenToolProps> = ({ isOpen, onClose }) => {
  const [breakSeconds, setBreakSeconds] = useState(300); // 5 mins
  const [remaining, setRemaining] = useState<number>(300);
  const [isRunning, setIsRunning] = useState(false);
  const [message] = useState('Giờ nghỉ giải lao! Các em vươn vai, uống nước và thư giãn nhé ☕');

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          liveBroadcastService.postMessage({
            type: 'BREAK_SCREEN_STATE',
            payload: { active: true, remainingSeconds: 0, message },
          });
          return 0;
        }
        const nextSecs = prev - 1;
        liveBroadcastService.postMessage({
          type: 'BREAK_SCREEN_STATE',
          payload: { active: true, remainingSeconds: nextSecs, message },
        });
        return nextSecs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, message]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const handleStartBreak = () => {
    setIsRunning(true);
    liveBroadcastService.postMessage({
      type: 'BREAK_SCREEN_STATE',
      payload: { active: true, remainingSeconds: remaining, message },
    });
  };

  const handleStopBreak = () => {
    setIsRunning(false);
    liveBroadcastService.postMessage({
      type: 'BREAK_SCREEN_STATE',
      payload: null,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleStopBreak} title="Màn Hình Nghỉ Giải Lao Thân Thiện">
      <div className="space-y-4 py-2 text-center relative overflow-hidden">
        {/* DECORATIONS */}
        <div className="absolute top-0 left-2 opacity-30 pointer-events-none">
          <CuteCloudSVG className="w-12 h-12" />
        </div>
        <div className="absolute top-0 right-2 opacity-30 pointer-events-none">
          <CuteRainbowSVG className="w-16 h-16" />
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 via-teal-50 to-purple-50 border-2 border-blue-200 shadow-md space-y-3">
          <Coffee className="w-12 h-12 text-teal-600 mx-auto animate-bounce" />
          <h2 className="text-xl font-extrabold text-slate-800">{message}</h2>

          <div className="p-4 rounded-2xl bg-slate-900 text-amber-300 font-mono text-4xl font-extrabold tracking-widest inline-block mx-auto shadow-inner">
            {formatTime(remaining)}
          </div>
        </div>

        {/* PRESET BUTTONS */}
        <div className="flex items-center justify-center gap-2 text-xs">
          {[180, 300, 600, 900].map((secs) => (
            <button
              key={secs}
              onClick={() => {
                setBreakSeconds(secs);
                setRemaining(secs);
                setIsRunning(false);
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
                breakSeconds === secs ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {secs / 60} phút
            </button>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleStopBreak}
          >
            Quay lại bài học
          </Button>

          <Button
            variant="primary"
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            leftIcon={isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            onClick={() => {
              if (isRunning) {
                setIsRunning(false);
              } else {
                handleStartBreak();
              }
            }}
          >
            {isRunning ? 'Tạm dừng đếm' : 'Bắt đầu giờ giải lao'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
