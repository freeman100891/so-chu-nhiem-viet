import React, { useState, useRef, useEffect, useId } from 'react';
import { Upload, RotateCcw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import {
  giftImageService,
} from '../../../core/services/gift-image.service';
import type { ProcessedGiftImage } from '../../../core/services/gift-image-processor.service';

export interface GiftImageUploadFieldProps {
  existingImageUrl?: string;
  hasExistingImage?: boolean;
  onImageChange: (processed: ProcessedGiftImage | null, isPendingRemoval: boolean) => void;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const GiftImageUploadField: React.FC<GiftImageUploadFieldProps> = ({
  existingImageUrl,
  hasExistingImage = false,
  onImageChange,
  disabled = false,
}) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [pendingProcessed, setPendingProcessed] = useState<ProcessedGiftImage | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [isPendingRemoval, setIsPendingRemoval] = useState<boolean>(false);

  // Dọn dẹp preview object URL khi component unmount
  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [pendingPreviewUrl]);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setProcessing(true);
    setProcessingStep('Đang kiểm tra ảnh...');

    try {
      // 1. Kiểm tra nhanh
      const val = await giftImageService.validateFile(file);
      if (!val.valid) {
        setError(val.error || 'Ảnh không hợp lệ.');
        setProcessing(false);
        return;
      }

      setProcessingStep('Đang tối ưu và tạo ảnh 3D...');

      // 2. Xử lý và tạo Full + Thumbnail
      const processed = await giftImageService.processAndPrepare(file);

      // 3. Tạo preview URL từ fullBlob
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(processed.fullBlob);

      setPendingProcessed(processed);
      setPendingPreviewUrl(previewUrl);
      setIsPendingRemoval(false);
      onImageChange(processed, false);
      setProcessingStep('Ảnh sẵn sàng!');
    } catch (err: any) {
      setError(err?.message || 'Không thể xử lý ảnh đã chọn. Vui lòng chọn ảnh khác.');
    } finally {
      setProcessing(false);
      // Reset input value để có thể chọn lại cùng file nếu muốn
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setError('Mỗi quà chỉ sử dụng một ảnh.');
      return;
    }
    handleFileSelect(files[0]!);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !processing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || processing) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setError('Mỗi quà chỉ sử dụng một ảnh.');
      return;
    }
    handleFileSelect(files[0]!);
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleRemoveClick = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
    }
    setPendingProcessed(null);
    setIsPendingRemoval(true);
    setError(null);
    onImageChange(null, true);
  };

  const handleCancelChanges = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
    }
    setPendingProcessed(null);
    setIsPendingRemoval(false);
    setError(null);
    onImageChange(null, false);
  };

  // Xác định ảnh hiển thị hiện tại
  const currentDisplayUrl = isPendingRemoval
    ? null
    : pendingPreviewUrl || (hasExistingImage ? existingImageUrl : null);

  const hasChanges = Boolean(pendingProcessed) || isPendingRemoval;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-xs font-bold text-app-main">
          Hình ảnh quà tặng
        </label>
        <span className="text-[11px] text-app-muted">PNG, JPG, WebP tối đa 5 MB</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled || processing}
        className="sr-only"
        aria-describedby={`${inputId}-hint ${inputId}-error`}
      />

      {/* Preview or Dropzone Area */}
      {currentDisplayUrl ? (
        <div className="relative rounded-2xl border border-app bg-app-surface-hover/60 p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-4">
            {/* Image Preview Box */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-app-surface border border-app/60 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              <img
                src={currentDisplayUrl}
                alt="Xem trước hình ảnh món quà"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Image Info & Meta */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-app-main">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pendingProcessed ? 'Ảnh mới sẵn sàng lưu' : 'Ảnh quà tặng hiện tại'}</span>
              </div>

              {pendingProcessed && (
                <div className="text-[11px] text-app-muted space-y-0.5">
                  <p>
                    Kích thước: <strong>{pendingProcessed.fullWidth} × {pendingProcessed.fullHeight} px</strong>
                  </p>
                  <p>
                    Dung lượng: <strong>{formatBytes(pendingProcessed.fullSizeBytes)}</strong>{' '}
                    <span className="text-emerald-700 font-medium">
                      (Đã tối ưu từ {formatBytes(pendingProcessed.originalSizeBytes || 0)})
                    </span>
                  </p>
                </div>
              )}

              {!pendingProcessed && hasExistingImage && (
                <p className="text-[11px] text-app-muted">
                  Đã lưu trữ trong bộ nhớ thiết bị.
                </p>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || processing}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-7 py-0.5 px-2.5"
                >
                  Thay ảnh
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || processing}
                  onClick={handleRemoveClick}
                  className="text-xs h-7 py-0.5 px-2.5 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  Xóa ảnh
                </Button>

                {hasChanges && hasExistingImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || processing}
                    onClick={handleCancelChanges}
                    className="text-xs h-7 py-0.5 px-2 text-app-muted hover:text-app-main"
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                  >
                    Hủy thay đổi
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : isPendingRemoval ? (
        <div className="p-3.5 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Ảnh sẽ bị xóa khi bấm "Lưu thay đổi". Món quà sẽ dùng biểu tượng mặc định.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelChanges}
            className="text-xs h-7 py-0.5 px-2.5 shrink-0 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            Hoàn tác
          </Button>
        </div>
      ) : (
        /* Empty State Dropzone */
        <div
          ref={dropzoneRef}
          role="button"
          tabIndex={disabled || processing ? -1 : 0}
          onClick={() => !disabled && !processing && fileInputRef.current?.click()}
          onKeyDown={handleDropzoneKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer select-none flex flex-col items-center justify-center gap-2.5 ${
            isDragOver
              ? 'border-app-primary bg-app-primary-light/40 scale-[1.01]'
              : 'border-app/80 bg-app-surface hover:bg-app-surface-hover hover:border-app-primary/60'
          } ${disabled || processing ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {processing ? (
            <div className="py-2 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
              <span className="text-xs font-bold text-app-main">{processingStep}</span>
            </div>
          ) : (
            <>
              <div className="p-2.5 rounded-xl bg-app-primary-light text-app-primary">
                <Upload className="w-5 h-5" />
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-bold text-app-main">
                  Bấm để chọn ảnh hoặc kéo thả vào đây
                </p>
                <p id={`${inputId}-hint`} className="text-[11px] text-app-muted">
                  Ảnh sẽ được tối ưu và lưu trên thiết bị này
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Inline Error Message */}
      {error && (
        <div
          id={`${inputId}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-red-600 font-medium pt-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
