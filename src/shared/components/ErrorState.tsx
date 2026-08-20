import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../utilities/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có lỗi xảy ra trong quá trình truy vấn dữ liệu từ cơ sở dữ liệu IndexedDB.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn('p-6 rounded-xl bg-red-50 border border-red-200 text-red-900 flex flex-col items-center text-center my-4', className)}>
      <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold">{title}</h4>
      <p className="text-sm text-red-700 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
};
