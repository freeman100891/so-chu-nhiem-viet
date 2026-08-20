import React from 'react';
import { useReports } from './ReportsContext';
import { HonorTitlesReportChart } from './components/HonorTitlesReportChart';
import { Card } from '../../shared/components/Card';

export const HonorsReportPage: React.FC = () => {
  const { report } = useReports();

  if (!report) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. HONORS BAR CHART */}
      <HonorTitlesReportChart data={report.honorTitlesStats} />

      {/* 2. HONORS BREAKDOWN BY TITLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.honorTitlesStats.map((grp) => (
          <Card key={grp.title.id} className="p-4 space-y-3 border-app">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: grp.title.colorToken }}
                />
                <h4 className="text-sm font-black text-app-main">{grp.title.name}</h4>
              </div>
              <span className="text-xs font-mono font-bold text-app-primary">
                {grp.recipientCount} học sinh
              </span>
            </div>

            {grp.recipients.length === 0 ? (
              <p className="text-xs text-app-muted italic">Chưa có học sinh nhận danh hiệu này trong kỳ.</p>
            ) : (
              <div className="divide-y divide-app max-h-48 overflow-y-auto pr-1">
                {grp.recipients.map((rec, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-app-main">{rec.studentName}</p>
                      <p className="text-[10px] text-app-muted">{rec.rankName}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{rec.date}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
