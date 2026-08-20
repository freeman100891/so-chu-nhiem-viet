import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { ToastProvider } from '../components/ToastContext';
import { TermDateWarningBanner } from '../components/TermDateWarningBanner';
import { useOnboardingCheck } from '../hooks/useOnboardingCheck';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const { checking } = useOnboardingCheck();

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl + B or Cmd + B to toggle desktop sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapse]);

  if (checking) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-app-main text-app-main font-sans antialiased">
        <div className="hide-on-presentation">
          <Sidebar
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <div className="hide-on-presentation">
            <Header onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />
            <TermDateWarningBanner />
          </div>
          <main className="flex-1 p-[var(--space-2)] sm:p-[var(--space-3)] md:p-[var(--space-4)] max-w-[min(100%,112rem)] w-full mx-auto">
            <Outlet />
          </main>
        </div>
        <div className="hide-on-presentation">
          <BottomNav onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        </div>
      </div>
    </ToastProvider>
  );
};
