import React from 'react';
import { cn } from '../utilities/cn';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold text-app-main flex items-center justify-between">
            <span>{label}</span>
            {props.required && <span className="text-red-500 text-xs font-normal ml-1">* bắt buộc</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border bg-app-surface text-app-main text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer',
            error ? 'border-red-500 focus:ring-red-500' : 'border-app',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="text-xs font-medium text-red-600" role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-app-muted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
