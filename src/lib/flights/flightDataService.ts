import flightsData from '@/data/parsed/flights.json';
import passengersData from '@/data/parsed/passengers.json';
import baggageData from '@/data/parsed/baggage.json';
import gateEventsData from '@/data/parsed/gate_events.json';
import maintenanceData from '@/data/parsed/maintenance_logs.json';

import type { Flight, Passenger, Bag, GateEvent, MaintenanceLog } from '@/data/types';
import type { SimAlert } from '@/lib/sim/simTypes';

export type LiveFlightStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'DELAYED' | 'CANCELLED';

export interface LiveFlightState {
  status: LiveFlightStatus;
  statusLabel: string;
  badgeVariant: 'ontime' | 'boarding' | 'delayed' | 'alert' | 'neutral';
  isLive: boolean;
  delayDisplay?: string;
  hasActiveAlert: boolean;
  activeAlertCount: number;
  alerts: SimAlert[];
}

export interface JoinedFlightData {
  flight: Flight;
  passengers: {
    list: Passenger[];
    totalSampled: number;
    flightCapacity: number;
    passengerCount: number;
    loadFactorPct: number;
    businessCount: number;
    economyCount: number;
    frequentFlyersCount: number;
    specialAssistanceCount: number;
  };
  baggage: {
    list: Bag[];
    totalCount: number;
    totalWeightKg: number;
    avgWeightKg: number;
  };
  gateEvents: GateEvent[];
  maintenanceLogs: MaintenanceLog[];
  alerts: SimAlert[];
  liveState: LiveFlightState;
}

export interface FlightFilterOptions {
  search: string;
  airline: string;
  destination: string;
  statusFilter: string; // 'ALL' | 'BOARDING' | 'ONTIME' | 'DELAYED' | 'DEPARTED'
  gateFilter: string;
  timeWindow: string; // 'ALL' | 'PAST_2H' | 'NEXT_2H' | 'NEXT_6H'
  preset: string; // 'ALL' | 'BOARDING_NOW' | 'DELAYED' | 'CRITICAL_DELAY' | 'INTL'
}

// Helper: Convert "YYYY-MM-DD HH:mm:ss" to epoch ms
export function parseSimTimestamp(tsStr: string): number {
  if (!tsStr) return 0;
  const formatted = tsStr.includes('T') ? tsStr : tsStr.replace(' ', 'T');
  const ms = new Date(formatted).getTime();
  return isNaN(ms) ? 0 : ms;
}

// ----------------------------------------------------
// PRE-INDEXED LOOKUP MAPS FOR O(1) CROSS-DATASET JOINS
// ----------------------------------------------------
const allFlights: Flight[] = flightsData as Flight[];
const passengersByFlightMap = new Map<string, Passenger[]>();
const baggageByFlightMap = new Map<string, Bag[]>();
const gateEventsByFlightMap = new Map<string, GateEvent[]>();
const maintenanceByFlightMap = new Map<string, MaintenanceLog[]>();

// Initialize indices once
(() => {
  for (const p of passengersData as Passenger[]) {
    if (!passengersByFlightMap.has(p.flightId)) {
      passengersByFlightMap.set(p.flightId, []);
    }
    passengersByFlightMap.get(p.flightId)!.push(p);
  }

  for (const b of baggageData as Bag[]) {
    if (!baggageByFlightMap.has(b.flightId)) {
      baggageByFlightMap.set(b.flightId, []);
    }
    baggageByFlightMap.get(b.flightId)!.push(b);
  }

  for (const g of gateEventsData as GateEvent[]) {
    if (!gateEventsByFlightMap.has(g.flightId)) {
      gateEventsByFlightMap.set(g.flightId, []);
    }
    gateEventsByFlightMap.get(g.flightId)!.push(g);
  }

  for (const m of maintenanceData as MaintenanceLog[]) {
    if (!maintenanceByFlightMap.has(m.flightId)) {
      maintenanceByFlightMap.set(m.flightId, []);
    }
    maintenanceByFlightMap.get(m.flightId)!.push(m);
  }
})();

export function getAllFlights(): Flight[] {
  return allFlights;
}

/**
 * Get unique airlines for dropdown filters
 */
export function getUniqueAirlines(): string[] {
  const set = new Set<string>();
  for (const f of allFlights) {
    if (f.airlineName) set.add(f.airlineName);
  }
  return Array.from(set).sort();
}

/**
 * Get unique destinations for dropdown filters
 */
export function getUniqueDestinations(): string[] {
  const set = new Set<string>();
  for (const f of allFlights) {
    if (f.destination) set.add(f.destination);
  }
  return Array.from(set).sort();
}

/**
 * Calculate dynamic live status driven by current sim clock time
 */
export function calculateLiveFlightState(
  flight: Flight,
  currentTimeMs: number,
  activeAlertsMap?: Map<string, SimAlert[]>
): LiveFlightState {
  const schedDepMs = parseSimTimestamp(flight.scheduledDeparture);
  const actDepMs = parseSimTimestamp(flight.actualDeparture);
  const boardMs = parseSimTimestamp(flight.boardingTime);

  const flightAlerts = activeAlertsMap?.get(flight.flightId) ?? [];
  const hasActiveAlert = flightAlerts.length > 0;

  // 1. Departed
  if (currentTimeMs >= actDepMs) {
    const wasDelayed = flight.delayMinutes > 0;
    return {
      status: 'DEPARTED',
      statusLabel: wasDelayed ? `DEPARTED (+${flight.delayMinutes}m)` : 'DEPARTED',
      badgeVariant: wasDelayed ? 'neutral' : 'ontime',
      isLive: false,
      delayDisplay: wasDelayed ? `+${flight.delayMinutes}m` : undefined,
      hasActiveAlert,
      activeAlertCount: flightAlerts.length,
      alerts: flightAlerts,
    };
  }

  // 2. Boarding (between boardingTime and actualDeparture)
  if (currentTimeMs >= boardMs) {
    return {
      status: 'BOARDING',
      statusLabel: `BOARDING GATE ${flight.gate}`,
      badgeVariant: 'boarding',
      isLive: true,
      delayDisplay: flight.delayMinutes > 0 ? `+${flight.delayMinutes}m` : undefined,
      hasActiveAlert,
      activeAlertCount: flightAlerts.length,
      alerts: flightAlerts,
    };
  }

  // 3. Delayed (scheduled time passed or delay confirmed prior to boarding)
  if (
    (currentTimeMs >= schedDepMs && flight.delayMinutes > 0) ||
    (flight.delayMinutes >= 60 && currentTimeMs >= schedDepMs - 60 * 60 * 1000)
  ) {
    return {
      status: 'DELAYED',
      statusLabel: `DELAYED (+${flight.delayMinutes}m)`,
      badgeVariant: flight.delayMinutes >= 150 ? 'alert' : 'delayed',
      isLive: true,
      delayDisplay: `+${flight.delayMinutes}m`,
      hasActiveAlert,
      activeAlertCount: flightAlerts.length,
      alerts: flightAlerts,
    };
  }

  // 4. Scheduled / On-Time
  return {
    status: 'SCHEDULED',
    statusLabel: 'ON TIME',
    badgeVariant: 'ontime',
    isLive: false,
    hasActiveAlert,
    activeAlertCount: flightAlerts.length,
    alerts: flightAlerts,
  };
}

/**
 * Get joined cross-dataset record for a flight
 */
export function getJoinedFlightData(flight: Flight, activeAlerts: SimAlert[] = [], currentTimeMs: number = 0): JoinedFlightData {
  const flightId = flight.flightId;
  const passengers = passengersByFlightMap.get(flightId) ?? [];
  const baggage = baggageByFlightMap.get(flightId) ?? [];
  const gateEvents = gateEventsByFlightMap.get(flightId) ?? [];
  const maintenanceLogs = maintenanceByFlightMap.get(flightId) ?? [];

  // Alerts linked to this flight
  const flightAlerts = activeAlerts.filter(
    (a) => a.affectedFlightId === flightId || a.affectedRef === flightId || a.affectedRef === flight.aircraftReg
  );

  // Compute passenger summary metrics
  const businessCount = passengers.filter((p) => p.bookingClass === 'Business').length;
  const economyCount = passengers.filter((p) => p.bookingClass === 'Economy').length;
  const frequentFlyersCount = passengers.filter((p) => p.isFrequentFlyer).length;
  const specialAssistanceCount = passengers.filter((p) => p.hasSpecialAssistance).length;
  const loadFactorPct = flight.capacity > 0 ? Math.round((flight.passengerCount / flight.capacity) * 100) : 0;

  // Compute baggage summary metrics
  const totalBaggageWeight = baggage.reduce((acc, b) => acc + (b.weightKg || 0), 0);
  const avgWeightKg = baggage.length > 0 ? Number((totalBaggageWeight / baggage.length).toFixed(1)) : 0;

  const alertsMap = new Map<string, SimAlert[]>();
  if (flightAlerts.length > 0) alertsMap.set(flightId, flightAlerts);

  const liveState = calculateLiveFlightState(flight, currentTimeMs, alertsMap);

  return {
    flight,
    passengers: {
      list: passengers,
      totalSampled: passengers.length,
      flightCapacity: flight.capacity,
      passengerCount: flight.passengerCount,
      loadFactorPct,
      businessCount,
      economyCount,
      frequentFlyersCount,
      specialAssistanceCount,
    },
    baggage: {
      list: baggage,
      totalCount: baggage.length,
      totalWeightKg: Math.round(totalBaggageWeight),
      avgWeightKg,
    },
    gateEvents,
    maintenanceLogs,
    alerts: flightAlerts,
    liveState,
  };
}

/**
 * Multi-field filtering and searching function
 */
export function filterFlights(
  flights: Flight[],
  options: FlightFilterOptions,
  currentTimeMs: number,
  activeAlertsMap: Map<string, SimAlert[]>
): Flight[] {
  const searchLower = options.search.trim().toLowerCase();

  return flights.filter((f) => {
    // 1. Search Query
    if (searchLower) {
      const matchId = f.flightId.toLowerCase().includes(searchLower);
      const matchAirline = f.airlineName.toLowerCase().includes(searchLower);
      const matchCode = f.airlineCode.toLowerCase().includes(searchLower);
      const matchDest = f.destination.toLowerCase().includes(searchLower);
      const matchGate = f.gate.toLowerCase().includes(searchLower);
      const matchReg = f.aircraftReg.toLowerCase().includes(searchLower);
      if (!matchId && !matchAirline && !matchCode && !matchDest && !matchGate && !matchReg) {
        return false;
      }
    }

    // 2. Airline Filter
    if (options.airline && options.airline !== 'ALL') {
      if (f.airlineName !== options.airline) return false;
    }

    // 3. Destination Filter
    if (options.destination && options.destination !== 'ALL') {
      if (f.destination !== options.destination) return false;
    }

    // 4. Live Status Filter
    if (options.statusFilter && options.statusFilter !== 'ALL') {
      const state = calculateLiveFlightState(f, currentTimeMs, activeAlertsMap);
      if (options.statusFilter === 'BOARDING' && state.status !== 'BOARDING') return false;
      if (options.statusFilter === 'ONTIME' && state.status !== 'SCHEDULED') return false;
      if (options.statusFilter === 'DELAYED' && state.status !== 'DELAYED') return false;
      if (options.statusFilter === 'DEPARTED' && state.status !== 'DEPARTED') return false;
    }

    // 5. Gate / Terminal Filter
    if (options.gateFilter && options.gateFilter !== 'ALL') {
      if (!f.gate.toLowerCase().includes(options.gateFilter.toLowerCase())) return false;
    }

    // 6. Time Window Filter (relative to virtual currentTimeMs)
    if (options.timeWindow && options.timeWindow !== 'ALL' && currentTimeMs > 0) {
      const schedMs = parseSimTimestamp(f.scheduledDeparture);
      const actMs = parseSimTimestamp(f.actualDeparture);

      if (options.timeWindow === 'PAST_2H') {
        const twoHoursAgo = currentTimeMs - 2 * 60 * 60 * 1000;
        if (actMs < twoHoursAgo || actMs > currentTimeMs) return false;
      } else if (options.timeWindow === 'NEXT_2H') {
        const twoHoursAhead = currentTimeMs + 2 * 60 * 60 * 1000;
        if (schedMs < currentTimeMs || schedMs > twoHoursAhead) return false;
      } else if (options.timeWindow === 'NEXT_6H') {
        const sixHoursAhead = currentTimeMs + 6 * 60 * 60 * 1000;
        if (schedMs < currentTimeMs || schedMs > sixHoursAhead) return false;
      }
    }

    // 7. Presets
    if (options.preset && options.preset !== 'ALL') {
      const state = calculateLiveFlightState(f, currentTimeMs, activeAlertsMap);
      if (options.preset === 'BOARDING_NOW' && state.status !== 'BOARDING') return false;
      if (options.preset === 'DELAYED' && f.delayMinutes === 0) return false;
      if (options.preset === 'CRITICAL_DELAY' && f.delayMinutes < 150) return false;
      if (options.preset === 'INTL' && !f.isInternational) return false;
    }

    return true;
  });
}
