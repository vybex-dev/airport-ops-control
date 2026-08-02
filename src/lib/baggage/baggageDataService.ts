import { getDatasetSync, onAllDataReady } from '@/lib/sim/dataLoader';
import type { Bag } from '@/data/types/bag';
import { parseSimTimestamp, getAllFlights } from '@/lib/flights/flightDataService';
import type { Flight } from '@/data/types';
import type { SimAlert } from '@/lib/sim/simTypes';

export type DynamicBagStatus = 'CHECKIN' | 'LOADED' | 'DELIVERED';

export interface DynamicBagState {
  bag: Bag;
  flight?: Flight;
  status: DynamicBagStatus;
  statusLabel: string;
  badgeVariant: 'ontime' | 'boarding' | 'delayed' | 'alert' | 'neutral';
  checkInMs: number;
  lastScanMs: number;
  hasAlert: boolean;
  alert?: SimAlert;
}

export interface BaggageFilterOptions {
  search: string;
  stageFilter: string; // 'ALL' | 'CHECKIN' | 'LOADED' | 'DELIVERED'
  flightFilter: string; // Flight ID or ALL
  hasAlertOnly: boolean;
}

let allBags: Bag[] = [];
const bagsByFlightMap = new Map<string, Bag[]>();
const bagsByTagMap = new Map<string, Bag>();

function buildBaggageIndex() {
  allBags = getDatasetSync<Bag>('baggage');
  bagsByFlightMap.clear();
  bagsByTagMap.clear();
  for (const b of allBags) {
    bagsByTagMap.set(b.bagTagId, b);
    if (!bagsByFlightMap.has(b.flightId)) bagsByFlightMap.set(b.flightId, []);
    bagsByFlightMap.get(b.flightId)!.push(b);
  }
}

onAllDataReady(buildBaggageIndex);

export function getAllBaggage(): Bag[] {
  return allBags;
}

export function getBagsForFlight(flightId: string): Bag[] {
  return bagsByFlightMap.get(flightId) ?? [];
}

export function getBagByTag(bagTagId: string): Bag | undefined {
  return bagsByTagMap.get(bagTagId);
}

/**
 * Compute live dynamic bag state relative to currentTimeMs
 */
export function calculateDynamicBagState(
  bag: Bag,
  currentTimeMs: number,
  alerts: SimAlert[] = []
): DynamicBagState {
  const checkInMs = parseSimTimestamp(bag.checkInTimestamp);
  const lastScanMs = parseSimTimestamp(bag.lastScanTimestamp);

  // Check SLA alert
  const alert = alerts.find(
    (a) => a.affectedRef === bag.bagTagId || a.description.includes(bag.bagTagId)
  );

  let status: DynamicBagStatus = 'CHECKIN';
  let statusLabel = 'CHECK-IN';
  let badgeVariant: DynamicBagState['badgeVariant'] = 'neutral';

  if (currentTimeMs >= lastScanMs) {
    status = 'DELIVERED';
    statusLabel = 'DELIVERED / CLAIM';
    badgeVariant = 'ontime';
  } else if (currentTimeMs >= checkInMs) {
    status = 'LOADED';
    statusLabel = 'LOADED / IN TRANSIT';
    badgeVariant = 'boarding';
  } else {
    status = 'CHECKIN';
    statusLabel = 'CHECKED-IN';
    badgeVariant = 'neutral';
  }

  if (alert) {
    badgeVariant = 'alert';
  }

  // Lookup associated flight
  const flight = getAllFlights().find((f) => f.flightId === bag.flightId);

  return {
    bag,
    flight,
    status,
    statusLabel,
    badgeVariant,
    checkInMs,
    lastScanMs,
    hasAlert: !!alert,
    alert,
  };
}

/**
 * Filter baggage list with live dynamic status evaluation
 */
export function filterBaggage(
  bags: Bag[],
  filters: BaggageFilterOptions,
  currentTimeMs: number,
  alerts: SimAlert[] = []
): DynamicBagState[] {
  const searchLower = filters.search.trim().toLowerCase();

  const results: DynamicBagState[] = [];

  for (const bag of bags) {
    // 1. Search Query
    if (searchLower) {
      const matchTag = bag.bagTagId.toLowerCase().includes(searchLower);
      const matchPnr = bag.tagPnr.toLowerCase().includes(searchLower);
      const matchFlight = bag.flightId.toLowerCase().includes(searchLower);
      const matchPass = bag.passengerRef.toLowerCase().includes(searchLower);

      if (!matchTag && !matchPnr && !matchFlight && !matchPass) {
        continue;
      }
    }

    // 2. Flight Filter
    if (filters.flightFilter && filters.flightFilter !== 'ALL') {
      if (bag.flightId !== filters.flightFilter) continue;
    }

    // Dynamic state computation
    const state = calculateDynamicBagState(bag, currentTimeMs, alerts);

    // 3. Stage Filter
    if (filters.stageFilter && filters.stageFilter !== 'ALL') {
      if (state.status !== filters.stageFilter) continue;
    }

    // 4. Alert Filter
    if (filters.hasAlertOnly && !state.hasAlert) continue;

    results.push(state);
  }

  return results;
}
