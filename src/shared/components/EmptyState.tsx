import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '../utilities/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có dữ liệu nào trong mục này.',
  actionText,
  onAction,
  icon,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-app rounded-xl bg-app-surface/50 my-4', className)}>
      <div className="p-4 bg-app-primary-light text-app-primary rounded-full mb-3">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-bold text-app-main">{title}</h4>
      <p className="text-sm text-app-muted max-w-sm mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
