import React from 'react';
import { clsx } from 'clsx';

export interface RadarSweepProps {
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
  label?: string;
}

export const RadarSweep: React.FC<RadarSweepProps> = ({
  size = 'md',
  active = true,
  className,
  label = 'LIVE ATC SCAN',
}) => {
  const sizePixels = size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-7 w-7' : 'h-10 w-10';

  return (
    <div
      className={clsx('inline-flex items-center gap-xs select-none', className)}
      title={label}
      role="status"
      aria-label={label}
    >
      <div className={clsx('relative flex items-center justify-center shrink-0', sizePixels)}>
        {/* Outer Scope Ring */}
        <div className="absolute inset-0 rounded-full border border-accent-signal/40 bg-surface-1/80 shadow-[0_0_8px_rgba(0,229,255,0.15)]" />
        
        {/* Inner Crosshair Lines */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-accent-signal/20" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-accent-signal/20" />

        {/* Dynamic Conic Sweep (disabled via reduced-motion in index.css, plus static fallback) */}
        {active && (
          <div
            className="absolute inset-0.5 rounded-full overflow-hidden motion-safe:animate-[spin_4s_linear_infinite] motion-reduce:animate-none"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(0, 229, 255, 0.25) 340deg, rgba(0, 229, 255, 0.6) 360deg)',
            }}
          />
        )}

        {/* Central Radar Dot */}
        <div className="relative h-1.5 w-1.5 rounded-full bg-accent-signal shadow-[0_0_6px_#00e5ff]" />
      </div>

      {label && (
        <span className="hidden xl:inline-flex items-center gap-1.5 font-data text-[10px] tracking-widest uppercase text-accent-signal font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-signal animate-pulse" />
          {label}
        </span>
      )}
    </div>
  );
};
