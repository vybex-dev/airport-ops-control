import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { RotateCcw } from 'lucide-react';
import type { SecurityFilterOptions } from '@/lib/security/securityDataService';

export interface SecurityFiltersProps {
  filters: SecurityFilterOptions;
  onChange: (updates: Partial<SecurityFilterOptions>) => void;
  onReset: () => void;
  totalResults: number;
}

export const SecurityFilters: React.FC<SecurityFiltersProps> = ({
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
            placeholder="Search Screening ID, Pax Ref, PNR..."
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-ink-muted">Filter Lane:</span>
          <select
            value={filters.laneFilter}
            onChange={(e) => onChange({ laneFilter: e.target.value })}
            className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">All Screening Lanes (1-8)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <option key={num} value={num.toString()}>
                Lane {num}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-ink-muted">Time Window:</span>
          <select
            value={filters.timeWindow}
            onChange={(e) => onChange({ timeWindow: e.target.value })}
            className="bg-surface-2 text-ink-primary border border-line rounded px-xs py-1 text-xs focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">Full Sim History</option>
            <option value="PAST_1H">Past 1 Hour</option>
            <option value="PAST_6H">Past 6 Hours</option>
          </select>
        </div>

        {(filters.search || filters.laneFilter !== 'ALL' || filters.timeWindow !== 'ALL') && (
          <Button variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw className="h-3 w-3" />}>
            Reset
          </Button>
        )}
      </div>

      <div className="text-ink-muted text-xs">
        Screening Records: <strong className="text-accent-signal">{totalResults.toLocaleString()} / 2,500</strong>
      </div>
    </div>
  );
};
