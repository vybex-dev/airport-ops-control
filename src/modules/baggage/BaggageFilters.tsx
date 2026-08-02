import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { RotateCcw } from 'lucide-react';
import type { BaggageFilterOptions } from '@/lib/baggage/baggageDataService';

export interface BaggageFiltersProps {
  filters: BaggageFilterOptions;
  onChange: (updates: Partial<BaggageFilterOptions>) => void;
  onReset: () => void;
  totalResults: number;
}

export const BaggageFilters: React.FC<BaggageFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-sm p-sm rounded-md bg-surface-1 border border-line font-data text-xs">
      <div className="flex items-center gap-xs flex-wrap flex-1">
        <div className="w-full sm:w-64">
          <SearchInput
            value={filters.search}
            onChange={(search) => onChange({ search })}
            placeholder="Search Tag, PNR, Flight, Pax Ref..."
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-ink-muted">Lifecycle Stage:</span>
          <select
            value={filters.stageFilter}
            onChange={(e) => onChange({ stageFilter: e.target.value })}
            className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">All Lifecycle Stages</option>
            <option value="CHECKIN">Check-in Only</option>
            <option value="LOADED">Loaded / In Transit</option>
            <option value="DELIVERED">Delivered / Claim</option>
          </select>
        </div>

        <Button
          variant={filters.hasAlertOnly ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onChange({ hasAlertOnly: !filters.hasAlertOnly })}
          className="text-xs"
        >
          {filters.hasAlertOnly ? 'Showing SLA Alerts' : 'Filter Alerts Only'}
        </Button>

        {(filters.search || filters.stageFilter !== 'ALL' || filters.hasAlertOnly) && (
          <Button variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw className="h-3 w-3" />}>
            Reset
          </Button>
        )}
      </div>

      <div className="text-ink-muted text-xs">
        Matching Bags: <strong className="text-accent-signal">{totalResults.toLocaleString()} / 2,800</strong>
      </div>
    </div>
  );
};
