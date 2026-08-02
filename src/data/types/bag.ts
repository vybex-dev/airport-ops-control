/**
 * Bag — one checked-baggage lifecycle record.
 * Source: baggage.csv (2800 rows)
 *
 * flightId (col2) resolves 100% against Flight.flightId (925/925 distinct
 * values found). tagPnr/passportRef (col1/col3) do NOT resolve against
 * Passenger — same caveat as passengers.passportMasked, treat as display-only.
 */
export interface Bag {
  bagTagId: string; // col0 — "4717 7156 73" style tag number
  tagPnr: string; // col1 — 6-char code, own namespace, not joinable to Passenger.pnrCode
  flightId: string; // col2 — join key to Flight.flightId (100% resolve)
  passengerRef: string; // col3 — "PP-****2486" style, DISPLAY ONLY, not a reliable join key
  weightKg: number; // col4 — float, ~5 to 32 kg
  dimensions: string; // col5 — constant "55x40x23" across all rows
  stage: 'Check-in'; // col6 — constant in this dataset (no in-transit variety)
  checkpointCode: string; // col7 — constant "C12" across all rows
  checkInTimestamp: string; // col8
  loadTimestamp: string; // col9 — not chronologically consistent with checkInTimestamp (can precede it); treat as an independent logged event, not a strict sequence
  scanCount: number; // col10 — int 1-10
  handlingStatus: 'Loaded'; // col11 — constant
  isFlagged: boolean; // col12 — constant False across all rows
  mishandlingCode: number; // col13 — constant 0 across all rows
  currentLocation: 'Ramp'; // col14 — constant
  lastScanTimestamp: string; // col15
  isDamaged: boolean; // col16 — constant False across all rows
}
