/**
 * SecurityScreening — one passenger security-lane processing record.
 * Source: security_screening.csv (2500 rows)
 *
 * passengerRef (col1) and pnrCode (col2) do NOT reliably join to Passenger —
 * same masked/independent-namespace caveat as elsewhere. There is no
 * flight_id column in this table at all, so SecurityScreening cannot be
 * joined to Flight directly; it can only be related to a flight indirectly
 * via a shared passenger identity, which itself is not reliably resolvable
 * in this dataset. Treat security_screening as flight-agnostic operational
 * volume data (queue/lane throughput), not as a per-flight breakdown.
 */
export interface SecurityScreening {
  screeningId: string; // col0 — "SCR369386"
  passengerRef: string; // col1 — "PP-****3049" style, not a reliable join key
  pnrCode: string; // col2 — 6-char code, own namespace
  laneNumber: number; // col3 — int 1-8
  queueEnterTimestamp: string; // col4
  screeningStartTimestamp: string; // col5 — NOT chronologically consistent with col4/col6; treat as independent logged timestamps, not a strict queue->screen->clear sequence
  clearedTimestamp: string; // col6
  result: 'Clear'; // col7 — constant; dataset has no flagged/secondary-screening outcomes
  flagNote: string; // col8 — always empty
  requiresSecondaryScreening: boolean; // col9 — constant False
  handledByRef: string; // col10 — reference code, not a working join to StaffShift.staffId
  laneType: 'XRAY-1'; // col11 — constant
  processingTimeSeconds: number; // col12 — constant 60 across all rows
  isVip: boolean; // col13 — constant False
  hasAlarm: boolean; // col14 — constant False
  shiftCode: 'SHIFT-1'; // col15 — constant
  throughputCapacity: number; // col16 — constant 400
  staffedLanes: number; // col17 — constant 200
  activeLanes: number; // col18 — constant 200
  isOverCapacity: boolean; // col19 — constant False
}
