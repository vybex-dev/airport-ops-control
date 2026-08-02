import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  shortcutKey?: string;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  shortcutKey = 'k',
  placeholder = 'Global Search (flight #, gate, PNR, staff ID)...',
  className,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey]);

  return (
    <div className={clsx('relative flex items-center max-w-md transition-all duration-300', className || 'w-full')}>
      <Search className="absolute left-xs h-4 w-4 text-ink-muted pointer-events-none shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Global operator search"
        className={clsx(
          'w-full bg-surface-0/90 text-ink-primary placeholder:text-ink-muted/70 text-xs font-display',
          'pl-9 pr-8 sm:pr-14 py-2xs rounded-sm border border-line transition-all duration-150',
          'focus:outline-none focus:border-accent-signal focus:ring-1 focus:ring-accent-signal/50 focus:bg-surface-1'
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-xs text-ink-muted hover:text-ink-primary p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-signal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <kbd className="absolute right-xs hidden sm:inline-flex items-center gap-0.5 pointer-events-none select-none rounded border border-line bg-surface-2 px-1.5 font-data text-[10px] font-medium text-ink-muted">
          <span className="text-[9px]">⌘</span>{shortcutKey.toUpperCase()}
        </kbd>
      )}
    </div>
  );
};
