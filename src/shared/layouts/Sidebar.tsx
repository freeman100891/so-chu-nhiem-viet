import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  School,
  Users,
  CheckSquare,
  Award,
  BookOpen,
  BarChart3,
  DatabaseBackup,
  Settings,
  Trash2,
  X,
  GraduationCap,
  Monitor,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  PlusCircle,
  PlayCircle,
  History,
  ShieldCheck,
  HardDrive,
  Scale,
  Sparkles,
  Trophy,
  Flame,
  UserCheck,
  Gift,
} from 'lucide-react';
import { cn } from '../utilities/cn';

interface SubNavItem {
  to: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubNavItem[];
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const STORAGE_KEY = 'gvcn_sidebar_expanded_sections';

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/classes', label: 'Lớp học', icon: School },
    { to: '/students', label: 'Học sinh', icon: Users },
    { to: '/attendance', label: 'Điểm danh', icon: CheckSquare },
    {
      to: '/conduct',
      label: 'Thi đua',
      icon: Award,
      subItems: [
        { to: '/conduct', label: 'Điểm thi đua', icon: Flame, end: true },
        { to: '/conduct/honor-board', label: 'Bảng vàng danh hiệu', icon: Trophy },
      ],
    },
    { to: '/evaluations', label: 'Nhận xét', icon: BookOpen },
    {
      to: '/gifts',
      label: 'Quà tặng',
      icon: Gift,
      subItems: [
        { to: '/gifts', label: 'Thư viện & Đổi quà', icon: Gift, end: true },
        { to: '/gifts/presentation', label: 'Trình chiếu Catalog', icon: Monitor },
      ],
    },
    {
      to: '/live-classroom',
      label: 'Lớp học trực tuyến',
      icon: Monitor,
      subItems: [
        { to: '/live-classroom', label: 'Phiên đang dạy', icon: PlayCircle, end: true },
        { to: '/live-classroom/new', label: 'Mở phiên mới', icon: PlusCircle },
        { to: '/live-classroom/history', label: 'Lịch sử phiên học', icon: History },
      ],
    },
    {
      to: '/reports',
      label: 'Báo cáo',
      icon: BarChart3,
      subItems: [
        { to: '/reports', label: 'Báo cáo tổng quan', icon: BarChart3, end: true },
        { to: '/reports/attendance', label: 'Chuyên cần', icon: UserCheck },
        { to: '/reports/points-ranks', label: 'Điểm & Cấp bậc', icon: Sparkles },
        { to: '/reports/engagement', label: 'Tương tác học tập', icon: Monitor },
        { to: '/reports/honors', label: 'Bảng vàng vinh danh', icon: Trophy },
        { to: '/reports/compare', label: 'So sánh đối sánh lớp', icon: Scale },
      ],
    },
    { to: '/backup', label: 'Sao lưu dữ liệu', icon: DatabaseBackup },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
    {
      to: '/trash',
      label: 'Thùng rác & Log',
      icon: Trash2,
      subItems: [
        { to: '/trash', label: 'Thùng rác khôi phục', icon: Trash2, end: true },
        { to: '/audit-logs', label: 'Nhật ký kiểm soát', icon: ShieldCheck },
        { to: '/privacy', label: 'Bảo mật & Bộ nhớ', icon: HardDrive },
      ],
    },
  ];

  // Load initial expanded state from localStorage or default to open
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore JSON parse error
    }
    // Default: all sections with subItems are open
    return {
      '/conduct': true,
      '/gifts': true,
      '/live-classroom': true,
      '/reports': true,
      '/trash': false,
    };
  });

  // Save to localStorage when changed
  const persistExpanded = useCallback((newState: Record<string, boolean>) => {
    setExpandedSections(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // ignore
    }
  }, []);

  // Auto-expand section if current URL is inside its subItems
  useEffect(() => {
    const pathname = location.pathname;
    navItems.forEach((item) => {
      if (item.subItems && item.subItems.length > 0) {
        const isChildActive = item.subItems.some((sub) =>
          sub.end ? pathname === sub.to : pathname.startsWith(sub.to)
        );
        if (isChildActive && !expandedSections[item.to]) {
          setExpandedSections((prev) => {
            const next = { ...prev, [item.to]: true };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      }
    });
  }, [location.pathname]);

  const toggleSection = (itemTo: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    persistExpanded({
      ...expandedSections,
      [itemTo]: !expandedSections[itemTo],
    });
  };

  const isSectionActive = (item: NavItem): boolean => {
    if (item.to === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (item.subItems) {
      return item.subItems.some((sub) =>
        sub.end ? location.pathname === sub.to : location.pathname.startsWith(sub.to)
      );
    }
    return location.pathname.startsWith(item.to);
  };

  const content = (
    <div
      className={cn(
        'flex flex-col h-full bg-app-surface border-r border-app select-none transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64 xl:w-[var(--sidebar-width)]'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center border-b border-app p-3.5',
          isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-app-primary text-app-primary-fg rounded-xl shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-sm md:text-[var(--text-base)] text-app-main leading-tight truncate">
                Sổ Chủ Nhiệm
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-app-primary px-1.5 py-0.5 bg-app-primary-light rounded inline-block">
                Offline PWA
              </span>
            </div>
          )}
        </div>

        {/* Desktop Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 text-app-muted hover:text-app-main hover:bg-app-surface-hover rounded-lg transition-colors"
            title={isCollapsed ? 'Mở rộng sidebar (Ctrl+B)' : 'Thu gọn sidebar (Ctrl+B)'}
            aria-label="Ẩn hiện thanh menu"
          >
            {isCollapsed ? (
              <PanelLeft className="w-5 h-5 text-app-primary" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-app-muted" />
            )}
          </button>
        )}

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 text-app-muted hover:text-app-main min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
          const isExpanded = Boolean(expandedSections[item.to]);
          const active = isSectionActive(item);

          return (
            <div key={item.to} className="space-y-1">
              <div className="flex items-center group relative">
                <NavLink
                  to={item.to}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm md:text-[var(--text-base)] font-medium transition-all min-h-[44px] flex-1',
                      isCollapsed ? 'justify-center px-0' : '',
                      isActive || (hasSubItems && active && !isExpanded)
                        ? 'bg-app-primary text-app-primary-fg font-semibold shadow-xs'
                        : 'text-app-main hover:bg-app-surface-hover hover:text-app-primary'
                    )
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                </NavLink>

                {/* Sub-item Expand/Collapse Toggle Chevron Button */}
                {hasSubItems && !isCollapsed && (
                  <button
                    type="button"
                    onClick={(e) => toggleSection(item.to, e)}
                    className={cn(
                      'p-2 mr-1 rounded-lg text-app-muted hover:text-app-main hover:bg-app-surface-hover transition-transform duration-200 shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center',
                      active && !isExpanded ? 'text-app-primary-fg/80 hover:text-app-primary-fg' : ''
                    )}
                    title={isExpanded ? `Thu gọn ${item.label}` : `Mở rộng ${item.label}`}
                    aria-label={isExpanded ? `Thu gọn ${item.label}` : `Mở rộng ${item.label}`}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                    )}
                  </button>
                )}
              </div>

              {/* Submenu Accordion (Collapsible & Expandable with smooth transition) */}
              {hasSubItems && !isCollapsed && (
                <div
                  className={cn(
                    'grid transition-all duration-200 ease-in-out',
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pl-6 pr-2 space-y-1 py-1 text-xs border-l-2 border-app-primary/20 ml-5 my-0.5">
                      {item.subItems!.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            end={sub.end}
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2 px-2.5 py-2 rounded-lg font-medium transition-colors',
                                isActive
                                  ? 'bg-app-primary-light text-app-primary font-bold shadow-2xs'
                                  : 'text-app-muted hover:text-app-main hover:bg-app-surface-hover'
                              )
                            }
                          >
                            {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate">{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-3 border-t border-app text-center text-xs">
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            className="p-2 text-app-primary hover:bg-app-surface-hover rounded-xl w-full flex justify-center"
            title="Mở rộng menu"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <div>
            <p className="text-xs text-app-muted font-medium">Lưu trữ 100% Cục bộ</p>
            <p className="text-[11px] text-app-muted/80 mt-0.5">Không cần Internet</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 h-full animate-slideRight">{content}</div>
        </div>
      )}
    </>
  );
};
