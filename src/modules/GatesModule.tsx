import React, { useState, useMemo } from 'react';
import { useSimClock, useAlerts } from '@/store/useSimEngineHooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTableShell } from '@/components/ui/DataTableShell';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { DoorClosed, AlertTriangle, Clock } from 'lucide-react';
import { getGateOccupancies, type GateOccupancy } from '@/lib/gates/gateDataService';
import { TimelineGanttChart } from '@/components/ui/TimelineGanttChart';
import { GateConflictBanner } from './gates/GateConflictBanner';
import { useFlightModalStore } from '@/store/useFlightModalStore';

export const GatesModule: React.FC = () => {
  const { currentTimeMs, formattedTime } = useSimClock();
  const { alerts, acknowledgeAlert } = useAlerts();
  const { openFlightModal } = useFlightModalStore();

  const [search, setSearch] = useState('');
  const [gatePrefix, setGatePrefix] = useState('ALL');
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [timeWindowHours, setTimeWindowHours] = useState(12);

  // Compute gate occupancy timeline groups
  const gateGroups = useMemo(() => {
    return getGateOccupancies(currentTimeMs, alerts, {
      search,
      gatePrefix,
      conflictsOnly,
    });
  }, [currentTimeMs, alerts, search, gatePrefix, conflictsOnly]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalOccupancies = 0;
    let totalConflicts = 0;
    let activeBoarding = 0;

    for (const g of gateGroups) {
      if (g.hasActiveConflict) totalConflicts++;
      for (const occ of g.occupancies) {
        totalOccupancies++;
        if (occ.occupancyType === 'BOARDING') activeBoarding++;
      }
    }

    return { totalOccupancies, totalConflicts, activeBoarding };
  }, [gateGroups]);

  const handleBlockClick = (occ: GateOccupancy) => {
    openFlightModal(occ.flight.flightId);
  };

  const handleSelectFlightById = (flightId: string) => {
    openFlightModal(flightId);
  };

  return (
    <div className="space-y-md">
      {/* 1. Header Control Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-sm">
          <div className="p-xs rounded bg-accent-signal/10 text-accent-signal border border-accent-signal/30">
            <DoorClosed className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-xs">
              <h2 className="font-display text-lg font-bold text-ink-primary">
                Gate & Concourse Control (DEL Terminal 3)
              </h2>
              <StatusBadge variant="boarding" size="sm">
                50 GATES (B1-B50)
              </StatusBadge>
              {stats.totalConflicts > 0 && (
                <StatusBadge variant="alert" size="sm" pulseDot>
                  {stats.totalConflicts} CONFLICTS
                </StatusBadge>
              )}
            </div>
            <p className="font-display text-xs text-ink-muted mt-4xs">
              Timeline Gantt occupancy, jetbridge turnaround windows & overlapping gate collision detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-xs">
          <Button
            variant={conflictsOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setConflictsOnly(!conflictsOnly)}
            icon={<AlertTriangle className="h-3.5 w-3.5 text-status-alert" />}
          >
            {conflictsOnly ? 'Showing Conflicts Only' : 'Filter Conflicts'}
          </Button>
          <div className="text-xs font-data text-ink-muted bg-surface-2 px-sm py-xs rounded border border-line">
            VIRTUAL TIME: <span className="text-accent-signal font-bold">{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* 2. Gate Conflict Alert Banner */}
      <GateConflictBanner
        alerts={alerts}
        onAcknowledgeAlert={acknowledgeAlert}
        onSelectFlight={handleSelectFlightById}
      />

      {/* 3. Gantt Toolbar & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-xs flex-wrap flex-1">
          <div className="w-full sm:w-64">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search Gate, Flight (e.g. B12, UK-633)..."
            />
          </div>

          <div className="flex items-center gap-1 font-data text-xs">
            <span className="text-ink-muted">Gate Range:</span>
            <select
              value={gatePrefix}
              onChange={(e) => setGatePrefix(e.target.value)}
              className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
            >
              <option value="ALL">All Gates (B1 - B50)</option>
              <option value="B1">Gates B1 - B9</option>
              <option value="B2">Gates B20 - B29</option>
              <option value="B3">Gates B30 - B39</option>
              <option value="B4">Gates B40 - B50</option>
            </select>
          </div>

          <div className="flex items-center gap-1 font-data text-xs">
            <span className="text-ink-muted">Gantt Scale:</span>
            <select
              value={timeWindowHours}
              onChange={(e) => setTimeWindowHours(parseInt(e.target.value, 10))}
              className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
            >
              <option value={6}>6 Hours Viewport</option>
              <option value={12}>12 Hours Viewport</option>
              <option value={24}>24 Hours Viewport</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-sm font-data text-xs text-ink-muted">
          <span>Active Boarding: <strong className="text-status-boarding">{stats.activeBoarding}</strong></span>
          <span>Showing Gates: <strong className="text-ink-primary">{gateGroups.length} / 50</strong></span>
        </div>
      </div>

      {/* 4. Timeline Gantt Chart Visualization */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <Clock className="h-4 w-4 text-accent-signal" />
            Concourse Gate Occupancy Gantt Timeline (Terminal 3)
          </span>
        }
      >
        <TimelineGanttChart
          groups={gateGroups}
          currentTimeMs={currentTimeMs}
          timeWindowHours={timeWindowHours}
          onBlockClick={handleBlockClick}
          selectedFlightId={undefined}
        />
      </DataTableShell>

      {/* 5. Cross-Dataset Joined Flight Detail Drawer — handled globally by GlobalFlightDrawer in AppLayout */}
    </div>
  );
};
