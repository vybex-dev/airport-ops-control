import React, { useState, useEffect } from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Filter, RotateCcw, Building2, MapPin, Clock, DoorClosed } from 'lucide-react';
import type { FlightFilterOptions } from '@/lib/flights/flightDataService';

interface FlightFiltersProps {
  filters: FlightFilterOptions;
  onChange: (updates: Partial<FlightFilterOptions>) => void;
  onReset: () => void;
  airlines: string[];
  destinations: string[];
  totalResults: number;
}

export const FlightFilters: React.FC<FlightFiltersProps> = ({
  filters,
  onChange,
  onReset,
  airlines,
  destinations,
  totalResults,
}) => {
  // Local debounced state for search input to prevent lag on 1000 items
  const [searchTerm, setSearchTerm] = useState(filters.search);

  useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onChange({ search: searchTerm });
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm, filters.search, onChange]);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.airline !== 'ALL' ||
    filters.destination !== 'ALL' ||
    filters.statusFilter !== 'ALL' ||
    filters.gateFilter !== 'ALL' ||
    filters.timeWindow !== 'ALL' ||
    filters.preset !== 'ALL';

  return (
    <div className="space-y-xs bg-surface-1 p-sm rounded-md border border-line">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-sm">
        {/* Debounced Search Bar */}
        <div className="flex-1 max-w-[480px]">
          <SearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="Search flight # (e.g. UK-633), airline, dest (SIN), gate (B3), or tail (VT-PIU)..."
            className="w-full"
          />
        </div>

        {/* Action Controls & Reset */}
        <div className="flex items-center gap-xs justify-between md:justify-end">
          <span className="font-data text-xs text-ink-muted">
            Showing <strong className="text-accent-signal">{totalResults}</strong> matching flights
          </span>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              icon={<RotateCcw className="h-3.5 w-3.5 text-status-delayed" />}
              className="text-status-delayed border-status-delayed/30 hover:bg-status-delayed/10"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Field Dropdown Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-xs pt-xs border-t border-line/60">
        {/* Airline Selector */}
        <div className="space-y-4xs">
          <label className="font-data text-[10px] uppercase tracking-wider text-ink-muted flex items-center gap-1">
            <Building2 className="h-3 w-3 text-accent-signal" /> Airline
          </label>
          <select
            value={filters.airline}
            onChange={(e) => onChange({ airline: e.target.value })}
            className="w-full bg-surface-2 text-ink-primary text-xs font-display py-1.5 px-2 rounded border border-line focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">All Airlines ({airlines.length})</option>
            {airlines.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Route / Destination Selector */}
        <div className="space-y-4xs">
          <label className="font-data text-[10px] uppercase tracking-wider text-ink-muted flex items-center gap-1">
            <MapPin className="h-3 w-3 text-accent-signal" /> Destination
          </label>
          <select
            value={filters.destination}
            onChange={(e) => onChange({ destination: e.target.value })}
            className="w-full bg-surface-2 text-ink-primary text-xs font-display py-1.5 px-2 rounded border border-line focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">All Destinations ({destinations.length})</option>
            {destinations.map((d) => (
              <option key={d} value={d}>
                DEL &rarr; {d}
              </option>
            ))}
          </select>
        </div>

        {/* Live Sim Status Selector */}
        <div className="space-y-4xs">
          <label className="font-data text-[10px] uppercase tracking-wider text-ink-muted flex items-center gap-1">
            <Filter className="h-3 w-3 text-accent-signal" /> Sim Status
          </label>
          <select
            value={filters.statusFilter}
            onChange={(e) => onChange({ statusFilter: e.target.value, preset: 'ALL' })}
            className="w-full bg-surface-2 text-ink-primary text-xs font-display py-1.5 px-2 rounded border border-line focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">All Statuses</option>
            <option value="BOARDING">⚡ Boarding Now</option>
            <option value="ONTIME">🟢 On-Time / Scheduled</option>
            <option value="DELAYED">⚠️ Delayed</option>
            <option value="DEPARTED">⚪ Departed</option>
          </select>
        </div>

        {/* Gate Filter */}
        <div className="space-y-4xs">
          <label className="font-data text-[10px] uppercase tracking-wider text-ink-muted flex items-center gap-1">
            <DoorClosed className="h-3 w-3 text-accent-signal" /> Gate / Terminal
          </label>
          <select
            value={filters.gateFilter}
            onChange={(e) => onChange({ gateFilter: e.target.value })}
            className="w-full bg-surface-2 text-ink-primary text-xs font-display py-1.5 px-2 rounded border border-line focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">All Gates (B3 - B50)</option>
            <option value="B3">Gate B3</option>
            <option value="B12">Gate B12</option>
            <option value="B18">Gate B18</option>
            <option value="B25">Gate B25</option>
            <option value="B30">Gate B30</option>
            <option value="B40">Gate B40</option>
          </select>
        </div>

        {/* Time Window Filter */}
        <div className="space-y-4xs">
          <label className="font-data text-[10px] uppercase tracking-wider text-ink-muted flex items-center gap-1">
            <Clock className="h-3 w-3 text-accent-signal" /> Time Window
          </label>
          <select
            value={filters.timeWindow}
            onChange={(e) => onChange({ timeWindow: e.target.value })}
            className="w-full bg-surface-2 text-ink-primary text-xs font-display py-1.5 px-2 rounded border border-line focus:outline-none focus:border-accent-signal"
          >
            <option value="ALL">All 90-Day Range</option>
            <option value="PAST_2H">Past 2 Hours (Departed)</option>
            <option value="NEXT_2H">Next 2 Hours (Upcoming)</option>
            <option value="NEXT_6H">Next 6 Hours</option>
          </select>
        </div>
      </div>
    </div>
  );
};
