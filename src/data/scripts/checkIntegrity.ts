/**
 * Data-integrity check: verifies which foreign keys actually resolve across
 * the parsed JSON, and reports orphans / non-joins honestly rather than
 * assuming the data_dictionary.md relationship claims hold.
 *
 * Run with: npm run check-integrity
 *
 * Findings baked into this script (see /src/data/types/*.ts for the
 * per-field version of the same notes):
 *  - flight_id is the only key that reliably joins across tables.
 *  - passenger/passport-shaped codes (PP-****xxxx, 6-char PNR codes) are
 *    independently generated per table and do NOT join reliably.
 *  - staff_id-shaped "handled by" reference codes never join back to an
 *    actual staff_shifts.staffId.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Flight } from '../types/flight';
import type { Passenger } from '../types/passenger';
import type { Bag } from '../types/bag';
import type { GateEvent } from '../types/gateEvent';
import type { StaffShift } from '../types/staffShift';
import type { RetailTransaction } from '../types/retailTransaction';
import type { MaintenanceLog } from '../types/maintenanceLog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PARSED_DIR = path.resolve(__dirname, '../parsed');

function load<T>(filename: string): T[] {
  return JSON.parse(fs.readFileSync(path.join(PARSED_DIR, filename), 'utf-8'));
}

function reportKeyOverlap(
  label: string,
  childValues: string[],
  parentValues: Set<string>,
) {
  const childSet = new Set(childValues);
  const resolved = [...childSet].filter((v) => parentValues.has(v));
  const orphanCount = childSet.size - resolved.length;
  const pct = ((resolved.length / childSet.size) * 100).toFixed(1);
  const flag = orphanCount === 0 ? 'OK' : orphanCount === childSet.size ? 'NO JOIN' : 'PARTIAL';
  console.log(
    `  [${flag}] ${label}: ${resolved.length}/${childSet.size} distinct values resolve (${pct}%)`,
  );
  return { label, resolved: resolved.length, total: childSet.size, flag };
}

function main() {
  const flights = load<Flight>('flights.json');
  const passengers = load<Passenger>('passengers.json');
  const baggage = load<Bag>('baggage.json');
  const gateEvents = load<GateEvent>('gate_events.json');
  const staffShifts = load<StaffShift>('staff_shifts.json');
  const retail = load<RetailTransaction>('retail_transactions.json');
  const maintenance = load<MaintenanceLog>('maintenance_logs.json');

  const flightIds = new Set(flights.map((f) => f.flightId));
  const staffIds = new Set(staffShifts.map((s) => s.staffId));
  const passportCodes = new Set(passengers.map((p) => p.passportMasked));
  const passengerPnrs = new Set(passengers.map((p) => p.pnrCode));

  console.log('=== flight_id joins (expected: reliable) ===');
  reportKeyOverlap('passengers.flightId -> flights', passengers.map((p) => p.flightId), flightIds);
  reportKeyOverlap('baggage.flightId -> flights', baggage.map((b) => b.flightId), flightIds);
  reportKeyOverlap('gateEvents.flightId -> flights', gateEvents.map((g) => g.flightId), flightIds);
  reportKeyOverlap('retail.flightId -> flights', retail.map((r) => r.flightId), flightIds);
  reportKeyOverlap('maintenance.flightId -> flights', maintenance.map((m) => m.flightId), flightIds);

  console.log('\n=== passenger identity joins (expected: unreliable — masked/independent codes) ===');
  reportKeyOverlap('baggage.passengerRef -> passengers.passportMasked', baggage.map((b) => b.passengerRef), passportCodes);
  reportKeyOverlap('retail.passengerRef -> passengers.passportMasked', retail.map((r) => r.passengerRef), passportCodes);
  reportKeyOverlap('baggage.tagPnr -> passengers.pnrCode', baggage.map((b) => b.tagPnr), passengerPnrs);

  console.log('\n=== staff_id joins (expected: NO JOIN — independent reference codes) ===');
  reportKeyOverlap('gateEvents.handledByRef -> staffShifts.staffId', gateEvents.map((g) => g.handledByRef), staffIds);
  reportKeyOverlap('retail.staffRef -> staffShifts.staffId', retail.map((r) => r.staffRef), staffIds);
  reportKeyOverlap('maintenance.technicianRef -> staffShifts.staffId', maintenance.map((m) => m.technicianRef), staffIds);

  console.log('\nSummary: build joins/aggregations around flight_id only.');
  console.log('Do not build features that assume passenger- or staff-level');
  console.log('cross-table linkage — the data does not support it.');
}

main();
