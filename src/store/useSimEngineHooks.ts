import { useMemo, useEffect } from 'react';
import { useSimClockStore, startSimTicker } from './useSimClockStore';
import { getActiveSimEvents } from '@/lib/sim/eventIndexer';
import { getActiveAlerts } from '@/lib/sim/alertRulesEngine';
import { computeAirportKPIs, type AirportKPIs } from '@/lib/sim/airportKpiService';
import type { EventSource, AlertSeverity } from '@/lib/sim/simTypes';

/**
 * Format timestamp ms into ISO / IST display string: "2024-11-15 08:00:00"
 */
export function formatSimTime(timeMs: number): string {
  if (!timeMs) return '2024-10-01 00:00:00';
  const d = new Date(timeMs);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
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

  const formattedTime = useMemo(() => formatSimTime(currentTimeMs), [currentTimeMs]);

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
export function useLiveFeed(options?: { limit?: number; sourceFilter?: EventSource }) {
  const currentTimeMs = useSimClockStore((s) => s.currentTimeMs);

  // Round time to nearest 1000ms for efficient memoization
  const roundedTimeSec = Math.floor(currentTimeMs / 1000) * 1000;

  const activeEvents = useMemo(() => {
    return getActiveSimEvents(roundedTimeSec);
  }, [roundedTimeSec]);

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

  const activeAlerts = useMemo(() => {
    return getActiveAlerts(roundedTimeSec);
  }, [roundedTimeSec]);

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
  }, [activeAlerts, acknowledgedAlertIds, options?.unacknowledgedOnly, options?.severityFilter]);

  const unacknowledgedCount = useMemo(() => {
    return activeAlerts.filter((a) => !acknowledgedAlertIds[a.id]).length;
  }, [activeAlerts, acknowledgedAlertIds]);

  const criticalCount = useMemo(() => {
    return activeAlerts.filter((a) => a.severity === 'critical' && !acknowledgedAlertIds[a.id]).length;
  }, [activeAlerts, acknowledgedAlertIds]);

  const warningCount = useMemo(() => {
    return activeAlerts.filter((a) => a.severity === 'warning' && !acknowledgedAlertIds[a.id]).length;
  }, [activeAlerts, acknowledgedAlertIds]);

  const infoCount = useMemo(() => {
    return activeAlerts.filter((a) => a.severity === 'info' && !acknowledgedAlertIds[a.id]).length;
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
 * 4. useAirportKPIs — Access live derived airport-wide KPIs
 */
export function useAirportKPIs(): AirportKPIs {
  const currentTimeMs = useSimClockStore((s) => s.currentTimeMs);
  const roundedTimeSec = Math.floor(currentTimeMs / 1000) * 1000;

  return useMemo(() => {
    return computeAirportKPIs(roundedTimeSec);
  }, [roundedTimeSec]);
}
