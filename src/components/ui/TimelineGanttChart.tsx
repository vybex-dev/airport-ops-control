import React, { useMemo } from 'react';
import type { GateGroup, GateOccupancy } from '@/lib/gates/gateDataService';
import { AlertTriangle } from 'lucide-react';

export interface TimelineGanttChartProps {
  groups: GateGroup[];
  currentTimeMs: number;
  timeWindowHours?: number; // viewport duration in hours (default 12)
  onBlockClick?: (occupancy: GateOccupancy) => void;
  selectedFlightId?: string | null;
}

export const TimelineGanttChart: React.FC<TimelineGanttChartProps> = ({
  groups,
  currentTimeMs,
  timeWindowHours = 12,
  onBlockClick,
  selectedFlightId,
}) => {
  // Compute viewport start and end time (centered around currentTimeMs or starting 2h before)
  const { viewStartMs, viewEndMs, hourTicks } = useMemo(() => {
    const windowMs = timeWindowHours * 3600 * 1000;
    // 2 hours before currentTimeMs to 10 hours after
    const start = currentTimeMs - 2 * 3600 * 1000;
    const end = start + windowMs;

    const ticks: { label: string; offsetPct: number }[] = [];
    const stepMs = 3600 * 1000; // 1 hour step

    for (let t = start; t <= end; t += stepMs) {
      const d = new Date(t);
      const label = `${d.getHours().toString().padStart(2, '0')}:00`;
      const offsetPct = Math.max(0, Math.min(100, ((t - start) / windowMs) * 100));
      ticks.push({ label, offsetPct });
    }

    return { viewStartMs: start, viewEndMs: end, hourTicks: ticks };
  }, [currentTimeMs, timeWindowHours]);

  const nowOffsetPct = useMemo(() => {
    const totalMs = viewEndMs - viewStartMs;
    if (totalMs <= 0) return 0;
    const offset = ((currentTimeMs - viewStartMs) / totalMs) * 100;
    return Math.max(0, Math.min(100, offset));
  }, [currentTimeMs, viewStartMs, viewEndMs]);

  // Compute min pixel width: each hour gets at least 80px + 96px for gate label column
  const minWidthPx = 96 + timeWindowHours * 80;

  return (
    <div className="w-full overflow-x-auto rounded-md border border-line">
      <div
        className="flex flex-col bg-surface-1 font-data text-xs"
        style={{ minWidth: `${minWidthPx}px` }}
      >
        {/* Time Header Scale */}
        <div className="relative h-9 bg-surface-2/90 border-b border-line flex items-center px-md select-none">
          <div className="w-24 shrink-0 font-display font-bold text-ink-muted uppercase tracking-wider text-[11px]">
            Concourse / Gate
          </div>
          <div className="relative flex-1 h-full flex items-center">
            {hourTicks.map((tick, idx) => (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${tick.offsetPct}%` }}
              >
                <span className="text-[10px] font-bold text-ink-muted">{tick.label}</span>
                <div className="h-2 w-px bg-line/60 mt-0.5" />
              </div>
            ))}

            {/* Current Time Marker line in Header */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent-signal z-20 flex flex-col items-center"
              style={{ left: `${nowOffsetPct}%` }}
            >
              <span className="px-1 py-0.5 rounded bg-accent-signal text-surface-0 font-bold text-[9px] uppercase tracking-tighter -mt-1 shadow-sm">
                NOW
              </span>
            </div>
          </div>
        </div>

        {/* Gantt Rows Container */}
        <div className="max-h-[560px] overflow-y-auto divide-y divide-line/40">
          {groups.map((group) => {
            return (
              <div
                key={group.gate}
                className={`flex items-center h-12 px-md hover:bg-surface-2/40 transition-colors relative ${
                  group.hasActiveConflict ? 'bg-status-alert/5' : ''
                }`}
              >
                {/* Gate Identifier */}
                <div className="w-24 shrink-0 flex items-center gap-xs">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold border ${
                      group.hasActiveConflict
                        ? 'bg-status-alert/20 text-status-alert border-status-alert/40 animate-pulse'
                        : 'bg-surface-2 text-ink-primary border-line'
                    }`}
                  >
                    {group.gate}
                  </span>
                  {group.hasActiveConflict && (
                    <span title="Gate Occupancy Conflict Alert">
                      <AlertTriangle className="h-3.5 w-3.5 text-status-alert shrink-0" />
                    </span>
                  )}
                </div>

                {/* Timeline Track */}
                <div className="relative flex-1 h-full flex items-center overflow-hidden">
                  {/* Vertical Grid Hour Lines */}
                  {hourTicks.map((tick, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 w-px bg-line/20 pointer-events-none"
                      style={{ left: `${tick.offsetPct}%` }}
                    />
                  ))}

                  {/* Live Sim Clock Indicator Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-accent-signal/80 z-10 pointer-events-none"
                    style={{ left: `${nowOffsetPct}%` }}
                  />

                  {/* Gate Occupancy Blocks */}
                  {group.occupancies.map((occ) => {
                    const windowTotalMs = viewEndMs - viewStartMs;
                    const startOffset = Math.max(0, ((occ.startMs - viewStartMs) / windowTotalMs) * 100);
                    const endOffset = Math.min(100, ((occ.endMs - viewStartMs) / windowTotalMs) * 100);
                    const widthPct = Math.max(1.5, endOffset - startOffset);

                    // If block is completely outside viewport window, omit render
                    if (endOffset < 0 || startOffset > 100) return null;

                    const isSelected = selectedFlightId === occ.flight.flightId;

                    let bgClass = 'bg-status-boarding/20 border-status-boarding text-status-boarding';
                    if (occ.hasConflict) {
                      bgClass = 'bg-status-alert/30 border-status-alert text-status-alert animate-pulse';
                    } else if (occ.occupancyType === 'DEPARTED') {
                      bgClass = 'bg-line/40 border-line text-ink-muted';
                    } else if (occ.occupancyType === 'BOARDING') {
                      bgClass = 'bg-status-boarding/30 border-status-boarding text-status-boarding shadow-glow';
                    }

                    return (
                      <div
                        key={occ.flight.flightId}
                        onClick={() => onBlockClick?.(occ)}
                        style={{
                          left: `${startOffset}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`Flight ${occ.flight.flightId} (${occ.flight.airlineCode}) -> ${occ.flight.destination} | ${occ.flight.scheduledDeparture.slice(11, 16)} - ${occ.flight.actualDeparture.slice(11, 16)}`}
                        className={`absolute h-8 rounded border px-1.5 py-0.5 flex items-center justify-between text-[11px] font-bold cursor-pointer transition-all hover:scale-[1.02] hover:z-30 select-none ${bgClass} ${
                          isSelected ? 'ring-2 ring-accent-signal ring-offset-1 ring-offset-surface-0 z-20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className="truncate">{occ.flight.flightId}</span>
                          <span className="text-[9px] opacity-80 hidden md:inline">&rarr; {occ.flight.destination}</span>
                        </div>
                        {occ.hasConflict && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-status-alert ml-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
