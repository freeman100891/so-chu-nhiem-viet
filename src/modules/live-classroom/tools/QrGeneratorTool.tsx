import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useToast } from '../../../shared/hooks/useToast';
import { generateQRCodeDataUrl } from '../../../shared/utilities/qr-generator';
import { liveBroadcastService } from '../../../core/services/live-classroom';
import { Copy, Monitor } from 'lucide-react';

interface QrGeneratorToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrGeneratorTool: React.FC<QrGeneratorToolProps> = ({ isOpen, onClose }) => {
  const { showSuccess } = useToast();
  const [docTitle, setDocTitle] = useState('Tài liệu học tập tiết dạy');
  const [url, setUrl] = useState('https://dongbo.moet.gov.vn/tailieu');
  const [isPresenting, setIsPresenting] = useState(false);

  const qrDataUrl = generateQRCodeDataUrl(url, 256);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    showSuccess('Đã sao chép', 'Đã sao chép đường dẫn tài liệu vào bộ nhớ tạm.');
  };

  const handleBroadcastQR = () => {
    liveBroadcastService.postMessage({
      type: 'PRESENT_QR',
      payload: { title: docTitle, url },
    });
    setIsPresenting(true);
  };

  const handleStopBroadcastQR = () => {
    liveBroadcastService.postMessage({
      type: 'PRESENT_QR',
      payload: null,
    });
    setIsPresenting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Mã QR Tài Liệu (100% Cục Bộ)">
      <div className="space-y-4 py-2 text-xs text-center">
        <Input
          label="Tiêu đề tài liệu"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
        />

        <Input
          label="Đường dẫn URL tài liệu (HTTPS)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        {/* QR CODE DISPLAY */}
        <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 inline-block mx-auto space-y-3">
          <img src={qrDataUrl} alt="Mã QR Cục Bộ" className="w-48 h-48 mx-auto rounded-xl border border-slate-200 shadow-sm" />
          <p className="font-extrabold text-slate-800 text-sm">{docTitle}</p>
          <p className="font-mono text-[10px] text-slate-400 truncate max-w-xs">{url}</p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="secondary" size="sm" className="flex-1" leftIcon={<Copy className="w-4 h-4" />} onClick={handleCopyUrl}>
            Sao chép liên kết
          </Button>

          {isPresenting ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={handleStopBroadcastQR}>
              Dừng chiếu QR
            </Button>
          ) : (
            <Button variant="primary" size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" leftIcon={<Monitor className="w-4 h-4" />} onClick={handleBroadcastQR}>
              Trình chiếu QR
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
