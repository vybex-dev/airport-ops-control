import React from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Plane, Clock, Sparkles } from 'lucide-react';
import type { FlightFilterOptions } from '@/lib/flights/flightDataService';

interface FlightFidsHeaderProps {
  totalFlights: number;
  filteredCount: number;
  boardingCount: number;
  onTimeCount: number;
  delayedCount: number;
  criticalDelayCount: number;
  activeAlertsCount: number;
  filters: FlightFilterOptions;
  onFilterChange: (updates: Partial<FlightFilterOptions>) => void;
  formattedSimTime: string;
}

export const FlightFidsHeader: React.FC<FlightFidsHeaderProps> = ({
  totalFlights,
  filteredCount,
  boardingCount,
  onTimeCount,
  delayedCount,
  criticalDelayCount,
  activeAlertsCount,
  filters,
  onFilterChange,
  formattedSimTime,
}) => {
  return (
    <div className="space-y-sm">
      {/* Flagship Title & Control Room FIDS Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md p-md rounded-md bg-surface-1 border border-line shadow-lg relative overflow-hidden">
        {/* Glow accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-status-boarding via-accent-signal to-status-delayed" />

        <div className="flex items-center gap-md">
          <div className="p-xs rounded-md bg-surface-2 border border-accent-signal/30 text-accent-signal shadow-inner flex items-center justify-center shrink-0">
            <Plane className="h-7 w-7 text-accent-signal animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-xs flex-wrap">
              <h1 className="font-display text-xl font-bold tracking-tight text-ink-primary">
                DEL Flight Operations & FIDS
              </h1>
              <StatusBadge variant="boarding" size="sm" pulseDot>
                SIM CLOCK LIVE
              </StatusBadge>
              {activeAlertsCount > 0 && (
                <StatusBadge variant="alert" size="sm" pulseDot>
                  {activeAlertsCount} ACTIVE ALERTS
                </StatusBadge>
              )}
            </div>
            <p className="font-display text-xs text-ink-muted mt-1 font-normal flex items-center gap-xs">
              <span>Indira Gandhi International Airport — Terminal 3 Concourse Master Schedule</span>
              <span className="text-line">•</span>
              <span className="font-data text-accent-signal flex items-center gap-1">
                <Clock className="h-3 w-3 inline" />
                {formattedSimTime}
              </span>
            </p>
          </div>
        </div>

        {/* FIDS Quick KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-xs">
          {/* Total Master */}
          <div className="p-xs rounded bg-surface-2/60 border border-line text-center min-w-[90px]">
            <span className="block font-data text-[10px] uppercase text-ink-muted tracking-wider">Total</span>
            <span className="font-data text-base font-bold text-ink-primary tabular-nums">
              {filteredCount}
              <span className="text-[10px] text-ink-muted font-normal ml-0.5">/{totalFlights}</span>
            </span>
          </div>

          {/* Boarding Now */}
          <div
            onClick={() => onFilterChange({ preset: filters.preset === 'BOARDING_NOW' ? 'ALL' : 'BOARDING_NOW' })}
            className={`p-xs rounded border text-center cursor-pointer transition-all ${
              filters.preset === 'BOARDING_NOW'
                ? 'bg-status-boarding/20 border-status-boarding text-status-boarding shadow-sm'
                : 'bg-surface-2/60 border-line hover:border-status-boarding/50'
            }`}
          >
            <span className="block font-data text-[10px] uppercase text-status-boarding tracking-wider">Boarding</span>
            <span className="font-data text-base font-bold text-status-boarding tabular-nums">{boardingCount}</span>
          </div>

          {/* On-Time */}
          <div className="p-xs rounded bg-surface-2/60 border border-line text-center min-w-[90px]">
            <span className="block font-data text-[10px] uppercase text-status-ontime tracking-wider">On-Time</span>
            <span className="font-data text-base font-bold text-status-ontime tabular-nums">{onTimeCount}</span>
          </div>

          {/* Delayed */}
          <div
            onClick={() => onFilterChange({ preset: filters.preset === 'DELAYED' ? 'ALL' : 'DELAYED' })}
            className={`p-xs rounded border text-center cursor-pointer transition-all ${
              filters.preset === 'DELAYED'
                ? 'bg-status-delayed/20 border-status-delayed text-status-delayed shadow-sm'
                : 'bg-surface-2/60 border-line hover:border-status-delayed/50'
            }`}
          >
            <span className="block font-data text-[10px] uppercase text-status-delayed tracking-wider">Delayed</span>
            <span className="font-data text-base font-bold text-status-delayed tabular-nums">{delayedCount}</span>
          </div>

          {/* Critical Delays */}
          <div
            onClick={() => onFilterChange({ preset: filters.preset === 'CRITICAL_DELAY' ? 'ALL' : 'CRITICAL_DELAY' })}
            className={`p-xs rounded border text-center cursor-pointer transition-all ${
              filters.preset === 'CRITICAL_DELAY'
                ? 'bg-status-alert/20 border-status-alert text-status-alert shadow-sm'
                : 'bg-surface-2/60 border-line hover:border-status-alert/50'
            }`}
          >
            <span className="block font-data text-[10px] uppercase text-status-alert tracking-wider">Critical (&ge;150m)</span>
            <span className="font-data text-base font-bold text-status-alert tabular-nums">{criticalDelayCount}</span>
          </div>
        </div>
      </div>

      {/* Preset Chips Quick Bar */}
      <div className="flex items-center gap-xs flex-wrap font-data text-xs px-xs py-1 rounded bg-surface-2/30 border border-line/50">
        <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-accent-signal" /> Quick Presets:
        </span>

        <button
          type="button"
          onClick={() => onFilterChange({ preset: 'ALL', statusFilter: 'ALL' })}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            filters.preset === 'ALL' && filters.statusFilter === 'ALL'
              ? 'bg-accent-signal/20 text-accent-signal border border-accent-signal/40'
              : 'bg-surface-1 text-ink-muted hover:text-ink-primary border border-line'
          }`}
        >
          All Flights ({totalFlights})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange({ preset: 'BOARDING_NOW' })}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            filters.preset === 'BOARDING_NOW'
              ? 'bg-status-boarding/20 text-status-boarding border border-status-boarding/40 font-semibold'
              : 'bg-surface-1 text-ink-muted hover:text-status-boarding border border-line'
          }`}
        >
          ⚡ Boarding Now ({boardingCount})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange({ preset: 'DELAYED' })}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            filters.preset === 'DELAYED'
              ? 'bg-status-delayed/20 text-status-delayed border border-status-delayed/40 font-semibold'
              : 'bg-surface-1 text-ink-muted hover:text-status-delayed border border-line'
          }`}
        >
          ⚠️ Delayed ({delayedCount})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange({ preset: 'CRITICAL_DELAY' })}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            filters.preset === 'CRITICAL_DELAY'
              ? 'bg-status-alert/20 text-status-alert border border-status-alert/40 font-semibold'
              : 'bg-surface-1 text-ink-muted hover:text-status-alert border border-line'
          }`}
        >
          🚨 Critical Delays &ge;150m ({criticalDelayCount})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange({ preset: filters.preset === 'INTL' ? 'ALL' : 'INTL' })}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            filters.preset === 'INTL'
              ? 'bg-accent-signal/20 text-accent-signal border border-accent-signal/40 font-semibold'
              : 'bg-surface-1 text-ink-muted hover:text-ink-primary border border-line'
          }`}
        >
          🌐 International Routes
        </button>
      </div>
    </div>
  );
};
