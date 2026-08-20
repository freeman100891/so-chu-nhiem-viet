import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utilities/cn';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md bg-app-surface text-app-main h-full shadow-2xl border-app flex flex-col',
          position === 'right' ? 'ml-auto border-l animate-slideLeft' : 'mr-auto border-r animate-slideRight',
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-app bg-app-surface">
          {title ? <h3 className="text-base font-bold text-app-main">{title}</h3> : <div />}
          <button
            onClick={onClose}
            className="p-2 text-app-muted hover:text-app-main hover:bg-app-surface-hover rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Đóng bảng trượt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};
