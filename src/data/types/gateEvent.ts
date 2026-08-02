/**
 * GateEvent — one boarding/gate movement event.
 * Source: gate_events.csv (1200 rows)
 *
 * flightId (col1) resolves 100% against Flight.flightId (687/687 distinct).
 * gate (col2) and terminal (col3) are CONSTANT across all 1200 rows
 * ("B12"/"T3") — this dataset does not vary gate assignment at the
 * gate-event level even though Flight.gate does vary per flight. Don't
 * build a UI that implies gate_events reveals per-flight gate assignment;
 * use Flight.gate for that instead.
 */
export interface GateEvent {
  eventId: string; // col0 — "T3-R18-474592"
  flightId: string; // col1 — join key to Flight.flightId (100% resolve)
  gate: 'B12'; // col2 — constant in this dataset
  terminal: 'T3'; // col3 — constant
  eventType: 'Boarding Start'; // col4 — constant; dataset has no other gate-event types
  eventTimestamp: string; // col5
  handledByRef: string; // col6 — "MTC-WY2PD" style reference code; NOT a working join to StaffShift.staffId (0/1200 resolve, see integrity report)
  durationSeconds: number; // col7 — constant 120 across all rows
  eventCategory: 'Routine'; // col8 — constant
  isDelayed: boolean; // col9 — constant False across all rows
  delayReasonNote: string; // col10 — always empty in this dataset
  loggedAt1: string; // col11 — unordered relative to eventTimestamp/loggedAt2; appears to be independent noise metadata rather than a causal sequence
  loggedAt2: string; // col12
  loggedAt3: string; // col13
}
