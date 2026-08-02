/**
 * RetailTransaction — one airport retail purchase.
 * Source: retail_transactions.csv (3000 rows)
 *
 * flightId (col5) resolves 100% against Flight.flightId (942/942 distinct).
 * passengerRef (col4) does NOT reliably join to Passenger (same masked-value
 * caveat as elsewhere). staffRef (col1) does NOT join to StaffShift.staffId.
 */
export interface RetailTransaction {
  transactionId: string; // col0 — "KSK4-1774440315797"
  staffRef: string; // col1 — reference code, not a working join to StaffShift.staffId
  storeCategory: 'Duty Free'; // col2 — constant in this dataset
  storeType: 'Retail'; // col3 — constant
  passengerRef: string; // col4 — "PP-****8382" style, not a reliable join key
  flightId: string; // col5 — join key to Flight.flightId (100% resolve)
  transactionTimestamp: string; // col6
  productCategory: 'Perfume'; // col7 — constant; dataset has no product-category variety
  quantity: number; // col8 — constant 1 across all rows
  unitPriceInr: number; // col9 — int, no fixed relationship to col10 (not simply cost vs. sale price — col10 is sometimes higher, sometimes lower)
  secondaryAmountInr: number; // col10 — int, see note above; treat as a second recorded amount, not derivable from unitPriceInr
  paymentMethod: 'Card'; // col11 — constant
  currency: 'INR'; // col12 — constant
  discountCode: string; // col13 — always empty
  terminal: 'T3'; // col14 — constant
  storeLocation: 'Near Gate'; // col15 — constant
  isCompleted: boolean; // col16 — constant True across all rows
}
