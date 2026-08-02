import type { SimEvent, AlertSeverity } from './simTypes';
import { parseTimestampToMs } from './timeUtils';
import { getDatasetSync, onAllDataReady } from './dataLoader';

// Cached sorted event list — rebuilt whenever data arrives
let cachedEvents: SimEvent[] | null = null;

/** Invalidate the event cache when fresh data loads. */
onAllDataReady(() => {
  cachedEvents = null;
});

export { parseTimestampToMs };

export function getAllSimEvents(): SimEvent[] {
  if (cachedEvents) return cachedEvents;

  const flights = getDatasetSync('flights');
  const gateEvents = getDatasetSync('gate_events');
  const baggage = getDatasetSync('baggage');
  const security = getDatasetSync('security_screening');
  const maintenance = getDatasetSync('maintenance_logs');

  const events: SimEvent[] = [];

  // 1. Map Flights (scheduledDeparture & actualDeparture)
  for (const f of flights as any[]) {
    const schedMs = parseTimestampToMs(f.scheduledDeparture);
    if (schedMs > 0) {
      events.push({
        id: `evt-flight-sched-${f.flightId}`,
        timestamp: f.scheduledDeparture,
        timestampMs: schedMs,
        source: 'flight',
        eventType: 'FLIGHT_SCHEDULED',
        title: `Flight ${f.flightId} (${f.airlineName}) Scheduled`,
        details: `Destination: ${f.destination} | Gate: ${f.gate} | Pass: ${f.passengerCount}/${f.capacity}`,
        flightId: f.flightId,
        severity: 'info',
        rawRecord: f,
      });
    }

    if (f.delayMinutes > 0) {
      const actMs = parseTimestampToMs(f.actualDeparture);
      if (actMs > 0) {
        const severity: AlertSeverity = f.delayMinutes >= 150 ? 'critical' : 'warning';
        events.push({
          id: `evt-flight-delay-${f.flightId}`,
          timestamp: f.actualDeparture,
          timestampMs: actMs,
          source: 'flight',
          eventType: 'FLIGHT_DELAYED',
          title: `Flight ${f.flightId} Delayed by ${f.delayMinutes}m`,
          details: `Reason Tag: ${f.delayReason} | Gate: ${f.gate} | Destination: ${f.destination}`,
          flightId: f.flightId,
          severity,
          rawRecord: f,
        });
      }
    }
  }

  // 2. Map Gate Events
  for (const g of gateEvents as any[]) {
    const ms = parseTimestampToMs(g.eventTimestamp);
    if (ms > 0) {
      events.push({
        id: `evt-gate-${g.eventId}`,
        timestamp: g.eventTimestamp,
        timestampMs: ms,
        source: 'gate',
        eventType: 'GATE_BOARDING_START',
        title: `Boarding Started for Flight ${g.flightId} at Gate ${g.gate}`,
        details: `Duration: ${g.durationSeconds}s | Handled By: ${g.handledByRef}`,
        flightId: g.flightId,
        severity: 'info',
        rawRecord: g,
      });
    }
  }

  // 3. Map Baggage Records
  for (const b of baggage as any[]) {
    const ms = parseTimestampToMs(b.checkInTimestamp);
    if (ms > 0) {
      events.push({
        id: `evt-bag-${b.bagTagId}`,
        timestamp: b.checkInTimestamp,
        timestampMs: ms,
        source: 'baggage',
        eventType: 'BAG_CHECKIN',
        title: `Baggage Tag ${b.bagTagId} Processed`,
        details: `Flight: ${b.flightId} | Weight: ${b.weightKg}kg | Checkpoint: ${b.checkpointCode}`,
        flightId: b.flightId,
        severity: 'info',
        rawRecord: b,
      });
    }
  }

  // 4. Map Security Screening Records
  for (const s of security as any[]) {
    const ms = parseTimestampToMs(s.queueEnterTimestamp);
    if (ms > 0) {
      events.push({
        id: `evt-sec-${s.screeningId}`,
        timestamp: s.queueEnterTimestamp,
        timestampMs: ms,
        source: 'security',
        eventType: 'SECURITY_QUEUE_ENTER',
        title: `Security Screening Scan ${s.screeningId}`,
        details: `Lane: #${s.laneNumber} (${s.laneType}) | Processing: ${s.processingTimeSeconds}s`,
        severity: 'info',
        rawRecord: s,
      });
    }
  }

  // 5. Map Maintenance Logs
  for (const m of maintenance as any[]) {
    const ms = parseTimestampToMs(m.openedTimestamp);
    if (ms > 0) {
      events.push({
        id: `evt-mtc-${m.workOrderId}`,
        timestamp: m.openedTimestamp,
        timestampMs: ms,
        source: 'maintenance',
        eventType: 'MAINTENANCE_DEFECT_LOGGED',
        title: `Maintenance Defect Logged for ${m.aircraftReg}`,
        details: `Flight: ${m.flightId} | Defect: ${m.defectDescription} (${m.partAffected}) | Severity: ${m.severity}`,
        flightId: m.flightId,
        severity: 'critical',
        rawRecord: m,
      });
    }
  }

  // Sort events chronologically ascending
  events.sort((a, b) => a.timestampMs - b.timestampMs);

  // Only cache when we have real data (not empty bootstrap arrays)
  if (flights.length > 0) {
    cachedEvents = events;
  }

  return events;
}

/**
 * Binary search cursor to find all events with timestampMs <= currentTimeMs
 */
export function getActiveSimEvents(currentTimeMs: number): SimEvent[] {
  const allEvents = getAllSimEvents();
  if (allEvents.length === 0) return [];

  let low = 0;
  let high = allEvents.length - 1;
  let index = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (allEvents[mid].timestampMs <= currentTimeMs) {
      index = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (index === -1) return [];
  return allEvents.slice(0, index + 1);
}
