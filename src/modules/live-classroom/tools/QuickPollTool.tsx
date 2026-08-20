import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { liveBroadcastService } from '../../../core/services/live-classroom';
import { HelpCircle, Monitor, RefreshCw } from 'lucide-react';

interface QuickPollToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPollTool: React.FC<QuickPollToolProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('Câu hỏi: Đáp án nào dưới đây là kết quả của 25 + 35?');
  const [optA, setOptA] = useState('A. 50');
  const [optB, setOptB] = useState('B. 60');
  const [optC, setOptC] = useState('C. 70');
  const [optD, setOptD] = useState('D. 80');

  const [correctIdx] = useState<number | null>(1); // Default B is correct
  const [counts, setCounts] = useState<number[]>([2, 28, 3, 1]); // Default count simulation

  const [isPresenting, setIsPresenting] = useState(false);

  const handleBroadcastPoll = () => {
    liveBroadcastService.postMessage({
      type: 'POLL_STATE',
      payload: {
        question,
        options: [optA, optB, optC, optD],
        correctAnswerIndex: correctIdx,
        counts,
      },
    });
    setIsPresenting(true);
  };

  const handleClearPoll = () => {
    liveBroadcastService.postMessage({
      type: 'POLL_STATE',
      payload: null,
    });
    setIsPresenting(false);
  };

  const totalVotes = counts.reduce((sum, c) => sum + c, 0) || 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Câu Hỏi Nhanh Lớp Học (A/B/C/D)">
      <div className="space-y-4 py-2 text-xs">
        <Input
          label="Nội dung câu hỏi"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input label="Phương án A" value={optA} onChange={(e) => setOptA(e.target.value)} />
          <Input label="Phương án B" value={optB} onChange={(e) => setOptB(e.target.value)} />
          <Input label="Phương án C" value={optC} onChange={(e) => setOptC(e.target.value)} />
          <Input label="Phương án D" value={optD} onChange={(e) => setOptD(e.target.value)} />
        </div>

        {/* COUNTS INPUT & RESULT CHART */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" /> Nhập số lượng lựa chọn của học sinh & xem biểu đồ:
          </h4>

          <div className="grid grid-cols-4 gap-2 text-center">
            {['A', 'B', 'C', 'D'].map((letter, idx) => (
              <div key={letter} className="space-y-1">
                <label className="font-bold text-slate-600 text-[11px]">Số em chọn {letter}</label>
                <input
                  type="number"
                  min="0"
                  value={counts[idx]}
                  onChange={(e) => {
                    const next = [...counts];
                    next[idx] = Math.max(0, Number(e.target.value));
                    setCounts(next);
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 text-center font-bold text-slate-800"
                />
              </div>
            ))}
          </div>

          {/* VISUAL BAR CHART */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            {[optA, optB, optC, optD].map((optText, idx) => {
              const count = counts[idx] || 0;
              const percent = Math.round((count / totalVotes) * 100);
              const isCorrect = correctIdx === idx;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                    <span className={isCorrect ? 'text-emerald-700 font-extrabold' : ''}>
                      {optText} {isCorrect ? '✓ (Đáp án đúng)' : ''}
                    </span>
                    <span>{count} em ({percent}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 overflow-hidden flex">
                    <div
                      className={`h-full transition-all ${isCorrect ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PRESENTATION CONTROLS */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={handleClearPoll}
          >
            Tắt màn hình câu hỏi
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            leftIcon={<Monitor className="w-4 h-4" />}
            onClick={handleBroadcastPoll}
          >
            {isPresenting ? 'Đang chiếu câu hỏi' : 'Trình chiếu câu hỏi ngay'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
