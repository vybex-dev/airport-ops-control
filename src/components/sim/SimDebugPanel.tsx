import React, { useState } from 'react';
import { useSimClock, useLiveFeed, useAlerts } from '@/store/useSimEngineHooks';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Calendar,
  Activity,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Terminal,
  Zap,
} from 'lucide-react';

export const SimDebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    formattedTime,
    isPlaying,
    speedMultiplier,
    togglePlay,
    setSpeed,
    jumpToDate,
    stepForward,
    resetClock,
  } = useSimClock();

  const { totalCount, latestEvent } = useLiveFeed({ limit: 1 });
  const { unacknowledgedCount } = useAlerts();

  const speeds = [1, 10, 60, 300, 3600];

  return (
    <div className="border-t border-line bg-surface-1/95 backdrop-blur-md font-display text-xs">
      {/* Compact Status Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-sm px-md py-xs">
        <div className="flex items-center gap-md">
          {/* SIM ENGINE Status Indicator */}
          <div className="flex items-center gap-xs">
            <StatusBadge variant={isPlaying ? 'ontime' : 'neutral'} size="sm" pulseDot={isPlaying}>
              {isPlaying ? 'SIM ENGINE RUNNING' : 'SIM ENGINE PAUSED'}
            </StatusBadge>
            <span className="font-data text-xs text-accent-signal font-semibold">
              {formattedTime}
            </span>
            <span className="font-data text-[10px] text-ink-muted px-1.5 py-0.5 rounded bg-surface-2 border border-line">
              {speedMultiplier}x SPEED
            </span>
          </div>

          {/* Controls: Play/Pause, Step */}
          <div className="flex items-center gap-2xs">
            <Button
              variant={isPlaying ? 'secondary' : 'primary'}
              size="xs"
              onClick={togglePlay}
              icon={isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => stepForward(60)}
              icon={<FastForward className="h-3 w-3" />}
            >
              +1m
            </Button>
          </div>
        </div>

        {/* Live Counters & Expand Button */}
        <div className="flex items-center gap-md">
          <div className="hidden sm:flex items-center gap-sm font-data text-xs">
            <div className="flex items-center gap-1.5 text-ink-muted">
              <Activity className="h-3.5 w-3.5 text-accent-signal" />
              <span>Events:</span>
              <span className="text-ink-primary font-semibold">{totalCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink-muted">
              <AlertTriangle className="h-3.5 w-3.5 text-status-alert" />
              <span>Alerts:</span>
              <span className="text-status-alert font-semibold">{unacknowledgedCount}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsExpanded(!isExpanded)}
            icon={isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          >
            {isExpanded ? 'Collapse Engine' : 'Debug Controls'}
          </Button>
        </div>
      </div>

      {/* Expanded Controls Drawer */}
      {isExpanded && (
        <div className="p-md border-t border-line/60 bg-surface-0/60 grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Column 1: Speed Multiplier Controls */}
          <div className="space-y-xs">
            <div className="font-display text-[10px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Zap className="h-3 w-3 text-accent-signal" /> Speed Multiplier
            </div>
            <div className="flex items-center gap-2xs flex-wrap">
              {speeds.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className={`px-xs py-1 rounded font-data text-xs border transition-colors ${
                    speedMultiplier === spd
                      ? 'bg-accent-signal/20 text-accent-signal border-accent-signal/50 font-semibold'
                      : 'bg-surface-2 text-ink-muted border-line hover:text-ink-primary'
                  }`}
                >
                  {spd}x {spd === 1 ? '(Realtime)' : spd === 60 ? '(1m/s)' : spd === 3600 ? '(1h/s)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Date Jump Presets */}
          <div className="space-y-xs">
            <div className="font-display text-[10px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-status-boarding" /> Timeline Date Presets
            </div>
            <div className="flex items-center gap-2xs flex-wrap">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => jumpToDate('2024-10-01 06:00:00')}
              >
                Oct 01 (Start)
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => jumpToDate('2024-11-15 08:00:00')}
              >
                Nov 15 (Mid)
              </Button>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => jumpToDate('2024-12-30 18:00:00')}
              >
                Dec 30 (Peak)
              </Button>
              <Button variant="ghost" size="xs" onClick={resetClock} icon={<RotateCcw className="h-3 w-3" />}>
                Reset
              </Button>
            </div>
          </div>

          {/* Column 3: Live Feed & Telemetry Summary */}
          <div className="space-y-xs font-data text-xs">
            <div className="font-display text-[10px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Terminal className="h-3 w-3 text-status-ontime" /> Live Telemetry Feed
            </div>
            {latestEvent ? (
              <div className="p-xs rounded bg-surface-2 border border-line/60 space-y-0.5">
                <div className="text-[11px] text-accent-signal font-semibold truncate">
                  [{latestEvent.timestamp}] {latestEvent.title}
                </div>
                <div className="text-[10px] text-ink-muted truncate">{latestEvent.details}</div>
              </div>
            ) : (
              <div className="text-ink-muted text-xs">No active events prior to selected timestamp.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
