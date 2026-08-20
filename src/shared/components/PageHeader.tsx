import React from 'react';
import { cn } from '../utilities/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badgeText?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badgeText,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-app mb-6', className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-app-main leading-tight">{title}</h2>
          {badgeText && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-app-primary-light text-app-primary border border-app-primary/20">
              {badgeText}
            </span>
          )}
        </div>
        {description && <p className="text-sm text-app-muted">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};
