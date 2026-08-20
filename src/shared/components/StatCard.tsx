import React from 'react';
import { cn } from '../utilities/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  trend?: {
    text: string;
    type: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  badge,
  trend,
  className,
}) => {
  return (
    <div className={cn('p-5 rounded-xl border border-app bg-app-surface shadow-xs transition-all hover:shadow-md', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">{title}</span>
        <div className="p-2.5 rounded-xl bg-app-primary-light text-app-primary shrink-0">{icon}</div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-extrabold text-app-main">{value}</h3>
        {subtitle && <p className="text-xs text-app-muted mt-1">{subtitle}</p>}
      </div>
      {(badge || trend) && (
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-app">
          {badge && <div>{badge}</div>}
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                trend.type === 'up' && 'bg-emerald-100 text-emerald-800',
                trend.type === 'down' && 'bg-red-100 text-red-800',
                trend.type === 'neutral' && 'bg-gray-100 text-gray-800'
              )}
            >
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
