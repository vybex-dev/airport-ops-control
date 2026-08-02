import React, { useState, useMemo } from 'react';
import { useFlightModalStore } from '@/store/useFlightModalStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTableShell } from '@/components/ui/DataTableShell';
import { SearchInput } from '@/components/ui/SearchInput';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  ShoppingBag,
  IndianRupee,
  Plane,
  CreditCard,
  Store,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  getAllRetailTransactions,
  filterRetailTransactions,
  getRetailKPIs,
  getHourlyRetailTrend,
} from '@/lib/retail/retailDataService';

export const RetailModule: React.FC = () => {
  const { openFlightModal } = useFlightModalStore();
  const [search, setSearch] = useState('');

  const allTx = useMemo(() => getAllRetailTransactions(), []);
  const kpis = useMemo(() => getRetailKPIs(), []);
  const hourlyData = useMemo(() => getHourlyRetailTrend(), []);

  const filteredTx = useMemo(() => {
    return filterRetailTransactions(allTx, { search });
  }, [allTx, search]);

  return (
    <div className="space-y-md">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-sm">
          <div className="p-xs rounded bg-status-delayed/10 text-status-delayed border border-status-delayed/30">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-xs">
              <h2 className="font-display text-lg font-bold text-ink-primary">
                Terminal Concessions & Retail Telemetry
              </h2>
              <StatusBadge variant="neutral" size="sm">
                3,000 TRANSACTIONS
              </StatusBadge>
              <StatusBadge variant="ontime" size="sm">
                T3 DUTY FREE
              </StatusBadge>
            </div>
            <p className="font-display text-xs text-ink-muted mt-4xs">
              Duty-Free Concourse Sales Density, Passenger Spend Trends & Flight Spend Correlations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-xs text-xs font-data text-ink-muted bg-surface-2 px-sm py-xs rounded border border-line">
          <Store className="h-3.5 w-3.5 text-status-delayed" />
          CONCOURSE: <span className="text-ink-primary font-bold">DEL T3 Main Retail Concourse</span>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm">
        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>TOTAL REVENUE (INR)</span>
            <IndianRupee className="h-3.5 w-3.5 text-status-ontime" />
          </div>
          <div className="font-data text-xl font-bold text-status-ontime">
            ₹<AnimatedNumber value={kpis.totalRevenueInr} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Gross Duty Free Sales</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>TOTAL TRANSACTIONS</span>
            <CreditCard className="h-3.5 w-3.5 text-accent-signal" />
          </div>
          <div className="font-data text-xl font-bold text-accent-signal">
            <AnimatedNumber value={kpis.totalCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Completed Purchase Logs</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>AVG TRANSACTION SPEND</span>
            <TrendingUp className="h-3.5 w-3.5 text-status-delayed" />
          </div>
          <div className="font-data text-xl font-bold text-status-delayed">
            ₹<AnimatedNumber value={kpis.avgSpendInr} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Average Ticket Basket Size</div>
        </div>

        <div className="p-sm rounded-md bg-surface-1 border border-line">
          <div className="flex items-center justify-between font-display text-xs text-ink-muted mb-1">
            <span>LINKED FLIGHTS</span>
            <Plane className="h-3.5 w-3.5 text-ink-primary" />
          </div>
          <div className="font-data text-xl font-bold text-ink-primary">
            <AnimatedNumber value={kpis.linkedFlightsCount} />
          </div>
          <div className="text-[10px] font-data text-ink-muted mt-1">Flight Operations Correlated</div>
        </div>
      </div>

      {/* 3. Hourly Sales Density Recharts Chart */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <TrendingUp className="h-4 w-4 text-status-delayed" />
            24-Hour Concourse Sales & Revenue Density (INR)
          </span>
        }
      >
        <div className="p-md h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="hour" stroke="#8b96a8" fontSize={11} tickLine={false} />
              <YAxis stroke="#8b96a8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenueInr" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataTableShell>

      {/* 4. Toolbar & Transaction Activity Stream */}
      <div className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-md bg-surface-1 border border-line">
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search Flight ID, Passenger Ref, Staff Ref..."
          />
        </div>

        <div className="text-xs font-data text-ink-muted">
          Showing <strong className="text-ink-primary">{filteredTx.length}</strong> of 3,000 transactions
        </div>
      </div>

      {/* 5. Transaction Log Table with 100% Resolvable Flight FK Click-Through */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <CreditCard className="h-4 w-4 text-accent-signal" />
            Concourse Duty Free Transaction Activity Stream
          </span>
        }
      >
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full min-w-[850px] text-left border-collapse font-data text-xs">
            <thead className="bg-surface-2 border-b border-line sticky top-0 z-10 text-ink-muted font-display uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-sm">Transaction ID</th>
                <th className="p-sm">Associated Flight (FK)</th>
                <th className="p-sm">Passenger Ref</th>
                <th className="p-sm">Category & Location</th>
                <th className="p-sm">Amount (INR)</th>
                <th className="p-sm">Payment</th>
                <th className="p-sm">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {filteredTx.slice(0, 150).map((tx) => (
                <tr key={tx.transactionId} className="hover:bg-surface-2/60 transition-colors">
                  <td className="p-sm font-bold text-ink-primary">{tx.transactionId}</td>
                  <td className="p-sm">
                    <button
                      type="button"
                      onClick={() => openFlightModal(tx.flightId)}
                      className="inline-flex items-center gap-1 font-bold text-accent-signal hover:underline bg-accent-signal/10 px-2 py-0.5 rounded border border-accent-signal/30"
                    >
                      <Plane className="h-3 w-3" />
                      {tx.flightId}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </td>
                  <td className="p-sm text-ink-muted font-mono">{tx.passengerRef}</td>
                  <td className="p-sm text-ink-muted">
                    {tx.storeCategory} ({tx.storeLocation})
                  </td>
                  <td className="p-sm font-bold text-status-ontime">
                    ₹{tx.unitPriceInr.toLocaleString()}
                  </td>
                  <td className="p-sm text-ink-muted">{tx.paymentMethod}</td>
                  <td className="p-sm text-ink-muted">{tx.transactionTimestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>
    </div>
  );
};
