import React from 'react';
import { clsx } from 'clsx';

export type TagVariant = 'default' | 'gate' | 'mono' | 'accent' | 'warning' | 'alert' | 'success';

export interface TagProps {
  variant?: TagVariant;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<TagVariant, string> = {
  default: 'bg-surface-2 text-ink-muted border-line',
  gate: 'bg-surface-2 text-ink-primary font-data font-semibold border-line tracking-wide',
  mono: 'bg-surface-2 text-ink-primary font-data border-line',
  accent: 'bg-accent-signal/10 text-accent-signal border-accent-signal/30',
  warning: 'bg-status-delayed/10 text-status-delayed border-status-delayed/30',
  alert: 'bg-status-alert/10 text-status-alert border-status-alert/30',
  success: 'bg-status-ontime/10 text-status-ontime border-status-ontime/30',
};

export const Tag: React.FC<TagProps> = ({ variant = 'default', icon, className, children }) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-xs border px-2xs py-4xs text-xs font-display select-none',
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0 flex items-center text-current">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};
