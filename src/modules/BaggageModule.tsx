import React, { useState, useMemo, useRef } from 'react';
import { useSimClock, useAlerts } from '@/store/useSimEngineHooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTableShell } from '@/components/ui/DataTableShell';
import { Luggage, Layers, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  getAllBaggage,
  filterBaggage,
  calculateDynamicBagState,
  type DynamicBagState,
  type BaggageFilterOptions,
} from '@/lib/baggage/baggageDataService';
import { BaggageFilters } from './baggage/BaggageFilters';
import { BagDetailDrawer } from './baggage/BagDetailDrawer';
import { useFlightModalStore } from '@/store/useFlightModalStore';

const initialFilters: BaggageFilterOptions = {
  search: '',
  stageFilter: 'ALL',
  flightFilter: 'ALL',
  hasAlertOnly: false,
};

export const BaggageModule: React.FC = () => {
  const { currentTimeMs, formattedTime } = useSimClock();
  const { alerts } = useAlerts();
  const { openFlightModal } = useFlightModalStore();

  const [filters, setFilters] = useState<BaggageFilterOptions>(initialFilters);
  const [selectedBagState, setSelectedBagState] = useState<DynamicBagState | null>(null);

  const allBags = useMemo(() => getAllBaggage(), []);

  // Filter bags dynamically relative to currentTimeMs
  const filteredBags = useMemo(() => {
    return filterBaggage(allBags, filters, currentTimeMs, alerts);
  }, [allBags, filters, currentTimeMs, alerts]);

  // Live Breakdown Counters across full dataset
  const breakdown = useMemo(() => {
    let checkin = 0;
    let loaded = 0;
    let delivered = 0;
    let alertsCount = 0;

    for (const bag of allBags) {
      const state = calculateDynamicBagState(bag, currentTimeMs, alerts);
      if (state.status === 'CHECKIN') checkin++;
      else if (state.status === 'LOADED') loaded++;
      else if (state.status === 'DELIVERED') delivered++;

      if (state.hasAlert) alertsCount++;
    }

    return { checkin, loaded, delivered, alertsCount };
  }, [allBags, currentTimeMs, alerts]);

  // Virtualizer for 2,800 baggage rows
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredBags.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 15,
  });

  const handleFilterChange = (updates: Partial<BaggageFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleOpenFlightDrawer = (flightId: string) => {
    openFlightModal(flightId);
  };

  return (
    <div className="space-y-md">
      {/* 1. Header & Live Breakdown Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md rounded-md bg-surface-1 border border-line">
        <div className="flex items-center gap-sm">
          <div className="p-xs rounded bg-status-ontime/10 text-status-ontime border border-status-ontime/30">
            <Luggage className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-xs">
              <h2 className="font-display text-lg font-bold text-ink-primary">
                Baggage Handling System (BHS)
              </h2>
              <StatusBadge variant="ontime" size="sm">
                2,800 BAGS
              </StatusBadge>
            </div>
            <p className="font-display text-xs text-ink-muted mt-4xs">
              Real-time checked luggage lifecycle, ramp transport status & claim telemetry
            </p>
          </div>
        </div>

        {/* Live Status Breakdown Cards */}
        <div className="grid grid-cols-3 gap-xs font-data text-xs select-none">
          <div className="px-sm py-xs rounded bg-surface-2 border border-line text-center">
            <span className="text-ink-muted block text-[10px] uppercase font-bold">Check-in Stage</span>
            <span className="text-ink-primary font-bold text-sm">{breakdown.checkin}</span>
          </div>

          <div className="px-sm py-xs rounded bg-status-boarding/10 border border-status-boarding/30 text-center">
            <span className="text-status-boarding block text-[10px] uppercase font-bold">Loaded / Transit</span>
            <span className="text-status-boarding font-bold text-sm">{breakdown.loaded}</span>
          </div>

          <div className="px-sm py-xs rounded bg-status-ontime/10 border border-status-ontime/30 text-center">
            <span className="text-status-ontime block text-[10px] uppercase font-bold">Delivered / Claim</span>
            <span className="text-status-ontime font-bold text-sm">{breakdown.delivered}</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <BaggageFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters(initialFilters)}
        totalResults={filteredBags.length}
      />

      {/* 3. Virtualized Baggage Table */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <Layers className="h-4 w-4 text-accent-signal" />
            BHS Baggage Lifecycle Manifest ({filteredBags.length.toLocaleString()} Bags)
          </span>
        }
        headerActions={
          <div className="flex items-center gap-xs font-data text-xs text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-status-ontime animate-ping" />
            <span>CLOCK SYNC: {formattedTime}</span>
          </div>
        }
        isEmpty={filteredBags.length === 0}
        emptyMessage="No checked luggage records match your filter criteria."
      >
        <div className="w-full flex flex-col min-w-[900px]" role="table" aria-label="BHS Baggage Lifecycle Manifest">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 font-data text-[11px] font-bold text-ink-muted uppercase tracking-wider px-md py-xs bg-surface-2/80 border-b border-line select-none" role="row">
            <div className="col-span-3 sm:col-span-3" role="columnheader">Bag Tag & PNR</div>
            <div className="col-span-2 sm:col-span-2" role="columnheader">Flight Manifest</div>
            <div className="col-span-2 sm:col-span-2" role="columnheader">Passenger Ref</div>
            <div className="hidden sm:block sm:col-span-2" role="columnheader">Weight / Specs</div>
            <div className="hidden lg:block lg:col-span-1" role="columnheader">Checkpoint</div>
            <div className="col-span-5 sm:col-span-2 text-right" role="columnheader">Lifecycle Status</div>
          </div>

          {/* Virtualized Rows Container */}
          <div
            ref={parentRef}
            role="rowgroup"
            className="overflow-y-auto max-h-[600px] w-full min-h-[400px] bg-surface-0/40 relative"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const bagState = filteredBags[virtualRow.index];
                const { bag, flight, statusLabel, badgeVariant, hasAlert } = bagState;
                const isSelected = selectedBagState?.bag.bagTagId === bag.bagTagId;

                return (
                  <div
                    key={bag.bagTagId}
                    role="row"
                    tabIndex={0}
                    aria-label={`Bag tag ${bag.bagTagId} for PNR ${bag.tagPnr}`}
                    onClick={() => setSelectedBagState(bagState)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedBagState(bagState);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`grid grid-cols-12 gap-2 items-center px-md py-2xs border-b border-line/60 cursor-pointer transition-colors select-none font-data text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal ${
                      isSelected
                        ? 'bg-accent-signal/10 border-l-4 border-l-accent-signal'
                        : hasAlert
                        ? 'bg-status-alert/10 border-l-4 border-l-status-alert'
                        : 'hover:bg-surface-2/60'
                    }`}
                  >

                    {/* Tag & PNR */}
                    <div className="col-span-3 sm:col-span-3 flex items-center gap-xs truncate">
                      <Luggage className="h-3.5 w-3.5 text-accent-signal shrink-0" />
                      <div>
                        <span className="font-bold text-ink-primary block truncate">{bag.bagTagId}</span>
                        <span className="text-[10px] text-ink-muted">PNR: {bag.tagPnr}</span>
                      </div>
                    </div>

                    {/* Flight — clickable FK link to global flight drawer */}
                    <div className="col-span-2 sm:col-span-2 flex items-center gap-xs">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openFlightModal(bag.flightId); }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent-signal/10 text-accent-signal font-bold border border-accent-signal/30 text-xs hover:bg-accent-signal/20 transition-colors"
                      >
                        {bag.flightId}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                      {flight && (
                        <span className="text-[10px] text-ink-muted hidden sm:inline">&rarr; {flight.destination}</span>
                      )}
                    </div>

                    {/* Pax Ref */}
                    <div className="col-span-2 sm:col-span-2 text-ink-muted truncate">
                      {bag.passengerRef}
                    </div>

                    {/* Weight & Specs */}
                    <div className="hidden sm:block sm:col-span-2 text-ink-primary font-medium">
                      {bag.weightKg.toFixed(1)} kg ({bag.dimensions})
                    </div>

                    {/* Checkpoint */}
                    <div className="hidden lg:block lg:col-span-1 text-ink-muted">
                      {bag.checkpointCode}
                    </div>

                    {/* Status */}
                    <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-xs">
                      {hasAlert && (
                        <AlertTriangle className="h-3.5 w-3.5 text-status-alert animate-bounce" />
                      )}
                      <StatusBadge variant={badgeVariant} size="sm">
                        {statusLabel}
                      </StatusBadge>
                      <ChevronRight className="h-4 w-4 text-ink-muted" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DataTableShell>

      {/* 4. Bag Detail Drawer */}
      <BagDetailDrawer
        bagState={selectedBagState}
        onClose={() => setSelectedBagState(null)}
        onOpenFlightDrawer={handleOpenFlightDrawer}
      />
    </div>
  );
};
