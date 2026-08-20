import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { StudentAvatar } from '../../../shared/components/StudentAvatar';
import { honorBoardRepository, honorRecipientRepository } from '../../../core/repositories/honor-board.repository';
import { db } from '../../../core/database/db';
import type { HonorBoard, HonorRecipient, Student } from '../../../core/database/types';
import { Trophy, ArrowRight, Plus, Crown } from 'lucide-react';

export interface DashboardHonorBoardWidgetProps {
  classId?: string;
}

export const DashboardHonorBoardWidget: React.FC<DashboardHonorBoardWidgetProps> = ({
  classId,
}) => {
  const navigate = useNavigate();
  const [latestBoard, setLatestBoard] = useState<HonorBoard | null>(null);
  const [topRecipients, setTopRecipients] = useState<{ recipient: HonorRecipient; student: Student }[]>([]);
  const [totalHonors, setTotalHonors] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadWidgetData = async () => {
      if (!classId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const boards = await honorBoardRepository.findByClass(classId);
        const published = boards.find((b) => b.status === 'published');

        if (published) {
          setLatestBoard(published);
          const recipients = await honorRecipientRepository.findByBoard(published.id);
          setTotalHonors(recipients.filter((r) => r.isApproved).length);

          const list: { recipient: HonorRecipient; student: Student }[] = [];
          for (const rec of recipients.slice(0, 3)) {
            const st = await db.students.get(rec.studentId);
            if (st) list.push({ recipient: rec, student: st });
          }
          setTopRecipients(list);
        } else {
          setLatestBoard(null);
          setTopRecipients([]);
          setTotalHonors(0);
        }
      } catch (err) {
        console.error('Error loading dashboard honor widget:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWidgetData();
  }, [classId]);

  return (
    <Card
      title="Bảng Vàng Tuần Này"
      action={
        latestBoard ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-amber-600 font-bold p-0 hover:bg-transparent"
            onClick={() => navigate(`/conduct/honor-board/${latestBoard.id}`)}
          >
            Xem chi tiết <ArrowRight className="w-3.5 h-3.5 ml-0.5 inline" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-app-primary font-bold p-0 hover:bg-transparent"
            onClick={() => navigate('/conduct/honor-board/new')}
          >
            Tạo mới <Plus className="w-3.5 h-3.5 ml-0.5 inline" />
          </Button>
        )
      }
    >
      <div className="space-y-3">
        {loading ? (
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ) : !latestBoard ? (
          <div className="py-6 text-center bg-amber-50/40 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 mx-auto flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
              Chưa có Bảng Vàng nào được công bố tuần này.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-100/50"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate('/conduct/honor-board/new')}
            >
              Tạo Bảng Vàng vinh danh
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-amber-100/60 via-amber-50/40 to-yellow-100/50 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600 fill-current" />
                <span className="text-xs font-black text-amber-950 dark:text-amber-200 truncate">
                  {latestBoard.title}
                </span>
              </div>
              <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                {totalHonors} danh hiệu
              </span>
            </div>

            <div className="divide-y divide-app">
              {topRecipients.map(({ recipient, student }, idx) => (
                <div
                  key={recipient.id}
                  onClick={() => navigate(`/students/${student.id}`)}
                  className="py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <StudentAvatar
                      student={student}
                      score={recipient.pointsAtAward}
                      size="xs"
                      className="border border-app shrink-0 shadow-2xs"
                    />
                    <span className="font-bold text-app-main truncate">{student.fullName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-app-primary truncate ml-2">
                    {recipient.titleNameAtAward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
