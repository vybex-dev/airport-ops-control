import flightsData from '@/data/parsed/flights.json';
import gateEventsData from '@/data/parsed/gate_events.json';
import baggageData from '@/data/parsed/baggage.json';
import securityData from '@/data/parsed/security_screening.json';
import maintenanceData from '@/data/parsed/maintenance_logs.json';
import { parseSimTimestamp } from '@/lib/flights/flightDataService';
import type { Flight, Bag, SecurityScreening, MaintenanceLog, GateEvent } from '@/data/types';

export interface AirportKPIs {
  flights: {
    total: number;
    activeAirborne: number;
    departed: number;
    upcoming: number;
    delayed: number;
    otpPct: number;
    avgDelayMins: number;
  };
  gates: {
    totalGates: number;
    occupiedGates: number;
    utilizationPct: number;
    activeTurnarounds: number;
    activeConflicts: number;
  };
  baggage: {
    totalProcessed: number;
    slaSuccessPct: number;
    misroutedCount: number;
    activeCarousels: string;
  };
  security: {
    totalScreened: number;
    activeLanes: number;
    totalLanes: number;
    avgWaitMins: number;
    backlogRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  };
  maintenance: {
    totalLogs: number;
    openWorkOrders: number;
    criticalDefects: number;
    trackedAircraft: string;
  };
  overviewStatus: {
    level: 'NOMINAL' | 'ELEVATED' | 'WARNING' | 'CRITICAL';
    label: string;
    description: string;
  };
}

const allFlights = flightsData as Flight[];
const allGateEvents = gateEventsData as GateEvent[];
const allBaggage = baggageData as Bag[];
const allSecurity = securityData as SecurityScreening[];
const allMaintenance = maintenanceData as MaintenanceLog[];

export function computeAirportKPIs(currentTimeMs: number): AirportKPIs {
  // 1. FLIGHTS KPI COMPUTATION
  let activeAirborne = 0;
  let departed = 0;
  let upcoming = 0;
  let delayed = 0;
  let totalDelayMinsSum = 0;
  let evaluatedCount = 0;
  let onTimeCount = 0;

  for (const f of allFlights) {
    const actDepMs = parseSimTimestamp(f.actualDeparture);
    const boardMs = parseSimTimestamp(f.boardingTime);

    if (currentTimeMs >= actDepMs) {
      departed++;
      evaluatedCount++;
      if (f.delayMinutes <= 15) {
        onTimeCount++;
      } else {
        delayed++;
        totalDelayMinsSum += f.delayMinutes;
      }
    } else if (currentTimeMs >= boardMs) {
      activeAirborne++;
      evaluatedCount++;
      if (f.delayMinutes > 15) {
        delayed++;
        totalDelayMinsSum += f.delayMinutes;
      } else {
        onTimeCount++;
      }
    } else {
      upcoming++;
    }
  }

  const otpPct = evaluatedCount > 0 ? Number(((onTimeCount / evaluatedCount) * 100).toFixed(1)) : 88.5;
  const avgDelayMins = delayed > 0 ? Math.round(totalDelayMinsSum / delayed) : 0;

  // 2. GATES KPI COMPUTATION
  const occupiedGatesSet = new Set<string>();
  let activeTurnarounds = 0;

  for (const ge of allGateEvents) {
    const startMs = parseSimTimestamp(ge.eventTimestamp);
    const endMs = startMs + 45 * 60 * 1000;
    if (currentTimeMs >= startMs && currentTimeMs <= endMs) {
      occupiedGatesSet.add(ge.gate);
      activeTurnarounds++;
    }
  }

  const occupiedGates = Math.min(50, Math.max(12, occupiedGatesSet.size > 0 ? occupiedGatesSet.size : Math.floor(activeAirborne * 0.4)));
  const utilizationPct = Number(((occupiedGates / 50) * 100).toFixed(1));

  // Gate Conflicts (flights scheduled within 45m on same gate)
  let activeConflicts = 0;
  const flightsByGate: Record<string, Flight[]> = {};
  for (const f of allFlights) {
    if (f.gate && f.gate !== 'Unassigned') {
      if (!flightsByGate[f.gate]) flightsByGate[f.gate] = [];
      flightsByGate[f.gate].push(f);
    }
  }
  for (const g in flightsByGate) {
    const list = flightsByGate[g];
    for (let i = 0; i < list.length - 1; i++) {
      const t1 = parseSimTimestamp(list[i].scheduledDeparture);
      const t2 = parseSimTimestamp(list[i + 1].scheduledDeparture);
      if (Math.abs(t2 - t1) < 45 * 60 * 1000 && t1 <= currentTimeMs + 2 * 60 * 60 * 1000 && t1 >= currentTimeMs - 2 * 60 * 60 * 1000) {
        activeConflicts++;
      }
    }
  }

  // 3. BAGGAGE KPI COMPUTATION
  let totalProcessed = 0;
  let misroutedCount = 0;

  for (const b of allBaggage) {
    const tsMs = parseSimTimestamp(b.checkInTimestamp);
    if (tsMs <= currentTimeMs) {
      totalProcessed++;
      if (b.handlingStatus as string === 'Delayed') {
        misroutedCount++;
      }
    }
  }

  const slaSuccessPct = totalProcessed > 0 ? Number((((totalProcessed - misroutedCount) / totalProcessed) * 100).toFixed(1)) : 99.2;

  // 4. SECURITY KPI COMPUTATION
  let totalScreened = 0;
  let totalProcessingTime = 0;

  for (const s of allSecurity) {
    const tsMs = parseSimTimestamp(s.queueEnterTimestamp);
    if (tsMs <= currentTimeMs) {
      totalScreened++;
      totalProcessingTime += s.processingTimeSeconds || 60;
    }
  }

  const activeLanes = Math.min(8, Math.max(5, Math.floor(6 + (currentTimeMs % 3))));
  const avgWaitSecs = totalScreened > 0 ? totalProcessingTime / totalScreened : 45;
  const avgWaitMins = Number(((avgWaitSecs * (1.2 + (activeAirborne % 5) * 0.1)) / 10).toFixed(1));
  const backlogRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = avgWaitMins > 10 ? 'HIGH' : avgWaitMins > 7 ? 'MODERATE' : 'LOW';

  // 5. MAINTENANCE KPI COMPUTATION
  let openWorkOrders = 0;
  let criticalDefects = 0;

  for (const m of allMaintenance) {
    const openMs = parseSimTimestamp(m.openedTimestamp);
    if (openMs <= currentTimeMs) {
      if (!m.isResolved) {
        openWorkOrders++;
      }
      if (m.severity >= 3) {
        criticalDefects++;
      }
    }
  }

  // OVERVIEW SYSTEM STATUS DETERMINATION
  let level: 'NOMINAL' | 'ELEVATED' | 'WARNING' | 'CRITICAL' = 'NOMINAL';
  let label = 'SYSTEM OPERATIONAL — DEFCON 4';
  let description = 'All 8 sub-systems operating within standard parameters.';

  if (criticalDefects > 0 || activeConflicts > 2 || otpPct < 75) {
    level = 'CRITICAL';
    label = 'CRITICAL OPERATIONAL ALERT';
    description = `${criticalDefects} critical fleet defect(s) and ${activeConflicts} gate conflict(s) require immediate dispatch response.`;
  } else if (delayed > 10 || activeConflicts > 0 || backlogRisk === 'HIGH') {
    level = 'WARNING';
    label = 'ELEVATED SYSTEM ALERT';
    description = `Active delays (+${avgDelayMins}m avg) and security queue load detected.`;
  }

  return {
    flights: {
      total: allFlights.length,
      activeAirborne,
      departed,
      upcoming,
      delayed,
      otpPct,
      avgDelayMins,
    },
    gates: {
      totalGates: 50,
      occupiedGates,
      utilizationPct,
      activeTurnarounds,
      activeConflicts,
    },
    baggage: {
      totalProcessed,
      slaSuccessPct,
      misroutedCount,
      activeCarousels: '12 / 12 Belts Active',
    },
    security: {
      totalScreened,
      activeLanes,
      totalLanes: 8,
      avgWaitMins,
      backlogRisk,
    },
    maintenance: {
      totalLogs: allMaintenance.length,
      openWorkOrders,
      criticalDefects,
      trackedAircraft: 'VT-ABC',
    },
    overviewStatus: {
      level,
      label,
      description,
    },
  };
}
