import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimClock } from '@/store/useSimEngineHooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTableShell } from '@/components/ui/DataTableShell';
import { SearchInput } from '@/components/ui/SearchInput';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  Users,
  Clock,
  DoorClosed,
  ShieldCheck,
  Award,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import {
  getAllStaffShifts,
  filterStaffShifts,
  getStaffKPIs,
} from '@/lib/staff/staffDataService';

export const StaffModule: React.FC = () => {
  const navigate = useNavigate();
  const { currentTimeMs, formattedTime } = useSimClock();

  const [search, setSearch] = useState('');
  const [dutyFilter, setDutyFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const allShifts = useMemo(() => getAllStaffShifts(), []);

  const kpis = useMemo(() => {
    return getStaffKPIs(currentTimeMs);
  }, [currentTimeMs]);

  const filteredShifts = useMemo(() => {
    return filterStaffShifts(
      allShifts,
      {
        search,
        dutyFilter,
        gateFilter: 'ALL',
        departmentFilter,
      },
      currentTimeMs
    );
  }, [allShifts, search, dutyFilter, departmentFilter, currentTimeMs]);

  const handleGateClick = (gate: string) => {
    if (!gate) return;
    navigate(`/gates?search=${encodeURIComponent(gate)}`);
  };

  return (
    <div className="space-y-md">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-sm">
          <div className="p-xs rounded bg-accent-signal/10 text-accent-signal border border-accent-signal/30">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-xs">
              <h2 className="font-display text-lg font-bold text-ink-primary">
                Ground Roster & Staffing Control
              </h2>
              <StatusBadge variant="neutral" size="sm">
                600 SHIFTS (T3)
              </StatusBadge>
              <StatusBadge variant="ontime" size="sm" pulseDot>
                {kpis.onDutyCount} ON DUTY
              </StatusBadge>
            </div>
            <p className="font-display text-xs text-ink-muted mt-4xs">
              Ground Handling Shifts, Real-Time Duty Derived Telemetry & Gate Deployment Roster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-xs text-xs font-data text-ink-muted bg-surface-2 px-sm py-xs rounded border border-line">
          <Clock className="h-3.5 w-3.5 text-accent-signal" />
          SIM TIME: <span className="text-accent-signal font-bold">{formattedTime}</span>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-sm">
        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>TOTAL ROSTER</span>
            <Users className="h-3.5 w-3.5 text-ink-muted" />
          </div>
          <div className="font-data text-xl font-bold text-ink-primary">
            <AnimatedNumber value={kpis.totalRoster} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Ground Personnel</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>CURRENTLY ON DUTY</span>
            <UserCheck className="h-3.5 w-3.5 text-status-ontime" />
          </div>
          <div className="font-data text-xl font-bold text-status-ontime">
            <AnimatedNumber value={kpis.onDutyCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Active at Virtual Now</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>OFF DUTY / ENDED</span>
            <Clock className="h-3.5 w-3.5 text-ink-muted" />
          </div>
          <div className="font-data text-xl font-bold text-ink-muted">
            <AnimatedNumber value={kpis.offDutyCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Standby & Off-Shift</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>GATES COVERED</span>
            <DoorClosed className="h-3.5 w-3.5 text-accent-signal" />
          </div>
          <div className="font-data text-xl font-bold text-accent-signal">
            <AnimatedNumber value={kpis.gatesCoveredCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Assigned Concourse Gates</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>SUPERVISORS</span>
            <ShieldCheck className="h-3.5 w-3.5 text-ink-primary" />
          </div>
          <div className="font-data text-xl font-bold text-ink-primary">
            <AnimatedNumber value={kpis.supervisorCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Lead Supervisor Refs</div>
        </div>
      </div>

      {/* 3. Toolbar & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-xs flex-wrap flex-1">
          <div className="w-full sm:w-64">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search Staff, ID, Gate, Supervisor..."
            />
          </div>

          <div className="flex items-center gap-1 font-data text-xs">
            <span className="text-ink-muted">Duty Status:</span>
            <select
              value={dutyFilter}
              onChange={(e) => setDutyFilter(e.target.value)}
              className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
            >
              <option value="ALL">All Shifts</option>
              <option value="ON_DUTY">Currently On Duty</option>
              <option value="OFF_DUTY">Off Duty / Ended</option>
            </select>
          </div>

          <div className="flex items-center gap-1 font-data text-xs">
            <span className="text-ink-muted">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
            >
              <option value="ALL">All Departments</option>
              <option value="Ops">Operations (Ops)</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-data text-ink-muted">
          Showing <strong className="text-ink-primary">{filteredShifts.length}</strong> of 600 records
        </div>
      </div>

      {/* 4. Staff Shifts Roster Data Table */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <Users className="h-4 w-4 text-accent-signal" />
            Ground Handling Roster & Shift Schedules
          </span>
        }
      >
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full min-w-[900px] text-left border-collapse font-data text-xs">
            <thead className="bg-surface-2 border-b border-line sticky top-0 z-10 text-ink-muted font-display uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-sm">Staff ID</th>
                <th className="p-sm">Staff Name</th>
                <th className="p-sm">Role & Dept</th>
                <th className="p-sm">Terminal</th>
                <th className="p-sm">Assigned Gate</th>
                <th className="p-sm">Shift Hours</th>
                <th className="p-sm">On-Duty Status</th>
                <th className="p-sm">Supervisor Ref</th>
                <th className="p-sm">Cert Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filteredShifts.slice(0, 150).map((staff) => (
                <tr key={staff.staffId} className="hover:bg-surface-2/60 transition-colors">
                  <td className="p-sm font-bold text-ink-primary">{staff.staffId}</td>
                  <td className="p-sm text-ink-primary font-medium">{staff.staffName}</td>
                  <td className="p-sm">
                    <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-muted font-mono">
                      {staff.role} ({staff.department})
                    </span>
                  </td>
                  <td className="p-sm text-ink-muted">{staff.terminal}</td>
                  <td className="p-sm">
                    <button
                      type="button"
                      onClick={() => handleGateClick(staff.assignedGate)}
                      className="inline-flex items-center gap-1 font-bold text-accent-signal hover:underline"
                    >
                      Gate {staff.assignedGate} <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="p-sm text-ink-muted">
                    {staff.shiftStartTimestamp.slice(11, 16)} - {staff.shiftEndTimestamp.slice(11, 16)} ({staff.shiftHours}h)
                  </td>
                  <td className="p-sm">
                    <StatusBadge variant={staff.badgeVariant} size="sm" pulseDot={staff.isOnDuty}>
                      {staff.shiftStatusLabel}
                    </StatusBadge>
                  </td>
                  <td className="p-sm text-ink-muted font-mono">{staff.supervisorRef}</td>
                  <td className="p-sm">
                    <span className={`flex items-center gap-1 ${staff.isCertExpiringSoon ? 'text-status-alert font-bold' : 'text-ink-muted'}`}>
                      {staff.isCertExpiringSoon && <Award className="h-3 w-3 text-status-alert" />}
                      {staff.certificationExpiry}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>
    </div>
  );
};
