/**
 * One-time build step: reads the 8 raw CSVs (numeric-header, positional
 * columns) and writes clean, typed JSON to /src/data/parsed/*.json using
 * the exact field mapping documented in /src/data/types/*.ts.
 *
 * Run with: npm run parse-data
 *
 * This is NOT part of the app's runtime bundle — it runs once in Node via
 * tsx, output JSON is committed/generated ahead of time and imported
 * directly by the app (so the browser never parses CSV).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { toBool, toNum } from './parseHelpers';
import type { Flight } from '../types/flight';
import type { Passenger } from '../types/passenger';
import type { Bag } from '../types/bag';
import type { GateEvent } from '../types/gateEvent';
import type { SecurityScreening } from '../types/securityScreening';
import type { StaffShift } from '../types/staffShift';
import type { RetailTransaction } from '../types/retailTransaction';
import type { MaintenanceLog } from '../types/maintenanceLog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.resolve(__dirname, '../raw');
const OUT_DIR = path.resolve(__dirname, '../parsed');

function readRows(filename: string): string[][] {
  const raw = fs.readFileSync(path.join(RAW_DIR, filename), 'utf-8');
  const result = Papa.parse<string[]>(raw.trim(), { skipEmptyLines: true });
  // First row is the numeric header (0,1,2,...) — drop it, we map by position.
  return (result.data as string[][]).slice(1);
}

function writeJson(filename: string, data: unknown[]) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, filename),
    JSON.stringify(data),
    'utf-8',
  );
  console.log(`  wrote ${filename} (${data.length} records)`);
}

function parseFlights(): Flight[] {
  return readRows('flights.csv').map((r): Flight => ({
    flightId: r[0],
    airlineName: r[1],
    airlineCode: r[2],
    origin: r[3],
    destination: r[4],
    scheduledDeparture: r[5],
    actualDeparture: r[6],
    scheduledArrival: r[7],
    actualArrival: r[8],
    aircraftType: r[9] as Flight['aircraftType'],
    aircraftReg: r[10],
    capacity: toNum(r[11]),
    passengerCount: toNum(r[12]),
    status: r[13] as Flight['status'],
    delayMinutes: toNum(r[14]),
    delayReason: r[15] as Flight['delayReason'],
    terminal: r[16] as Flight['terminal'],
    gate: r[17],
    gateAssigned: toBool(r[18]),
    distanceKm: toNum(r[19]),
    fuelUsedKg: toNum(r[20]),
    boardingTime: r[21],
    isInternational: toBool(r[22]),
    delayCategory: r[23] as Flight['delayCategory'],
    onTimePerformanceScore: toNum(r[24]),
    turnaroundMinutes: toNum(r[25]),
    loadFactor: toNum(r[26]),
    timeOfDayBand: r[27] as Flight['timeOfDayBand'],
    dayOfWeek: r[28],
    isWeekend: toBool(r[29]),
    season: r[30] as Flight['season'],
    routeType: r[31] as Flight['routeType'],
  }));
}

function parsePassengers(): Passenger[] {
  return readRows('passengers.csv').map((r): Passenger => ({
    pnrCode: r[0],
    passengerNumericId: r[1],
    passportMasked: r[2],
    firstName: r[3],
    lastName: r[4],
    nationality: r[5] as Passenger['nationality'],
    dateOfBirth: r[6],
    gender: r[7] as Passenger['gender'],
    seatNumber: r[8],
    bookingClass: r[9] as Passenger['bookingClass'],
    flightId: r[10],
    checkInTime: r[11],
    bagDropTime: r[12],
    seatZone: r[13],
    boardingGroup: toNum(r[14]),
    email: r[18],
    phone: r[19],
    isFrequentFlyer: toBool(r[22]),
    checkInDurationMinutes: toNum(r[23]),
    hasSpecialAssistance: toBool(r[24]),
    loyaltyTier: r[25] as Passenger['loyaltyTier'],
    loyaltyPoints: toNum(r[26]),
    ageGroup: r[27] as Passenger['ageGroup'],
  }));
}

function parseBaggage(): Bag[] {
  return readRows('baggage.csv').map((r): Bag => ({
    bagTagId: r[0],
    tagPnr: r[1],
    flightId: r[2],
    passengerRef: r[3],
    weightKg: toNum(r[4]),
    dimensions: r[5],
    stage: r[6] as Bag['stage'],
    checkpointCode: r[7],
    checkInTimestamp: r[8],
    loadTimestamp: r[9],
    scanCount: toNum(r[10]),
    handlingStatus: r[11] as Bag['handlingStatus'],
    isFlagged: toBool(r[12]),
    mishandlingCode: toNum(r[13]),
    currentLocation: r[14] as Bag['currentLocation'],
    lastScanTimestamp: r[15],
    isDamaged: toBool(r[16]),
  }));
}

function parseGateEvents(): GateEvent[] {
  return readRows('gate_events.csv').map((r): GateEvent => ({
    eventId: r[0],
    flightId: r[1],
    gate: r[2] as GateEvent['gate'],
    terminal: r[3] as GateEvent['terminal'],
    eventType: r[4] as GateEvent['eventType'],
    eventTimestamp: r[5],
    handledByRef: r[6],
    durationSeconds: toNum(r[7]),
    eventCategory: r[8] as GateEvent['eventCategory'],
    isDelayed: toBool(r[9]),
    delayReasonNote: r[10],
    loggedAt1: r[11],
    loggedAt2: r[12],
    loggedAt3: r[13],
  }));
}

function parseSecurity(): SecurityScreening[] {
  return readRows('security_screening.csv').map((r): SecurityScreening => ({
    screeningId: r[0],
    passengerRef: r[1],
    pnrCode: r[2],
    laneNumber: toNum(r[3]),
    queueEnterTimestamp: r[4],
    screeningStartTimestamp: r[5],
    clearedTimestamp: r[6],
    result: r[7] as SecurityScreening['result'],
    flagNote: r[8],
    requiresSecondaryScreening: toBool(r[9]),
    handledByRef: r[10],
    laneType: r[11] as SecurityScreening['laneType'],
    processingTimeSeconds: toNum(r[12]),
    isVip: toBool(r[13]),
    hasAlarm: toBool(r[14]),
    shiftCode: r[15] as SecurityScreening['shiftCode'],
    throughputCapacity: toNum(r[16]),
    staffedLanes: toNum(r[17]),
    activeLanes: toNum(r[18]),
    isOverCapacity: toBool(r[19]),
  }));
}

function parseStaffShifts(): StaffShift[] {
  return readRows('staff_shifts.csv').map((r): StaffShift => ({
    staffId: r[0],
    staffName: r[1],
    department: r[2] as StaffShift['department'],
    role: r[3] as StaffShift['role'],
    shiftDate: r[4],
    shiftStartTimestamp: r[5],
    shiftEndTimestamp: r[6],
    terminal: r[7] as StaffShift['terminal'],
    assignedGate: r[8] as StaffShift['assignedGate'],
    supervisorRef: r[9],
    shiftHours: toNum(r[10]),
    isOnLeave: toBool(r[11]),
    leaveNote: r[12],
    certificationExpiry: r[13],
    primaryLanguage: r[14] as StaffShift['primaryLanguage'],
  }));
}

function parseRetail(): RetailTransaction[] {
  return readRows('retail_transactions.csv').map((r): RetailTransaction => ({
    transactionId: r[0],
    staffRef: r[1],
    storeCategory: r[2] as RetailTransaction['storeCategory'],
    storeType: r[3] as RetailTransaction['storeType'],
    passengerRef: r[4],
    flightId: r[5],
    transactionTimestamp: r[6],
    productCategory: r[7] as RetailTransaction['productCategory'],
    quantity: toNum(r[8]),
    unitPriceInr: toNum(r[9]),
    secondaryAmountInr: toNum(r[10]),
    paymentMethod: r[11] as RetailTransaction['paymentMethod'],
    currency: r[12] as RetailTransaction['currency'],
    discountCode: r[13],
    terminal: r[14] as RetailTransaction['terminal'],
    storeLocation: r[15] as RetailTransaction['storeLocation'],
    isCompleted: toBool(r[16]),
  }));
}

function parseMaintenance(): MaintenanceLog[] {
  return readRows('maintenance_logs.csv').map((r): MaintenanceLog => ({
    workOrderId: r[0],
    aircraftReg: r[1],
    flightId: r[2],
    workOrderType: r[3] as MaintenanceLog['workOrderType'],
    reportedByRef: r[4],
    openedTimestamp: r[5],
    closedTimestamp: r[6],
    priorityCode: toNum(r[7]),
    systemCode: toNum(r[8]),
    defectDescription: r[9] as MaintenanceLog['defectDescription'],
    partAffected: r[10] as MaintenanceLog['partAffected'],
    severity: toNum(r[11]),
    technicianRef: r[12],
    aircraftGrounded: toBool(r[13]),
    isResolved: toBool(r[14]),
    resolutionNote: r[15],
  }));
}

function main() {
  console.log('Parsing raw CSVs -> typed JSON...');
  writeJson('flights.json', parseFlights());
  writeJson('passengers.json', parsePassengers());
  writeJson('baggage.json', parseBaggage());
  writeJson('gate_events.json', parseGateEvents());
  writeJson('security_screening.json', parseSecurity());
  writeJson('staff_shifts.json', parseStaffShifts());
  writeJson('retail_transactions.json', parseRetail());
  writeJson('maintenance_logs.json', parseMaintenance());
  console.log('Done.');
}

main();
