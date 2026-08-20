import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { evaluationExportService } from '../../../core/services/evaluation-export.service';
import type { EvaluationPeriodCode } from '../../../core/database/types';
import { FileSpreadsheet, Printer, ShieldCheck, Download } from 'lucide-react';
import { useToast } from '../../../shared/hooks/useToast';

export interface EvaluationExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  academicYearId: string;
  periodCode: EvaluationPeriodCode;
}

export const EvaluationExportModal: React.FC<EvaluationExportModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  academicYearId,
  periodCode,
}) => {
  const { showSuccess, showError } = useToast();
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const { blob, filename } = await evaluationExportService.exportEvaluationToExcel(
        classId,
        academicYearId,
        periodCode
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Xuất Excel thành công', `Đã tải về file: ${filename}`);
      onClose();
    } catch (err: unknown) {
      showError('Lỗi xuất Excel', (err as Error).message);
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xuất Dữ Liệu & In Ấn Bảng Đánh Giá">
      <div className="space-y-4 text-xs">
        <p className="text-app-muted leading-relaxed">
          Dữ liệu đánh giá của lớp <strong>{className}</strong> sẽ được kết xuất chuẩn hóa theo mẫu của Bộ Giáo dục & Đào tạo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Option 1: Excel Export */}
          <div className="p-4 rounded-2xl border border-app bg-app-surface hover:border-emerald-500/50 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              <h4 className="font-bold text-sm text-app-main">Xuất File Excel (.xlsx)</h4>
              <p className="text-[11px] text-app-muted">
                Bảng tính đầy đủ số thứ tự, mã học sinh, mức đánh giá các môn học, phẩm chất, năng lực và nhận xét.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
              onClick={handleExportExcel}
              isLoading={exportingExcel}
              className="w-full"
            >
              Tải file Excel
            </Button>
          </div>

          {/* Option 2: Print A4 */}
          <div className="p-4 rounded-2xl border border-app bg-app-surface hover:border-blue-500/50 transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <Printer className="w-8 h-8 text-blue-600" />
              <h4 className="font-bold text-sm text-app-main">In Ấn Trực Tiếp (A4)</h4>
              <p className="text-[11px] text-app-muted">
                Kết xuất bản in trang chuẩn A4 phục vụ lưu trữ hồ sơ sổ sách chủ nhiệm tại văn phòng trường.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4 text-blue-600" />}
              onClick={handlePrint}
              className="w-full"
            >
              Mở hộp thoại In
            </Button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>File kết xuất được tạo 100% trên thiết bị của Thầy/Cô và không gửi dữ liệu ra máy chủ ngoài.</span>
        </div>
      </div>
    </Modal>
  );
};
