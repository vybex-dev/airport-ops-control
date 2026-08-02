import React from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-signal text-surface-0 font-semibold hover:bg-accent-signal/90 active:bg-accent-signal/80 border-transparent shadow-sm',
  secondary:
    'bg-surface-2 text-ink-primary hover:bg-line/60 active:bg-line border-line font-medium',
  ghost:
    'bg-transparent text-ink-muted hover:text-ink-primary hover:bg-surface-2/60 border-transparent',
  danger:
    'bg-status-alert/20 text-status-alert border-status-alert/40 hover:bg-status-alert/30 active:bg-status-alert/40 font-medium',
  outline:
    'bg-transparent text-accent-signal border-accent-signal/40 hover:bg-accent-signal/10 active:bg-accent-signal/20 font-medium',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2xs py-4xs text-xs gap-1.5 rounded-xs',
  sm: 'px-xs py-2xs text-xs font-medium gap-2 rounded-xs',
  md: 'px-sm py-xs text-sm font-medium gap-2.5 rounded-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'sm',
      icon,
      iconPosition = 'left',
      isLoading = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center border font-display transition-colors cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : icon && iconPosition === 'left' ? (
          <span className="shrink-0 flex items-center">{icon}</span>
        ) : null}

        {children && <span>{children}</span>}

        {!isLoading && icon && iconPosition === 'right' && (
          <span className="shrink-0 flex items-center">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
