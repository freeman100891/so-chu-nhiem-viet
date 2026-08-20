import React from 'react';
import { cn } from '../utilities/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
  return (
    <div
      className={cn(
        'bg-app-surface border border-app rounded-xl shadow-xs overflow-hidden transition-all',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-app bg-app-surface">
          {typeof title === 'string' ? (
            <h3 className="text-base font-bold text-app-main">{title}</h3>
          ) : (
            title
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
