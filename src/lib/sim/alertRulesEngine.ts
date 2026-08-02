import type { SimAlert, AlertSeverity } from './simTypes';
import { parseTimestampToMs } from './eventIndexer';
import flights from '@/data/parsed/flights.json';
import maintenance from '@/data/parsed/maintenance_logs.json';

let cachedAllAlerts: SimAlert[] | null = null;

export function generateAllAlgorithmicAlerts(): SimAlert[] {
  if (cachedAllAlerts) return cachedAllAlerts;

  const alerts: SimAlert[] = [];

  // 1. RULE_FLIGHT_DELAY: Flight delay >= 60m
  for (const f of flights as any[]) {
    if (f.delayMinutes >= 60) {
      const tsMs = parseTimestampToMs(f.scheduledDeparture);
      const severity: AlertSeverity = f.delayMinutes >= 150 ? 'critical' : 'warning';
      alerts.push({
        id: `alert-delay-${f.flightId}`,
        ruleId: 'RULE_FLIGHT_DELAY',
        timestamp: f.scheduledDeparture,
        timestampMs: tsMs,
        severity,
        title: `Flight ${f.flightId} (${f.destination}) Delayed +${f.delayMinutes}m`,
        description: `Flight ${f.flightId} delayed by ${f.delayMinutes} minutes due to ${f.delayReason}. Scheduled gate: ${f.gate}.`,
        affectedFlightId: f.flightId,
        isAcknowledged: false,
        source: 'flight',
      });
    }
  }

  // 2. RULE_GATE_CONFLICT: Detect flights assigned to same gate within 45 minutes of scheduled departure
  const flightsByGate: Record<string, any[]> = {};
  for (const f of flights as any[]) {
    if (f.gate && f.gate !== 'Unassigned') {
      if (!flightsByGate[f.gate]) flightsByGate[f.gate] = [];
      flightsByGate[f.gate].push(f);
    }
  }

  for (const gate in flightsByGate) {
    const list = flightsByGate[gate];
    list.sort(
      (a, b) =>
        parseTimestampToMs(a.scheduledDeparture) - parseTimestampToMs(b.scheduledDeparture)
    );

    for (let i = 0; i < list.length - 1; i++) {
      const f1 = list[i];
      const f2 = list[i + 1];
      const t1 = parseTimestampToMs(f1.scheduledDeparture);
      const t2 = parseTimestampToMs(f2.scheduledDeparture);
      const diffMinutes = Math.abs(t2 - t1) / (1000 * 60);

      if (diffMinutes < 45) {
        alerts.push({
          id: `alert-gate-conflict-${f1.flightId}-${f2.flightId}`,
          ruleId: 'RULE_GATE_CONFLICT',
          timestamp: f1.scheduledDeparture,
          timestampMs: t1,
          severity: 'warning',
          title: `Gate ${gate} Concourse Tight Turnaround Conflict`,
          description: `Flight ${f1.flightId} and Flight ${f2.flightId} scheduled at Gate ${gate} within ${Math.round(diffMinutes)}m window.`,
          affectedFlightId: f1.flightId,
          affectedRef: `Gate ${gate}`,
          isAcknowledged: false,
          source: 'gate',
        });
      }
    }
  }

  // 3. RULE_MAINTENANCE_DEFECT: High-severity technical defects on VT-ABC
  for (const m of maintenance as any[]) {
    if (m.severity >= 3) {
      const tsMs = parseTimestampToMs(m.openedTimestamp);
      alerts.push({
        id: `alert-mtc-${m.workOrderId}`,
        ruleId: 'RULE_MAINTENANCE_DEFECT',
        timestamp: m.openedTimestamp,
        timestampMs: tsMs,
        severity: 'critical',
        title: `Airframe ${m.aircraftReg} Hydraulic Seal Defect`,
        description: `Work order ${m.workOrderId} logged for ${m.aircraftReg} (${m.defectDescription} - ${m.partAffected}). Linked flight: ${m.flightId}.`,
        affectedFlightId: m.flightId,
        affectedRef: m.workOrderId,
        isAcknowledged: false,
        source: 'maintenance',
      });
    }
  }

  // Sort alerts chronologically ascending
  alerts.sort((a, b) => a.timestampMs - b.timestampMs);
  cachedAllAlerts = alerts;
  return cachedAllAlerts;
}

/**
 * Returns all alerts whose timestampMs <= currentTimeMs
 */
export function getActiveAlerts(currentTimeMs: number): SimAlert[] {
  const allAlerts = generateAllAlgorithmicAlerts();
  return allAlerts.filter((a) => a.timestampMs <= currentTimeMs);
}
