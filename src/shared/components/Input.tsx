import React from 'react';
import { cn } from '../utilities/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-app-main flex items-center justify-between">
            <span>{label}</span>
            {props.required && <span className="text-red-500 text-xs font-normal ml-1">* bắt buộc</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-app-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border bg-app-surface text-app-main text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 placeholder:text-gray-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error ? 'border-red-500 focus:ring-red-500' : 'border-app',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-app-muted flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <span className="text-xs font-medium text-red-600 animate-fadeIn" role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-app-muted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
