import { getDatasetSync } from '@/lib/sim/dataLoader';
import type { StaffShift } from '@/data/types';
import { parseSimTimestamp } from '@/lib/flights/flightDataService';

export interface JoinedStaffShift extends StaffShift {
  isOnDuty: boolean;
  shiftStatusLabel: 'ON DUTY' | 'OFF DUTY' | 'SHIFT ENDED';
  badgeVariant: 'ontime' | 'neutral' | 'delayed';
  isCertExpiringSoon: boolean;
}

export interface StaffFilterOptions {
  search: string;
  dutyFilter: string; // 'ALL' | 'ON_DUTY' | 'OFF_DUTY'
  gateFilter: string; // 'ALL' | gate name
  departmentFilter: string; // 'ALL' | department
}

const _getStaffShifts = () => getDatasetSync<StaffShift>('staff_shifts');

export function getAllStaffShifts(): StaffShift[] {
  return _getStaffShifts();
}

/**
 * Derives live on-duty status and status metadata based on sim clock time
 */
export function calculateStaffDutyState(
  staff: StaffShift,
  currentTimeMs: number
): JoinedStaffShift {
  const startMs = parseSimTimestamp(staff.shiftStartTimestamp);
  const endMs = parseSimTimestamp(staff.shiftEndTimestamp);

  let isOnDuty = false;
  let shiftStatusLabel: 'ON DUTY' | 'OFF DUTY' | 'SHIFT ENDED' = 'OFF DUTY';
  let badgeVariant: 'ontime' | 'neutral' | 'delayed' = 'neutral';

  if (currentTimeMs > 0 && startMs > 0) {
    if (currentTimeMs >= startMs && (endMs === 0 || currentTimeMs <= endMs)) {
      isOnDuty = true;
      shiftStatusLabel = 'ON DUTY';
      badgeVariant = 'ontime';
    } else if (endMs > 0 && currentTimeMs > endMs) {
      shiftStatusLabel = 'SHIFT ENDED';
      badgeVariant = 'neutral';
    }
  }

  // Cert expiry warning if expiring before mid 2025
  const certMs = parseSimTimestamp(staff.certificationExpiry);
  const isCertExpiringSoon = certMs > 0 && certMs <= new Date('2025-06-30').getTime();

  return {
    ...staff,
    isOnDuty,
    shiftStatusLabel,
    badgeVariant,
    isCertExpiringSoon,
  };
}

/**
 * Filter staff shift records
 */
export function filterStaffShifts(
  shifts: StaffShift[],
  options: StaffFilterOptions,
  currentTimeMs: number
): JoinedStaffShift[] {
  const searchLower = options.search.trim().toLowerCase();

  return shifts
    .map((s) => calculateStaffDutyState(s, currentTimeMs))
    .filter((s) => {
      // 1. Search Query
      if (searchLower) {
        const matchId = s.staffId.toLowerCase().includes(searchLower);
        const matchName = s.staffName.toLowerCase().includes(searchLower);
        const matchGate = s.assignedGate.toLowerCase().includes(searchLower);
        const matchSup = s.supervisorRef.toLowerCase().includes(searchLower);
        const matchDept = s.department.toLowerCase().includes(searchLower);
        if (!matchId && !matchName && !matchGate && !matchSup && !matchDept) {
          return false;
        }
      }

      // 2. Duty Filter
      if (options.dutyFilter && options.dutyFilter !== 'ALL') {
        if (options.dutyFilter === 'ON_DUTY' && !s.isOnDuty) return false;
        if (options.dutyFilter === 'OFF_DUTY' && s.isOnDuty) return false;
      }

      // 3. Gate Filter
      if (options.gateFilter && options.gateFilter !== 'ALL') {
        if (!s.assignedGate.toLowerCase().includes(options.gateFilter.toLowerCase())) {
          return false;
        }
      }

      // 4. Department Filter
      if (options.departmentFilter && options.departmentFilter !== 'ALL') {
        if (s.department !== options.departmentFilter) return false;
      }

      return true;
    });
}

/**
 * Get aggregate Staffing KPIs for current sim time
 */
export function getStaffKPIs(currentTimeMs: number) {
  const allStaffShifts = _getStaffShifts();
  let totalRoster = allStaffShifts.length;
  let onDutyCount = 0;
  let offDutyCount = 0;
  let certExpiringCount = 0;
  const gatesCoveredSet = new Set<string>();
  const supervisorsSet = new Set<string>();

  for (const s of allStaffShifts) {
    const state = calculateStaffDutyState(s, currentTimeMs);
    if (state.isOnDuty) {
      onDutyCount++;
      if (s.assignedGate) gatesCoveredSet.add(s.assignedGate);
    } else {
      offDutyCount++;
    }
    if (state.isCertExpiringSoon) certExpiringCount++;
    if (s.supervisorRef) supervisorsSet.add(s.supervisorRef);
  }

  return {
    totalRoster,
    onDutyCount,
    offDutyCount,
    gatesCoveredCount: gatesCoveredSet.size,
    supervisorCount: supervisorsSet.size,
    certExpiringCount,
  };
}
