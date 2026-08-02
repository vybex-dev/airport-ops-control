import React from 'react';
import { clsx } from 'clsx';

export interface DataTableShellProps {
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  filterBar?: React.ReactNode;
  footerBar?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: React.ReactNode;
}

export const DataTableShell: React.FC<DataTableShellProps> = ({
  title,
  headerActions,
  filterBar,
  footerBar,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No records match current operator filter.',
  className,
  children,
}) => {
  return (
    <div
      className={clsx(
        'rounded-md border border-line bg-surface-1 flex flex-col overflow-hidden',
        className
      )}
    >
      {(title || headerActions) && (
        <div className="flex flex-wrap items-center justify-between gap-sm px-md py-xs border-b border-line bg-surface-1">
          {title && (
            <div className="font-display text-sm font-semibold tracking-wide text-ink-primary flex items-center gap-2xs">
              {title}
            </div>
          )}
          {headerActions && <div className="flex items-center gap-xs ml-auto">{headerActions}</div>}
        </div>
      )}

      {filterBar && (
        <div className="px-md py-xs border-b border-line/60 bg-surface-2/40 flex items-center gap-xs flex-wrap">
          {filterBar}
        </div>
      )}

      <div className="relative overflow-x-auto min-h-[160px] flex-1">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-1/80 z-10 gap-xs">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent-signal border-t-transparent" />
            <span className="font-data text-xs text-accent-signal uppercase tracking-wider">
              Querying DEL Ops Database...
            </span>
          </div>
        ) : isEmpty ? (
          <div className="p-xl text-center flex flex-col items-center justify-center gap-xs text-ink-muted">
            <p className="font-display text-sm">{emptyMessage}</p>
            <span className="font-data text-xs text-ink-muted/60">
              Adjust filters or clear search query to view operational events.
            </span>
          </div>
        ) : (
          children
        )}
      </div>

      {footerBar && (
        <div className="px-md py-2xs border-t border-line bg-surface-2/60 font-data text-xs text-ink-muted flex items-center justify-between">
          {footerBar}
        </div>
      )}
    </div>
  );
};
