import React from 'react';
import { clsx } from 'clsx';

export type StatusVariant = 'ontime' | 'boarding' | 'delayed' | 'alert' | 'neutral';
export type StatusSize = 'sm' | 'md';

export interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  size?: StatusSize;
  showDot?: boolean;
  pulseDot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; border: string; dot: string }> = {
  ontime: {
    bg: 'bg-status-ontime/10',
    text: 'text-status-ontime',
    border: 'border-status-ontime/30',
    dot: 'bg-status-ontime',
  },
  boarding: {
    bg: 'bg-status-boarding/10',
    text: 'text-status-boarding',
    border: 'border-status-boarding/30',
    dot: 'bg-status-boarding',
  },
  delayed: {
    bg: 'bg-status-delayed/10',
    text: 'text-status-delayed',
    border: 'border-status-delayed/30',
    dot: 'bg-status-delayed',
  },
  alert: {
    bg: 'bg-status-alert/10',
    text: 'text-status-alert',
    border: 'border-status-alert/30',
    dot: 'bg-status-alert',
  },
  neutral: {
    bg: 'bg-line/40',
    text: 'text-ink-muted',
    border: 'border-line',
    dot: 'bg-ink-muted',
  },
};

const sizeStyles: Record<StatusSize, { container: string; text: string; dot: string }> = {
  sm: {
    container: 'px-2xs py-4xs text-xs',
    text: 'font-data text-xs tracking-wider uppercase',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    container: 'px-xs py-3xs text-sm',
    text: 'font-data text-sm font-medium tracking-wide uppercase',
    dot: 'h-2 w-2',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  size = 'sm',
  showDot = true,
  pulseDot = false,
  className,
  children,
}) => {
  const styles = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-sm border font-data tabular-data select-none',
        styles.bg,
        styles.text,
        styles.border,
        sizeConfig.container,
        className
      )}
    >
      {showDot && (
        <span className="relative flex items-center justify-center">
          {pulseDot && (
            <span
              className={clsx(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                styles.dot
              )}
            />
          )}
          <span className={clsx('relative inline-flex rounded-full', sizeConfig.dot, styles.dot)} />
        </span>
      )}
      <span className={sizeConfig.text}>{label ?? children}</span>
    </span>
  );
};
