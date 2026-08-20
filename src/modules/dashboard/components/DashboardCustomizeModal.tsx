import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import {
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';
import { cn } from '../../../shared/utilities/cn';
import {
  type DashboardWidgetConfig,
  DEFAULT_DASHBOARD_CONFIG,
} from '../dashboard.types';

export interface DashboardCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardWidgetConfig;
  onSaveConfig: (newConfig: DashboardWidgetConfig) => void;
}

export const DashboardCustomizeModal: React.FC<DashboardCustomizeModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<DashboardWidgetConfig>(config);

  const toggleWidget = (key: keyof Omit<DashboardWidgetConfig, 'density'>) => {
    setLocalConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_DASHBOARD_CONFIG);
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const widgetList: { key: keyof Omit<DashboardWidgetConfig, 'density'>; label: string; desc: string }[] = [
    { key: 'showHero', label: '1. Khung Chào Mừng (Hero Banner)', desc: 'Lời chào theo buổi, mascot chủ đề và 3 nút tác vụ nhanh' },
    { key: 'showTasks', label: '2. Việc Cần Làm Hôm Nay', desc: 'Danh sách cảnh báo điểm danh, lịch hẹn phụ huynh, sao lưu' },
    { key: 'showKPIStats', label: '3. Thẻ Thống Kê Nhanh (5 KPI)', desc: 'Sĩ số, có mặt, vắng, điểm thi đua và học sinh thăng cấp' },
    { key: 'showAttendanceDonut', label: '4. Biểu Đồ Tròn Chuyên Cần', desc: 'Tỷ lệ có mặt, đi muộn, có phép, không phép' },
    { key: 'showPointTrend', label: '5. Biểu Đồ Diễn Biến Thi Đua', desc: 'Xu hướng điểm cộng và điểm trừ theo ngày (Area Chart)' },
    { key: 'showRankJourney', label: '6. Hành Trình Cấp Bậc Của Lớp', desc: 'Phân bố 4 nhóm cấp và top học sinh sắp thăng cấp' },
    { key: 'showSpotlights', label: '7. Gương Mặt Nổi Bật & Cần Đồng Hành', desc: '2 tab học sinh tích cực và học sinh cần quan tâm' },
    { key: 'showBirthdays', label: '8. Sinh Nhật & Sự Kiện', desc: 'Sinh nhật hôm nay và danh sách sinh nhật 30 ngày tới' },
    { key: 'showQuickActions', label: '9. Lưới Phím Tắt Thao Tác Nhanh', desc: '8 nút điều hướng nhanh đến các phân hệ' },
    { key: 'showRecentActivities', label: '10. Nhật Ký Hoạt Động Gần Đây', desc: 'Dòng thời gian các sự kiện điểm danh, cộng điểm, thăng cấp' },
    { key: 'showDataHealth', label: '11. An Toàn Dữ Liệu & Sao Lưu', desc: 'Trạng thái dữ liệu cục bộ và nút sao lưu nhanh' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tùy Chỉnh Giao Diện Dashboard"
      maxWidth="lg"
    >
      <div className="space-y-5">
        <p className="text-xs text-app-muted">
          Thầy/Cô có thể tùy ý ẩn hoặc hiện các khối thông tin trên bảng điều khiển để tối ưu hóa không gian làm việc.
        </p>

        {/* DENSITY SELECTOR */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-app rounded-2xl space-y-2">
          <label className="text-xs font-bold text-app-main block">Mật độ hiển thị:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocalConfig((prev) => ({ ...prev, density: 'spacious' }))}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                localConfig.density === 'spacious'
                  ? 'border-app-primary bg-app-primary-light text-app-primary'
                  : 'border-app bg-white dark:bg-slate-700 text-app-muted'
              )}
            >
              {localConfig.density === 'spacious' && <Check className="w-3.5 h-3.5" />}
              Thoáng đãng (Mặc định)
            </button>

            <button
              onClick={() => setLocalConfig((prev) => ({ ...prev, density: 'compact' }))}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                localConfig.density === 'compact'
                  ? 'border-app-primary bg-app-primary-light text-app-primary'
                  : 'border-app bg-white dark:bg-slate-700 text-app-muted'
              )}
            >
              {localConfig.density === 'compact' && <Check className="w-3.5 h-3.5" />}
              Gọn gàng (Thu nhỏ khoảng cách)
            </button>
          </div>
        </div>

        {/* WIDGET TOGGLES LIST */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <label className="text-xs font-bold text-app-main block">Khối thông tin hiển thị:</label>
          <div className="space-y-1.5">
            {widgetList.map((item) => {
              const isChecked = localConfig[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleWidget(item.key)}
                  className={cn(
                    'p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer',
                    isChecked
                      ? 'bg-app-primary-light/20 border-app-primary/40'
                      : 'bg-slate-50 dark:bg-slate-800/30 border-app opacity-60'
                  )}
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-extrabold text-app-main truncate">{item.label}</p>
                    <p className="text-[11px] text-app-muted truncate">{item.desc}</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-app-primary border-slate-300 focus:ring-app-primary pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-between pt-3 border-t border-app">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleReset}
          >
            Khôi phục mặc định
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs rounded-xl" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-bold px-4 rounded-xl"
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
              onClick={handleSave}
            >
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
