import React, { useState, useEffect } from 'react';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { PageHeader } from '../../shared/components/PageHeader';
import { LoadingSkeleton } from '../../shared/components/LoadingSkeleton';
import { useToast } from '../../shared/hooks/useToast';
import { storageHealthService, type StorageEstimateInfo } from '../../core/services/storage-health.service';
import type { DatabaseHealthStatus } from '../../core/database/db';
import {
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Database,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyStoragePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [healthStatus, setHealthStatus] = useState<DatabaseHealthStatus | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo>({ usageMB: 0, quotaMB: 0, percentUsed: 0 });
  const [backupReminder, setBackupReminder] = useState<{ shouldRemind: boolean; daysSince: number | null }>({
    shouldRemind: false,
    daysSince: null,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const health = await storageHealthService.checkHealth();
      setHealthStatus(health);

      const persisted = await storageHealthService.checkPersistentStorage();
      setIsPersisted(persisted);

      const est = await storageHealthService.getStorageEstimate();
      setStorageInfo(est);

      const reminder = await storageHealthService.checkBackupReminder();
      setBackupReminder(reminder);
    } catch (err) {
      console.error('Error checking storage health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestPersistent = async () => {
    try {
      const granted = await storageHealthService.requestPersistentStorage();
      setIsPersisted(granted);
      if (granted) {
        showSuccess('Cấp quyền thành công', 'Cơ sở dữ liệu đã được bảo vệ lưu trữ bền vững (Persistent Storage).');
      } else {
        showError('Chưa cấp quyền', 'Trình duyệt từ chối quyền lưu trữ bền vững. Vui lòng cấp quyền trong Cài đặt trình duyệt.');
      }
    } catch (err: unknown) {
      showError('Lỗi', (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Quản Lý Lưu Trữ & Trung Tâm Bảo Mật"
        description="Kiểm tra dung lượng bộ nhớ, xin quyền lưu trữ bền vững, health check database và minh bạch bảo mật dữ liệu"
        badgeText="App v1.0.0 • Schema v1"
      />

      {/* Backup Reminder Banner */}
      {backupReminder.shouldRemind && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Khuyến cáo sao lưu dữ liệu!</p>
              <p className="text-xs text-amber-800">
                {backupReminder.daysSince === null
                  ? 'Bạn chưa từng tạo bản sao lưu dữ liệu nào.'
                  : `Đã ${backupReminder.daysSince} ngày kể từ lần sao lưu gần nhất.`} Vui lòng sao lưu file `.gvcn-backup` định kỳ để bảo vệ dữ liệu.
              </p>
            </div>
          </div>
          <Button size="sm" variant="secondary" leftIcon={<Database className="w-4 h-4" />} onClick={() => navigate('/backup')}>
            Sao lưu ngay
          </Button>
        </div>
      )}

      {/* Storage & Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Capacity */}
        <Card title="Dung Lượng Lưu Trữ Web Storage API" action={<HardDrive className="w-5 h-5 text-app-primary" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-app-muted font-medium">Dung lượng đã sử dụng</p>
                <p className="text-2xl font-bold text-app-main mt-0.5">{storageInfo.usageMB} MB</p>
              </div>
              <div>
                <p className="text-xs text-app-muted font-medium">Quyền Lưu Trữ Bền Vững</p>
                <Badge variant={isPersisted ? 'success' : 'warning'} className="mt-1">
                  {isPersisted ? 'Đã bật Persistent' : 'Chưa bật Persistent'}
                </Badge>
              </div>
            </div>

            {!isPersisted && (
              <div className="p-3 rounded-lg bg-app-surface-hover border border-app text-xs space-y-2">
                <p className="text-app-main font-medium">
                  Bật quyền **Persistent Storage** để ngăn trình duyệt tự động dọn dẹp cơ sở dữ liệu IndexedDB khi thiết bị sắp hết bộ nhớ.
                </p>
                <Button size="sm" variant="primary" leftIcon={<ShieldCheck className="w-4 h-4" />} onClick={handleRequestPersistent}>
                  Yêu cầu Lưu trữ Bền Vững
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Database Health Check */}
        <Card
          title="Database Health Check"
          action={
            <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadData}>
              Kiểm tra lại
            </Button>
          }
        >
          {loading || !healthStatus ? (
            <LoadingSkeleton type="card" count={2} />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-app-main">Trạng thái Cơ sở dữ liệu</span>
                <Badge variant={healthStatus.status === 'healthy' ? 'success' : 'danger'}>
                  {healthStatus.status === 'healthy' ? 'Lành mạnh (Healthy)' : 'Có lỗi'}
                </Badge>
              </div>

              <div className="p-3 rounded-xl border border-app bg-app-surface text-xs space-y-1 font-mono">
                <p><strong>Database Name:</strong> SoChuNhiemVietOfflineDB</p>
                <p><strong>Schema Version:</strong> v{healthStatus.version}</p>
                <p><strong>Tổng số bản ghi:</strong> {healthStatus.totalRecords} bản ghi</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(healthStatus.tableCounts).map(([tableName, count]) => (
                  <div key={tableName} className="p-2 rounded-lg bg-app-surface border border-app flex justify-between">
                    <span className="text-app-muted">{tableName}:</span>
                    <span className="font-bold text-app-main">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Privacy & Transparency Center */}
      <Card title="Cam Kết Bảo Mật 100% Offline & Minh Bạch Dữ Liệu" action={<Lock className="w-5 h-5 text-app-primary" />}>
        <div className="space-y-3 text-xs text-app-main leading-relaxed">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Ứng dụng hoạt động 100% Offline • KHÔNG máy chủ bên ngoài • KHÔNG thu thập dữ liệu</span>
          </div>

          <ul className="list-disc list-inside space-y-1.5 pt-1 text-app-muted">
            <li><strong>0% Telemetry & Analytics:</strong> Hệ thống không gửi bất kỳ báo cáo hay hành vi người dùng nào ra ngoài Internet.</li>
            <li><strong>Lưu trữ Nội bộ Tuyệt đối:</strong> Toàn bộ hồ sơ giáo viên, danh sách học sinh, điểm danh, thi đua và nhật ký liên hệ phụ huynh được lưu trực tiếp tại cơ sở dữ liệu IndexedDB trong trình duyệt của Thầy/Cô.</li>
            <li><strong>Cảnh báo Xóa Cache Trình duyệt:</strong> Thao tác "Xóa lịch sử web / Xóa dữ liệu duyệt web" của trình duyệt hoặc các phần mềm dọn rác có thể xóa sạch bộ nhớ IndexedDB. Thầy/Cô hãy thường xuyên bấm <strong>Sao lưu dữ liệu</strong> để tải file `.gvcn-backup` về máy tính an toàn!</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
