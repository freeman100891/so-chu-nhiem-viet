import React, { useState, useEffect } from 'react';
import {
  Menu,
  Palette,
  Wifi,
  WifiOff,
  Download,
  Database,
  UserCheck,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLastBackupStatus } from '../hooks/useLastBackupStatus';
import { THEME_OPTIONS } from '../../themes/theme.types';
import { teacherProfileRepository } from '../../core/repositories/teacher-profile.repository';
import type { TeacherProfile } from '../../core/database/types';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const { canInstall, promptInstall } = usePWAInstall();
  const { lastBackupText } = useLastBackupStatus();

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  const loadActiveContext = async () => {
    try {
      const p = await teacherProfileRepository.getProfile();
      setProfile(p || null);
    } catch (err) {
      console.error('Error loading active context in header:', err);
    }
  };

  useEffect(() => {
    loadActiveContext();
    const handleProfileUpdate = () => {
      loadActiveContext();
    };
    window.addEventListener('TEACHER_PROFILE_UPDATED', handleProfileUpdate);
    return () => {
      window.removeEventListener('TEACHER_PROFILE_UPDATED', handleProfileUpdate);
    };
  }, []);

  return (
    <header className="h-16 px-4 sm:px-6 bg-app-surface border-b border-app flex items-center justify-between z-30 sticky top-0 transition-colors">
      {/* LEFT: Mobile Navigation Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 rounded-lg hover:bg-app-surface-hover md:hidden text-app-main min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* RIGHT: Quick Utilities & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Offline / Online Status Indicator */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40'
          }`}
          title={isOnline ? 'Đang kết nối trực tuyến (Dữ liệu lưu an toàn trong máy)' : 'Đang làm việc offline (Dữ liệu sẵn sàng)'}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">Offline-First Sẵn sàng</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Chế độ Ngoại tuyến</span>
            </>
          )}
        </div>

        {/* PWA Install Button */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-app-primary text-app-primary-fg text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-opacity min-h-[36px]"
            title="Cài đặt phần mềm lên máy tính để dùng nhanh không cần trình duyệt"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cài đặt App</span>
          </button>
        )}

        {/* Backup Status Pill */}
        <button
          onClick={() => navigate('/backup')}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-app-muted hover:text-app-main hover:bg-app-surface-hover rounded-xl border border-app transition-colors"
          title={`Trạng thái sao lưu: ${lastBackupText}. Bấm để mở Trung tâm sao lưu.`}
        >
          <Database className="w-3.5 h-3.5 text-app-primary" />
          <span className="font-medium text-[11px]">{lastBackupText}</span>
        </button>

        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemePicker(!showThemePicker);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-lg border border-app hover:bg-app-surface-hover text-app-main min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="Đổi phong cách giao diện"
            aria-label="Bảng chọn màu giao diện"
          >
            <Palette className="w-5 h-5 text-app-primary" />
          </button>

          {showThemePicker && (
            <div className="absolute right-0 mt-2 w-64 p-3 bg-app-surface border border-app rounded-2xl shadow-xl z-50 animate-fadeIn space-y-2">
              <div className="text-xs font-bold text-app-main px-1 pb-1 border-b border-app">
                Chọn phong cách giao diện
              </div>
              {THEME_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    changeTheme(item.id);
                    setShowThemePicker(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    theme === item.id
                      ? 'border-app-primary bg-app-primary-light text-app-primary font-bold shadow-xs'
                      : 'border-app hover:bg-app-surface-hover text-app-main'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{item.description}</div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: item.previewColors.primary }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: item.previewColors.bg }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Teacher Account / Settings Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowThemePicker(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-app bg-app-surface hover:bg-app-surface-hover min-h-[44px] transition-colors"
            aria-label="Menu tài khoản"
          >
            <div className="w-7 h-7 rounded-full bg-app-primary text-app-primary-fg font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-app-primary/20">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.fullName || 'GV'} className="w-full h-full object-cover" />
              ) : profile?.fullName ? (
                profile.fullName.charAt(0).toUpperCase()
              ) : (
                'GV'
              )}
            </div>
            <span className="hidden lg:inline text-xs font-bold text-app-main max-w-[100px] truncate">
              {profile?.fullName || 'Giáo viên'}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 p-2 bg-app-surface border border-app rounded-2xl shadow-xl z-50 animate-fadeIn space-y-1">
              <div className="p-2.5 border-b border-app flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-app-primary text-app-primary-fg font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt={profile.fullName || 'GV'} className="w-full h-full object-cover" />
                  ) : profile?.fullName ? (
                    profile.fullName.charAt(0).toUpperCase()
                  ) : (
                    'GV'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-app-main truncate">{profile?.fullName || 'Giáo viên Chủ nhiệm'}</p>
                  <p className="text-[11px] text-app-muted truncate">{profile?.schoolName || 'Chưa cập nhật trường'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-app-main hover:bg-app-surface-hover rounded-xl flex items-center gap-2 min-h-[44px]"
              >
                <UserCheck className="w-4 h-4 text-app-primary" />
                Hồ sơ & Cài đặt
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
