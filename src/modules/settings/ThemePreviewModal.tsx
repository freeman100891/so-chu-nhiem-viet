import React, { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { themeService, THEME_OPTIONS, type ThemeId } from '../../core/services/theme.service';
import { useToast } from '../../shared/hooks/useToast';
import { Palette, CheckCircle, Sparkles } from 'lucide-react';

export interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChanged?: (themeId: ThemeId) => void;
}

export const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({
  isOpen,
  onClose,
  onThemeChanged,
}) => {
  const { showSuccess } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(themeService.getCurrentTheme());

  const handlePreviewTheme = (themeId: ThemeId) => {
    setSelectedTheme(themeId);
    themeService.applyTheme(themeId); // Live preview without reload
  };

  const handleApplyTheme = async () => {
    await themeService.applyTheme(selectedTheme);
    showSuccess('Thay đổi giao diện thành công', `Đã áp dụng theme "${THEME_OPTIONS.find((t) => t.id === selectedTheme)?.name}"`);
    if (onThemeChanged) onThemeChanged(selectedTheme);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xem Trước & Chọn Giao Diện (Cultural Themes)">
      <div className="space-y-4 py-2">
        <p className="text-xs text-app-muted">
          Ứng dụng cung cấp 3 bộ giao diện chuẩn văn hóa Việt Nam. Thay đổi theme tức thì và lưu trữ offline bền vững.
        </p>

        <div className="grid grid-cols-1 gap-4">
          {THEME_OPTIONS.map((theme) => (
            <div
              key={theme.id}
              onClick={() => handlePreviewTheme(theme.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                selectedTheme === theme.id
                  ? 'border-2 border-app-primary bg-app-surface-hover shadow-sm'
                  : 'border-app hover:bg-app-surface-hover/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-app-main flex items-center gap-2">
                    <Palette className="w-4 h-4 text-app-primary" /> {theme.name}
                  </h4>
                  <p className="text-xs text-app-muted font-medium mt-0.5">{theme.subtitle}</p>
                </div>
                {selectedTheme === theme.id && (
                  <Badge variant="success">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 inline" /> Đang xem trước
                  </Badge>
                )}
              </div>

              <p className="text-xs text-app-main">{theme.description}</p>

              {/* Color Swatches */}
              <div className="flex items-center gap-2 pt-1">
                <div className="w-6 h-6 rounded-full border border-gray-300 shadow-xs" style={{ backgroundColor: theme.primaryColor }} title="Màu chủ đạo" />
                <div className="w-6 h-6 rounded-full border border-gray-300 shadow-xs" style={{ backgroundColor: theme.secondaryColor }} title="Màu nền phụ" />
                <div className="w-6 h-6 rounded-full border border-gray-300 shadow-xs" style={{ backgroundColor: theme.accentColor }} title="Màu điểm nhấn" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-app">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="primary" className="flex-1" leftIcon={<Sparkles className="w-4 h-4" />} onClick={handleApplyTheme}>
            Xác Nhận Áp Dụng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
