import { create } from 'zustand';
import { parseTimestampToMs } from '@/lib/sim/timeUtils';

// Timeline limits based on dataset range (2024-10-01 to 2024-12-30)
export const DATASET_START_MS = parseTimestampToMs('2024-10-01 00:00:00');
export const DATASET_END_MS = parseTimestampToMs('2024-12-30 23:59:59');

// Default initial time set to a rich mid-season operational morning (Nov 15, 2024 08:00:00)
export const DEFAULT_INITIAL_SIM_TIME_MS = parseTimestampToMs('2024-11-15 08:00:00');

export interface SimClockStore {
  currentTimeMs: number;
  isPlaying: boolean;
  speedMultiplier: number;
  startTimeMs: number;
  endTimeMs: number;
  acknowledgedAlertIds: Record<string, boolean>;

  // Clock Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (ms: number) => void;
  jumpToDate: (isoOrDateStr: string) => void;
  stepForward: (seconds: number) => void;
  resetClock: () => void;
  tick: (deltaRealMs: number) => void;

  // UI Drawer State
  isAlertsDrawerOpen: boolean;
  openAlertsDrawer: () => void;
  closeAlertsDrawer: () => void;
  toggleAlertsDrawer: () => void;

  // Alert Actions
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: (alertIds: string[]) => void;
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
}

export const useSimClockStore = create<SimClockStore>((set, get) => ({
  currentTimeMs: DEFAULT_INITIAL_SIM_TIME_MS,
  isPlaying: false,
  speedMultiplier: 60, // 1 real sec = 1 sim minute
  startTimeMs: DATASET_START_MS,
  endTimeMs: DATASET_END_MS,
  acknowledgedAlertIds: {},
  isAlertsDrawerOpen: false,

  openAlertsDrawer: () => set({ isAlertsDrawerOpen: true }),
  closeAlertsDrawer: () => set({ isAlertsDrawerOpen: false }),
  toggleAlertsDrawer: () => set((state) => ({ isAlertsDrawerOpen: !state.isAlertsDrawerOpen })),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setSpeed: (speed: number) => set({ speedMultiplier: speed }),

  setCurrentTime: (ms: number) => {
    const boundedMs = Math.max(DATASET_START_MS, Math.min(DATASET_END_MS, ms));
    set({ currentTimeMs: boundedMs });
  },

  jumpToDate: (isoOrDateStr: string) => {
    const ms = parseTimestampToMs(isoOrDateStr);
    if (ms > 0) {
      get().setCurrentTime(ms);
    }
  },

  stepForward: (seconds: number) => {
    set((state) => ({
      currentTimeMs: Math.min(state.endTimeMs, state.currentTimeMs + seconds * 1000),
    }));
  },

  resetClock: () =>
    set({
      currentTimeMs: DEFAULT_INITIAL_SIM_TIME_MS,
      isPlaying: false,
      speedMultiplier: 60,
    }),

  tick: (deltaRealMs: number) => {
    const state = get();
    if (!state.isPlaying) return;

    const advanceMs = deltaRealMs * state.speedMultiplier;
    const nextTimeMs = state.currentTimeMs + advanceMs;

    if (nextTimeMs >= state.endTimeMs) {
      set({ currentTimeMs: state.endTimeMs, isPlaying: false });
    } else {
      set({ currentTimeMs: nextTimeMs });
    }
  },

  acknowledgeAlert: (alertId: string) =>
    set((state) => ({
      acknowledgedAlertIds: { ...state.acknowledgedAlertIds, [alertId]: true },
    })),

  acknowledgeAllAlerts: (alertIds: string[]) =>
    set((state) => {
      const nextMap = { ...state.acknowledgedAlertIds };
      for (const id of alertIds) {
        nextMap[id] = true;
      }
      return { acknowledgedAlertIds: nextMap };
    }),

  clearAlert: (alertId: string) =>
    set((state) => ({
      acknowledgedAlertIds: { ...state.acknowledgedAlertIds, [alertId]: true },
    })),

  clearAllAlerts: () => set({ acknowledgedAlertIds: {} }),
}));

// Ticker singleton runner
let tickerIntervalId: number | null = null;
let lastTickTime = Date.now();

export function startSimTicker() {
  if (typeof window === 'undefined') return;
  if (tickerIntervalId !== null) return;

  lastTickTime = Date.now();
  tickerIntervalId = window.setInterval(() => {
    const now = Date.now();
    const deltaMs = now - lastTickTime;
    lastTickTime = now;
    useSimClockStore.getState().tick(deltaMs);
  }, 100); // 10 ticks per second
}

export function stopSimTicker() {
  if (tickerIntervalId !== null) {
    clearInterval(tickerIntervalId);
    tickerIntervalId = null;
  }
}
