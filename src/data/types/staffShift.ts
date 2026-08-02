/**
 * StaffShift — one staff scheduling/assignment record.
 * Source: staff_shifts.csv (600 rows)
 *
 * staffId (col0) follows department-coded prefixes (OPS-/MTC-/GH-/CC-/RET-/
 * SEC-) but is NOT referenced as a foreign key anywhere else in this
 * dataset — gate_events.handledByRef, security_screening.handledByRef,
 * retail_transactions.staffRef, and maintenance_logs.technicianRef all use
 * similarly-shaped codes but 0% of them match an actual StaffShift.staffId.
 * Each table generates its own independent "handled by" code. Do not build
 * a "staff workload" view that claims to link shifts to specific logged
 * events — the data doesn't support that join. staff_shifts stands alone
 * as a roster/scheduling table.
 */
export interface StaffShift {
  staffId: string; // col0 — "SEC-UGHFA"
  staffName: string;
  department: 'Ops'; // col2 — constant across all 600 rows
  role: 'Agent'; // col3 — constant
  shiftDate: string; // col4 — "YYYY-MM-DD"
  shiftStartTimestamp: string; // col5
  shiftEndTimestamp: string; // col6 — NOT reliably after shiftStartTimestamp; treat both as independently generated, not a strict start<end pair
  terminal: 'T3'; // col7 — constant
  assignedGate: 'B12'; // col8 — constant
  supervisorRef: string; // col9 — reference code, not a working join to another StaffShift.staffId
  shiftHours: number; // col10 — constant 8 across all rows
  isOnLeave: boolean; // col11 — constant False
  leaveNote: string; // col12 — always empty
  certificationExpiry: string; // col13 — "YYYY-MM-DD"
  primaryLanguage: 'English'; // col14 — constant
}
