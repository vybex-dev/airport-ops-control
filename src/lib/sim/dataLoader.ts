/**
 * dataLoader.ts — Fetch-based dataset loader with split loading.
 *
 * Separates critical datasets (for immediate Overview mount) from lazy datasets
 * (for secondary tabs/drawers) to cut down blocking time on slow networks.
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

export const CRITICAL_DATASETS: DatasetName[] = [
  'flights',
  'gate_events',
  'baggage',
  'security_screening',
  'maintenance_logs',
];

export const LAZY_DATASETS: DatasetName[] = [
  'passengers',
  'retail_transactions',
  'staff_shifts',
];

const ALL_DATASETS: DatasetName[] = [...CRITICAL_DATASETS, ...LAZY_DATASETS];

// In-memory caches
const cache: Partial<Record<DatasetName, any[]>> = {};
const promises: Partial<Record<DatasetName, Promise<any[]>>> = {};

// Ready-state tracking
let criticalReadyCallbacks: Array<() => void> = [];
let allReadyCallbacks: Array<() => void> = [];
let _criticalReady = false;
let _allReady = false;

function checkReadyStates() {
  if (!_criticalReady) {
    const criticalDone = CRITICAL_DATASETS.every((n) => n in cache);
    if (criticalDone) {
      _criticalReady = true;
      criticalReadyCallbacks.forEach((cb) => cb());
      criticalReadyCallbacks = [];
    }
  }

  if (!_allReady) {
    const allDone = ALL_DATASETS.every((n) => n in cache);
    if (allDone) {
      _allReady = true;
      allReadyCallbacks.forEach((cb) => cb());
      allReadyCallbacks = [];
    }
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
      checkReadyStates();
      return data;
    })
    .catch((err) => {
      console.error('[dataLoader]', err);
      cache[name] = []; // degrade gracefully
      checkReadyStates();
      return [] as any[];
    });
  promises[name] = p;
  return p;
}

// Kick off ALL fetches immediately when this module loads.
ALL_DATASETS.forEach(prefetch);

/** Synchronous accessor — returns cached data or [] if not yet loaded. */
export function getDatasetSync<T = any>(name: DatasetName): T[] {
  return (cache[name] as T[] | undefined) ?? [];
}

/** Async accessor — always resolves (never rejects). */
export function getDatasetAsync<T = any>(name: DatasetName): Promise<T[]> {
  return (promises[name] as Promise<T[]> | undefined) ?? prefetch(name);
}

/** Register a callback that fires once CRITICAL datasets are ready. */
export function onCriticalDataReady(cb: () => void): void {
  if (_criticalReady) {
    cb();
  } else {
    criticalReadyCallbacks.push(cb);
  }
}

/** Register a callback that fires once ALL datasets have loaded. */
export function onAllDataReady(cb: () => void): void {
  if (_allReady) {
    cb();
  } else {
    allReadyCallbacks.push(cb);
  }
}

/** Returns true once critical datasets are ready. */
export function isCriticalDataReady(): boolean {
  return _criticalReady;
}

/** Returns true once every dataset has loaded. */
export function isAllDataReady(): boolean {
  return _allReady;
}

/**
 * React hook: returns true once critical datasets have been fetched and cached.
 */
export function useCriticalDataReady(): boolean {
  const [ready, setReady] = useState(_criticalReady);

  useEffect(() => {
    if (_criticalReady) {
      setReady(true);
      return;
    }
    let cancelled = false;
    onCriticalDataReady(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}

/**
 * React hook: returns true once all datasets have been fetched and cached.
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
