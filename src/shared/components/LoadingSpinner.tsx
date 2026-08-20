import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utilities/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label = 'Đang tải...',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 p-4', className)} role="status">
      <Loader2 className={cn('animate-spin text-app-primary', sizeMap[size])} />
      {label && <span className="text-sm font-medium text-app-muted">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
};
