import React from 'react';
import { cn } from '../utilities/cn';

export interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'text' | 'avatar';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'text',
  count = 1,
  className,
}) => {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
        {items.map((_, i) => (
          <div key={i} className="p-5 rounded-xl border border-app bg-app-surface animate-pulse space-y-3">
            <div className="h-4 bg-app-surface-hover rounded w-1/3" />
            <div className="h-8 bg-app-surface-hover rounded w-1/2" />
            <div className="h-4 bg-app-surface-hover rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={cn('w-full border border-app rounded-xl bg-app-surface overflow-hidden p-4 space-y-3 animate-pulse', className)}>
        <div className="h-6 bg-app-surface-hover rounded w-full mb-4" />
        {items.map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-app-surface-hover rounded flex-1" />
            <div className="h-4 bg-app-surface-hover rounded flex-1" />
            <div className="h-4 bg-app-surface-hover rounded flex-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2 animate-pulse', className)}>
      {items.map((_, i) => (
        <div key={i} className="h-4 bg-app-surface-hover rounded w-full" />
      ))}
    </div>
  );
};
