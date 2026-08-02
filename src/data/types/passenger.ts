/**
 * Passenger — one passenger journey record.
 * Source: passengers.csv (2500 rows)
 *
 * IMPORTANT JOIN CAVEAT:
 *  passportMasked (col2, "PP-****1234") is NOT a reliable cross-table key.
 *  Cross-checking passengers.passportMasked against baggage/security/retail's
 *  passport-shaped columns resolves only ~25% of the time, and the values
 *  repeat within passengers.csv itself (2500 rows, only 2204 distinct) —
 *  it's a masked/truncated display value, not a stable identifier. Treat it
 *  as display-only. The only fully-resolving join in this dataset is
 *  Flight.flightId <-> Passenger.flightId (908/908 resolve to a real flight).
 *  pnrCode (col0) is also NOT shared with baggage/security's own "PNR-like"
 *  columns — each table generates its own independent random code.
 */
export interface Passenger {
  pnrCode: string; // col0 — 6-char code, unique to this passengers table only
  passengerNumericId: string; // col1 — long numeric string, effectively a synthetic ID
  passportMasked: string; // col2 — "PP-****1234", DISPLAY ONLY, not a working join key (see caveat above)
  firstName: string;
  lastName: string;
  nationality: 'British' | 'French' | 'German' | 'Indian' | 'UAE';
  dateOfBirth: string; // "YYYY-MM-DD"
  gender: 'F' | 'M';
  seatNumber: string; // "2E"
  bookingClass: 'Business' | 'Economy'; // col9
  flightId: string; // col10 — join key to Flight.flightId (908/908 resolve)
  checkInTime: string; // col11 — timestamp with microseconds
  bagDropTime: string; // col12 — always exactly 1 hour after checkInTime in sampled rows
  seatZone: string; // col13 — "B4".."B36" (looks like a boarding-zone/row label, not a real gate)
  boardingGroup: number; // col14 — one of {15,20,25,30}
  email: string;
  phone: string; // "+91-xxxxxxxxxx"
  isFrequentFlyer: boolean; // col22
  checkInDurationMinutes: number; // col23 — float, occasionally negative in source data (kept as-is, flag in integrity report)
  hasSpecialAssistance: boolean; // col24
  loyaltyTier: 'Business' | 'Economy'; // col25 — duplicates bookingClass's value set but is a separate source column; do not assume it always equals bookingClass without checking
  loyaltyPoints: number; // col26
  ageGroup: 'Adult' | 'Child' | 'Senior' | 'Youth'; // col27
}
