import React, { useState, useMemo } from 'react';
import { useFlightModalStore } from '@/store/useFlightModalStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTableShell } from '@/components/ui/DataTableShell';
import { SearchInput } from '@/components/ui/SearchInput';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  Wrench,
  AlertOctagon,
  Plane,
  ShieldAlert,
  ExternalLink,
  Layers,
  Activity,
} from 'lucide-react';
import {
  getAllMaintenanceLogs,
  filterMaintenanceLogs,
  getMaintenanceKPIs,
} from '@/lib/maintenance/maintenanceDataService';

export const MaintenanceModule: React.FC = () => {
  const { openFlightModal } = useFlightModalStore();

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const allLogs = useMemo(() => getAllMaintenanceLogs(), []);
  const kpis = useMemo(() => getMaintenanceKPIs(), []);

  const filteredLogs = useMemo(() => {
    return filterMaintenanceLogs(allLogs, {
      search,
      aircraftRegFilter: 'ALL',
      severityFilter,
    });
  }, [allLogs, search, severityFilter]);

  return (
    <div className="space-y-md">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-sm">
          <div className="p-xs rounded bg-status-alert/10 text-status-alert border border-status-alert/30">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-xs">
              <h2 className="font-display text-lg font-bold text-ink-primary">
                Aircraft & Fleet Maintenance Control
              </h2>
              <StatusBadge variant="alert" size="sm" pulseDot>
                400 LOGS (VT-ABC)
              </StatusBadge>
              <StatusBadge variant="delayed" size="sm">
                SEVERITY 3 DEFECTS
              </StatusBadge>
            </div>
            <p className="font-display text-xs text-ink-muted mt-4xs">
              Airframe Maintenance Records, Defect Work Orders & Flight Operation Readiness Audits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-xs text-xs font-data text-ink-muted bg-surface-2 px-sm py-xs rounded border border-line">
          <Activity className="h-3.5 w-3.5 text-status-alert" />
          TRACKED TAIL: <span className="text-status-alert font-bold">VT-ABC (Airframe Hyd Subsystem)</span>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-sm">
        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>TOTAL WORK ORDERS</span>
            <Layers className="h-3.5 w-3.5 text-ink-muted" />
          </div>
          <div className="font-data text-xl font-bold text-ink-primary">
            <AnimatedNumber value={kpis.totalCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Airframe Log Entries</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>TRACKED AIRFRAME</span>
            <Plane className="h-3.5 w-3.5 text-accent-signal" />
          </div>
          <div className="font-data text-xl font-bold text-accent-signal">
            {kpis.trackedAirframe}
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Single Airframe Logged</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>IMPACTED FLIGHTS</span>
            <Plane className="h-3.5 w-3.5 text-status-delayed" />
          </div>
          <div className="font-data text-xl font-bold text-status-delayed">
            <AnimatedNumber value={kpis.impactedFlightsCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">100% FK Resolved Flights</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>SEVERITY 3 DEFECTS</span>
            <AlertOctagon className="h-3.5 w-3.5 text-status-alert" />
          </div>
          <div className="font-data text-xl font-bold text-status-alert">
            <AnimatedNumber value={kpis.severity3Count} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Hydraulic Leak / Seal</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>PRIORITY 5 LOGS</span>
            <ShieldAlert className="h-3.5 w-3.5 text-status-alert" />
          </div>
          <div className="font-data text-xl font-bold text-status-alert">
            <AnimatedNumber value={kpis.priority5Count} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">High Priority Work Orders</div>
        </div>
      </div>

      {/* 3. Toolbar & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-xs flex-wrap flex-1">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search Work Order ID, Flight ID, Tech Ref..."
            />
          </div>

          <div className="flex items-center gap-1 font-data text-xs">
            <span className="text-ink-muted">Severity Filter:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
            >
              <option value="ALL">All Severities</option>
              <option value="3">Severity 3 (Critical)</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-data text-ink-muted">
          Showing <strong className="text-ink-primary">{filteredLogs.length}</strong> of 400 work orders
        </div>
      </div>

      {/* 4. Maintenance Logs Data Table */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <Wrench className="h-4 w-4 text-status-alert" />
            Airframe Maintenance Defect Work Orders (VT-ABC)
          </span>
        }
      >
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full min-w-[900px] text-left border-collapse font-data text-xs">
            <thead className="bg-surface-2 border-b border-line sticky top-0 z-10 text-ink-muted font-display uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-sm">Work Order ID</th>
                <th className="p-sm">Aircraft Reg</th>
                <th className="p-sm">Associated Flight (FK)</th>
                <th className="p-sm">Defect Description</th>
                <th className="p-sm">Part Affected</th>
                <th className="p-sm">Severity / Priority</th>
                <th className="p-sm">Opened Timestamp</th>
                <th className="p-sm">Technician Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filteredLogs.slice(0, 150).map((log) => (
                <tr key={log.workOrderId} className="hover:bg-surface-2/60 transition-colors">
                  <td className="p-sm font-bold text-ink-primary">{log.workOrderId}</td>
                  <td className="p-sm font-bold text-accent-signal">{log.aircraftReg}</td>
                  <td className="p-sm">
                    <button
                      type="button"
                      onClick={() => openFlightModal(log.flightId)}
                      className="inline-flex items-center gap-1 font-bold text-accent-signal hover:underline bg-accent-signal/10 px-2 py-0.5 rounded border border-accent-signal/30"
                    >
                      <Plane className="h-3 w-3" />
                      {log.flightId}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </td>
                  <td className="p-sm text-status-alert font-medium">{log.defectDescription}</td>
                  <td className="p-sm text-ink-muted">{log.partAffected}</td>
                  <td className="p-sm">
                    <div className="flex items-center gap-1">
                      <StatusBadge variant="alert" size="sm" pulseDot>
                        SEV {log.severity}
                      </StatusBadge>
                      <span className="px-1.5 py-0.5 rounded bg-surface-2 text-ink-muted font-mono text-[10px]">
                        PRI {log.priorityCode}
                      </span>
                    </div>
                  </td>
                  <td className="p-sm text-ink-muted">{log.openedTimestamp}</td>
                  <td className="p-sm text-ink-muted font-mono">{log.technicianRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>
    </div>
  );
};
