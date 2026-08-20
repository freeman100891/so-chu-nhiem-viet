import React from 'react';
import { cn } from '../utilities/cn';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px] min-w-[44px] rounded-lg';

  const variantStyles = {
    primary:
      'bg-app-primary text-app-primary-fg hover:opacity-90 active:scale-[0.98] focus:ring-amber-500 shadow-xs',
    secondary:
      'bg-app-surface text-app-main border border-app hover:bg-app-surface-hover active:scale-[0.98] focus:ring-gray-400 shadow-xs',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] focus:ring-red-500 shadow-xs',
    ghost:
      'bg-transparent text-app-main hover:bg-app-surface-hover active:scale-[0.98] focus:ring-gray-300',
    outline:
      'bg-transparent text-app-primary border-2 border-app-primary hover:bg-app-primary-light focus:ring-amber-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-medium gap-1.5',
    md: 'px-4 py-2 text-sm font-semibold gap-2',
    lg: 'px-6 py-3 text-base font-semibold gap-2.5',
  };

  const isBtnDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isBtnDisabled}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" label="" className="p-0 border-0" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
