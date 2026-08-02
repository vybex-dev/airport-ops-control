/**
 * MaintenanceLog — one aircraft maintenance/work-order record.
 * Source: maintenance_logs.csv (400 rows)
 *
 * flightId (col2) resolves 100% against Flight.flightId (330/330 distinct)
 * — note this links a work order to a specific flight OPERATION, while
 * aircraftReg (col1) is the physical airframe, constant "VT-ABC" across
 * ALL 400 rows in this dataset (i.e. every maintenance log in the sample
 * happens to reference the same tail number). Don't build a "fleet health"
 * view that implies multiple aircraft are represented here — there's only one.
 */
export interface MaintenanceLog {
  workOrderId: string; // col0 — "VT-ABC-WO-9571"
  aircraftReg: string; // col1 — constant "VT-ABC" across all 400 rows in this dataset
  flightId: string; // col2 — join key to Flight.flightId (100% resolve)
  workOrderType: 'Inspection'; // col3 — constant; dataset has no other work-order types
  reportedByRef: string; // col4 — reference code, not a working join to StaffShift.staffId
  openedTimestamp: string; // col5
  closedTimestamp: string; // col6 — NOT reliably after openedTimestamp; treat as independent, not a strict open<close pair
  priorityCode: number; // col7 — constant 5 across all rows
  systemCode: number; // col8 — constant 32 across all rows
  defectDescription: 'Hydraulic leak'; // col9 — constant; dataset has no defect-type variety
  partAffected: 'Seal'; // col10 — constant
  severity: number; // col11 — constant 3 across all rows
  technicianRef: string; // col12 — reference code, not a working join to StaffShift.staffId
  aircraftGrounded: boolean; // col13 — constant False across all rows
  isResolved: boolean; // col14 — constant False across all rows
  resolutionNote: string; // col15 — always empty
}
