import { getDatasetSync } from '@/lib/sim/dataLoader';
import type { MaintenanceLog } from '@/data/types';

export interface MaintenanceFilterOptions {
  search: string;
  aircraftRegFilter?: string;
  severityFilter?: string;
}

const _getMaintenanceLogs = () => getDatasetSync<MaintenanceLog>('maintenance_logs');

export function getAllMaintenanceLogs(): MaintenanceLog[] {
  return _getMaintenanceLogs();
}

/**
 * Filter maintenance records
 */
export function filterMaintenanceLogs(
  logs: MaintenanceLog[],
  options: MaintenanceFilterOptions
): MaintenanceLog[] {
  const searchLower = options.search.trim().toLowerCase();

  return logs.filter((log) => {
    if (searchLower) {
      const matchWo = log.workOrderId.toLowerCase().includes(searchLower);
      const matchFlight = log.flightId.toLowerCase().includes(searchLower);
      const matchReg = log.aircraftReg.toLowerCase().includes(searchLower);
      const matchDefect = log.defectDescription.toLowerCase().includes(searchLower);
      const matchPart = log.partAffected.toLowerCase().includes(searchLower);
      const matchTech = log.technicianRef.toLowerCase().includes(searchLower);
      if (!matchWo && !matchFlight && !matchReg && !matchDefect && !matchPart && !matchTech) {
        return false;
      }
    }

    if (options.aircraftRegFilter && options.aircraftRegFilter !== 'ALL') {
      if (log.aircraftReg !== options.aircraftRegFilter) return false;
    }

    if (options.severityFilter && options.severityFilter !== 'ALL') {
      if (log.severity.toString() !== options.severityFilter) return false;
    }

    return true;
  });
}

/**
 * Maintenance summary KPIs
 */
export function getMaintenanceKPIs() {
  const allMaintenanceLogs = _getMaintenanceLogs();
  const totalCount = allMaintenanceLogs.length;
  const uniqueFlightsSet = new Set<string>();

  let severity3Count = 0;
  let priority5Count = 0;

  for (const log of allMaintenanceLogs) {
    if (log.flightId) uniqueFlightsSet.add(log.flightId);
    if (log.severity === 3) severity3Count++;
    if (log.priorityCode === 5) priority5Count++;
  }

  return {
    totalCount,
    trackedAirframe: 'VT-ABC', // Main tracked airframe in DEL dataset
    impactedFlightsCount: uniqueFlightsSet.size,
    severity3Count,
    priority5Count,
    commonDefect: 'Hydraulic leak (Seal)',
  };
}
