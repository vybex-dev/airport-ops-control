import { getAllFlights, parseSimTimestamp } from '@/lib/flights/flightDataService';
import type { Flight } from '@/data/types';
import type { SimAlert } from '@/lib/sim/simTypes';

export interface GateOccupancy {
  gate: string;
  terminal: string;
  flight: Flight;
  startMs: number;
  endMs: number;
  occupancyType: 'BOARDING' | 'TURNAROUND' | 'SCHEDULED' | 'DEPARTED' | 'CONFLICT';
  hasConflict: boolean;
  conflictFlightId?: string;
  alerts: SimAlert[];
}

export interface GateGroup {
  gate: string;
  terminal: string;
  occupancies: GateOccupancy[];
  hasActiveConflict: boolean;
}

export interface GateFilterOptions {
  search: string;
  terminal: string;
  gatePrefix: string;
  conflictsOnly: boolean;
}

/**
 * Extract all unique gates sorted numerically (B1, B2, ..., B50)
 */
export function getUniqueGates(): string[] {
  const flights = getAllFlights();
  const set = new Set<string>();
  for (const f of flights) {
    if (f.gate) set.add(f.gate);
  }
  return Array.from(set).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
}

/**
 * Calculate gate occupancy groups for all gates
 */
export function getGateOccupancies(
  currentTimeMs: number,
  alerts: SimAlert[],
  filters?: Partial<GateFilterOptions>
): GateGroup[] {
  const flights = getAllFlights();
  const gates = getUniqueGates();

  // Create lookup map of active gate conflict alerts
  const gateAlertMap = new Map<string, SimAlert[]>();
  for (const a of alerts) {
    if (a.ruleId === 'RULE_GATE_CONFLICT' || a.affectedRef?.includes('Gate')) {
      const gateMatch = a.affectedRef?.match(/Gate\s+(B\d+)/i) || a.description.match(/Gate\s+(B\d+)/i);
      const gateName = gateMatch ? gateMatch[1] : null;
      if (gateName) {
        if (!gateAlertMap.has(gateName)) gateAlertMap.set(gateName, []);
        gateAlertMap.get(gateName)!.push(a);
      }
    }
  }

  // Group flights by gate
  const flightsByGateMap = new Map<string, Flight[]>();
  for (const f of flights) {
    if (!f.gate) continue;
    if (!flightsByGateMap.has(f.gate)) flightsByGateMap.set(f.gate, []);
    flightsByGateMap.get(f.gate)!.push(f);
  }

  const result: GateGroup[] = [];

  for (const gate of gates) {
    // Apply filters
    if (filters?.gatePrefix && filters.gatePrefix !== 'ALL') {
      if (!gate.toLowerCase().includes(filters.gatePrefix.toLowerCase())) continue;
    }

    const gateFlights = flightsByGateMap.get(gate) ?? [];

    // Sort flights by scheduledDeparture timestamp
    gateFlights.sort(
      (a, b) => parseSimTimestamp(a.scheduledDeparture) - parseSimTimestamp(b.scheduledDeparture)
    );

    const occupancies: GateOccupancy[] = [];
    let hasActiveConflict = false;

    for (let i = 0; i < gateFlights.length; i++) {
      const flight = gateFlights[i];
      const schedMs = parseSimTimestamp(flight.scheduledDeparture);
      const actMs = parseSimTimestamp(flight.actualDeparture);

      // Gate occupancy window: 45 minutes prior to departure until departure
      const startMs = schedMs - 45 * 60 * 1000;
      const endMs = actMs;

      // Check conflict with adjacent flight on same gate (<45m window overlap)
      let hasConflict = false;
      let conflictFlightId: string | undefined;

      if (i > 0) {
        const prevFlight = gateFlights[i - 1];
        const prevActMs = parseSimTimestamp(prevFlight.actualDeparture);
        if (startMs < prevActMs + 5 * 60 * 1000) {
          hasConflict = true;
          conflictFlightId = prevFlight.flightId;
        }
      }
      if (i < gateFlights.length - 1) {
        const nextFlight = gateFlights[i + 1];
        const nextSchedMs = parseSimTimestamp(nextFlight.scheduledDeparture);
        if (endMs > nextSchedMs - 40 * 60 * 1000) {
          hasConflict = true;
          conflictFlightId = nextFlight.flightId;
        }
      }

      if (hasConflict) hasActiveConflict = true;

      // Determine state relative to currentTimeMs
      let occupancyType: GateOccupancy['occupancyType'] = 'SCHEDULED';
      if (hasConflict) {
        occupancyType = 'CONFLICT';
      } else if (currentTimeMs >= endMs) {
        occupancyType = 'DEPARTED';
      } else if (currentTimeMs >= startMs && currentTimeMs < endMs) {
        occupancyType = 'BOARDING';
      }

      // Check linked alerts for this specific flight
      const flightAlerts = alerts.filter(
        (a) => a.affectedFlightId === flight.flightId || a.affectedRef === `Gate ${gate}`
      );

      occupancies.push({
        gate,
        terminal: 'T3',
        flight,
        startMs,
        endMs,
        occupancyType,
        hasConflict,
        conflictFlightId,
        alerts: flightAlerts,
      });
    }

    // Search filter
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      const matchGate = gate.toLowerCase().includes(s);
      const matchFlight = occupancies.some(
        (o) =>
          o.flight.flightId.toLowerCase().includes(s) ||
          o.flight.destination.toLowerCase().includes(s) ||
          o.flight.airlineName.toLowerCase().includes(s)
      );
      if (!matchGate && !matchFlight) continue;
    }

    if (filters?.conflictsOnly && !hasActiveConflict) {
      continue;
    }

    result.push({
      gate,
      terminal: 'T3',
      occupancies,
      hasActiveConflict,
    });
  }

  return result;
}
