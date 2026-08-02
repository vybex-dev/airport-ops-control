import { getDatasetSync } from '@/lib/sim/dataLoader';
import type { SecurityScreening } from '@/data/types/securityScreening';
import { parseSimTimestamp } from '@/lib/flights/flightDataService';
import type { SimAlert } from '@/lib/sim/simTypes';

export interface HourlySecurityBucket {
  hourLabel: string; // e.g. "08:00"
  timestampMs: number;
  queueEntered: number;
  cleared: number;
  backlog: number;
  hasPeakAlert: boolean;
}

export interface LaneStatus {
  laneNumber: number;
  laneType: string;
  processedCount: number;
  avgWaitSec: number;
  isOverCapacity: boolean;
  status: 'OPTIMAL' | 'MODERATE' | 'HEAVY';
}

export interface SecurityFilterOptions {
  search: string;
  laneFilter: string; // 'ALL' | '1'..'8'
  timeWindow: string; // 'ALL' | 'PAST_1H' | 'PAST_6H'
}

const getAllSecurityLogs = () => getDatasetSync<SecurityScreening>('security_screening');

export function getAllSecurityScreenings(): SecurityScreening[] {
  return getAllSecurityLogs();
}

/**
 * Generate 24-hour time-bucket throughput series centered around current virtual time
 */
export function getSecurityThroughputSeries(
  currentTimeMs: number,
  alerts: SimAlert[] = []
): HourlySecurityBucket[] {
  if (!currentTimeMs) {
    // Default to initial timestamp if not set
    currentTimeMs = parseSimTimestamp('2024-10-01 08:00:00');
  }

  // Create 24 one-hour buckets surrounding currentTimeMs (-12h to +12h)
  const currentHourStart = new Date(currentTimeMs);
  currentHourStart.setMinutes(0, 0, 0);
  const currentHourMs = currentHourStart.getTime();

  const buckets: HourlySecurityBucket[] = [];

  for (let i = -12; i <= 11; i++) {
    const bucketStartMs = currentHourMs + i * 3600 * 1000;
    const bucketEndMs = bucketStartMs + 3600 * 1000;
    const d = new Date(bucketStartMs);
    const hourLabel = `${d.getHours().toString().padStart(2, '0')}:00`;

    let queueEntered = 0;
    let cleared = 0;

    for (const log of getAllSecurityLogs()) {
      const enterMs = parseSimTimestamp(log.queueEnterTimestamp);
      const clearMs = parseSimTimestamp(log.clearedTimestamp);

      if (enterMs >= bucketStartMs && enterMs < bucketEndMs) {
        queueEntered++;
      }
      if (clearMs >= bucketStartMs && clearMs < bucketEndMs) {
        cleared++;
      }
    }

    const backlog = Math.max(0, queueEntered - cleared);
    const hasPeakAlert = alerts.some(
      (a) => a.ruleId === 'RULE_SECURITY_LATENCY' && Math.abs(a.timestampMs - bucketStartMs) < 3600 * 1000
    );

    buckets.push({
      hourLabel,
      timestampMs: bucketStartMs,
      queueEntered,
      cleared,
      backlog,
      hasPeakAlert,
    });
  }

  return buckets;
}

/**
 * Get Lane-by-Lane operational metrics for Lanes 1 to 8
 */
export function getLaneStatusList(currentTimeMs: number): LaneStatus[] {
  const lanes: LaneStatus[] = [];

  for (let laneNum = 1; laneNum <= 8; laneNum++) {
    const laneLogs = getAllSecurityLogs().filter((s) => s.laneNumber === laneNum);

    // Filter logs processed up to currentTimeMs
    const processedUpToNow = laneLogs.filter(
      (s) => parseSimTimestamp(s.clearedTimestamp) <= currentTimeMs
    );

    const count = processedUpToNow.length;

    let status: LaneStatus['status'] = 'OPTIMAL';
    if (count > 320) status = 'HEAVY';
    else if (count > 250) status = 'MODERATE';

    lanes.push({
      laneNumber: laneNum,
      laneType: 'XRAY-1 (Standard)',
      processedCount: count,
      avgWaitSec: 60, // constant from dataset
      isOverCapacity: status === 'HEAVY',
      status,
    });
  }

  return lanes;
}

/**
 * Filter security logs for table view
 */
export function filterSecurityLogs(
  logs: SecurityScreening[],
  filters: SecurityFilterOptions,
  currentTimeMs: number
): SecurityScreening[] {
  const searchLower = filters.search.trim().toLowerCase();

  return logs.filter((log) => {
    // 1. Search Query
    if (searchLower) {
      const matchId = log.screeningId.toLowerCase().includes(searchLower);
      const matchPass = log.passengerRef.toLowerCase().includes(searchLower);
      const matchPnr = log.pnrCode.toLowerCase().includes(searchLower);
      if (!matchId && !matchPass && !matchPnr) return false;
    }

    // 2. Lane Filter
    if (filters.laneFilter && filters.laneFilter !== 'ALL') {
      if (log.laneNumber !== parseInt(filters.laneFilter, 10)) return false;
    }

    // 3. Time Window
    if (filters.timeWindow && filters.timeWindow !== 'ALL' && currentTimeMs > 0) {
      const enterMs = parseSimTimestamp(log.queueEnterTimestamp);
      if (filters.timeWindow === 'PAST_1H') {
        if (enterMs < currentTimeMs - 3600 * 1000 || enterMs > currentTimeMs) return false;
      } else if (filters.timeWindow === 'PAST_6H') {
        if (enterMs < currentTimeMs - 6 * 3600 * 1000 || enterMs > currentTimeMs) return false;
      }
    }

    return true;
  });
}
