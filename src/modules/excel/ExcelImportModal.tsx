import React, { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { Badge } from '../../shared/components/Badge';
import { useToast } from '../../shared/hooks/useToast';
import { excelImportService, type ImportPreviewResult } from '../../core/excel/excel-import.service';
import type { ClassRoom } from '../../core/database/types';
import {
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classList: ClassRoom[];
  defaultClassId?: string;
  onImportSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  classList,
  defaultClassId,
  onImportSuccess,
}) => {
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || classList[0]?.id || '');
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await excelImportService.generateImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mau_Nhap_Hoc_Sinh.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Tải file mẫu thành công', 'Đã xuất file Mau_Nhap_Hoc_Sinh.xlsx');
    } catch (err: unknown) {
      showError('Lỗi tải file mẫu', (err as Error).message);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      showError('Định dạng không hỗ trợ', 'Ứng dụng chỉ chấp nhận file Excel đuôi .xlsx');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showError('Dung lượng quá lớn', 'File Excel không được vượt quá 10MB.');
      return;
    }

    setFileName(file.name);
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = await excelImportService.parseAndValidateImportFile(buffer);
      setPreview(result);

      // Auto-detect & auto-select class from Excel file
      const detected = result.detectedClassName || result.validRows[0]?.className;
      if (detected && classList.length > 0) {
        const cleanDetected = detected.replace(/^(?:lớp|lop)\s*/i, '').trim().toLowerCase();
        const matched = classList.find(
          (c) =>
            c.name.trim().toLowerCase() === cleanDetected ||
            `lớp ${c.name}`.trim().toLowerCase() === cleanDetected
        );
        if (matched) {
          setSelectedClassId(matched.id);
        }
      }

      setStep(2);
    } catch (err: unknown) {
      showError('Lỗi đọc file Excel', (err as Error).message);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      const activeId = defaultClassId || classList[0]?.id || '';
      setSelectedClassId(activeId);
    }
  }, [isOpen, defaultClassId, classList]);

  const handleDownloadErrorReport = async () => {
    if (!preview || preview.errorRows.length === 0) return;
    try {
      const blob = await excelImportService.generateErrorReportExcel(preview.errorRows);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bao_Cao_Loi_Nhap_Hoc_Sinh.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  const handleExecuteImport = async () => {
    if (!preview || preview.validRows.length === 0) {
      showError('Không có dữ liệu', 'Không có dòng dữ liệu hợp lệ để nhập.');
      return;
    }

    const classIdToUse = selectedClassId || defaultClassId || classList[0]?.id || '';
    if (!classIdToUse) {
      showError('Chưa chọn Lớp học', 'Vui lòng chọn Lớp học nhận danh sách học sinh ở Bước 1.');
      return;
    }

    setSubmitting(true);
    setProgress(0);

    try {
      const res = await excelImportService.executeImport(preview, classIdToUse, (pct) =>
        setProgress(pct)
      );
      showSuccess('Nhập danh sách thành công', `Đã thêm ${res.importedCount} học sinh vào hệ thống.`);
      onImportSuccess();
      handleResetAndClose();
    } catch (err: unknown) {
      showError('Lỗi nhập dữ liệu', (err as Error).message);
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setFileName('');
    setPreview(null);
    onClose();
  };

  const distinctClassCount = preview ? Object.keys(preview.classSummary).length : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleResetAndClose} title="Nhập Danh sách Học sinh từ Excel (.xlsx)">
      <div className="space-y-4 py-2">
        {/* STEP 1: Select Class & File */}
        {step === 1 && (
          <div className="space-y-4">
            <Select
              label="Chọn Lớp học nhận danh sách (mặc định nếu file không có cột Lớp)"
              required
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))}
            />

            <div className="flex items-center justify-between p-4 rounded-xl bg-app-primary-light/40 border border-app">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-app-primary" />
                <div>
                  <h4 className="text-sm font-bold text-app-main">Tải file Excel mẫu</h4>
                  <p className="text-xs text-app-muted">Chứa các cột chuẩn STT, Họ tên, Lớp, Ngày sinh, Phụ huynh...</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={handleDownloadTemplate}>
                Tải file mẫu
              </Button>
            </div>

            <div className="border-2 border-dashed border-app rounded-xl p-6 text-center hover:bg-app-surface-hover transition-colors cursor-pointer">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
                disabled={loading}
              />
              <label htmlFor="excel-file-input" className="cursor-pointer space-y-2 block">
                <div className="p-3 bg-app-primary text-app-primary-fg rounded-full inline-flex">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-app-main">
                  {loading ? 'Đang đọc dữ liệu file Excel...' : fileName ? fileName : 'Bấm để chọn file .xlsx từ máy tính'}
                </h4>
                <p className="text-xs text-app-muted">Hỗ trợ tự động nhận diện cột Họ tên, Lớp, Giới tính, Ngày sinh, SĐT</p>
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: Validation Preview */}
        {step === 2 && preview && (
          <div className="space-y-4">
            {distinctClassCount > 1 ? (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-blue-900 block">
                    Phát hiện {distinctClassCount} lớp trong file Excel:
                  </span>
                  <span className="text-blue-700 text-[11px]">
                    {Object.entries(preview.classSummary)
                      .map(([cls, cnt]) => `Lớp ${cls} (${cnt} HS)`)
                      .join(' • ')}
                  </span>
                </div>
                <Badge variant="primary">Phân lớp tự động</Badge>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-app-primary-light/50 border border-app text-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-app-primary block">
                    Lớp học sẽ nhận danh sách: Lớp{' '}
                    {classList.find((c) => c.id === (selectedClassId || defaultClassId))?.name ||
                      preview.detectedClassName ||
                      'Mặc định'}
                  </span>
                  {preview.detectedClassName && (
                    <span className="text-app-muted text-[11px]">
                      ✨ Tự động nhận diện từ file Excel: <strong>Lớp {preview.detectedClassName}</strong>
                    </span>
                  )}
                </div>
                <Badge variant="primary">Lớp nhận</Badge>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-app-surface-hover rounded-xl border border-app">
                <p className="text-xs text-app-muted">Tổng số dòng</p>
                <p className="text-lg font-bold text-app-main mt-0.5">{preview.totalRows}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                <p className="text-xs font-semibold">Dòng hợp lệ</p>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">{preview.validRows.length}</p>
              </div>
              <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200">
                <p className="text-xs font-semibold">Dòng có lỗi</p>
                <p className="text-lg font-bold text-red-700 mt-0.5">{preview.errorRows.length}</p>
              </div>
            </div>

            {preview.errorRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Danh sách lỗi gặp phải ({preview.errorRows.length} dòng):
                  </span>
                  <button
                    onClick={handleDownloadErrorReport}
                    className="text-xs font-semibold text-app-primary hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải báo cáo dòng lỗi
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-red-200 bg-red-50/50 rounded-xl p-3 space-y-2 text-xs text-red-800">
                  {preview.errorRows.map((errRow) => (
                    <div key={errRow.rowIndex} className="border-b border-red-200/60 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-bold">Dòng Excel {errRow.rowIndex} ({errRow.fullName || 'Chưa có họ tên'}): </span>
                      <span>{errRow.errors.join('; ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview.validRows.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-app-main flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Xem trước danh sách học sinh hợp lệ sẽ nhập ({preview.validRows.length} dòng):
                </h4>
                <div className="max-h-40 overflow-y-auto border border-app rounded-xl divide-y divide-app bg-app-surface p-2 text-xs">
                  {preview.validRows.slice(0, 5).map((row) => (
                    <div key={row.rowIndex} className="py-1.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-app-main">{row.fullName}</span>
                        <span className="text-app-muted ml-2">({row.gender} • {row.dateOfBirth})</span>
                        {row.className && (
                          <span className="ml-2 font-bold text-blue-600">
                            [Lớp {row.className}]
                          </span>
                        )}
                      </div>
                      <Badge variant="success">Hợp lệ</Badge>
                    </div>
                  ))}
                  {preview.validRows.length > 5 && (
                    <div className="py-1 text-center text-app-muted font-italic">
                      ... và {preview.validRows.length - 5} học sinh khác
                    </div>
                  )}
                </div>
              </div>
            )}

            {progress !== null && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex justify-between text-xs font-bold text-app-muted">
                  <span>Đang nhập dữ liệu vào cơ sở dữ liệu...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-app-surface border border-app rounded-full h-2 overflow-hidden">
                  <div className="bg-app-primary h-full transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-app">
              <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Chọn lại file
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={preview.validRows.length === 0}
                isLoading={submitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleExecuteImport}
              >
                Nhập {preview.validRows.length} Học Sinh Hợp Lệ
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
