/**
 * Flight — one scheduled flight operation at DEL.
 * Source: flights.csv (1000 rows, header row is numeric 0..31)
 *
 * Column mapping (raw index -> field), derived by:
 *  - enum/value inspection across the full column (not just head rows)
 *  - timestamp delta checks: actualDeparture - scheduledDeparture === delayMinutes
 *    exactly for all 1000 rows, which is what pins down cols 5/6/14.
 *  - boardingTime (col21) sits ~15min before scheduledDeparture when on-time,
 *    and shifts later in step with delay, confirming it's derived from the
 *    schedule + delay rather than an independently logged event.
 *
 * NOTE ON DATA REALISM:
 *  - status (col13) is 'Departed' for all 1000 rows — this dataset has no
 *    in-progress or future flights, it's a closed historical batch. The
 *    "live board" feel in the UI comes entirely from simulated playback
 *    (see /src/lib/simClock), not from varying status values in the data.
 *  - capacity/passengerCount (col11/12) do NOT reconcile with actual row
 *    counts in passengers.csv (which only covers a subset of flights with
 *    a handful of sampled passengers each). Treat them as the flight's
 *    reported/summary figures, not a literal manifest count.
 */
export interface Flight {
  flightId: string; // "UK-633" — join key used by passengers/baggage/gate_events/maintenance/retail
  airlineName: string; // "Vistara"
  airlineCode: string; // "UK"
  origin: string; // always "DEL" in this dataset
  destination: string; // "SIN", "DXB", ... (14 distinct)
  scheduledDeparture: string; // ISO-ish "YYYY-MM-DD HH:mm:ss"
  actualDeparture: string;
  scheduledArrival: string;
  actualArrival: string;
  aircraftType: 'A320' | 'A350' | 'B737' | 'B787';
  aircraftReg: string; // "VT-PIU"
  capacity: number; // col11 — seat capacity for this operation, independent of aircraftType
  passengerCount: number; // col12 — reported boarded/booked count
  status: 'Departed'; // constant in this dataset; typed as literal, see note above
  delayMinutes: number; // col14 — one of {0, 30, 60, 150}
  delayReason: 'ATC' | 'CREW' | 'TECH' | 'TURNAROUND' | 'WX'; // col15 — ALWAYS populated, including 693/1000 flights with delayMinutes===0. Treat as an operational tag, not literally "the cause of the delay."
  terminal: 'T3'; // constant
  gate: string; // "B3".."B50" (50 distinct)
  gateAssigned: boolean;
  distanceKm: number; // col19 — plausible per destination but not cross-checked against a real route table
  fuelUsedKg: number; // col20
  boardingTime: string; // col21
  isInternational: boolean; // col22
  delayCategory: 'On-Time' | 'Moderate'; // col23 — coarse bucket derived from delayMinutes
  onTimePerformanceScore: number; // col24 — float, roughly 64-105 (values >100 exist in source, kept as-is)
  turnaroundMinutes: number; // col25
  loadFactor: number; // col26 — float 0..1
  timeOfDayBand: 'Morning' | 'Evening' | 'Night'; // col27
  dayOfWeek: string; // col28 — "Mon".."Sun"
  isWeekend: boolean; // col29 — matches dayOfWeek (Sat/Sun) exactly for all 1000 rows
  season: 'Autumn' | 'Winter'; // col30
  routeType: 'Domestic' | 'Long-Haul Intl'; // col31
}
