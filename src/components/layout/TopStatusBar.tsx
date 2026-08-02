import React, { useState } from 'react';
import { RadarSweep } from '../ui/RadarSweep';
import { SearchInput } from '../ui/SearchInput';
import { StatusBadge } from '../ui/StatusBadge';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { useSimClock, useAlerts, useAirportKPIs } from '@/store/useSimEngineHooks';
import { Plane, Clock, Menu, X, ShieldAlert } from 'lucide-react';

export interface TopStatusBarProps {
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  onToggleMobileNav,
  isMobileNavOpen = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { formattedTime, isPlaying, speedMultiplier } = useSimClock();
  const { unacknowledgedCount, openAlertsDrawer } = useAlerts();
  const kpis = useAirportKPIs();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-surface-0/95 backdrop-blur-md">
      <div className="flex items-center justify-between gap-sm px-md py-xs">
        {/* Left Section: Mobile Nav Toggle + Airport Identity */}
        <div className="flex items-center gap-md">
          {onToggleMobileNav && (
            <button
              type="button"
              onClick={onToggleMobileNav}
              aria-label={isMobileNavOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileNavOpen}
              className="lg:hidden p-1.5 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
            >
              {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <div className="flex items-center gap-xs">
            <div className="flex items-center justify-center h-8 w-10 rounded bg-accent-signal/15 border border-accent-signal/40 text-accent-signal font-data text-xs font-bold tracking-widest select-none shadow-[0_0_10px_rgba(0,229,255,0.15)]">
              DEL
            </div>

            <div>
              <div className="flex items-center gap-2xs">
                <h1 className="font-display text-xs sm:text-sm font-semibold tracking-wide text-ink-primary truncate max-w-[160px] sm:max-w-none">
                  Indira Gandhi International Airport
                </h1>
                <span className="font-data text-[9px] sm:text-[10px] text-ink-muted px-1.5 py-0.5 rounded bg-surface-2 border border-line shrink-0">
                  VIDP / T3 NOC
                </span>
              </div>
              <p className="font-display text-[11px] text-ink-muted hidden sm:block">
                Operations Control Center — Real-time Monitoring & Dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Center Section: Live Virtual Clock & Radar Sweep */}
        <div className="hidden md:flex items-center gap-md border-x border-line/60 px-md py-0.5">
          <RadarSweep size="sm" active={isPlaying} label="ATC RADAR" />

          <div className="flex items-center gap-2xs font-data">
            <Clock className="h-3.5 w-3.5 text-accent-signal" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-ink-primary font-medium tracking-tight">
                <span className="text-accent-signal font-semibold">{formattedTime}</span>
                <span className="text-ink-muted">IST</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-ink-muted">
                <span>UTC+05:30</span>
                <span className="text-line">•</span>
                <span className={isPlaying ? 'text-status-ontime font-medium' : 'text-ink-muted'}>
                  {isPlaying ? `SIM PLAYING (${speedMultiplier}x)` : 'SIM PAUSED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: KPI Tiles, Global Alert Trigger & Search */}
        <div className="flex items-center gap-sm">
          <div className="hidden xl:flex items-center gap-xs">
            {/* Active Flights Tile */}
            <div className="flex items-center gap-2xs px-xs py-1 rounded bg-surface-1 border border-line">
              <Plane className="h-3.5 w-3.5 text-status-boarding shrink-0" />
              <div className="font-data text-xs">
                <span className="text-ink-muted mr-1">ACTIVE</span>
                <span className="font-semibold text-ink-primary">
                  <AnimatedNumber value={kpis.flights.activeAirborne} />
                </span>
              </div>
            </div>

            {/* On-Time Rate Tile */}
            <div className="flex items-center gap-2xs px-xs py-1 rounded bg-surface-1 border border-line">
              <StatusBadge variant="ontime" size="sm" showDot pulseDot={false}>
                <AnimatedNumber value={kpis.flights.otpPct} suffix="% OTP" />
              </StatusBadge>
            </div>
          </div>

          {/* Persistent Open Alerts Button */}
          <button
            type="button"
            onClick={openAlertsDrawer}
            className={`flex items-center gap-2xs px-xs py-1 rounded border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal ${
              unacknowledgedCount > 0
                ? 'bg-status-alert/15 border-status-alert/50 text-status-alert shadow-[0_0_10px_rgba(244,63,94,0.2)] hover:bg-status-alert/25'
                : 'bg-surface-1 border-line text-ink-muted hover:text-ink-primary'
            }`}
          >
            <ShieldAlert className={`h-4 w-4 shrink-0 ${unacknowledgedCount > 0 ? 'animate-pulse text-status-alert' : ''}`} />
            <div className="font-data text-xs flex items-center gap-1">
              <span className="font-bold">
                <AnimatedNumber value={unacknowledgedCount} />
              </span>
              <span className="hidden sm:inline">ALERTS</span>
            </div>
          </button>

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-36 focus-within:w-48 sm:w-48 sm:focus-within:w-60 md:w-60 md:focus-within:w-72 lg:w-72 lg:focus-within:w-80 shrink-0"
          />
        </div>
      </div>
    </header>
  );
};
