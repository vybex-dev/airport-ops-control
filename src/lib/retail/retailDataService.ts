import retailData from '@/data/parsed/retail_transactions.json';
import type { RetailTransaction } from '@/data/types';

export interface RetailFilterOptions {
  search: string;
  flightIdFilter?: string;
  storeLocationFilter?: string;
}

export interface HourlyRevenueTrend {
  hour: string;
  revenueInr: number;
  transactionCount: number;
}

const allTransactions: RetailTransaction[] = retailData as RetailTransaction[];

export function getAllRetailTransactions(): RetailTransaction[] {
  return allTransactions;
}

/**
 * Filter retail transactions
 */
export function filterRetailTransactions(
  transactions: RetailTransaction[],
  options: RetailFilterOptions
): RetailTransaction[] {
  const searchLower = options.search.trim().toLowerCase();

  return transactions.filter((t) => {
    if (searchLower) {
      const matchTx = t.transactionId.toLowerCase().includes(searchLower);
      const matchFlight = t.flightId.toLowerCase().includes(searchLower);
      const matchPax = t.passengerRef.toLowerCase().includes(searchLower);
      const matchStaff = t.staffRef.toLowerCase().includes(searchLower);
      if (!matchTx && !matchFlight && !matchPax && !matchStaff) {
        return false;
      }
    }

    if (options.flightIdFilter && options.flightIdFilter !== 'ALL') {
      if (t.flightId !== options.flightIdFilter) return false;
    }

    if (options.storeLocationFilter && options.storeLocationFilter !== 'ALL') {
      if (t.storeLocation !== options.storeLocationFilter) return false;
    }

    return true;
  });
}

/**
 * Aggregate summary KPIs
 */
export function getRetailKPIs() {
  const totalCount = allTransactions.length;
  let totalRevenueInr = 0;
  const uniqueFlightsSet = new Set<string>();

  for (const t of allTransactions) {
    totalRevenueInr += t.unitPriceInr || 0;
    if (t.flightId) uniqueFlightsSet.add(t.flightId);
  }

  const avgSpendInr = totalCount > 0 ? Math.round(totalRevenueInr / totalCount) : 0;

  return {
    totalCount,
    totalRevenueInr,
    avgSpendInr,
    linkedFlightsCount: uniqueFlightsSet.size,
    dutyFreeStoresCount: 1, // Terminal 3 Main Duty Free Concourse
  };
}

/**
 * Aggregates transactions into hourly buckets (00:00 to 23:00) for Recharts visual graphs
 */
export function getHourlyRetailTrend(): HourlyRevenueTrend[] {
  const hourMap = new Map<number, { revenue: number; count: number }>();

  for (let i = 0; i < 24; i++) {
    hourMap.set(i, { revenue: 0, count: 0 });
  }

  for (const t of allTransactions) {
    if (!t.transactionTimestamp) continue;
    const date = new Date(t.transactionTimestamp.replace(' ', 'T'));
    const hour = date.getHours();
    if (!isNaN(hour) && hourMap.has(hour)) {
      const current = hourMap.get(hour)!;
      current.revenue += t.unitPriceInr || 0;
      current.count += 1;
    }
  }

  return Array.from(hourMap.entries()).map(([hourNum, data]) => ({
    hour: `${hourNum.toString().padStart(2, '0')}:00`,
    revenueInr: Math.round(data.revenue),
    transactionCount: data.count,
  }));
}
