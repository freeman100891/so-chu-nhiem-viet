import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { backupService, type BackupPreviewData } from '../../core/backup/backup.service';
import {
  Upload,
  Lock,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ArrowRight,
  Database,
  XCircle,
} from 'lucide-react';

export interface OnboardingRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingRestoreModal: React.FC<OnboardingRestoreModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States: 'idle' | 'password_prompt' | 'preview' | 'restoring' | 'success' | 'error'
  const [step, setStep] = useState<'idle' | 'password_prompt' | 'preview' | 'restoring' | 'success' | 'error'>('idle');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [previewData, setPreviewData] = useState<BackupPreviewData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isInFlight, setIsInFlight] = useState<boolean>(false);

  const resetState = () => {
    setStep('idle');
    setFileContent(null);
    setFileName('');
    setPassword('');
    setPasswordError('');
    setPreviewData(null);
    setErrorMessage('');
    setProgressPercent(0);
    setIsInFlight(false);
  };

  const handleClose = () => {
    if (isInFlight) return; // Prevent closing while in progress
    resetState();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gvcn-backup') && !file.name.endsWith('.json')) {
      setErrorMessage('File không hợp lệ. Vui lòng chọn tệp sao lưu có đuôi .gvcn-backup');
      setStep('error');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      setFileContent(content);
      await parseFile(content);
    };
    reader.onerror = () => {
      setErrorMessage('Không thể đọc file sao lưu từ thiết bị.');
      setStep('error');
    };
    reader.readAsText(file);
  };

  const parseFile = async (content: string, pass?: string) => {
    try {
      setErrorMessage('');
      setPasswordError('');
      const preview = await backupService.parseAndValidateBackupFile(content, pass);
      
      if (!preview.isCompatible) {
        setErrorMessage(
          preview.warning ||
            `Bản sao lưu được tạo từ phiên bản ứng dụng mới hơn (Schema v${preview.schemaVersion}). Vui lòng cập nhật ứng dụng trước khi khôi phục.`
        );
        setStep('error');
        return;
      }

      setPreviewData(preview);
      setStep('preview');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg === 'FILE_ENCRYPTED_REQUIRES_PASSWORD') {
        setStep('password_prompt');
      } else if (msg.includes('Mật khẩu giải mã không chính xác')) {
        setPasswordError('Mật khẩu giải mã không chính xác. Vui lòng thử lại.');
      } else {
        setErrorMessage(msg || 'Lỗi kiểm tra cấu trúc file sao lưu.');
        setStep('error');
      }
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu giải mã.');
      return;
    }
    if (fileContent) {
      parseFile(fileContent, password);
    }
  };

  const handleExecuteRestore = async () => {
    if (!previewData || isInFlight) return;

    setIsInFlight(true);
    setStep('restoring');
    setProgressPercent(10);

    try {
      await backupService.executeRestore(previewData, (percent) => {
        setProgressPercent(percent);
      });

      setStep('success');
    } catch (err: unknown) {
      console.error('Onboarding restore error:', err);
      setErrorMessage((err as Error).message || 'Quá trình khôi phục dữ liệu thất bại.');
      setStep('error');
    } finally {
      setIsInFlight(false);
    }
  };

  const handleFinishAndNavigate = () => {
    handleClose();
    navigate('/dashboard', { replace: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="lg"
      title={
        step === 'success'
          ? 'Khôi Phục Thành Công'
          : step === 'restoring'
          ? 'Đang Khôi Phục Dữ Liệu...'
          : 'Khôi Phục Dữ Liệu Từ Bản Sao Lưu'
      }
    >
      <div className="p-4 sm:p-6 space-y-5">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".gvcn-backup,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* STEP: IDLE - Upload Area */}
        {step === 'idle' && (
          <div className="space-y-4 text-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-app hover:border-app-primary bg-app-surface-hover/30 hover:bg-app-surface-hover/60 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-app-primary-light text-app-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-base text-app-main">
                  Bấm để chọn file bản sao lưu
                </p>
                <p className="text-xs text-app-muted mt-1">
                  Định dạng hỗ trợ: <strong className="text-app-primary font-mono">*.gvcn-backup</strong> hoặc <strong className="text-app-primary font-mono">*.json</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-app-surface-hover/50 border border-app text-left text-xs text-app-muted leading-relaxed space-y-1">
              <p className="font-bold text-app-main flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-app-primary" /> Lưu ý khi khôi phục:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>File sao lưu sẽ phục hồi đầy đủ: Hồ sơ giáo viên, Năm học, Lớp học, Học sinh, Điểm danh, Thi đua và Cấp bậc.</li>
                <li>Hệ thống tự động đồng bộ và đưa Thầy/Cô vào Trang Chủ ngay sau khi hoàn tất.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP: PASSWORD PROMPT */}
        {step === 'password_prompt' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-700 dark:text-amber-400">File sao lưu được bảo vệ bằng mật khẩu</p>
                <p className="text-app-muted">Vui lòng nhập mật khẩu Thầy/Cô đã thiết lập khi tạo bản sao lưu này để giải mã dữ liệu.</p>
              </div>
            </div>

            <Input
              label="Mật khẩu giải mã"
              type="password"
              placeholder="Nhập mật khẩu..."
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              error={passwordError}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setStep('idle')}>
                Chọn file khác
              </Button>
              <Button type="submit" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Giải mã & Tiếp tục
              </Button>
            </div>
          </form>
        )}

        {/* STEP: PREVIEW CONFIRMATION */}
        {step === 'preview' && previewData && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-app-primary-light/40 border border-app-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-app-primary flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Thông tin bản sao lưu
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-app-surface text-app-main border border-app">
                  Schema v{previewData.schemaVersion}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-app-surface border border-app space-y-0.5">
                  <span className="text-app-muted text-[11px] block">Giáo viên chủ nhiệm:</span>
                  <span className="font-bold text-app-main text-sm">{previewData.teacherName}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-app-surface border border-app space-y-0.5">
                  <span className="text-app-muted text-[11px] block">Năm học:</span>
                  <span className="font-bold text-app-main text-sm">{previewData.academicYearName}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-app-surface border border-app space-y-0.5">
                  <span className="text-app-muted text-[11px] block">Quy mô dữ liệu:</span>
                  <span className="font-bold text-app-main text-sm">
                    {previewData.classCount} lớp • {previewData.studentCount} học sinh
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-app-surface border border-app space-y-0.5">
                  <span className="text-app-muted text-[11px] block">Thời điểm sao lưu:</span>
                  <span className="font-bold text-app-main text-sm">{previewData.createdAtFormatted}</span>
                </div>
              </div>

              <div className="text-[11px] text-app-muted flex items-center justify-between pt-1 border-t border-app/50">
                <span>Tổng số bản ghi: <strong className="font-mono text-app-main">{previewData.totalRecords}</strong></span>
                <span>Tên file: <strong className="font-mono text-app-main truncate max-w-[180px]">{fileName}</strong></span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>File sao lưu hợp lệ. Hệ thống sẽ tiến hành khôi phục toàn bộ cơ sở dữ liệu và chuyển Thầy/Cô vào làm việc ngay.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setStep('idle')}>
                Hủy / Chọn file khác
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteRestore}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Bắt đầu Khôi phục Dữ liệu
              </Button>
            </div>
          </div>
        )}

        {/* STEP: RESTORING IN PROGRESS */}
        {step === 'restoring' && (
          <div className="py-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-app-primary-light text-app-primary mx-auto flex items-center justify-center animate-spin">
              <Database className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-app-main">Đang Khôi Phục Dữ Liệu...</h3>
              <p className="text-xs text-app-muted max-w-sm mx-auto">
                Vui lòng không tắt hoặc tải lại trang web trong lúc hệ thống đang thiết lập cơ sở dữ liệu.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-xs font-bold font-mono text-app-primary">
                <span>Tiến độ khôi phục</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-app-surface-hover rounded-full h-2.5 overflow-hidden border border-app">
                <div
                  className="bg-app-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Step Checkpoints */}
            <div className="text-left max-w-sm mx-auto text-xs space-y-1.5 font-medium text-app-muted pt-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đọc & Giải mã bản sao lưu
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Xác thực tính toàn vẹn SHA-256
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn hóa Schema & Migration
              </div>
              <div className="flex items-center gap-2 text-app-primary font-bold animate-pulse">
                ● Khôi phục 30 bảng IndexedDB
              </div>
            </div>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'success' && previewData && (
          <div className="py-4 space-y-6 text-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-app-main tracking-tight">
                Khôi Phục Thành Công!
              </h3>
              <p className="text-sm text-app-muted max-w-md mx-auto leading-relaxed">
                Toàn bộ dữ liệu của Thầy/Cô đã được nạp thành công vào hệ thống.
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-4 rounded-2xl bg-app-surface-hover/60 border border-app text-left space-y-2 text-xs font-mono max-w-md mx-auto">
              <div className="flex justify-between py-0.5 border-b border-app/50">
                <span className="text-app-muted">Giáo viên:</span>
                <span className="font-bold text-app-main">{previewData.teacherName}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-app/50">
                <span className="text-app-muted">Năm học:</span>
                <span className="font-bold text-app-main">{previewData.academicYearName}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-app/50">
                <span className="text-app-muted">Tổng học sinh:</span>
                <span className="font-bold text-app-main">{previewData.studentCount} học sinh ({previewData.classCount} lớp)</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-app-muted">Tổng bản ghi:</span>
                <span className="font-bold text-emerald-600">{previewData.totalRecords} bản ghi</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full max-w-md mx-auto"
              leftIcon={<Sparkles className="w-5 h-5" />}
              onClick={handleFinishAndNavigate}
            >
              Bắt Đầu Sử Dụng (Vào Trang Chủ)
            </Button>
          </div>
        )}

        {/* STEP: ERROR */}
        {step === 'error' && (
          <div className="py-4 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-app-main">Không Thể Khôi Phục</h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto leading-relaxed font-medium">
                {errorMessage || 'Đã xảy ra lỗi trong quá trình đọc hoặc xử lý file sao lưu.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-app-surface-hover/50 border border-app text-left text-xs text-app-muted">
              <p className="font-bold text-app-main">Dữ liệu hiện tại chưa bị thay đổi.</p>
              <p className="text-[11px] mt-0.5">Thầy/Cô có thể thử lại với file sao lưu khác hoặc tiến hành Thiết Lập Mới.</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep('idle')}>
                Chọn File Khác
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Đóng & Thiết Lập Mới
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
