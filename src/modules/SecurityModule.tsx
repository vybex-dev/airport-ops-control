import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimClock, useAlerts } from '@/store/useSimEngineHooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTableShell } from '@/components/ui/DataTableShell';
import { ShieldCheck, Activity, ExternalLink } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  getAllSecurityScreenings,
  getSecurityThroughputSeries,
  getLaneStatusList,
  filterSecurityLogs,
  type SecurityFilterOptions,
} from '@/lib/security/securityDataService';
import { QueueThroughputChart } from '@/components/ui/QueueThroughputChart';
import { SecurityLaneGrid } from './security/SecurityLaneGrid';
import { SecurityFilters } from './security/SecurityFilters';
import { parseSimTimestamp } from '@/lib/flights/flightDataService';
import type { SecurityScreening } from '@/data/types/securityScreening';

const initialFilters: SecurityFilterOptions = {
  search: '',
  laneFilter: 'ALL',
  timeWindow: 'ALL',
};

export const SecurityModule: React.FC = () => {
  const navigate = useNavigate();
  const { currentTimeMs, formattedTime } = useSimClock();
  const { alerts } = useAlerts();

  const [filters, setFilters] = useState<SecurityFilterOptions>(initialFilters);
  const [selectedLog, setSelectedLog] = useState<SecurityScreening | null>(null);

  const allLogs = useMemo(() => getAllSecurityScreenings(), []);

  // Filter security screening logs
  const filteredLogs = useMemo(() => {
    return filterSecurityLogs(allLogs, filters, currentTimeMs);
  }, [allLogs, filters, currentTimeMs]);

  // Compute Throughput chart series
  const throughputData = useMemo(() => {
    return getSecurityThroughputSeries(currentTimeMs, alerts);
  }, [currentTimeMs, alerts]);

  // Compute Lane status list
  const laneStatuses = useMemo(() => {
    return getLaneStatusList(currentTimeMs);
  }, [currentTimeMs]);

  // Summary Metrics
  const stats = useMemo(() => {
    let clearedUpToNow = 0;
    for (const log of allLogs) {
      if (parseSimTimestamp(log.clearedTimestamp) <= currentTimeMs) {
        clearedUpToNow++;
      }
    }
    const currentHourData = throughputData.find((d) => d.hourLabel === formattedTime.slice(11, 13) + ':00');
    const activeBacklog = currentHourData?.backlog ?? 0;
    const peakAlertCount = alerts.filter((a) => a.ruleId === 'RULE_SECURITY_LATENCY' || a.source === 'security').length;

    return { clearedUpToNow, activeBacklog, peakAlertCount };
  }, [allLogs, currentTimeMs, throughputData, formattedTime, alerts]);

  // Virtualizer for ~2,500 security screening rows
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 15,
  });

  const handleFilterChange = (updates: Partial<SecurityFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-md">
      {/* 1. Header Banner & KPI Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-sm">
          <div className="p-xs rounded bg-status-ontime/10 text-status-ontime border border-status-ontime/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-xs">
              <h2 className="font-display text-lg font-bold text-ink-primary">
                Security Screening Checkpoints (DEL T3)
              </h2>
              <StatusBadge variant="ontime" size="sm">
                8 LANES ACTIVE
              </StatusBadge>
              {stats.peakAlertCount > 0 && (
                <StatusBadge variant="alert" size="sm" pulseDot>
                  {stats.peakAlertCount} PEAK BACKLOG ALERTS
                </StatusBadge>
              )}
            </div>
            <p className="font-display text-xs text-ink-muted mt-4xs">
              Passenger screening telemetry, queue wait time analytics & lane capacity throughput
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 gap-xs font-data text-xs select-none">
          <div className="px-sm py-xs rounded bg-surface-2 border border-line text-center">
            <span className="text-ink-muted block text-[10px] uppercase font-bold">Cleared Passengers</span>
            <span className="text-status-ontime font-bold text-sm">
              {stats.clearedUpToNow.toLocaleString()} / 2,500
            </span>
          </div>

          <div className="px-sm py-xs rounded bg-surface-2 border border-line text-center">
            <span className="text-ink-muted block text-[10px] uppercase font-bold">Estimated Queue Backlog</span>
            <span className={`font-bold text-sm ${stats.activeBacklog > 50 ? 'text-status-alert' : 'text-accent-signal'}`}>
              {stats.activeBacklog} pax
            </span>
          </div>
        </div>
      </div>

      {/* 2. Throughput Chart Visualization */}
      <QueueThroughputChart data={throughputData} currentTimeMs={currentTimeMs} />

      {/* 3. Lane Status Breakdown Grid */}
      <SecurityLaneGrid
        lanes={laneStatuses}
        activeLaneFilter={filters.laneFilter}
        onSelectLane={(laneNum) => handleFilterChange({ laneFilter: laneNum })}
      />

      {/* 4. Filter Bar */}
      <SecurityFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters(initialFilters)}
        totalResults={filteredLogs.length}
      />

      {/* 5. Virtualized Security Screening Table */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <Activity className="h-4 w-4 text-accent-signal" />
            Security Checkpoint Log Telemetry ({filteredLogs.length.toLocaleString()} Scans)
          </span>
        }
        headerActions={
          <div className="flex items-center gap-xs font-data text-xs text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-status-ontime animate-ping" />
            <span>CLOCK SYNC: {formattedTime}</span>
          </div>
        }
        isEmpty={filteredLogs.length === 0}
        emptyMessage="No screening records match your filter criteria."
      >
        <div className="w-full flex flex-col min-w-[900px]" role="table" aria-label="Security Checkpoint Log Telemetry">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 font-data text-[11px] font-bold text-ink-muted uppercase tracking-wider px-md py-xs bg-surface-2/80 border-b border-line select-none" role="row">
            <div className="col-span-3 sm:col-span-2" role="columnheader">Screening ID</div>
            <div className="col-span-2 sm:col-span-2" role="columnheader">Lane / Type</div>
            <div className="col-span-3 sm:col-span-2" role="columnheader">Passenger Ref / PNR</div>
            <div className="hidden sm:block sm:col-span-2" role="columnheader">Queue Entered</div>
            <div className="hidden sm:block sm:col-span-2" role="columnheader">Cleared Time</div>
            <div className="col-span-4 sm:col-span-2 text-right" role="columnheader">Result</div>
          </div>

          {/* Virtualized Rows Container */}
          <div
            ref={parentRef}
            role="rowgroup"
            className="overflow-y-auto max-h-[500px] w-full min-h-[350px] bg-surface-0/40 relative"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const log = filteredLogs[virtualRow.index];
                const isCleared = parseSimTimestamp(log.clearedTimestamp) <= currentTimeMs;
                const isSelected = selectedLog?.screeningId === log.screeningId;

                return (
                  <div
                    key={log.screeningId}
                    role="row"
                    tabIndex={0}
                    aria-label={`Security screening log ${log.screeningId} for lane ${log.laneNumber}`}
                    onClick={() => setSelectedLog(log)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedLog(log);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`grid grid-cols-12 gap-2 items-center px-md py-2xs border-b border-line/60 cursor-pointer transition-colors select-none font-data text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal ${
                      isSelected

                        ? 'bg-accent-signal/10 border-l-4 border-l-accent-signal'
                        : 'hover:bg-surface-2/60'
                    }`}
                  >
                    {/* Screening ID */}
                    <div className="col-span-3 sm:col-span-2 font-bold text-ink-primary truncate">
                      {log.screeningId}
                    </div>

                    {/* Lane / Type */}
                    <div className="col-span-2 sm:col-span-2 flex items-center gap-xs">
                      <span className="px-1.5 py-0.5 rounded bg-surface-2 text-accent-signal font-bold border border-line text-xs">
                        LANE {log.laneNumber}
                      </span>
                    </div>

                    {/* Pax Ref / PNR — click to search flights by PNR */}
                    <div className="col-span-3 sm:col-span-2 truncate">
                      <span className="text-ink-primary font-medium block truncate">{log.passengerRef}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/flights?search=${log.pnrCode}`); }}
                        className="text-[10px] text-accent-signal hover:underline flex items-center gap-0.5"
                      >
                        PNR: {log.pnrCode} <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {/* Queue Entered */}
                    <div className="hidden sm:block sm:col-span-2 text-ink-muted">
                      {log.queueEnterTimestamp.slice(11, 19)}
                    </div>

                    {/* Cleared Time */}
                    <div className="hidden sm:block sm:col-span-2 text-ink-primary">
                      {log.clearedTimestamp.slice(11, 19)}
                    </div>

                    {/* Result */}
                    <div className="col-span-4 sm:col-span-2 flex items-center justify-end">
                      <StatusBadge variant={isCleared ? 'ontime' : 'neutral'} size="sm">
                        {isCleared ? 'CLEARED' : 'QUEUED'}
                      </StatusBadge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DataTableShell>
    </div>
  );
};
