/**
 * dataLoader.ts — Fetch-based dataset loader.
 *
 * JSON files live in /public/data/ and are served as static assets —
 * NOT bundled into JS chunks. This dramatically shrinks the initial
 * JS payload (was ~5 MB of bundled JSON on mobile).
 *
 * Strategy:
 *  1. All fetches start immediately when this module is first imported
 *     (parallel network requests, non-blocking).
 *  2. getDatasetSync() returns [] until the dataset arrives — callers
 *     (KPI service, event indexer, alert engine) fall back to safe
 *     empty-state defaults during the brief loading window.
 *  3. onAllDataReady(cb) fires once every dataset has resolved.
 *  4. useDataReady() React hook drives loading-overlay visibility.
 */

import { useState, useEffect } from 'react';

export type DatasetName =
  | 'flights'
  | 'gate_events'
  | 'baggage'
  | 'security_screening'
  | 'maintenance_logs'
  | 'passengers'
  | 'retail_transactions'
  | 'staff_shifts';

const ALL_DATASETS: DatasetName[] = [
  'flights',
  'gate_events',
  'baggage',
  'security_screening',
  'maintenance_logs',
  'passengers',
  'retail_transactions',
  'staff_shifts',
];

// In-memory caches
const cache: Partial<Record<DatasetName, any[]>> = {};
const promises: Partial<Record<DatasetName, Promise<any[]>>> = {};

// Ready-state tracking
let allReadyCallbacks: Array<() => void> = [];
let _allReady = false;

function checkAllReady() {
  if (_allReady) return;
  const done = ALL_DATASETS.every((n) => n in cache);
  if (done) {
    _allReady = true;
    allReadyCallbacks.forEach((cb) => cb());
    allReadyCallbacks = [];
  }
}

function prefetch(name: DatasetName): Promise<any[]> {
  if (promises[name]) return promises[name]!;
  const p = fetch(`/data/${name}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load /data/${name}.json: ${r.status}`);
      return r.json() as Promise<any[]>;
    })
    .then((data) => {
      cache[name] = data;
      checkAllReady();
      return data;
    })
    .catch((err) => {
      console.error('[dataLoader]', err);
      cache[name] = []; // degrade gracefully
      checkAllReady();
      return [] as any[];
    });
  promises[name] = p;
  return p;
}

// Kick off ALL fetches immediately when this module loads.
// Browser parallelises these requests (HTTP/2 or separate TCP).
ALL_DATASETS.forEach(prefetch);

/** Synchronous accessor — returns cached data or [] if not yet loaded. */
export function getDatasetSync<T = any>(name: DatasetName): T[] {
  return (cache[name] as T[] | undefined) ?? [];
}

/** Async accessor — always resolves (never rejects). */
export function getDatasetAsync<T = any>(name: DatasetName): Promise<T[]> {
  return (promises[name] as Promise<T[]> | undefined) ?? prefetch(name);
}

/** Register a callback that fires once every dataset has loaded. */
export function onAllDataReady(cb: () => void): void {
  if (_allReady) {
    cb();
  } else {
    allReadyCallbacks.push(cb);
  }
}

/** Returns true once every dataset has loaded. */
export function isAllDataReady(): boolean {
  return _allReady;
}

/**
 * React hook: returns true once all datasets have been fetched and cached.
 * Triggers a re-render exactly once — when data becomes available.
 */
export function useDataReady(): boolean {
  const [ready, setReady] = useState(_allReady);

  useEffect(() => {
    if (_allReady) {
      setReady(true);
      return;
    }
    let cancelled = false;
    onAllDataReady(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
