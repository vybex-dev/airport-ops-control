import { useMemo, useEffect, useState, useRef } from "react";
import { useSimClockStore, startSimTicker } from "./useSimClockStore";
import { getActiveSimEvents } from "@/lib/sim/eventIndexer";
import { getActiveAlerts } from "@/lib/sim/alertRulesEngine";
import {
  computeAirportKPIs,
  type AirportKPIs,
} from "@/lib/sim/airportKpiService";
import { useCriticalDataReady } from "@/lib/sim/dataLoader";
import type { EventSource, AlertSeverity } from "@/lib/sim/simTypes";

/**
 * Cross-browser requestIdleCallback with a setTimeout fallback (Safari has
 * no rIC). Used to push the FIRST heavy synchronous compute (KPI
 * aggregation, alert rule evaluation, event indexing/sort — each an O(n)
 * or O(n log n) pass over thousands of records) off the critical rendering
 * path, so the shell/header gets a paint frame before the main thread is
 * occupied. Subsequent recomputes (driven by the sim clock ticking) are
 * cheap by comparison and don't need this treatment.
 */
function deferToIdle(cb: () => void): () => void {
  const w = window as any;
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(cb, { timeout: 500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 0);
  return () => window.clearTimeout(id);
}

/**
 * Returns true once critical data is ready AND we've yielded at least one
 * frame back to the browser. First render after data lands stays "false"
 * so callers can render a lightweight placeholder instead of computing
 * (and rendering) the full derived state in the same commit as the fetch
 * resolving.
 */
function useDeferredReady(): boolean {
  const criticalReady = useCriticalDataReady();
  const [settled, setSettled] = useState(false);
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (!criticalReady || scheduledRef.current) return;
    scheduledRef.current = true;
    const cancel = deferToIdle(() => setSettled(true));
    return cancel;
  }, [criticalReady]);

  return criticalReady && settled;
}

/**
 * Format timestamp ms into ISO / IST display string: "2024-11-15 08:00:00"
 */
export function formatSimTime(timeMs: number): string {
  if (!timeMs) return "2024-10-01 00:00:00";
  const d = new Date(timeMs);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 1. useSimClock — Access virtual clock state and control actions
 */
export function useSimClock() {
  const currentTimeMs = useSimClockStore((s) => s.currentTimeMs);
  const isPlaying = useSimClockStore((s) => s.isPlaying);
  const speedMultiplier = useSimClockStore((s) => s.speedMultiplier);
  const startTimeMs = useSimClockStore((s) => s.startTimeMs);
  const endTimeMs = useSimClockStore((s) => s.endTimeMs);

  const play = useSimClockStore((s) => s.play);
  const pause = useSimClockStore((s) => s.pause);
  const togglePlay = useSimClockStore((s) => s.togglePlay);
  const setSpeed = useSimClockStore((s) => s.setSpeed);
  const setCurrentTime = useSimClockStore((s) => s.setCurrentTime);
  const jumpToDate = useSimClockStore((s) => s.jumpToDate);
  const stepForward = useSimClockStore((s) => s.stepForward);
  const resetClock = useSimClockStore((s) => s.resetClock);

  // Auto-start ticker on mount
  useEffect(() => {
    startSimTicker();
  }, []);

  const formattedTime = useMemo(
    () => formatSimTime(currentTimeMs),
    [currentTimeMs],
  );

  return {
    currentTimeMs,
    formattedTime,
    isPlaying,
    speedMultiplier,
    startTimeMs,
    endTimeMs,
    play,
    pause,
    togglePlay,
    setSpeed,
    setCurrentTime,
    jumpToDate,
    stepForward,
    resetClock,
  };
}

/**
 * 2. useLiveFeed — Access live derived operational event feed
 */
export function useLiveFeed(options?: {
  limit?: number;
  sourceFilter?: EventSource;
}) {
  const currentTimeMs = useSimClockStore((s) => s.currentTimeMs);
  const deferredReady = useDeferredReady();

  // Round time to nearest 1000ms for efficient memoization
  const roundedTimeSec = Math.floor(currentTimeMs / 1000) * 1000;

  const activeEvents = useMemo(() => {
    // Skip the (potentially large) merge + chronological sort across all
    // 5 datasets until we've yielded a paint frame post-data-load.
    if (!deferredReady) return [];
    return getActiveSimEvents(roundedTimeSec);
  }, [roundedTimeSec, deferredReady]);

  const filteredEvents = useMemo(() => {
    let result = activeEvents;
    if (options?.sourceFilter) {
      result = result.filter((e) => e.source === options.sourceFilter);
    }
    // Return newest first
    const reversed = [...result].reverse();
    if (options?.limit && options.limit > 0) {
      return reversed.slice(0, options.limit);
    }
    return reversed;
  }, [activeEvents, options?.sourceFilter, options?.limit]);

  return {
    events: filteredEvents,
    totalCount: activeEvents.length,
    latestEvent: filteredEvents[0] ?? null,
  };
}

/**
 * 3. useAlerts — Access active algorithmic operational alerts
 */
export function useAlerts(options?: {
  unacknowledgedOnly?: boolean;
  severityFilter?: AlertSeverity;
}) {
  const currentTimeMs = useSimClockStore((s) => s.currentTimeMs);
  const acknowledgedAlertIds = useSimClockStore((s) => s.acknowledgedAlertIds);
  const acknowledgeAlert = useSimClockStore((s) => s.acknowledgeAlert);
  const acknowledgeAllAlerts = useSimClockStore((s) => s.acknowledgeAllAlerts);
  const clearAlert = useSimClockStore((s) => s.clearAlert);
  const clearAllAlerts = useSimClockStore((s) => s.clearAllAlerts);

  const isAlertsDrawerOpen = useSimClockStore((s) => s.isAlertsDrawerOpen);
  const openAlertsDrawer = useSimClockStore((s) => s.openAlertsDrawer);
  const closeAlertsDrawer = useSimClockStore((s) => s.closeAlertsDrawer);
  const toggleAlertsDrawer = useSimClockStore((s) => s.toggleAlertsDrawer);

  const roundedTimeSec = Math.floor(currentTimeMs / 1000) * 1000;
  const deferredReady = useDeferredReady();

  const activeAlerts = useMemo(() => {
    // Skip alert-rule evaluation (loops + gate-conflict sort over flights
    // and maintenance logs) until we've yielded a paint frame post-load.
    if (!deferredReady) return [];
    return getActiveAlerts(roundedTimeSec);
  }, [roundedTimeSec, deferredReady]);

  const filteredAlerts = useMemo(() => {
    let result = activeAlerts.map((a) => ({
      ...a,
      isAcknowledged: !!acknowledgedAlertIds[a.id],
    }));

    if (options?.unacknowledgedOnly) {
      result = result.filter((a) => !a.isAcknowledged);
    }

    if (options?.severityFilter) {
      result = result.filter((a) => a.severity === options.severityFilter);
    }

    return [...result].reverse();
  }, [
    activeAlerts,
    acknowledgedAlertIds,
    options?.unacknowledgedOnly,
    options?.severityFilter,
  ]);

  const unacknowledgedCount = useMemo(() => {
    return activeAlerts.filter((a) => !acknowledgedAlertIds[a.id]).length;
  }, [activeAlerts, acknowledgedAlertIds]);

  const criticalCount = useMemo(() => {
    return activeAlerts.filter(
      (a) => a.severity === "critical" && !acknowledgedAlertIds[a.id],
    ).length;
  }, [activeAlerts, acknowledgedAlertIds]);

  const warningCount = useMemo(() => {
    return activeAlerts.filter(
      (a) => a.severity === "warning" && !acknowledgedAlertIds[a.id],
    ).length;
  }, [activeAlerts, acknowledgedAlertIds]);

  const infoCount = useMemo(() => {
    return activeAlerts.filter(
      (a) => a.severity === "info" && !acknowledgedAlertIds[a.id],
    ).length;
  }, [activeAlerts, acknowledgedAlertIds]);

  return {
    alerts: filteredAlerts,
    unacknowledgedCount,
    criticalCount,
    warningCount,
    infoCount,
    totalActiveAlerts: activeAlerts.length,
    isAlertsDrawerOpen,
    openAlertsDrawer,
    closeAlertsDrawer,
    toggleAlertsDrawer,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    clearAlert,
    clearAllAlerts,
  };
}

/**
 * Zeroed placeholder shape, returned while critical data is still loading
 * or before we've yielded a post-load paint frame. Lets OverviewModule
 * (and anything else reading kpis.flights.otpPct etc.) render immediately
 * without needing every call site to add null-guards.
 */
const EMPTY_KPIS: AirportKPIs = {
  flights: {
    total: 0,
    activeAirborne: 0,
    departed: 0,
    upcoming: 0,
    delayed: 0,
    otpPct: 0,
    avgDelayMins: 0,
  },
  gates: {
    totalGates: 50,
    occupiedGates: 0,
    utilizationPct: 0,
    activeTurnarounds: 0,
    activeConflicts: 0,
  },
  baggage: {
    totalProcessed: 0,
    slaSuccessPct: 0,
    misroutedCount: 0,
    activeCarousels: "—",
  },
  security: {
    totalScreened: 0,
    activeLanes: 0,
    totalLanes: 8,
    avgWaitMins: 0,
    backlogRisk: "LOW",
  },
  maintenance: {
    totalLogs: 0,
    openWorkOrders: 0,
    criticalDefects: 0,
    trackedAircraft: "—",
  },
  overviewStatus: {
    level: "NOMINAL",
    label: "INITIALIZING — LOADING TELEMETRY",
    description: "Fetching and indexing operational datasets.",
  },
};

/**
 * 4. useAirportKPIs — Access live derived airport-wide KPIs
 */
export function useAirportKPIs(): AirportKPIs {
  const currentTimeMs = useSimClockStore((s) => s.currentTimeMs);
  const roundedTimeSec = Math.floor(currentTimeMs / 1000) * 1000;
  const deferredReady = useDeferredReady();

  return useMemo(() => {
    // Skip the full KPI aggregation (5 separate O(n) passes over flights,
    // gate events, baggage, security, and maintenance) until we've yielded
    // a paint frame after critical data lands. Returns a safe zeroed shape
    // in the meantime so the KPI cards can render their chrome immediately.
    if (!deferredReady) return EMPTY_KPIS;
    return computeAirportKPIs(roundedTimeSec);
  }, [roundedTimeSec, deferredReady]);
}
