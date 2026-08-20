import React, { useState } from 'react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Table, Maximize2, Download, BarChart2 } from 'lucide-react';
import { reportExportService } from '../../../core/services/report-export.service';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  tableHeaders?: string[];
  tableRows?: (string | number)[][];
  exportFilename?: string;
  className?: string;
  extraActions?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  tableHeaders,
  tableRows,
  exportFilename = 'chart-data',
  className,
  extraActions,
}) => {
  const [showTable, setShowTable] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleExportCsv = () => {
    if (!tableHeaders || !tableRows) return;
    reportExportService.exportToCsv(exportFilename, tableHeaders, tableRows);
  };

  return (
    <>
      <Card
        className={className}
        title={
          <div className="flex items-center gap-2">
            {icon && <span className="text-app-primary">{icon}</span>}
            <div>
              <h3 className="text-base font-black text-app-main leading-tight">{title}</h3>
              {subtitle && <p className="text-xs text-app-muted font-normal mt-0.5">{subtitle}</p>}
            </div>
          </div>
        }
        action={
          <div className="flex items-center gap-1.5">
            {extraActions}

            {tableHeaders && tableRows && (
              <Button
                variant={showTable ? 'primary' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs font-bold"
                title={showTable ? 'Xem dạng biểu đồ' : 'Xem dạng bảng'}
                onClick={() => setShowTable((prev) => !prev)}
              >
                {showTable ? <BarChart2 className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
              </Button>
            )}

            {tableHeaders && tableRows && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-app-muted hover:text-app-main"
                title="Xuất CSV"
                onClick={handleExportCsv}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-app-muted hover:text-app-main"
              title="Phóng to"
              onClick={() => setIsZoomed(true)}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        }
      >
        <div className="pt-2">
          {showTable && tableHeaders && tableRows ? (
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-app rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-app-main font-bold sticky top-0">
                  <tr>
                    {tableHeaders.map((h, i) => (
                      <th key={i} className="px-3 py-2.5 border-b border-app">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-app">
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-app-main">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            children
          )}
        </div>
      </Card>

      {/* ZOOM MODAL */}
      <Modal isOpen={isZoomed} onClose={() => setIsZoomed(false)} title={title} maxWidth="2xl">
        <div className="py-2 min-h-[420px]">{children}</div>
      </Modal>
    </>
  );
};
