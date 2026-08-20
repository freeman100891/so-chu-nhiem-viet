import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Award, Menu } from 'lucide-react';
import { cn } from '../utilities/cn';

interface BottomNavProps {
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMobileMenu }) => {
  const navItems = [
    { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/students', label: 'Học sinh', icon: Users },
    { to: '/attendance', label: 'Điểm danh', icon: CheckSquare },
    { to: '/conduct', label: 'Thi đua', icon: Award },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-app-surface/95 backdrop-blur-md border-t border-app flex items-center justify-around px-2 py-1 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-lg transition-colors text-[10px] font-medium gap-0.5',
                isActive
                  ? 'text-app-primary font-bold bg-app-primary-light/50'
                  : 'text-app-muted hover:text-app-main'
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] rounded-lg text-app-muted hover:text-app-main text-[10px] font-medium gap-0.5"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </div>
  );
};
