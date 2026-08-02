import React from 'react';
import { clsx } from 'clsx';

export type PanelVariant = 'surface-1' | 'surface-2';

export interface PanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  variant?: PanelVariant;
  glow?: boolean;
  accentBorder?: 'ontime' | 'boarding' | 'delayed' | 'alert' | 'signal' | 'none';
  className?: string;
  headerClassName?: string;
  children?: React.ReactNode;
}

const accentBorderMap: Record<NonNullable<PanelProps['accentBorder']>, string> = {
  ontime: 'border-l-2 border-l-status-ontime',
  boarding: 'border-l-2 border-l-status-boarding',
  delayed: 'border-l-2 border-l-status-delayed',
  alert: 'border-l-2 border-l-status-alert',
  signal: 'border-l-2 border-l-accent-signal',
  none: '',
};

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  headerActions,
  variant = 'surface-1',
  glow = false,
  accentBorder = 'none',
  className,
  headerClassName,
  children,
}) => {
  const bgClass = variant === 'surface-1' ? 'bg-surface-1' : 'bg-surface-2';

  return (
    <section
      className={clsx(
        'rounded-md border border-line flex flex-col transition-colors',
        bgClass,
        accentBorderMap[accentBorder],
        glow && 'shadow-[0_0_15px_rgba(0,229,255,0.06)]',
        className
      )}
    >
      {(title || subtitle || headerActions) && (
        <div
          className={clsx(
            'flex items-center justify-between gap-sm px-md py-xs border-b border-line/60',
            headerClassName
          )}
        >
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="font-display text-sm font-semibold tracking-wide text-ink-primary truncate flex items-center gap-2xs">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-display text-xs text-ink-muted mt-4xs truncate">{subtitle}</p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2xs shrink-0">{headerActions}</div>}
        </div>
      )}
      <div className="p-md flex-1">{children}</div>
    </section>
  );
};
