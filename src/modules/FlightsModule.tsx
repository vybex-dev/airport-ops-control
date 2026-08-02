import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSimClock, useAlerts } from "@/store/useSimEngineHooks";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTableShell } from "@/components/ui/DataTableShell";
import { Plane, AlertTriangle, ChevronRight } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  getAllFlights,
  getUniqueAirlines,
  getUniqueDestinations,
  filterFlights,
  calculateLiveFlightState,
  type FlightFilterOptions,
} from "@/lib/flights/flightDataService";
import type { SimAlert } from "@/lib/sim/simTypes";

import { FlightFidsHeader } from "./flights/FlightFidsHeader";
import { FlightFilters } from "./flights/FlightFilters";
import { useFlightModalStore } from "@/store/useFlightModalStore";

const initialFilters: FlightFilterOptions = {
  search: "",
  airline: "ALL",
  destination: "ALL",
  statusFilter: "ALL",
  gateFilter: "ALL",
  timeWindow: "ALL",
  preset: "ALL",
};

export const FlightsModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentTimeMs, formattedTime } = useSimClock();
  const { alerts } = useAlerts();
  const { openFlightModal } = useFlightModalStore();

  const [filters, setFilters] = useState<FlightFilterOptions>(initialFilters);

  const allFlights = useMemo(() => getAllFlights(), []);
  const airlines = useMemo(() => getUniqueAirlines(), []);
  const destinations = useMemo(() => getUniqueDestinations(), []);

  // Auto-open flight drawer if URL query param flightId is present
  useEffect(() => {
    const flightIdParam = searchParams.get("flightId");
    if (flightIdParam) {
      const target = allFlights.find(
        (f) => f.flightId.toLowerCase() === flightIdParam.toLowerCase(),
      );
      if (target) {
        openFlightModal(target.flightId);
      }
    }
  }, [searchParams, allFlights, openFlightModal]);

  // Map active alerts by flightId / reg for quick lookup
  const activeAlertsMap = useMemo(() => {
    const map = new Map<string, SimAlert[]>();
    for (const a of alerts) {
      if (a.affectedFlightId) {
        if (!map.has(a.affectedFlightId)) map.set(a.affectedFlightId, []);
        map.get(a.affectedFlightId)!.push(a);
      }
      if (a.affectedRef) {
        if (!map.has(a.affectedRef)) map.set(a.affectedRef, []);
        map.get(a.affectedRef)!.push(a);
      }
    }
    return map;
  }, [alerts]);

  // Filter flights based on options and currentTimeMs
  const filteredFlights = useMemo(() => {
    return filterFlights(allFlights, filters, currentTimeMs, activeAlertsMap);
  }, [allFlights, filters, currentTimeMs, activeAlertsMap]);

  // FIDS Top Summary KPI Counts
  const stats = useMemo(() => {
    let boarding = 0;
    let onTime = 0;
    let delayed = 0;
    let critical = 0;

    for (const f of allFlights) {
      const state = calculateLiveFlightState(f, currentTimeMs, activeAlertsMap);
      if (state.status === "BOARDING") boarding++;
      else if (state.status === "SCHEDULED") onTime++;

      // Count delays off the flight's historical delayMinutes field rather
      // than live status: once a flight has passed its actual departure,
      // calculateLiveFlightState reports 'DEPARTED' (its terminal state),
      // so 'DELAYED' is only reachable for a flight that hasn't departed
      // or boarded yet. In this dataset every flight is already departed,
      // so that branch is effectively unreachable — leaving this badge
      // stuck at 0 while the preset filter (which checks delayMinutes
      // directly) and the table rows correctly show delayed flights.
      if (f.delayMinutes > 0) delayed++;
      if (f.delayMinutes >= 150) critical++;
    }

    return { boarding, onTime, delayed, critical };
  }, [allFlights, currentTimeMs, activeAlertsMap]);

  // Virtualizer setup for 1000 rows
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredFlights.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54, // estimated height of row in px
    overscan: 12,
  });

  const handleFilterChange = (updates: Partial<FlightFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="space-y-md">
      {/* 1. Flagship FIDS Control Header */}
      <FlightFidsHeader
        totalFlights={allFlights.length}
        filteredCount={filteredFlights.length}
        boardingCount={stats.boarding}
        onTimeCount={stats.onTime}
        delayedCount={stats.delayed}
        criticalDelayCount={stats.critical}
        activeAlertsCount={alerts.length}
        filters={filters}
        onFilterChange={handleFilterChange}
        formattedSimTime={formattedTime}
      />

      {/* 2. Multi-Field Filter Bar */}
      <FlightFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        airlines={airlines}
        destinations={destinations}
        totalResults={filteredFlights.length}
      />

      {/* 3. FIDS Master Flight Display Table Shell */}
      <DataTableShell
        title={
          <span className="flex items-center gap-xs font-display font-bold text-sm tracking-wider uppercase">
            <Plane className="h-4 w-4 text-accent-signal" />
            FIDS Departure Schedule Board ({filteredFlights.length} Flights)
          </span>
        }
        headerActions={
          <div className="flex items-center gap-xs font-data text-xs text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-status-ontime animate-ping" />
            <span>LIVE VIRTUAL CLOCK SYNC</span>
          </div>
        }
        isEmpty={filteredFlights.length === 0}
        emptyMessage="No flight operations match your current multi-field filter."
      >
        {/* Table View Container */}
        <div
          className="w-full flex flex-col min-w-[950px]"
          role="table"
          aria-label="FIDS Departure Schedule Board"
        >
          {/* FIDS Table Column Header */}
          <div
            className="grid grid-cols-12 gap-2 font-data text-[11px] font-bold text-ink-muted uppercase tracking-wider px-md py-xs bg-surface-2/80 border-b border-line select-none"
            role="row"
          >
            <div className="col-span-2 sm:col-span-2" role="columnheader">
              Flight & Airline
            </div>
            <div className="col-span-2 sm:col-span-2" role="columnheader">
              Route
            </div>
            <div className="col-span-2 sm:col-span-1" role="columnheader">
              STD
            </div>
            <div className="col-span-2 sm:col-span-1" role="columnheader">
              ATD / ETD
            </div>
            <div className="col-span-1 sm:col-span-1" role="columnheader">
              Gate
            </div>
            <div className="hidden sm:block sm:col-span-2" role="columnheader">
              Aircraft / Reg
            </div>
            <div className="hidden lg:block lg:col-span-1" role="columnheader">
              Pax Load
            </div>
            <div
              className="col-span-2 sm:col-span-2 text-right"
              role="columnheader"
            >
              Sim Live Status
            </div>
          </div>

          {/* Virtualized Rows List Container */}
          <div
            ref={parentRef}
            role="rowgroup"
            className="overflow-y-auto max-h-[620px] w-full min-h-[400px] bg-surface-0/40 relative"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const flight = filteredFlights[virtualRow.index];
                const liveState = calculateLiveFlightState(
                  flight,
                  currentTimeMs,
                  activeAlertsMap,
                );
                const isSelected = false; // selection now managed by global modal store
                const loadFactorPct =
                  flight.capacity > 0
                    ? Math.round(
                        (flight.passengerCount / flight.capacity) * 100,
                      )
                    : 0;

                return (
                  <div
                    key={flight.flightId}
                    role="row"
                    tabIndex={0}
                    aria-label={`Flight ${flight.flightId} to ${flight.destination}`}
                    onClick={() => openFlightModal(flight.flightId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openFlightModal(flight.flightId);
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`grid grid-cols-12 gap-2 items-center px-md py-2xs border-b border-line/60 cursor-pointer transition-colors select-none font-data text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal ${
                      isSelected
                        ? "bg-accent-signal/10 border-l-4 border-l-accent-signal"
                        : liveState.hasActiveAlert
                          ? "bg-status-alert/10 border-l-4 border-l-status-alert hover:bg-status-alert/20"
                          : liveState.status === "BOARDING"
                            ? "bg-status-boarding/5 hover:bg-status-boarding/15"
                            : "hover:bg-surface-2/60"
                    }`}
                  >
                    {/* 1. Flight ID & Airline */}
                    <div
                      className="col-span-2 sm:col-span-2 flex items-center gap-xs overflow-hidden"
                      role="cell"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-surface-2 text-ink-primary border border-line font-bold text-xs shrink-0">
                        {flight.airlineCode}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-ink-primary block truncate">
                          {flight.flightId}
                        </span>
                        <span className="text-[10px] text-ink-muted hidden sm:block truncate">
                          {flight.airlineName}
                        </span>
                      </div>
                    </div>

                    {/* 2. Route */}
                    <div
                      className="col-span-2 sm:col-span-2 flex items-center gap-1 font-data"
                      role="cell"
                    >
                      <span className="text-ink-muted">DEL</span>
                      <span className="text-line">&rarr;</span>
                      <span className="font-bold text-accent-signal">
                        {flight.destination}
                      </span>
                    </div>

                    {/* 3. STD */}
                    <div
                      className="col-span-2 sm:col-span-1 text-ink-primary font-medium"
                      role="cell"
                    >
                      {flight.scheduledDeparture.slice(11, 16)}
                    </div>

                    {/* 4. ATD / ETD */}
                    <div
                      className={`col-span-2 sm:col-span-1 font-bold ${
                        flight.delayMinutes > 0
                          ? "text-status-delayed"
                          : "text-status-ontime"
                      }`}
                      role="cell"
                    >
                      {flight.actualDeparture.slice(11, 16)}
                    </div>

                    {/* 5. Gate */}
                    <div className="col-span-1 sm:col-span-1" role="cell">
                      <span className="px-1.5 py-0.5 rounded bg-surface-2 text-accent-signal font-bold border border-line text-xs">
                        {flight.gate}
                      </span>
                    </div>

                    {/* 6. Aircraft & Reg */}
                    <div
                      className="hidden sm:block sm:col-span-2 text-ink-muted truncate"
                      role="cell"
                    >
                      <span className="text-ink-primary font-medium">
                        {flight.aircraftType}
                      </span>{" "}
                      <span className="text-[11px]">
                        ({flight.aircraftReg})
                      </span>
                    </div>

                    {/* 7. Pax Load */}
                    <div className="hidden lg:block lg:col-span-1" role="cell">
                      <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                        <span>{flight.passengerCount}</span>
                        <div className="w-12 h-1.5 rounded-full bg-surface-2 border border-line overflow-hidden">
                          <div
                            className={`h-full ${
                              loadFactorPct > 85
                                ? "bg-status-ontime"
                                : "bg-status-boarding"
                            }`}
                            style={{ width: `${loadFactorPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 8. Live Status & Alert */}
                    <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-xs">
                      {liveState.hasActiveAlert && (
                        <span
                          className="p-1 rounded bg-status-alert/20 text-status-alert animate-bounce"
                          title="Active Phase 2 Operational Alert"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </span>
                      )}

                      <StatusBadge
                        variant={liveState.badgeVariant}
                        size="sm"
                        pulseDot={liveState.isLive}
                      >
                        {liveState.statusLabel}
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

      {/* 4. Flight Detail Drawer — rendered globally via GlobalFlightDrawer in AppLayout */}
    </div>
  );
};
