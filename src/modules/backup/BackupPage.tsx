import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Modal } from '../../shared/components/Modal';
import { Table, type Column } from '../../shared/components/Table';
import { useToast } from '../../shared/hooks/useToast';
import { backupService, type BackupPreviewData } from '../../core/backup/backup.service';
import { db } from '../../core/database/db';
import { formatDateVietnamese } from '../../shared/utilities/date';
import type { BackupHistory } from '../../core/database/types';
import {
  DatabaseBackup,
  Download,
  Upload,
  Lock,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  History,
  CheckCircle2,
} from 'lucide-react';

export const BackupPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');

  // Backup State
  const [usePassword, setUsePassword] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupProgress, setBackupProgress] = useState<number | null>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [history, setHistory] = useState<BackupHistory[]>([]);

  // Restore State
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [restorePassword, setRestorePassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [previewData, setPreviewData] = useState<BackupPreviewData | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);

  const loadBackupHistory = async () => {
    try {
      const list = await db.backupHistory.orderBy('createdAt').reverse().toArray();
      setHistory(list);
    } catch (err) {
      console.error('Failed to load backup history:', err);
    }
  };

  useEffect(() => {
    loadBackupHistory();
  }, []);

  // Backup Action
  const handleCreateBackup = async () => {
    if (usePassword && (!backupPassword || backupPassword.length < 4)) {
      showError('Mật khẩu quá ngắn', 'Mật khẩu bảo vệ sao lưu phải có ít nhất 4 ký tự.');
      return;
    }

    setCreatingBackup(true);
    setBackupProgress(0);

    try {
      const pass = usePassword ? backupPassword : undefined;
      const res = await backupService.createBackup(pass, (pct) => setBackupProgress(pct));
      showSuccess('Sao lưu thành công', `Đã xuất file ${res.filename} (${res.totalRecords} bản ghi).`);
      loadBackupHistory();
    } catch (err: unknown) {
      console.error('Backup error:', err);
      showError('Lỗi sao lưu', (err as Error).message || 'Không thể tạo file sao lưu.');
    } finally {
      setCreatingBackup(false);
      setBackupProgress(null);
    }
  };

  // File Selected for Restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gvcn-backup') && !file.name.endsWith('.json')) {
      showError('File không hợp lệ', 'Vui lòng chọn file có định dạng .gvcn-backup');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      setSelectedFileContent(content);
      setSelectedFileName(file.name);
      await processFileContent(content);
    };
    reader.readAsText(file);
  };

  const processFileContent = async (content: string, pass?: string) => {
    try {
      const preview = await backupService.parseAndValidateBackupFile(content, pass);
      setPreviewData(preview);
      setShowPasswordModal(false);
    } catch (err: unknown) {
      const errMsg = (err as Error).message;
      if (errMsg === 'FILE_ENCRYPTED_REQUIRES_PASSWORD') {
        setShowPasswordModal(true);
      } else {
        showError('Lỗi đọc file sao lưu', errMsg);
        setPreviewData(null);
      }
    }
  };

  const handlePasswordModalSubmit = () => {
    if (selectedFileContent) {
      processFileContent(selectedFileContent, restorePassword);
    }
  };

  // Execute Restore
  const handleConfirmRestore = async () => {
    if (confirmInput.trim().toUpperCase() !== 'KHÔI PHỤC') {
      showError('Chưa xác nhận đúng', 'Vui lòng nhập đúng từ "KHÔI PHỤC" để tiếp tục.');
      return;
    }

    if (!previewData) return;

    setRestoring(true);
    setRestoreProgress(0);

    try {
      await backupService.executeRestore(previewData, (pct) => setRestoreProgress(pct));
      showSuccess('Khôi phục hoàn tất', `Đã khôi phục ${previewData.totalRecords} bản ghi từ file sao lưu.`);
      setShowConfirmModal(false);
      setPreviewData(null);
      setSelectedFileContent(null);
      setConfirmInput('');
      loadBackupHistory();
    } catch (err: unknown) {
      console.error('Restore error:', err);
      showError('Lỗi khôi phục', (err as Error).message);
    } finally {
      setRestoring(false);
      setRestoreProgress(null);
    }
  };

  const historyColumns: Column<BackupHistory>[] = [
    {
      header: 'Tên File Sao Lưu',
      accessorKey: 'filename',
      cell: (row) => <span className="font-mono text-xs font-semibold">{row.filename}</span>,
    },
    {
      header: 'Số Bản Ghi',
      accessorKey: 'recordCount',
      cell: (row) => <span className="font-bold text-app-primary">{row.recordCount}</span>,
    },
    {
      header: 'Kích Thước',
      cell: (row) => <span>{(row.fileSize / 1024).toFixed(1)} KB</span>,
    },
    {
      header: 'Thời Gian',
      cell: (row) => {
        const dateStr = row.createdAt.split('T')[0];
        const timeStr = row.createdAt.split('T')[1]?.substring(0, 5) || '';
        return (
          <span className="text-xs text-app-muted">
            {formatDateVietnamese(dateStr)} {timeStr}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-app-main">Sao lưu & Khôi phục Dữ liệu An toàn</h2>
        <p className="text-sm text-app-muted mt-1">
          Xuất file sao lưu mã hóa định dạng `.gvcn-backup` hoặc khôi phục toàn bộ dữ liệu 100% Offline trên thiết bị.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-app">
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'backup'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <DatabaseBackup className="w-4 h-4" /> Sao lưu Dữ liệu
        </button>
        <button
          onClick={() => setActiveTab('restore')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'restore'
              ? 'border-app-primary text-app-primary'
              : 'border-transparent text-app-muted hover:text-app-main'
          }`}
        >
          <Upload className="w-4 h-4" /> Khôi phục Dữ liệu
        </button>
      </div>

      {/* TAB 1: BACKUP */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <Card title="Tạo Bản Sao Lưu Mới (.gvcn-backup)">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-app-surface-hover/60 border border-app space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-app-main">
                    <input
                      type="checkbox"
                      checked={usePassword}
                      onChange={(e) => setUsePassword(e.target.checked)}
                      className="w-4 h-4 rounded text-app-primary focus:ring-amber-500"
                    />
                    <Lock className="w-4 h-4 text-app-primary" />
                    Bảo vệ file sao lưu bằng Mật khẩu (Mã hóa AES-GCM 256-bit)
                  </label>
                </div>

                {usePassword && (
                  <div className="space-y-2 pt-2 animate-fadeIn">
                    <Input
                      label="Mật khẩu bảo vệ"
                      type="password"
                      placeholder="Nhập mật khẩu (tối thiểu 4 ký tự)"
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                    />
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Cảnh báo quan trọng:</strong> Ứng dụng không lưu mật khẩu này. Nếu quên mật khẩu, không ai (kể cả quản trị viên) có thể mở hoặc khôi phục lại file sao lưu.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {backupProgress !== null && (
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="flex justify-between text-xs font-bold text-app-muted">
                    <span>Đang đóng gói và mã hóa dữ liệu...</span>
                    <span>{backupProgress}%</span>
                  </div>
                  <div className="w-full bg-app-surface border border-app rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-app-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${backupProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={creatingBackup}
                leftIcon={<Download className="w-5 h-5" />}
                onClick={handleCreateBackup}
              >
                Tạo và Tải File Sao Lưu (.gvcn-backup)
              </Button>
            </div>
          </Card>

          {/* Backup History Table */}
          <Card title="Lịch sử Sao lưu trên Thiết bị" action={<History className="w-5 h-5 text-app-muted" />}>
            <Table
              columns={historyColumns}
              data={history}
              keyExtractor={(row) => row.id}
              emptyTitle="Chưa có lịch sử sao lưu"
              emptyDescription="Hãy bấm nút phía trên để tạo bản sao lưu đầu tiên."
            />
          </Card>
        </div>
      )}

      {/* TAB 2: RESTORE */}
      {activeTab === 'restore' && (
        <div className="space-y-6">
          <Card title="Chọn File Sao Lưu (.gvcn-backup)">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-app rounded-xl p-8 text-center bg-app-surface-hover/30 hover:bg-app-surface-hover/60 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".gvcn-backup,.json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="restore-file-input"
                />
                <label htmlFor="restore-file-input" className="cursor-pointer space-y-3 block">
                  <div className="p-4 bg-app-primary-light text-app-primary rounded-full inline-flex">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-app-main">
                    {selectedFileName ? selectedFileName : 'Kéo thả file .gvcn-backup hoặc bấm để chọn'}
                  </h4>
                  <p className="text-xs text-app-muted max-w-sm mx-auto">
                    Hệ thống sẽ tự động kiểm tra định dạng, xác thực mã băm SHA-256 và mở bản xem trước trước khi khôi phục.
                  </p>
                </label>
              </div>

              {previewData && (
                <div className="p-5 rounded-xl border border-app bg-app-surface space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-app pb-3">
                    <h4 className="text-base font-bold text-app-main flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-600" /> Xem trước Thông số File Sao Lưu
                    </h4>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Mã băm SHA-256 Hợp lệ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-app-surface-hover rounded-lg">
                      <p className="text-xs text-app-muted">Ngày sao lưu</p>
                      <p className="font-bold text-sm text-app-main mt-0.5">{previewData.createdAtFormatted}</p>
                    </div>
                    <div className="p-3 bg-app-surface-hover rounded-lg">
                      <p className="text-xs text-app-muted">Số lớp học</p>
                      <p className="font-bold text-sm text-app-main mt-0.5">{previewData.classCount} lớp</p>
                    </div>
                    <div className="p-3 bg-app-surface-hover rounded-lg">
                      <p className="text-xs text-app-muted">Số học sinh</p>
                      <p className="font-bold text-sm text-app-main mt-0.5">{previewData.studentCount} HS</p>
                    </div>
                    <div className="p-3 bg-app-surface-hover rounded-lg">
                      <p className="text-xs text-app-muted">Tổng số bản ghi</p>
                      <p className="font-bold text-sm text-app-primary mt-0.5">{previewData.totalRecords}</p>
                    </div>
                  </div>

                  {previewData.warning && (
                    <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{previewData.warning}</span>
                    </div>
                  )}

                  <Button
                    variant="danger"
                    size="lg"
                    className="w-full mt-2"
                    leftIcon={<ShieldAlert className="w-5 h-5" />}
                    onClick={() => setShowConfirmModal(true)}
                  >
                    Tiến hành Khôi phục Dữ liệu
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: Password Decryption Prompt */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="File sao lưu được Bảo vệ Mật khẩu">
        <div className="space-y-4 py-2">
          <p className="text-xs text-app-muted">
            File sao lưu này đã được mã hóa bằng thuật toán AES-GCM 256-bit. Vui lòng nhập mật khẩu để giải mã.
          </p>
          <Input
            label="Mật khẩu giải mã"
            type="password"
            placeholder="Nhập mật khẩu"
            value={restorePassword}
            onChange={(e) => setRestorePassword(e.target.value)}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPasswordModal(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" className="flex-1" onClick={handlePasswordModalSubmit}>
              Giải mã File
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Confirm Restore Danger Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Xác nhận Thay thế Toàn bộ Dữ liệu">
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" /> Cảnh báo nguy hiểm
            </div>
            <p className="text-xs leading-relaxed">
              Thao tác này sẽ **XÓA TOÀN BỘ** dữ liệu hiện tại trong hệ thống và thay thế bằng dữ liệu từ file sao lưu ({previewData?.totalRecords} bản ghi).
            </p>
            <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 pt-1 border-t border-red-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Hệ thống sẽ tự động tạo 1 bản sao lưu điểm phục hồi (Pre-restore Auto-backup) phòng trường hợp xảy ra sự cố.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-app-main">
              Vui lòng nhập chính xác từ <span className="text-red-600">KHÔI PHỤC</span> để xác nhận:
            </label>
            <Input
              placeholder="Nhập KHÔI PHỤC"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
            />
          </div>

          {restoreProgress !== null && (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex justify-between text-xs font-bold text-app-muted">
                <span>Đang thực thi khôi phục dữ liệu...</span>
                <span>{restoreProgress}%</span>
              </div>
              <div className="w-full bg-app-surface border border-app rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${restoreProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={restoring}
              onClick={() => setShowConfirmModal(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              isLoading={restoring}
              onClick={handleConfirmRestore}
            >
              Tôi hiểu & Khôi phục
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
